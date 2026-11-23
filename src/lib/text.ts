export function parseId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
}

export function searchWords(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((word) => word.length > 0)
    .slice(0, 12)
    .map((word) => word.slice(0, 40));
}

export function matchesRecipe(title: string, tags: string[], words: string[]): boolean {
  if (words.length === 0) return true;
  const hayTitle = title.toLowerCase();
  const hayTags = tags.map((tag) => tag.toLowerCase());
  return words.every((word) => {
    const needle = word.toLowerCase();
    return hayTitle.includes(needle) || hayTags.some((tag) => tag.includes(needle));
  });
}

export function likeContains(word: string): string {
  return `%${word.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

export function pdfFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${slug || "recipe"}.pdf`;
}

export function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
