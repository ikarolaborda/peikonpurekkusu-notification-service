"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEnvelopeFactory = void 0;
const common_1 = require("@nestjs/common");
const trace_context_js_1 = require("./trace-context.js");
let EventEnvelopeFactory = class EventEnvelopeFactory {
    build(eventId, topic, payload, opts) {
        return {
            event_id: eventId,
            event_type: topic,
            schema_version: 1,
            occurred_at: (opts?.occurredAt ?? new Date()).toISOString(),
            tenant_id: 'peikon',
            correlation_id: trace_context_js_1.trace.currentTraceId(),
            causation_id: opts?.causationId ?? null,
            idempotency_key: opts?.idempotencyKey ?? null,
            payload,
        };
    }
};
exports.EventEnvelopeFactory = EventEnvelopeFactory;
exports.EventEnvelopeFactory = EventEnvelopeFactory = __decorate([
    (0, common_1.Injectable)()
], EventEnvelopeFactory);
//# sourceMappingURL=event-envelope.factory.js.map