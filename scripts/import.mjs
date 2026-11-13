import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { PGlite } from "@electric-sql/pglite";

const SOURCE = "https://recipes.textplain.net/api/recipes";
const DATA_DIR = path.join(process.cwd(), ".data", "pglite");

function redact(error) {
  const message = error instanceof Error ? error.message : "import failed";
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]");
}

async function applyMigrations(db) {
  await db.exec(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const files = (await readdir("migrations").catch(() => []))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const done = new Set((await db.query("select name from schema_migrations")).rows.map((row) => row.name));
  for (const file of files) {
    if (done.has(file)) continue;
    const sqlText = await readFile(path.join("migrations", file), "utf8");
    await db.transaction(async (tx) => {
      await tx.exec(sqlText);
      await tx.query("insert into schema_migrations (name) values ($1)", [file]);
    });
    console.log(`import: applied ${file}`);
  }
}

function text(value) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function stringList(value, label, id) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`recipe ${id} has ${label} that are not an array of strings`);
  }
  return value;
}

function prepare(payload) {
  if (!Array.isArray(payload)) throw new Error("API payload is not a list");
  const recipes = [];
  const links = [];
  const seenIds = new Set();
  for (const raw of payload) {
    const id = raw?.id;
    if (!Number.isInteger(id) || id <= 0) throw new Error("a recipe is missing a numeric id");
    if (seenIds.has(id)) throw new Error(`duplicate legacy id ${id}`);
    seenIds.add(id);
    const title = text(raw.title);
    if (title.trim() === "") throw new Error(`recipe ${id} has no title`);
    recipes.push({
      id,
      title,
      summary: text(raw.summary),
      amount: text(raw.amount),
      time: text(raw.time),
      oven: text(raw.oven),
      source: text(raw.source),
      notes: text(raw.notes),
      author_name: text(raw.author_name),
      ingredients: stringList(raw.ingredients, "ingredients", id),
      directions: stringList(raw.directions, "directions", id),
      tags: stringList(raw.tags, "tags", id),
    });
    const related = raw.linked_recipes;
    if (!Array.isArray(related)) throw new Error(`recipe ${id} is missing linked_recipes`);
    for (const link of related) {
      if (!Number.isInteger(link?.id) || link.id <= 0) {
        throw new Error(`recipe ${id} has a link without a numeric id`);
      }
      if (link.id === id) continue;
      links.push([id, link.id]);
    }
  }
  return { recipes, links: [...new Set(links.map((pair) => pair.join(":")))].map((key) => key.split(":").map(Number)) };
}

function spotCheckPayload(recipes) {
  const vanilla = recipes.find((recipe) => recipe.title === "Vanilla Ice Cream (for ice cream maker)");
  if (!vanilla) throw new Error("spot-check: Vanilla Ice Cream is missing from the API");
  if (vanilla.notes.length < 800 || !vanilla.notes.includes("Rum Raisin") || !vanilla.notes.includes("Dulce de Leche")) {
    throw new Error("spot-check: Vanilla Ice Cream note looks truncated");
  }
  return vanilla;
}

async function spotCheckDatabase(db, recipes, links) {
  const vanilla = spotCheckPayload(recipes);
  const note = await db.query("select notes from recipes where legacy_id = $1", [vanilla.id]);
  if (note.rows[0]?.notes !== vanilla.notes) {
    throw new Error("spot-check: Vanilla Ice Cream note did not round-trip");
  }
  const apple = recipes.find((recipe) => recipe.id === 119);
  const source = apple ?? recipes.find((recipe) => links.some((link) => link[0] === recipe.id));
  if (!source) throw new Error("spot-check: no linked recipe in the payload");
  const dest = links.find((link) => link[0] === source.id);
  if (!dest) throw new Error(`spot-check: ${source.title} has no link to verify`);
  const found = await db.query(
    `select d.title as title
     from links l
     join recipes d on d.id = l.dest_id
     where l.src_id = (select id from recipes where legacy_id = $1)
       and d.legacy_id = $2`,
    [source.id, dest[1]],
  );
  if (found.rows.length !== 1) {
    throw new Error(`spot-check: link ${source.id} -> ${dest[1]} is missing`);
  }
  const titles = new Map();
  for (const recipe of recipes) titles.set(recipe.title, (titles.get(recipe.title) ?? 0) + 1);
  for (const [title, count] of titles) {
    if (count < 2) continue;
    const got = await db.query("select count(*)::int as n from recipes where title = $1", [title]);
    if (Number(got.rows[0].n) < count) {
      throw new Error(`spot-check: duplicate title collapsed: ${title}`);
    }
  }
  console.log(
    `spot-check: Vanilla Ice Cream note ${vanilla.notes.length} chars; link ${source.id} -> ${dest[1]} (${found.rows[0].title})`,
  );
}

async function load(db, payload) {
  const { recipes, links } = prepare(payload);
  spotCheckPayload(recipes);
  const ids = new Set(recipes.map((recipe) => recipe.id));
  const keptLinks = links.filter((link) => ids.has(link[1]));
  const dropped = links.length - keptLinks.length;
  if (dropped > 0) console.log(`import: skipped ${dropped} links whose destination is not in the feed`);

  await db.transaction(async (tx) => {
    for (const recipe of recipes) {
      await tx.query(
        `insert into recipes (
           id, legacy_id, title, summary, amount, time, oven, source, notes, author_name,
           ingredients, directions, tags
         ) values (
           $1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb
         )
         on conflict (legacy_id) do update set
           title = excluded.title,
           summary = excluded.summary,
           amount = excluded.amount,
           time = excluded.time,
           oven = excluded.oven,
           source = excluded.source,
           notes = excluded.notes,
           author_name = excluded.author_name,
           ingredients = excluded.ingredients,
           directions = excluded.directions,
           tags = excluded.tags,
           updated_at = now()`,
        [
          recipe.id,
          recipe.title,
          recipe.summary,
          recipe.amount,
          recipe.time,
          recipe.oven,
          recipe.source,
          recipe.notes,
          recipe.author_name,
          JSON.stringify(recipe.ingredients),
          JSON.stringify(recipe.directions),
          JSON.stringify(recipe.tags),
        ],
      );
    }
    await tx.query(
      `delete from links l
       using recipes s, recipes d
       where l.src_id = s.id and l.dest_id = d.id
         and s.legacy_id is not null and d.legacy_id is not null`,
    );
    for (const [src, dest] of keptLinks) {
      await tx.query(
        `insert into links (src_id, dest_id)
         select s.id, d.id from recipes s, recipes d
         where s.legacy_id = $1 and d.legacy_id = $2 and s.id <> d.id
         on conflict do nothing`,
        [src, dest],
      );
    }
    await tx.query(
      "select setval(pg_get_serial_sequence('recipes','id'), greatest((select coalesce(max(id), 1) from recipes), 1))",
    );
    await tx.query(
      `insert into app_meta (key, value) values ('imported_at', $1)
       on conflict (key) do update set value = excluded.value`,
      [new Date().toISOString()],
    );
  });

  const counts = await db.query(
    "select (select count(*)::int from recipes) as recipes, (select count(*)::int from links) as links",
  );
  console.log(`import: fetched ${recipes.length} recipes; database has ${counts.rows[0].recipes} recipes and ${counts.rows[0].links} links`);
  await spotCheckDatabase(db, recipes, keptLinks);
}

async function withDatabase(fn) {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (url !== "") {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED?.trim() || url });
    await client.connect();
    const db = {
      query: (text, params) => client.query(text, params ?? []),
      exec: async (text) => {
        await client.query(text);
      },
      transaction: async (fn) => {
        await client.query("begin");
        try {
          const result = await fn({
            query: (text, params) => client.query(text, params ?? []),
            exec: async (text) => {
              await client.query(text);
            },
          });
          await client.query("commit");
          return result;
        } catch (error) {
          await client.query("rollback");
          throw error;
        }
      },
    };
    try {
      await client.query("set lock_timeout = '60s'");
      await client.query("select pg_advisory_lock(7272742)");
      await applyMigrations(db);
      return await fn(db);
    } finally {
      await client.end();
    }
  }

  await mkdir(DATA_DIR, { recursive: true });
  const pglite = new PGlite(DATA_DIR);
  await pglite.waitReady;
  const db = {
    query: (text, params) => pglite.query(text, params ?? []),
    exec: (text) => pglite.exec(text),
    transaction: (fn) => pglite.transaction(fn),
  };
  try {
    await applyMigrations(db);
    return await fn(db);
  } finally {
    await pglite.close();
  }
}

export async function importRecipes({ refresh }) {
  await withDatabase(async (db) => {
    if (!refresh) {
      const existing = await db.query("select value from app_meta where key = 'imported_at'");
      if (existing.rows.length > 0) {
        console.log(`import: already loaded at ${existing.rows[0].value}`);
        return;
      }
    }
    const response = await fetch(SOURCE, {
      headers: { accept: "application/json", "user-agent": "recipes-import" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`recipe API returned ${response.status}`);
    const payload = await response.json();
    await load(db, payload);
  });
}

const invoked = process.argv[1]?.endsWith("import.mjs");
if (invoked) {
  importRecipes({ refresh: true }).catch((error) => {
    console.error(redact(error));
    process.exit(1);
  });
}
