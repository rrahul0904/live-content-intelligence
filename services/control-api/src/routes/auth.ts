import { randomBytes, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { config, authConfigured } from "../config.js";
import { HttpError } from "../lib/errors.js";
import { getUser, upsertTwitchUser } from "../repositories.js";
import {
  clearUserSession,
  consumeOAuthState,
  requireUserId,
  setOAuthState,
  setUserSession
} from "../session.js";
import { persistUserTokens } from "../token-service.js";
import { twitchClient } from "../twitch/client.js";

function statesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/auth/twitch/start", async (_request, reply) => {
    if (!authConfigured()) {
      throw new HttpError(503, "Twitch authentication is not configured", "auth_not_configured");
    }

    const state = randomBytes(32).toString("base64url");
    setOAuthState(reply, state);
    return reply.redirect(twitchClient.authorizationUrl(state));
  });

  app.get("/auth/twitch/callback", async (request, reply) => {
    if (!authConfigured()) {
      throw new HttpError(503, "Twitch authentication is not configured", "auth_not_configured");
    }

    const query = request.query as {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
    };

    if (query.error) {
      throw new HttpError(
        400,
        query.error_description ?? "Twitch authorization was declined",
        "oauth_denied"
      );
    }
    if (!query.code || !query.state) {
      throw new HttpError(400, "OAuth callback is incomplete", "oauth_callback_invalid");
    }

    const expectedState = consumeOAuthState(request, reply);
    if (!statesMatch(expectedState, query.state)) {
      throw new HttpError(400, "OAuth state mismatch", "oauth_state_mismatch");
    }

    const token = await twitchClient.exchangeAuthorizationCode(query.code);
    const profile = await twitchClient.getCurrentUser(token.access_token);
    const user = await upsertTwitchUser({
      id: profile.id,
      login: profile.login,
      displayName: profile.display_name,
      email: profile.email,
      profileImageUrl: profile.profile_image_url
    });

    await persistUserTokens(user.id, token);
    setUserSession(reply, user.id);
    return reply.redirect(config.webAppUrl + "/channels?connected=1");
  });

  app.post("/auth/logout", async (_request, reply) => {
    clearUserSession(reply);
    return reply.code(204).send();
  });

  app.get("/v1/me", async (request) => {
    const userId = requireUserId(request);
    const user = await getUser(userId);
    if (!user) throw new HttpError(401, "Session user no longer exists", "invalid_session");

    return {
      id: user.id,
      twitchUserId: user.twitch_user_id,
      login: user.login,
      displayName: user.display_name,
      email: user.email,
      profileImageUrl: user.profile_image_url,
      plan: user.plan
    };
  });
}
