// Imported labels, folded into one smaller set. Unknown labels are dropped.
// Keep the case list in migrations/002_simplify.sql in step with this map.
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
