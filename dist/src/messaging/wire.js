"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFrame = parseFrame;
exports.toEnvelope = toEnvelope;
exports.unframe = unframe;
function parseFrame(value) {
    if (value.length < 6 || value[0] !== 0) {
        throw new Error('not a confluent-framed message');
    }
    return {
        schema_id: value.readInt32BE(1),
        doc: JSON.parse(value.subarray(5).toString('utf8')),
    };
}
function toEnvelope(doc) {
    const env = doc;
    if (!env.event_id || !env.event_type) {
        throw new Error('envelope missing event_id/event_type');
    }
    return {
        event_id: env.event_id,
        event_type: env.event_type,
        correlation_id: env.correlation_id ?? env.event_id,
        payload: env.payload ?? {},
    };
}
function unframe(value) {
    return toEnvelope(parseFrame(value).doc);
}
//# sourceMappingURL=wire.js.map