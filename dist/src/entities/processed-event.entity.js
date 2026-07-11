"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessedEvent = void 0;
const core_1 = require("@mikro-orm/core");
exports.ProcessedEvent = (0, core_1.defineEntity)({
    name: 'ProcessedEvent',
    tableName: 'processed_events',
    properties: (p) => ({
        eventId: p.uuid().primary(),
        processedAt: p.datetime().onCreate(() => new Date()),
    }),
});
//# sourceMappingURL=processed-event.entity.js.map