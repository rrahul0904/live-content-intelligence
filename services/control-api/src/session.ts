import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "./config.js";
import { HttpError } from "./lib/errors.js";

const SESSION_COOKIE = "lci_session";
const OAUTH_STATE_COOKIE = "lci_oauth_state";

function secureCookies(): boolean {
  return config.nodeEnv === "production";
}

export function setOAuthState(reply: FastifyReply, state: string): void {
  reply.setCookie(OAUTH_STATE_COOKIE, state, {
    path: "/auth/twitch/callback",
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    signed: true,
    maxAge: 10 * 60
  });
}

export function consumeOAuthState(request: FastifyRequest, reply: FastifyReply): string {
  const raw = request.cookies[OAUTH_STATE_COOKIE];
  reply.clearCookie(OAUTH_STATE_COOKIE, { path: "/auth/twitch/callback" });
  if (!raw) {
    throw new HttpError(400, "OAuth state cookie is missing", "oauth_state_missing");
  }

  const unsigned = request.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) {
    throw new HttpError(400, "OAuth state cookie is invalid", "oauth_state_invalid");
  }

  return unsigned.value;
}

export function setUserSession(reply: FastifyReply, userId: string): void {
  reply.setCookie(SESSION_COOKIE, userId, {
    path: "/",
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    signed: true,
    maxAge: 30 * 24 * 60 * 60
  });
}

export function clearUserSession(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function requireUserId(request: FastifyRequest): string {
  const raw = request.cookies[SESSION_COOKIE];
  if (!raw) {
    throw new HttpError(401, "Authentication required", "unauthenticated");
  }

  const unsigned = request.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) {
    throw new HttpError(401, "Session is invalid", "invalid_session");
  }

  return unsigned.value;
}
