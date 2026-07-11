"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxEvent = void 0;
const core_1 = require("@mikro-orm/core");
const uuid_1 = require("uuid");
exports.OutboxEvent = (0, core_1.defineEntity)({
    name: 'OutboxEvent',
    tableName: 'outbox',
    properties: (p) => ({
        id: p.uuid().primary().onCreate(() => (0, uuid_1.v7)()),
        aggregatetype: p.string(),
        aggregateid: p.string(),
        type: p.string(),
        payload: p.json().$type(),
        createdAt: p.datetime().onCreate(() => new Date()),
        processedAt: p.datetime().nullable(),
    }),
});
//# sourceMappingURL=outbox-event.entity.js.map