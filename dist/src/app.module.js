"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const nestjs_1 = require("@mikro-orm/nestjs");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const terminus_1 = require("@nestjs/terminus");
const mikro_orm_config_js_1 = __importDefault(require("../mikro-orm.config.js"));
const channel_strategy_js_1 = require("./channels/channel.strategy.js");
const env_validation_js_1 = require("./config/env.validation.js");
const notification_consumer_js_1 = require("./consumers/notification.consumer.js");
const contract_validator_js_1 = require("./messaging/contract-validator.js");
const delivery_attempt_entity_js_1 = require("./entities/delivery-attempt.entity.js");
const dev_inbox_entity_js_1 = require("./entities/dev-inbox.entity.js");
const notification_entity_js_1 = require("./entities/notification.entity.js");
const outbox_event_entity_js_1 = require("./entities/outbox-event.entity.js");
const processed_event_entity_js_1 = require("./entities/processed-event.entity.js");
const health_controller_js_1 = require("./health/health.controller.js");
const notifications_controller_js_1 = require("./notifications/notifications.controller.js");
const sse_hub_service_js_1 = require("./notifications/sse-hub.service.js");
const templates_js_1 = require("./templating/templates.js");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, cache: true, validate: env_validation_js_1.validateEnv }),
            nestjs_1.MikroOrmModule.forRoot(mikro_orm_config_js_1.default),
            nestjs_1.MikroOrmModule.forFeature([notification_entity_js_1.Notification, delivery_attempt_entity_js_1.DeliveryAttempt, dev_inbox_entity_js_1.DevInboxItem, processed_event_entity_js_1.ProcessedEvent, outbox_event_entity_js_1.OutboxEvent]),
            terminus_1.TerminusModule,
        ],
        controllers: [notifications_controller_js_1.NotificationsController, health_controller_js_1.HealthController],
        providers: [
            templates_js_1.TemplateRegistry,
            sse_hub_service_js_1.SseHub,
            contract_validator_js_1.ContractValidator,
            notification_consumer_js_1.NotificationConsumer,
            {
                provide: channel_strategy_js_1.CHANNEL_STRATEGIES,
                useValue: [new channel_strategy_js_1.InAppTransport(), new channel_strategy_js_1.EmailTransport(), new channel_strategy_js_1.SmsTransport(), new channel_strategy_js_1.PushTransport()],
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map