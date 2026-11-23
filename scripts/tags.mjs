// Imported labels, folded into one smaller set. Unknown labels are dropped.
// Keep the case list in migrations/002_simplify.sql in step with this map.
// "fresh-milled flour" is not an old-site label. withFreshMilledTag adds it
// when the recipe text says fresh-milled, and migrations/003_fresh_milled.sql
// does the same for a database that was already imported.
export const FRESH_MILLED_TAG = "fresh-milled flour";

const FRESH_MILLED = /fresh[\s-]*milled/i;

export const TAG_MAP = {
  alcohol: ["drink"],
  appetizer: ["appetizer"],
  asian: [],
  beverage: ["drink"],
  bread: ["bread"],
  breakfast: ["breakfast"],
  cake: ["dessert"],
  camping: ["camping"],
  carnivorous: [],
  chinese: [],
  chocolate: ["chocolate"],
  cold: [],
  complex: [],
  cookies: ["cookies"],
  cracker: ["appetizer"],
  cupcake: ["dessert"],
  dessert: ["dessert"],
  dinner: ["dinner"],
  dip: ["appetizer"],
  dressing: ["sauce"],
  drink: ["drink"],
  easy: ["easy"],
  "fresh-milled flour": ["fresh-milled flour"],
  frosting: ["dessert"],
  "fruit dessert": ["dessert"],
  glaze: ["dessert"],
  greek: [],
  indian: [],
  lunch: ["lunch"],
  mexican: [],
  nuts: [],
  pasta: ["pasta"],
  pie: ["dessert"],
  pudding: ["dessert"],
  "quick bread": ["bread"],
  rice: [],
  russian: [],
  salad: ["side dish"],
  sauce: ["sauce"],
  side: ["side dish"],
  "side dish": ["side dish"],
  snack: ["appetizer"],
  "slow cooker": ["slow cooker"],
  soup: ["soup"],
  spicy: [],
  tea: ["drink"],
  vegan: [],
  vegetable: ["side dish"],
  "yeast bread": ["bread"],
};

export function normalizeTags(tags) {
  const seen = new Set();
  const out = [];
  for (const raw of tags) {
    const key = String(raw).trim().toLowerCase();
    if (key === "") continue;
    const mapped = Object.hasOwn(TAG_MAP, key) ? TAG_MAP[key] : [];
    for (const tag of mapped) {
      if (seen.has(tag)) continue;
      seen.add(tag);
      out.push(tag);
    }
  }
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

export function withFreshMilledTag(tags, text) {
  if (!FRESH_MILLED.test(String(text))) return tags;
  if (tags.includes(FRESH_MILLED_TAG)) return tags;
  const out = [...tags, FRESH_MILLED_TAG];
  out.sort((a, b) => a.localeCompare(b));
  return out;
}
