export interface RuntimeConfig {
  nodeEnv: string;
  databaseUrl?: string;
  webOrigin: string;
  webAppUrl: string;
  twitchClientId?: string;
  twitchClientSecret?: string;
  twitchRedirectUri: string;
  tokenEncryptionKey?: string;
  cookieSecret?: string;
}

export const config: RuntimeConfig = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL,
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  webAppUrl: process.env.WEB_APP_URL ?? "http://localhost:3000",
  twitchClientId: process.env.TWITCH_CLIENT_ID,
  twitchClientSecret: process.env.TWITCH_CLIENT_SECRET,
  twitchRedirectUri:
    process.env.TWITCH_REDIRECT_URI ?? "http://localhost:3001/auth/twitch/callback",
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY,
  cookieSecret: process.env.COOKIE_SECRET
};

export function twitchConfigured(): boolean {
  return Boolean(config.twitchClientId && config.twitchClientSecret && config.twitchRedirectUri);
}

export function authConfigured(): boolean {
  return twitchConfigured() && Boolean(config.databaseUrl && config.tokenEncryptionKey && config.cookieSecret);
}

export function requireValue(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(name + " is not configured");
  }
  return value;
}
