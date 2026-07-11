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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const postgresql_1 = require("@mikro-orm/postgresql");
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const notification_entity_js_1 = require("../entities/notification.entity.js");
const sse_hub_service_js_1 = require("./sse-hub.service.js");
let NotificationsController = class NotificationsController {
    em;
    hub;
    constructor(em, hub) {
        this.em = em;
        this.hub = hub;
    }
    async inbox(userId) {
        if (!userId)
            throw new common_1.UnauthorizedException('missing identity');
        const rows = await this.em.fork().find(notification_entity_js_1.Notification, { userId }, { orderBy: { createdAt: 'desc' }, limit: 50 });
        return {
            notifications: rows.map((n) => ({
                id: n.id,
                template_id: n.templateId,
                title: n.renderedTitle,
                body: n.renderedBody,
                read_at: n.readAt,
                created_at: n.createdAt,
            })),
        };
    }
    async markRead(userId, id) {
        if (!userId)
            throw new common_1.UnauthorizedException('missing identity');
        const em = this.em.fork();
        const n = await em.findOne(notification_entity_js_1.Notification, { id, userId });
        if (n && !n.readAt) {
            n.readAt = new Date();
            await em.flush();
        }
    }
    stream(userId, res) {
        if (!userId)
            throw new common_1.UnauthorizedException('missing identity');
        res.setHeader('X-Accel-Buffering', 'no');
        const heartbeat = new rxjs_1.Observable((sub) => {
            const t = setInterval(() => sub.next({ data: 'keepalive' }), 25_000);
            return () => clearInterval(t);
        });
        return (0, rxjs_1.merge)(this.hub.forUser(userId), heartbeat.pipe((0, rxjs_1.map)((h) => h)));
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('x-user-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "inbox", null);
__decorate([
    (0, common_1.Post)(':id/read'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Headers)('x-user-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markRead", null);
__decorate([
    (0, common_1.Sse)('stream'),
    __param(0, (0, common_1.Headers)('x-user-id')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], NotificationsController.prototype, "stream", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [postgresql_1.EntityManager,
        sse_hub_service_js_1.SseHub])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map