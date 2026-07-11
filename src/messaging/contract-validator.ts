import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Ajv2020 from 'ajv/dist/2020.js';
import type { ValidateFunction } from 'ajv';

/** The payload does not conform to the schema the producer framed it with (poison). */
export class ContractViolationError extends Error {}

/** The registry authoritatively answered 404 for the frame's schema id (poison). */
export class UnknownSchemaError extends Error {}

/**
 * The registry could not answer (network failure, timeout, 5xx). Transient:
 * the consumer must hold the offset and retry, never dead-letter.
 */
export class RegistryUnavailableError extends Error {}

/**
 * Validates consumed events against the exact schema the producer framed them
 * with (the Confluent frame's schema id), fetched from the registry and cached
 * compiled forever — registry ids are immutable. Formats are deliberately not
 * enforced yet (mirrors the platform-wide RequireFormatValidation=false choice).
 */
@Injectable()
export class ContractValidator {
  private readonly logger = new Logger(ContractValidator.name);
  private readonly ajv = new Ajv2020({ strict: false, validateFormats: false });
  private readonly cache = new Map<number, ValidateFunction>();
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('SCHEMA_REGISTRY_URL');
  }

  async validate(schemaId: number, doc: unknown): Promise<void> {
    let fn = this.cache.get(schemaId);
    if (!fn) {
      fn = await this.fetchAndCompile(schemaId);
      this.cache.set(schemaId, fn);
    }
    if (fn(doc)) return;
    const detail = (fn.errors ?? [])
      .slice(0, 5)
      .map((e) => `${e.instancePath} ${e.keyword}: ${e.message}`)
      .join('; ');
    throw new ContractViolationError(`payload violates schema id ${schemaId}: ${detail}`);
  }

  private async fetchAndCompile(schemaId: number): Promise<ValidateFunction> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/schemas/ids/${schemaId}`, { signal: AbortSignal.timeout(5000) });
    } catch (err) {
      throw new RegistryUnavailableError(
        `registry unreachable resolving schema id ${schemaId}: ${(err as Error).message}`,
      );
    }
    // Only a definitive answer from the registry itself may condemn the frame;
    // anything else (5xx, proxy noise) is treated as an outage.
    if (res.status === 404) throw new UnknownSchemaError(`schema id ${schemaId} unknown to the registry`);
    if (!res.ok) throw new RegistryUnavailableError(`registry answered ${res.status} for schema id ${schemaId}`);
    const body = (await res.json()) as { schema: string };
    const fn = this.ajv.compile(JSON.parse(body.schema) as object);
    this.logger.log(`schema id ${schemaId} fetched and compiled`);
    return fn;
  }
}
