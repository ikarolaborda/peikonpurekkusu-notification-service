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
var KafkaProducerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaProducerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kafka_javascript_1 = require("@confluentinc/kafka-javascript");
const trace_context_js_1 = require("./trace-context.js");
let KafkaProducerService = KafkaProducerService_1 = class KafkaProducerService {
    logger = new common_1.Logger(KafkaProducerService_1.name);
    kafka;
    producer;
    registryUrl;
    schemaIds = new Map();
    connected = false;
    consecutiveTimeouts = 0;
    reconnecting = false;
    constructor(config) {
        this.kafka = new kafka_javascript_1.KafkaJS.Kafka({
            kafkaJS: {
                clientId: 'notification-service',
                brokers: config.getOrThrow('KAFKA_BOOTSTRAP_SERVERS').split(','),
            },
        });
        this.producer = this.newProducer();
        this.registryUrl = config.getOrThrow('SCHEMA_REGISTRY_URL').replace(/\/$/, '');
    }
    newProducer() {
        return this.kafka.producer({ kafkaJS: { acks: -1, idempotent: true } });
    }
    async onModuleInit() {
        await this.producer.connect();
        this.connected = true;
        this.logger.log('kafka producer connected');
    }
    async onModuleDestroy() {
        if (this.connected)
            await this.producer.disconnect();
    }
    isConnected() {
        return this.connected;
    }
    async recoverIfStale() {
        if (this.reconnecting || this.consecutiveTimeouts < 3)
            return;
        this.reconnecting = true;
        try {
            this.logger.warn('recreating kafka producer after repeated send timeouts');
            try {
                await this.producer.disconnect();
            }
            catch {
            }
            this.producer = this.newProducer();
            await this.producer.connect();
            this.consecutiveTimeouts = 0;
            this.logger.log('kafka producer reconnected');
        }
        catch (err) {
            this.logger.error(`producer reconnect failed: ${err.message}`);
        }
        finally {
            this.reconnecting = false;
        }
    }
    async publish(topic, key, envelope) {
        const value = this.frame(await this.schemaId(topic), envelope);
        const send = this.producer.send({
            topic,
            messages: [
                {
                    key,
                    value,
                    headers: { traceparent: trace_context_js_1.trace.currentTraceparent() },
                },
            ],
        });
        const timeout = new Promise((_, reject) => {
            const t = setTimeout(() => reject(new Error(`kafka send timeout (${topic})`)), 15_000);
            t.unref();
        });
        try {
            await Promise.race([send, timeout]);
            this.consecutiveTimeouts = 0;
        }
        catch (err) {
            if (err.message.includes('send timeout')) {
                this.consecutiveTimeouts += 1;
                void this.recoverIfStale();
            }
            throw err;
        }
    }
    frame(schemaId, envelope) {
        const payload = Buffer.from(JSON.stringify(envelope), 'utf8');
        const header = Buffer.alloc(5);
        header.writeUInt8(0, 0);
        header.writeInt32BE(schemaId, 1);
        return Buffer.concat([header, payload]);
    }
    async schemaId(topic) {
        const cached = this.schemaIds.get(topic);
        if (cached !== undefined)
            return cached;
        const res = await fetch(`${this.registryUrl}/subjects/${topic}-value/versions/latest`);
        if (!res.ok) {
            throw new Error(`schema lookup for ${topic}-value failed: HTTP ${res.status}`);
        }
        const { id } = (await res.json());
        this.schemaIds.set(topic, id);
        return id;
    }
};
exports.KafkaProducerService = KafkaProducerService;
exports.KafkaProducerService = KafkaProducerService = KafkaProducerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], KafkaProducerService);
//# sourceMappingURL=kafka-producer.service.js.map