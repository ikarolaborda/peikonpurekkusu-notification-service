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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Env = void 0;
exports.validateEnv = validateEnv;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class Env {
    NOTIFICATION_DB_HOST = 'notification-db';
    NOTIFICATION_DB_PORT = 5432;
    NOTIFICATION_DB_USER;
    NOTIFICATION_DB_PASSWORD;
    NOTIFICATION_DB_NAME;
    KAFKA_BOOTSTRAP_SERVERS = 'kafka:19092';
    SCHEMA_REGISTRY_URL = 'http://apicurio-registry:8080/apis/ccompat/v7';
    GATEWAY_JWKS_URL = 'http://user-service:8080/.well-known/jwks.json';
}
exports.Env = Env;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Env.prototype, "NOTIFICATION_DB_HOST", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], Env.prototype, "NOTIFICATION_DB_PORT", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Env.prototype, "NOTIFICATION_DB_USER", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Env.prototype, "NOTIFICATION_DB_PASSWORD", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Env.prototype, "NOTIFICATION_DB_NAME", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Env.prototype, "KAFKA_BOOTSTRAP_SERVERS", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Env.prototype, "SCHEMA_REGISTRY_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Env.prototype, "GATEWAY_JWKS_URL", void 0);
function validateEnv(raw) {
    const env = (0, class_transformer_1.plainToInstance)(Env, raw, { enableImplicitConversion: true, exposeDefaultValues: true });
    const errors = (0, class_validator_1.validateSync)(env, { whitelist: true });
    if (errors.length > 0) {
        throw new Error(`notification-service env validation failed:\n${errors
            .map((e) => Object.values(e.constraints ?? {}).join(', '))
            .join('\n')}`);
    }
    return env;
}
//# sourceMappingURL=env.validation.js.map