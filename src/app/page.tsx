import { RecipeIndex } from "@/components/recipe-index";
import { listRecipes } from "@/lib/recipes";
import { one } from "@/lib/text";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const query = one((await searchParams).q);
  const recipes = await listRecipes([]);
  return <RecipeIndex recipes={recipes} initialQuery={query} />;
}
