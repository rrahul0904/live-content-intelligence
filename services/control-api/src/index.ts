import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  credentials: true
});

app.get("/health", async () => ({
  status: "ok",
  service: "control-api",
  timestamp: new Date().toISOString()
}));

app.get("/v1/detector/presets", async () => ({
  presets: [
    { id: "default", threshold: 72 },
    { id: "small-streamer", threshold: 68 },
    { id: "fps", threshold: 74 },
    { id: "moba", threshold: 74 },
    { id: "strategy", threshold: 70 },
    { id: "irl", threshold: 70 },
    { id: "variety", threshold: 69 },
    { id: "sports", threshold: 75 }
  ]
}));

app.get("/v1/runtime/config", async () => ({
  twitchConfigured: Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET),
  databaseConfigured: Boolean(process.env.DATABASE_URL),
  redisConfigured: Boolean(process.env.REDIS_URL)
}));

const port = Number(process.env.PORT ?? 3001);
await app.listen({ host: "0.0.0.0", port });
