"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryAttempt = void 0;
const core_1 = require("@mikro-orm/core");
const uuid_1 = require("uuid");
exports.DeliveryAttempt = (0, core_1.defineEntity)({
    name: 'DeliveryAttempt',
    tableName: 'delivery_attempts',
    properties: (p) => ({
        id: p.uuid().primary().onCreate(() => (0, uuid_1.v7)()),
        notificationId: p.uuid().index(),
        channel: p.string(),
        status: p.string(),
        attempt: p.integer(),
        detail: p.string().nullable(),
        createdAt: p.datetime().onCreate(() => new Date()),
    }),
});
//# sourceMappingURL=delivery-attempt.entity.js.map