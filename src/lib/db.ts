import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const dataDir = path.join(process.cwd(), ".data", "pglite");

let pool: pg.Pool | undefined;

const globalForDb = globalThis as unknown as { pglite?: Promise<PGlite> };

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await pool.query(text, params)).rows as T[];
  }
  globalForDb.pglite ??= startLocal().catch((error: unknown) => {
    globalForDb.pglite = undefined;
    throw error;
  });
  return (await (await globalForDb.pglite).query<T>(text, params)).rows;
}

async function startLocal(): Promise<PGlite> {
  await mkdir(dataDir, { recursive: true });
  const db = new PGlite(dataDir);
  await db.waitReady;
  await db.exec(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const files = (await readdir("migrations").catch(() => [] as string[]))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const done = new Set(
    (await db.query<{ name: string }>("select name from schema_migrations")).rows.map((row) => row.name),
  );
  for (const file of files) {
    if (done.has(file)) continue;
    const sqlText = await readFile(path.join("migrations", file), "utf8");
    await db.transaction(async (tx) => {
      await tx.exec(sqlText);
      await tx.query("insert into schema_migrations (name) values ($1)", [file]);
    });
  }
  return db;
}
