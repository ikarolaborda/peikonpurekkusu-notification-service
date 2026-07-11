"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trace = void 0;
const node_async_hooks_1 = require("node:async_hooks");
const node_crypto_1 = require("node:crypto");
const storage = new node_async_hooks_1.AsyncLocalStorage();
exports.trace = {
    run(traceparent, fn) {
        const traceId = parseTraceparent(traceparent) ?? (0, node_crypto_1.randomBytes)(16).toString('hex');
        return storage.run({ traceId }, fn);
    },
    currentTraceId() {
        return storage.getStore()?.traceId ?? (0, node_crypto_1.randomBytes)(16).toString('hex');
    },
    currentTraceparent() {
        return `00-${exports.trace.currentTraceId()}-${(0, node_crypto_1.randomBytes)(8).toString('hex')}-01`;
    },
};
function parseTraceparent(header) {
    if (!header)
        return null;
    const m = /^00-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$/.exec(header.trim());
    return m ? m[1] : null;
}
//# sourceMappingURL=trace-context.js.map