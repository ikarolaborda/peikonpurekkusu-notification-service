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
var OutboxRelayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxRelayService = void 0;
const postgresql_1 = require("@mikro-orm/postgresql");
const common_1 = require("@nestjs/common");
const event_envelope_factory_js_1 = require("./event-envelope.factory.js");
const kafka_producer_service_js_1 = require("./kafka-producer.service.js");
const POLL_INTERVAL_MS = 500;
const BATCH_SIZE = 50;
let OutboxRelayService = OutboxRelayService_1 = class OutboxRelayService {
    orm;
    producer;
    envelopes;
    logger = new common_1.Logger(OutboxRelayService_1.name);
    timer;
    draining = false;
    constructor(orm, producer, envelopes) {
        this.orm = orm;
        this.producer = producer;
        this.envelopes = envelopes;
    }
    onModuleInit() {
        this.timer = setInterval(() => void this.drainOnce(), POLL_INTERVAL_MS);
        this.timer.unref();
    }
    onModuleDestroy() {
        if (this.timer)
            clearInterval(this.timer);
    }
    async drainOnce() {
        if (this.draining || !this.producer.isConnected())
            return 0;
        this.draining = true;
        try {
            const em = this.orm.em.fork();
            let published = 0;
            await em.transactional(async (tem) => {
                const rows = await tem.getConnection().execute(`select id, aggregateid, type, payload, created_at from outbox
           where processed_at is null
           order by id
           limit ?
           for update skip locked`, [BATCH_SIZE]);
                for (const row of rows) {
                    const envelope = this.envelopes.build(row.id, row.type, row.payload, {
                        occurredAt: new Date(row.created_at),
                    });
                    await this.producer.publish(row.type, row.aggregateid, envelope);
                    published += 1;
                }
                if (rows.length > 0) {
                    await tem
                        .getConnection()
                        .execute(`update outbox set processed_at = now() where id in (?)`, [rows.map((r) => r.id)]);
                }
            });
            return published;
        }
        catch (err) {
            this.logger.error(`outbox drain failed (will retry): ${err.message}`);
            return 0;
        }
        finally {
            this.draining = false;
        }
    }
};
exports.OutboxRelayService = OutboxRelayService;
exports.OutboxRelayService = OutboxRelayService = OutboxRelayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgresql_1.MikroORM,
        kafka_producer_service_js_1.KafkaProducerService,
        event_envelope_factory_js_1.EventEnvelopeFactory])
], OutboxRelayService);
//# sourceMappingURL=outbox-relay.service.js.map