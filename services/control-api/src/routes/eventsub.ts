import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { config, requireValue } from "../config.js";
import { HttpError } from "../lib/errors.js";
import { recordTwitchStreamEvent } from "../repositories.js";

const MAX_MESSAGE_AGE_MS = 10 * 60 * 1000;

interface EventSubBody {
  challenge?: string;
  subscription?: {
    id: string;
    type: string;
    version: string;
    status: string;
  };
  event?: {
    id?: string;
    broadcaster_user_id?: string;
    broadcaster_user_login?: string;
    broadcaster_user_name?: string;
    type?: string;
    started_at?: string;
  };
}

function header(request: FastifyRequest, name: string): string {
  const value = request.headers[name.toLowerCase()];
  if (typeof value !== "string" || !value) {
    throw new HttpError(400, "Missing Twitch EventSub header: " + name, "eventsub_header_missing");
  }
  return value;
}

function verifySignature(request: FastifyRequest, rawBody: string): {
  messageId: string;
  timestamp: string;
  messageType: string;
} {
  const messageId = header(request, "twitch-eventsub-message-id");
  const timestamp = header(request, "twitch-eventsub-message-timestamp");
  const signature = header(request, "twitch-eventsub-message-signature");
  const messageType = header(request, "twitch-eventsub-message-type");

  const eventTime = Date.parse(timestamp);
  if (!Number.isFinite(eventTime) || Math.abs(Date.now() - eventTime) > MAX_MESSAGE_AGE_MS) {
    throw new HttpError(400, "EventSub message timestamp is stale", "eventsub_stale_message");
  }

  const secret = requireValue(config.twitchEventSubSecret, "TWITCH_EVENTSUB_SECRET");
  const expected = "sha256=" + createHmac("sha256", secret)
    .update(messageId + timestamp + rawBody)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new HttpError(403, "EventSub signature is invalid", "eventsub_signature_invalid");
  }

  return { messageId, timestamp, messageType };
}

export async function registerEventSubRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/webhooks/twitch/eventsub",
    { config: { rawBody: true } },
    async (request, reply) => {
      const rawBody = (request as FastifyRequest & { rawBody?: string }).rawBody;
      if (!rawBody) {
        throw new HttpError(400, "Raw EventSub body is unavailable", "eventsub_raw_body_missing");
      }

      const headers = verifySignature(request, rawBody);
      const body = request.body as EventSubBody;

      if (headers.messageType === "webhook_callback_verification") {
        if (!body.challenge) {
          throw new HttpError(400, "EventSub challenge is missing", "eventsub_challenge_missing");
        }
        return reply.type("text/plain").send(body.challenge);
      }

      if (headers.messageType === "revocation") {
        request.log.warn({ subscription: body.subscription }, "Twitch EventSub subscription revoked");
        return reply.code(204).send();
      }

      if (headers.messageType !== "notification") {
        return reply.code(204).send();
      }

      const eventType = body.subscription?.type;
      const event = body.event;
      if (
        (eventType !== "stream.online" && eventType !== "stream.offline") ||
        !event?.broadcaster_user_id
      ) {
        return reply.code(204).send();
      }

      await recordTwitchStreamEvent({
        messageId: headers.messageId,
        eventType,
        eventTimestamp: new Date(headers.timestamp),
        providerChannelId: event.broadcaster_user_id,
        providerStreamId: event.id ?? null,
        startedAt: event.started_at ? new Date(event.started_at) : null,
        payload: body
      });

      return reply.code(204).send();
    }
  );
}
