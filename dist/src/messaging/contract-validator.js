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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ContractValidator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractValidator = exports.RegistryUnavailableError = exports.UnknownSchemaError = exports.ContractViolationError = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const _2020_js_1 = __importDefault(require("ajv/dist/2020.js"));
class ContractViolationError extends Error {
}
exports.ContractViolationError = ContractViolationError;
class UnknownSchemaError extends Error {
}
exports.UnknownSchemaError = UnknownSchemaError;
class RegistryUnavailableError extends Error {
}
exports.RegistryUnavailableError = RegistryUnavailableError;
let ContractValidator = ContractValidator_1 = class ContractValidator {
    logger = new common_1.Logger(ContractValidator_1.name);
    ajv = new _2020_js_1.default({ strict: false, validateFormats: false });
    cache = new Map();
    baseUrl;
    constructor(config) {
        this.baseUrl = config.getOrThrow('SCHEMA_REGISTRY_URL');
    }
    async validate(schemaId, doc) {
        let fn = this.cache.get(schemaId);
        if (!fn) {
            fn = await this.fetchAndCompile(schemaId);
            this.cache.set(schemaId, fn);
        }
        if (fn(doc))
            return;
        const detail = (fn.errors ?? [])
            .slice(0, 5)
            .map((e) => `${e.instancePath} ${e.keyword}: ${e.message}`)
            .join('; ');
        throw new ContractViolationError(`payload violates schema id ${schemaId}: ${detail}`);
    }
    async fetchAndCompile(schemaId) {
        let res;
        try {
            res = await fetch(`${this.baseUrl}/schemas/ids/${schemaId}`, { signal: AbortSignal.timeout(5000) });
        }
        catch (err) {
            throw new RegistryUnavailableError(`registry unreachable resolving schema id ${schemaId}: ${err.message}`);
        }
        if (res.status === 404)
            throw new UnknownSchemaError(`schema id ${schemaId} unknown to the registry`);
        if (!res.ok)
            throw new RegistryUnavailableError(`registry answered ${res.status} for schema id ${schemaId}`);
        const body = (await res.json());
        const fn = this.ajv.compile(JSON.parse(body.schema));
        this.logger.log(`schema id ${schemaId} fetched and compiled`);
        return fn;
    }
};
exports.ContractValidator = ContractValidator;
exports.ContractValidator = ContractValidator = ContractValidator_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ContractValidator);
//# sourceMappingURL=contract-validator.js.map