import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import * as jose from 'jose';

/** Audience pin: an access token (a different audience) signed by the same key ring
 *  can never be replayed here as an identity proof. */
const AUDIENCE = 'peikon-internal';
const IDENTITY_HEADERS = ['x-user-id', 'x-user-roles', 'x-session-id', 'x-auth-amr', 'x-auth-time'];

/**
 * Verifies the signed gateway assertion user-service mints at ForwardAuth, so
 * this service trusts identity from a cryptographic claim rather than from a raw
 * x-user-id header — which any peer on the internal network could otherwise forge
 * (Traefik only overwrites it at the edge). The verified claims are written back
 * onto the request as the headers the controller already reads.
 */
@Injectable()
export class GatewayAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GatewayAuthMiddleware.name);
  private readonly jwks: ReturnType<typeof jose.createRemoteJWKSet>;

  constructor(config: ConfigService) {
    const url = config.get<string>('GATEWAY_JWKS_URL') ?? 'http://user-service:8080/.well-known/jwks.json';
    // createRemoteJWKSet caches keys and refetches (rate-limited) on an unknown kid,
    // so a signing-key rotation self-heals without a restart.
    this.jwks = jose.createRemoteJWKSet(new URL(url));
  }

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const assertion = req.headers['x-gateway-assertion'];
    const token = Array.isArray(assertion) ? assertion[0] : assertion;
    if (!token) {
      throw new UnauthorizedException('missing gateway assertion');
    }

    let payload: jose.JWTPayload;
    try {
      ({ payload } = await jose.jwtVerify(token, this.jwks, {
        algorithms: ['ES256'],
        audience: AUDIENCE,
        clockTolerance: '10s',
      }));
    } catch (err) {
      this.logger.warn(`gateway assertion rejected: ${(err as Error).message}`);
      throw new UnauthorizedException('invalid gateway assertion');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('invalid gateway assertion');
    }

    // Verified identity is the only identity: drop any inbound copy, then set from claims.
    for (const h of [...IDENTITY_HEADERS, 'x-gateway-assertion']) {
      delete req.headers[h];
    }
    req.headers['x-user-id'] = payload.sub;
    if (Array.isArray(payload.amr)) {
      req.headers['x-auth-amr'] = (payload.amr as string[]).join(',');
    }
    if (typeof payload.auth_time === 'number') {
      req.headers['x-auth-time'] = String(payload.auth_time);
    }

    next();
  }
}
