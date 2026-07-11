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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const postgresql_1 = require("@mikro-orm/postgresql");
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const notification_consumer_js_1 = require("../consumers/notification.consumer.js");
let HealthController = class HealthController {
    health;
    indicator;
    orm;
    consumer;
    constructor(health, indicator, orm, consumer) {
        this.health = health;
        this.indicator = indicator;
        this.orm = orm;
        this.consumer = consumer;
    }
    live() {
        return { status: 'ok' };
    }
    ready() {
        return this.health.check([
            async () => {
                const ind = this.indicator.check('postgres');
                return (await this.orm.isConnected()) ? ind.up() : ind.down();
            },
            async () => {
                const ind = this.indicator.check('consumer');
                return this.consumer.isRunning() ? ind.up() : ind.down();
            },
        ]);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)('live'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "live", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "ready", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        terminus_1.HealthIndicatorService,
        postgresql_1.MikroORM,
        notification_consumer_js_1.NotificationConsumer])
], HealthController);
//# sourceMappingURL=health.controller.js.map