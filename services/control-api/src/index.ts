import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { config, authConfigured, twitchConfigured } from "./config.js";
import { DETECTOR_PRESETS } from "./detector-presets.js";
import { closeDatabase } from "./db.js";
import { asPublicError } from "./lib/errors.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerChannelRoutes } from "./routes/channels.js";

const app = Fastify({ logger: true });

await app.register(cookie, {
  secret: config.cookieSecret ?? "local-development-cookie-secret-change-me-32"
});

await app.register(cors, {
  origin: config.webOrigin,
  credentials: true
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  const publicError = asPublicError(error);
  return reply.code(publicError.statusCode).send(publicError.body);
});

app.get("/health", async () => ({
  status: "ok",
  service: "control-api",
  timestamp: new Date().toISOString()
}));

app.get("/ready", async (_request, reply) => {
  const checks = {
    databaseConfigured: Boolean(config.databaseUrl),
    twitchConfigured: twitchConfigured(),
    authConfigured: authConfigured(),
    redisConfigured: Boolean(process.env.REDIS_URL)
  };
  const ready = checks.databaseConfigured && checks.twitchConfigured && checks.authConfigured;
  return reply.code(ready ? 200 : 503).send({ ready, checks });
});

app.get("/v1/detector/presets", async () => ({
  presets: Object.values(DETECTOR_PRESETS)
}));

app.get("/v1/runtime/config", async () => ({
  twitchConfigured: twitchConfigured(),
  authConfigured: authConfigured(),
  databaseConfigured: Boolean(config.databaseUrl),
  redisConfigured: Boolean(process.env.REDIS_URL)
}));

await registerAuthRoutes(app);
await registerChannelRoutes(app);

const port = Number(process.env.PORT ?? 3001);

const shutdown = async () => {
  await app.close();
  await closeDatabase();
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

await app.listen({ host: "0.0.0.0", port });
