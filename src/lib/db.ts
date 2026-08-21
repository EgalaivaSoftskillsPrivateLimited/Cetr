import { readFileSync, readdirSync } from "fs";
import path from "path";
import { Pool, type QueryResultRow } from "pg";

declare global {
  var __pgPool: Pool | undefined;
  var __pgMigrated: Promise<void> | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — see .env.example.");
  }
  return new Pool({ connectionString });
}

// Cached on globalThis so Next.js dev-mode module reloads don't open a new
// connection pool on every edit.
const pool = globalThis.__pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__pgPool = pool;

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations");

async function runMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const { rows } = await pool.query("SELECT 1 FROM schema_migrations WHERE name = $1", [file]);
    if (rows.length > 0) continue;

    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      client.release();
    }
  }
}

const migrated = globalThis.__pgMigrated ?? runMigrations();
if (process.env.NODE_ENV !== "production") globalThis.__pgMigrated = migrated;

/** Finds-or-creates the (name, certificateType) program row and returns its id. */
export async function resolveProgramId(name: string, certificateType: string): Promise<number> {
  const rows = await query<{ id: number }>(
    `INSERT INTO programs (name, certificate_type) VALUES ($1, $2)
     ON CONFLICT (name, certificate_type) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name, certificateType]
  );
  return rows[0].id;
}

/** Runs a query once pending migrations have applied. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  await migrated;
  const { rows } = await pool.query<T>(text, params);
  return rows;
}

/** Runs `fn` inside a transaction once pending migrations have applied. */
export async function withTransaction<T>(
  fn: (client: { query: <R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) => Promise<R[]> }) => Promise<T>
): Promise<T> {
  await migrated;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn({
      query: async (text, params) => (await client.query(text, params)).rows,
    });
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
