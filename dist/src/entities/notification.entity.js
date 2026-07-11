"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const core_1 = require("@mikro-orm/core");
const uuid_1 = require("uuid");
exports.Notification = (0, core_1.defineEntity)({
    name: 'Notification',
    tableName: 'notifications',
    properties: (p) => ({
        id: p.uuid().primary().onCreate(() => (0, uuid_1.v7)()),
        userId: p.uuid().index(),
        templateId: p.string(),
        channel: p.string(),
        renderedTitle: p.string(),
        renderedBody: p.text(),
        params: p.json().$type(),
        readAt: p.datetime().nullable(),
        createdAt: p.datetime().onCreate(() => new Date()),
    }),
});
//# sourceMappingURL=notification.entity.js.map