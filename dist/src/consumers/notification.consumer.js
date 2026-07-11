"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationConsumer = void 0;
const postgresql_1 = require("@mikro-orm/postgresql");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kafka_javascript_1 = require("@confluentinc/kafka-javascript");
const delivery_attempt_entity_js_1 = require("../entities/delivery-attempt.entity.js");
const notification_entity_js_1 = require("../entities/notification.entity.js");
const channel_strategy_js_1 = require("../channels/channel.strategy.js");
const sse_hub_service_js_1 = require("../notifications/sse-hub.service.js");
const templates_js_1 = require("../templating/templates.js");
const wire_js_1 = require("../messaging/wire.js");
const contract_validator_js_1 = require("../messaging/contract-validator.js");
const GROUP = 'notification-service';
const ROUTES = {
    'identity.user.registered.v1': {
        template: 'welcome',
        channels: ['inapp', 'email'],
        map: (p) => ({ kyc_status: p.kyc_status }),
    },
    'payments.payment.captured.v1': {
        template: 'payment_captured',
        channels: ['inapp', 'email'],
        map: (p) => ({ amount: formatMinor(p.amount_minor_units, p.currency_code), currency: p.currency_code, merchant: p.merchant_id }),
    },
    'payments.payment.failed.v1': {
        template: 'payment_failed',
        channels: ['inapp', 'sms'],
        map: (p) => ({ amount: formatMinor(p.amount_minor_units, p.currency_code), currency: p.currency_code, reason: p.failure_code }),
    },
    'fraud.score.flagged.v1': {
        template: 'fraud_alert',
        channels: ['inapp', 'email'],
        map: (p) => ({ action: p.recommended_action }),
    },
};
let NotificationConsumer = NotificationConsumer_1 = class NotificationConsumer {
    orm;
    templates;
    hub;
    validator;
    channels;
    logger = new common_1.Logger(NotificationConsumer_1.name);
    consumer;
    producer;
    running = false;
    constructor(orm, templates, hub, validator, channels, config) {
        this.orm = orm;
        this.templates = templates;
        this.hub = hub;
        this.validator = validator;
        this.channels = channels;
        const kafka = new kafka_javascript_1.KafkaJS.Kafka({
            kafkaJS: { clientId: GROUP, brokers: config.getOrThrow('KAFKA_BOOTSTRAP_SERVERS').split(',') },
        });
        this.consumer = kafka.consumer({
            kafkaJS: { groupId: GROUP, fromBeginning: true, autoCommit: false },
            'session.timeout.ms': 90000,
            'heartbeat.interval.ms': 3000,
            'max.poll.interval.ms': 300000,
            'reconnect.backoff.max.ms': 10000,
        });
        this.producer = kafka.producer({ kafkaJS: { acks: -1 } });
    }
    async onModuleInit() {
        await this.producer.connect();
        await this.consumer.connect();
        await this.consumer.subscribe({ topics: Object.keys(ROUTES) });
        this.running = true;
        void this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                await this.handle(topic, partition, message);
            },
        });
        this.logger.log('notification consumer running');
    }
    async onModuleDestroy() {
        this.running = false;
        await this.consumer.disconnect().catch(() => undefined);
        await this.producer.disconnect().catch(() => undefined);
    }
    isRunning() {
        return this.running;
    }
    async handle(topic, partition, message) {
        const route = ROUTES[topic];
        if (!route || !message.value)
            return;
        let attempt = 0;
        while (true) {
            attempt += 1;
            try {
                const frame = (0, wire_js_1.parseFrame)(message.value);
                await this.validator.validate(frame.schema_id, frame.doc);
                const env = (0, wire_js_1.toEnvelope)(frame.doc);
                await this.process(env, route);
                await this.consumer.commitOffsets([
                    { topic, partition, offset: (Number(message.offset) + 1).toString() },
                ]);
                return;
            }
            catch (err) {
                if (err instanceof contract_validator_js_1.RegistryUnavailableError) {
                    this.logger.warn(`schema registry unavailable — holding ${topic}@${message.offset}`);
                    attempt = 0;
                    await new Promise((r) => setTimeout(r, 2000));
                    continue;
                }
                const poison = err instanceof contract_validator_js_1.ContractViolationError || err instanceof contract_validator_js_1.UnknownSchemaError;
                this.logger.warn(`handle failed (attempt ${attempt}): ${err.message}`);
                if (poison || attempt >= 3) {
                    const deadLettered = await this.deadLetter(topic, partition, message, err);
                    if (!deadLettered) {
                        this.logger.error(`offset held for redelivery: ${topic}@${message.offset}`);
                        return;
                    }
                    await this.consumer.commitOffsets([
                        { topic, partition, offset: (Number(message.offset) + 1).toString() },
                    ]);
                    return;
                }
                await new Promise((r) => setTimeout(r, attempt * 200));
            }
        }
    }
    async process(env, route) {
        const userId = env.payload.user_id;
        if (typeof userId !== 'string' || !userId) {
            throw new contract_validator_js_1.ContractViolationError("payload missing 'user_id'");
        }
        const rendered = this.templates.render(route.template, route.map(env.payload));
        let toPublish = null;
        const em = this.orm.em.fork();
        await em.transactional(async (tem) => {
            const rows = (await tem
                .getConnection()
                .execute('insert into processed_events (event_id, processed_at) values (?, now()) on conflict do nothing returning event_id', [env.event_id]));
            if (!Array.isArray(rows) || rows.length === 0)
                return;
            const notification = tem.create(notification_entity_js_1.Notification, {
                userId,
                templateId: route.template,
                channel: 'inapp',
                renderedTitle: rendered.title,
                renderedBody: rendered.body,
                params: route.map(env.payload),
            });
            tem.persist(notification);
            for (const channelName of route.channels) {
                const strategy = this.channels.find((c) => c.channel === channelName);
                if (!strategy)
                    continue;
                try {
                    await strategy.deliver(tem, { userId, channel: channelName }, rendered);
                    tem.persist(tem.create(delivery_attempt_entity_js_1.DeliveryAttempt, {
                        notificationId: notification.id,
                        channel: channelName,
                        status: 'delivered',
                        attempt: 1,
                    }));
                }
                catch (err) {
                    tem.persist(tem.create(delivery_attempt_entity_js_1.DeliveryAttempt, {
                        notificationId: notification.id,
                        channel: channelName,
                        status: 'failed',
                        attempt: 1,
                        detail: err.message,
                    }));
                }
            }
            toPublish = {
                userId,
                id: notification.id,
                title: rendered.title,
                body: rendered.body,
                channel: 'inapp',
                createdAt: new Date().toISOString(),
            };
        });
        if (toPublish) {
            this.hub.publish(toPublish);
        }
    }
    async deadLetter(topic, partition, message, cause) {
        try {
            await this.producer.send({
                topic: `${GROUP}.${topic}.dlq`,
                messages: [
                    {
                        key: message.key,
                        value: message.value,
                        headers: {
                            'x-exception': cause.message,
                            'x-original-topic': topic,
                            'x-original-partition': String(partition),
                            'x-original-offset': String(message.offset),
                            'x-failed-at': new Date().toISOString(),
                            'x-consumer-group': GROUP,
                        },
                    },
                ],
            });
            this.logger.warn(`dead-lettered ${topic}@${message.offset}: ${cause.message}`);
            return true;
        }
        catch (err) {
            this.logger.error(`DLQ publish failed: ${err.message}`);
            return false;
        }
    }
};
exports.NotificationConsumer = NotificationConsumer;
exports.NotificationConsumer = NotificationConsumer = NotificationConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)(channel_strategy_js_1.CHANNEL_STRATEGIES)),
    __metadata("design:paramtypes", [postgresql_1.MikroORM,
        templates_js_1.TemplateRegistry,
        sse_hub_service_js_1.SseHub,
        contract_validator_js_1.ContractValidator, Array, config_1.ConfigService])
], NotificationConsumer);
function formatMinor(minor, currency) {
    const n = Number(minor ?? 0);
    const zeroDecimal = new Set(['JPY', 'KRW', 'VND']);
    if (zeroDecimal.has(String(currency)))
        return String(n);
    return (n / 100).toFixed(2);
}
//# sourceMappingURL=notification.consumer.js.map