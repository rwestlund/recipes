import { sql } from "@/lib/db";
import { likeContains, parseId } from "@/lib/text";

export { parseId, searchWords, pdfFilename } from "@/lib/text";

export type Recipe = {
  id: number;
  legacyId: number | null;
  title: string;
  summary: string;
  amount: string;
  time: string;
  notes: string;
  ingredients: string[];
  directions: string[];
  tags: string[];
};

export type ListRecipe = {
  id: number;
  title: string;
  summary: string;
  time: string;
  tags: string[];
  photoId: number | null;
};

export type LinkedRecipe = { id: number; title: string };

export type RecipeInput = {
  title: string;
  summary: string;
  amount: string;
  time: string;
  notes: string;
  ingredients: string[];
  directions: string[];
  tags: string[];
};

const LIMITS = {
  title: 200,
  summary: 4000,
  amount: 300,
  time: 300,
  notes: 20_000,
  line: 2000,
  lines: 80,
  tags: 30,
  tag: 40,
};

export class ValidationError extends Error {}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    } catch {
      return [];
    }
  }
  return [];
}

function numberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

type RecipeRow = {
  id: number | string;
  legacy_id: number | string | null;
  title: string;
  summary: string;
  amount: string;
  time: string;
  notes: string;
  ingredients: unknown;
  directions: unknown;
  tags: unknown;
};

function toRecipe(row: RecipeRow): Recipe {
  return {
    id: Number(row.id),
    legacyId: numberOrNull(row.legacy_id),
    title: row.title,
    summary: row.summary,
    amount: row.amount,
    time: row.time,
    notes: row.notes,
    ingredients: asStringArray(row.ingredients),
    directions: asStringArray(row.directions),
    tags: asStringArray(row.tags),
  };
}

export async function listRecipes(words: string[]): Promise<ListRecipe[]> {
  const params: unknown[] = [];
  const clauses: string[] = [];
  for (const word of words) {
    params.push(likeContains(word));
    const index = params.length;
    clauses.push(
      `(title ilike $${index} escape '\\' or exists (
        select 1 from jsonb_array_elements_text(tags) as tag
        where tag ilike $${index} escape '\\'
      ))`,
    );
  }
  const where = clauses.length > 0 ? `where ${clauses.join(" and ")}` : "";
  const rows = await sql<RecipeRow & { photo_id: number | string | null }>(
    `select id, title, summary, time, tags,
       (select id from photos where recipe_id = recipes.id order by id limit 1) as photo_id
     from recipes
     ${where}
     order by lower(title), id`,
    params,
  );
  return rows.map((row) => ({
    id: Number(row.id),
    title: row.title,
    summary: row.summary,
    time: row.time,
    tags: asStringArray(row.tags),
    photoId: numberOrNull(row.photo_id),
  }));
}

export async function getRecipe(id: number): Promise<Recipe | null> {
  const rows = await sql<RecipeRow>("select * from recipes where id = $1", [id]);
  const row = rows[0];
  return row ? toRecipe(row) : null;
}

export async function outgoingLinks(id: number): Promise<LinkedRecipe[]> {
  const rows = await sql<{ id: number | string; title: string }>(
    `select r.id, r.title
     from links l
     join recipes r on r.id = l.dest_id
     where l.src_id = $1
     order by lower(r.title), r.id`,
    [id],
  );
  return rows.map((row) => ({ id: Number(row.id), title: row.title }));
}

export async function incomingLinks(id: number): Promise<LinkedRecipe[]> {
  const rows = await sql<{ id: number | string; title: string }>(
    `select r.id, r.title
     from links l
     join recipes r on r.id = l.src_id
     where l.dest_id = $1
     order by lower(r.title), r.id`,
    [id],
  );
  return rows.map((row) => ({ id: Number(row.id), title: row.title }));
}

export async function photoIds(recipeId: number): Promise<number[]> {
  const rows = await sql<{ id: number | string }>(
    "select id from photos where recipe_id = $1 order by id",
    [recipeId],
  );
  return rows.map((row) => Number(row.id));
}

export async function photoBytes(id: number): Promise<Buffer | null> {
  const rows = await sql<{ bytes: unknown }>("select bytes from photos where id = $1", [id]);
  const value = rows[0]?.bytes;
  if (value == null) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") {
    const hex = value.startsWith("\\x") ? value.slice(2) : value;
    return Buffer.from(hex, "hex");
  }
  return null;
}

export function recipeInputFromForm(formData: FormData): RecipeInput {
  const title = field(formData, "title");
  if (title === "") throw new ValidationError("A title is required.");
  return {
    title: limited(title, LIMITS.title, "Title"),
    summary: limited(field(formData, "summary"), LIMITS.summary, "Summary"),
    amount: limited(field(formData, "amount"), LIMITS.amount, "Amount"),
    time: limited(field(formData, "time"), LIMITS.time, "Time"),
    notes: limited(rawField(formData, "notes").trim(), LIMITS.notes, "Notes"),
    ingredients: lines(rawField(formData, "ingredients"), "Ingredient"),
    directions: lines(rawField(formData, "directions"), "Step"),
    tags: tagList(field(formData, "tags")),
  };
}

function field(formData: FormData, name: string): string {
  return rawField(formData, name).trim();
}

function rawField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function limited(value: string, max: number, label: string): string {
  if (value.length > max) throw new ValidationError(`${label} is too long.`);
  return value;
}

function lines(value: string, label: string): string[] {
  const items = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  if (items.length > LIMITS.lines) throw new ValidationError(`Too many ${label.toLowerCase()} lines.`);
  for (const item of items) {
    if (item.length > LIMITS.line) throw new ValidationError(`An ${label.toLowerCase()} line is too long.`);
  }
  return items;
}

function tagList(value: string): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const part of value.split(",")) {
    const tag = part.trim();
    if (tag === "") continue;
    if (tag.length > LIMITS.tag) throw new ValidationError("A tag is too long.");
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  if (tags.length > LIMITS.tags) throw new ValidationError("Too many tags.");
  return tags;
}

export async function insertRecipe(input: RecipeInput): Promise<number> {
  const rows = await sql<{ id: number | string }>(
    `insert into recipes (
       title, summary, amount, time, notes, ingredients, directions, tags
     ) values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb)
     returning id`,
    [
      input.title,
      input.summary,
      input.amount,
      input.time,
      input.notes,
      JSON.stringify(input.ingredients),
      JSON.stringify(input.directions),
      JSON.stringify(input.tags),
    ],
  );
  return Number(rows[0].id);
}

export async function updateRecipe(id: number, input: RecipeInput): Promise<boolean> {
  const rows = await sql<{ id: number | string }>(
    `update recipes set
       title = $2,
       summary = $3,
       amount = $4,
       time = $5,
       notes = $6,
       ingredients = $7::jsonb,
       directions = $8::jsonb,
       tags = $9::jsonb,
       updated_at = now()
     where id = $1
     returning id`,
    [
      id,
      input.title,
      input.summary,
      input.amount,
      input.time,
      input.notes,
      JSON.stringify(input.ingredients),
      JSON.stringify(input.directions),
      JSON.stringify(input.tags),
    ],
  );
  return rows.length > 0;
}

export async function deleteRecipe(id: number): Promise<void> {
  await sql("delete from recipes where id = $1", [id]);
}

export async function addPhoto(recipeId: number, bytes: Buffer): Promise<void> {
  const counts = await sql<{ n: number | string }>(
    "select count(*)::int as n from photos where recipe_id = $1",
    [recipeId],
  );
  if (Number(counts[0]?.n ?? 0) >= 8) {
    throw new ValidationError("This recipe already has 8 photos.");
  }
  if (bytes.length >= 3_000_000) {
    throw new ValidationError("That photo is still too large after resizing.");
  }
  await sql("insert into photos (recipe_id, bytes) values ($1, $2)", [recipeId, bytes]);
}

export async function deletePhoto(recipeId: number, photoId: number): Promise<void> {
  await sql("delete from photos where id = $1 and recipe_id = $2", [photoId, recipeId]);
}

export async function addLink(srcId: number, destId: number): Promise<void> {
  if (srcId === destId) throw new ValidationError("Pick a different recipe.");
  const dest = await sql("select id from recipes where id = $1", [destId]);
  if (dest.length === 0) throw new ValidationError("That recipe is not in the book.");
  await sql(
    "insert into links (src_id, dest_id) values ($1, $2) on conflict do nothing",
    [srcId, destId],
  );
}

export async function removeLink(srcId: number, destId: number): Promise<void> {
  await sql("delete from links where src_id = $1 and dest_id = $2", [srcId, destId]);
}

export async function searchTitles(query: string, exceptId: number): Promise<LinkedRecipe[]> {
  const words = query.trim();
  if (words === "") return [];
  const id = parseId(words) ?? 0;
  const rows = await sql<{ id: number | string; title: string }>(
    `select id, title from recipes
     where id <> $1 and (title ilike $2 escape '\\' or ($3::int > 0 and id = $3::int))
     order by lower(title), id
     limit 12`,
    [exceptId, likeContains(words), id],
  );
  return rows.map((row) => ({ id: Number(row.id), title: row.title }));
}
