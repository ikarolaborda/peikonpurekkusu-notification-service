"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRegistry = void 0;
const common_1 = require("@nestjs/common");
const TEMPLATES = {
    welcome: {
        title: 'Welcome to peikonpurekkusu',
        body: 'Your account is ready. KYC status: {{kyc_status}}.',
    },
    payment_captured: {
        title: 'Payment successful',
        body: 'Your payment of {{amount}} {{currency}} to {{merchant}} was captured.',
    },
    payment_failed: {
        title: 'Payment failed',
        body: 'Your payment of {{amount}} {{currency}} could not be completed ({{reason}}).',
    },
    fraud_alert: {
        title: 'Security review on your account',
        body: 'A recent activity was flagged for review ({{action}}). No action may be needed.',
    },
};
let TemplateRegistry = class TemplateRegistry {
    has(templateId) {
        return templateId in TEMPLATES;
    }
    render(templateId, params) {
        const tpl = TEMPLATES[templateId];
        if (!tpl) {
            return { title: 'Notification', body: JSON.stringify(params) };
        }
        return {
            title: interpolate(tpl.title, params),
            body: interpolate(tpl.body, params),
        };
    }
};
exports.TemplateRegistry = TemplateRegistry;
exports.TemplateRegistry = TemplateRegistry = __decorate([
    (0, common_1.Injectable)()
], TemplateRegistry);
function interpolate(template, params) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const v = params[key];
        return v === undefined || v === null ? `{{${key}}}` : String(v);
    });
}
//# sourceMappingURL=templates.js.map