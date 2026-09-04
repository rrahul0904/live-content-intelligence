import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DETECTOR_PRESETS, isPresetId } from "../detector-presets.js";
import { HttpError } from "../lib/errors.js";
import { assertChannelCapacity, channelLimitForPlan } from "../plans.js";
import {
  addUserChannel,
  countEnabledChannels,
  getUser,
  getUserChannelByProviderId,
  listUserChannels,
  removeUserChannel,
  updateUserChannel
} from "../repositories.js";
import { requireUserId } from "../session.js";
import { twitchClient } from "../twitch/client.js";

const loginSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9_]{2,25}$/);

const addSchema = z.object({
  login: loginSchema,
  preset: z.string().default("default")
});

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  preset: z.string().optional()
}).refine((value) => value.enabled !== undefined || value.preset !== undefined, {
  message: "At least one field is required"
});

async function authenticatedUser(request: Parameters<FastifyInstance["get"]>[1] extends never ? never : any) {
  const userId = requireUserId(request);
  const user = await getUser(userId);
  if (!user) throw new HttpError(401, "Session user no longer exists", "invalid_session");
  return user;
}

export async function registerChannelRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/channels/search", async (request) => {
    await authenticatedUser(request);
    const parsed = loginSchema.safeParse((request.query as { login?: string }).login);
    if (!parsed.success) {
      throw new HttpError(400, "Enter a valid Twitch login", "invalid_channel_login");
    }

    const channel = await twitchClient.findUser(parsed.data);
    if (!channel) throw new HttpError(404, "Twitch channel not found", "channel_not_found");

    const streams = await twitchClient.getStreams([channel.id]);
    const stream = streams[0];

    return {
      providerChannelId: channel.id,
      login: channel.login,
      displayName: channel.display_name,
      profileImageUrl: channel.profile_image_url,
      description: channel.description,
      broadcasterType: channel.broadcaster_type,
      live: Boolean(stream),
      stream: stream ? {
        id: stream.id,
        gameName: stream.game_name,
        title: stream.title,
        viewerCount: stream.viewer_count,
        startedAt: stream.started_at
      } : null
    };
  });

  app.get("/v1/channels", async (request) => {
    const user = await authenticatedUser(request);
    const channels = await listUserChannels(user.id);
    const streams = await twitchClient.getStreams(
      channels.filter((channel) => channel.enabled).map((channel) => channel.provider_channel_id)
    );
    const streamsByUser = new Map(streams.map((stream) => [stream.user_id, stream]));

    return {
      plan: user.plan,
      channelLimit: channelLimitForPlan(user.plan),
      enabledCount: channels.filter((channel) => channel.enabled).length,
      channels: channels.map((channel) => {
        const stream = streamsByUser.get(channel.provider_channel_id);
        return {
          id: channel.id,
          providerChannelId: channel.provider_channel_id,
          login: channel.login,
          displayName: channel.display_name,
          profileImageUrl: channel.profile_image_url,
          description: channel.description,
          broadcasterType: channel.broadcaster_type,
          preset: channel.preset,
          threshold: Number(channel.threshold),
          enabled: channel.enabled,
          live: Boolean(stream),
          stream: stream ? {
            id: stream.id,
            gameName: stream.game_name,
            title: stream.title,
            viewerCount: stream.viewer_count,
            startedAt: stream.started_at
          } : null
        };
      })
    };
  });

  app.post("/v1/channels", async (request, reply) => {
    const user = await authenticatedUser(request);
    const parsed = addSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid channel", "invalid_channel");
    }
    if (!isPresetId(parsed.data.preset)) {
      throw new HttpError(400, "Unknown detector preset", "invalid_preset");
    }

    const remote = await twitchClient.findUser(parsed.data.login);
    if (!remote) throw new HttpError(404, "Twitch channel not found", "channel_not_found");

    const existing = await getUserChannelByProviderId(user.id, remote.id);
    if (existing?.enabled) {
      return reply.code(200).send(existing);
    }

    const enabledCount = await countEnabledChannels(user.id);
    assertChannelCapacity(user.plan, enabledCount);

    const preset = DETECTOR_PRESETS[parsed.data.preset];
    const saved = await addUserChannel({
      userId: user.id,
      providerChannelId: remote.id,
      login: remote.login,
      displayName: remote.display_name,
      profileImageUrl: remote.profile_image_url,
      description: remote.description,
      broadcasterType: remote.broadcaster_type,
      preset: preset.id,
      threshold: preset.threshold
    });

    return reply.code(existing ? 200 : 201).send(saved);
  });

  app.patch("/v1/channels/:id", async (request) => {
    const user = await authenticatedUser(request);
    const parsed = patchSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid update", "invalid_channel_update");
    }
    if (parsed.data.preset && !isPresetId(parsed.data.preset)) {
      throw new HttpError(400, "Unknown detector preset", "invalid_preset");
    }

    const current = (await listUserChannels(user.id)).find(
      (channel) => channel.id === (request.params as { id: string }).id
    );
    if (!current) throw new HttpError(404, "Configured channel not found", "configured_channel_not_found");

    if (parsed.data.enabled === true && !current.enabled) {
      assertChannelCapacity(user.plan, await countEnabledChannels(user.id));
    }

    const preset = parsed.data.preset && isPresetId(parsed.data.preset)
      ? DETECTOR_PRESETS[parsed.data.preset]
      : undefined;

    const updated = await updateUserChannel(
      user.id,
      current.id,
      {
        enabled: parsed.data.enabled,
        preset: preset?.id,
        threshold: preset?.threshold
      }
    );
    if (!updated) throw new HttpError(404, "Configured channel not found", "configured_channel_not_found");
    return updated;
  });

  app.delete("/v1/channels/:id", async (request, reply) => {
    const user = await authenticatedUser(request);
    const removed = await removeUserChannel(user.id, (request.params as { id: string }).id);
    if (!removed) throw new HttpError(404, "Configured channel not found", "configured_channel_not_found");
    return reply.code(204).send();
  });
}
