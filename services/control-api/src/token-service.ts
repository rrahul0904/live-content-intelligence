import { config, requireValue } from "./config.js";
import { decryptSecret, encryptSecret } from "./lib/crypto.js";
import { HttpError } from "./lib/errors.js";
import { getCredential, saveCredential } from "./repositories.js";
import { twitchClient } from "./twitch/client.js";

export async function persistUserTokens(
  userId: string,
  token: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string[];
  }
): Promise<void> {
  const key = requireValue(config.tokenEncryptionKey, "TOKEN_ENCRYPTION_KEY");
  await saveCredential({
    userId,
    accessTokenCiphertext: encryptSecret(token.access_token, key),
    refreshTokenCiphertext: token.refresh_token
      ? encryptSecret(token.refresh_token, key)
      : null,
    expiresAt: new Date(Date.now() + token.expires_in * 1000),
    scopes: token.scope ?? []
  });
}

export async function getUserAccessToken(userId: string): Promise<string> {
  const credential = await getCredential(userId);
  if (!credential) {
    throw new HttpError(401, "Twitch account is not connected", "twitch_not_connected");
  }

  const key = requireValue(config.tokenEncryptionKey, "TOKEN_ENCRYPTION_KEY");
  const validUntil = credential.expires_at?.getTime() ?? 0;
  if (validUntil > Date.now() + 120_000) {
    return decryptSecret(credential.access_token_ciphertext, key);
  }

  if (!credential.refresh_token_ciphertext) {
    throw new HttpError(401, "Twitch authorization must be renewed", "twitch_reauth_required");
  }

  const refreshToken = decryptSecret(credential.refresh_token_ciphertext, key);
  const refreshed = await twitchClient.refreshUserToken(refreshToken);

  await persistUserTokens(userId, {
    ...refreshed,
    refresh_token: refreshed.refresh_token ?? refreshToken
  });

  return refreshed.access_token;
}
