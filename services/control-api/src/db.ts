import pg from "pg";
import { config } from "./config.js";
import { HttpError } from "./lib/errors.js";

const { Pool } = pg;
let pool: pg.Pool | undefined;

export function database(): pg.Pool {
  if (!config.databaseUrl) {
    throw new HttpError(503, "Database is not configured", "database_not_configured");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }

  return pool;
}

export async function query<T extends pg.QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  const result = await database().query<T>(text, values);
  return result.rows;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
