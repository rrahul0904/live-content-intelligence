import { config, requireValue } from "../config.js";
import { HttpError } from "../lib/errors.js";

const TWITCH_IDENTITY = "https://id.twitch.tv/oauth2";
const TWITCH_HELIX = "https://api.twitch.tv/helix";
const USER_SCOPES = ["clips:edit", "user:read:email"] as const;

export interface TwitchTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string[];
  token_type: string;
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  email?: string;
}

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
}

interface HelixResponse<T> {
  data: T[];
}

export class TwitchClient {
  private appToken?: { value: string; expiresAt: number };

  authorizationUrl(state: string): string {
    const clientId = requireValue(config.twitchClientId, "TWITCH_CLIENT_ID");
    const url = new URL(TWITCH_IDENTITY + "/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", config.twitchRedirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", USER_SCOPES.join(" "));
    url.searchParams.set("state", state);
    return url.toString();
  }

  async exchangeAuthorizationCode(code: string): Promise<TwitchTokenResponse> {
    const body = new URLSearchParams({
      client_id: requireValue(config.twitchClientId, "TWITCH_CLIENT_ID"),
      client_secret: requireValue(config.twitchClientSecret, "TWITCH_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
      redirect_uri: config.twitchRedirectUri
    });

    return this.identityRequest<TwitchTokenResponse>("/token", body);
  }

  async refreshUserToken(refreshToken: string): Promise<TwitchTokenResponse> {
    const body = new URLSearchParams({
      client_id: requireValue(config.twitchClientId, "TWITCH_CLIENT_ID"),
      client_secret: requireValue(config.twitchClientSecret, "TWITCH_CLIENT_SECRET"),
      grant_type: "refresh_token",
      refresh_token: refreshToken
    });

    return this.identityRequest<TwitchTokenResponse>("/token", body);
  }

  async getCurrentUser(userAccessToken: string): Promise<TwitchUser> {
    const response = await this.helix<HelixResponse<TwitchUser>>(
      "/users",
      userAccessToken
    );
    const user = response.data[0];
    if (!user) {
      throw new HttpError(502, "Twitch did not return the authorized user", "twitch_user_missing");
    }
    return user;
  }

  async findUser(login: string): Promise<TwitchUser | null> {
    const token = await this.getAppAccessToken();
    const params = new URLSearchParams({ login });
    const response = await this.helix<HelixResponse<TwitchUser>>(
      "/users?" + params.toString(),
      token
    );
    return response.data[0] ?? null;
  }

  async getStreams(userIds: string[]): Promise<TwitchStream[]> {
    if (userIds.length === 0) return [];

    const token = await this.getAppAccessToken();
    const params = new URLSearchParams();
    for (const id of userIds.slice(0, 100)) params.append("user_id", id);

    const response = await this.helix<HelixResponse<TwitchStream>>(
      "/streams?" + params.toString(),
      token
    );
    return response.data;
  }

  async createLiveClip(
    broadcasterId: string,
    userAccessToken: string,
    input?: { title?: string; duration?: number }
  ): Promise<{ id: string; edit_url: string }> {
    const params = new URLSearchParams({ broadcaster_id: broadcasterId });
    if (input?.title) params.set("title", input.title);
    if (input?.duration) params.set("duration", String(input.duration));

    const response = await this.helix<HelixResponse<{ id: string; edit_url: string }>>(
      "/clips?" + params.toString(),
      userAccessToken,
      { method: "POST" }
    );
    const clip = response.data[0];
    if (!clip) {
      throw new HttpError(502, "Twitch accepted no clip record", "twitch_clip_missing");
    }
    return clip;
  }

  private async getAppAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.appToken && this.appToken.expiresAt > now + 60_000) {
      return this.appToken.value;
    }

    const body = new URLSearchParams({
      client_id: requireValue(config.twitchClientId, "TWITCH_CLIENT_ID"),
      client_secret: requireValue(config.twitchClientSecret, "TWITCH_CLIENT_SECRET"),
      grant_type: "client_credentials"
    });
    const token = await this.identityRequest<TwitchTokenResponse>("/token", body);
    this.appToken = {
      value: token.access_token,
      expiresAt: now + token.expires_in * 1000
    };
    return token.access_token;
  }

  private async identityRequest<T>(path: string, body: URLSearchParams): Promise<T> {
    const response = await fetch(TWITCH_IDENTITY + path, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new HttpError(
        response.status >= 500 ? 502 : 400,
        "Twitch OAuth request failed: " + detail.slice(0, 240),
        "twitch_oauth_error"
      );
    }

    return response.json() as Promise<T>;
  }

  private async helix<T>(
    path: string,
    token: string,
    init: RequestInit = {}
  ): Promise<T> {
    const clientId = requireValue(config.twitchClientId, "TWITCH_CLIENT_ID");
    const response = await fetch(TWITCH_HELIX + path, {
      ...init,
      headers: {
        "Client-Id": clientId,
        Authorization: "Bearer " + token,
        "content-type": "application/json",
        ...(init.headers ?? {})
      }
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new HttpError(
        response.status === 401 ? 401 : response.status === 429 ? 429 : 502,
        "Twitch API request failed: " + detail.slice(0, 240),
        response.status === 429 ? "twitch_rate_limited" : "twitch_api_error"
      );
    }

    return response.json() as Promise<T>;
  }
}

export const twitchClient = new TwitchClient();
