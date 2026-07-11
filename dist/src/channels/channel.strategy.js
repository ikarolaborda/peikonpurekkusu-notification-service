"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHANNEL_STRATEGIES = exports.PushTransport = exports.SmsTransport = exports.EmailTransport = exports.InAppTransport = void 0;
const common_1 = require("@nestjs/common");
const dev_inbox_entity_js_1 = require("../entities/dev-inbox.entity.js");
let InAppTransport = class InAppTransport {
    channel = 'inapp';
    async deliver() { }
};
exports.InAppTransport = InAppTransport;
exports.InAppTransport = InAppTransport = __decorate([
    (0, common_1.Injectable)()
], InAppTransport);
class MockTransport {
    channel;
    logger;
    constructor(channel) {
        this.channel = channel;
        this.logger = new common_1.Logger(`MockTransport:${channel}`);
    }
    async deliver(em, target, message) {
        em.persist(em.create(dev_inbox_entity_js_1.DevInboxItem, {
            channel: this.channel,
            userId: target.userId,
            title: message.title,
            body: message.body,
        }));
        this.logger.log(`[${this.channel}] → ${target.userId.slice(0, 8)}…: ${message.title}`);
    }
}
class EmailTransport extends MockTransport {
    constructor() {
        super('email');
    }
}
exports.EmailTransport = EmailTransport;
class SmsTransport extends MockTransport {
    constructor() {
        super('sms');
    }
}
exports.SmsTransport = SmsTransport;
class PushTransport extends MockTransport {
    constructor() {
        super('push');
    }
}
exports.PushTransport = PushTransport;
exports.CHANNEL_STRATEGIES = Symbol('CHANNEL_STRATEGIES');
//# sourceMappingURL=channel.strategy.js.map