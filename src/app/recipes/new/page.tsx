import { redirect } from "next/navigation";
import { createRecipeAction } from "@/app/actions";
import { RecipeForm } from "@/components/recipe-form";
import { isEditor } from "@/lib/auth";
import { one } from "@/lib/text";

export const metadata = { title: "New recipe" };

export default async function NewRecipePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  if (!(await isEditor())) redirect("/login?next=/recipes/new");
  const error = one((await searchParams).error);

  return (
    <>
      <h1>New recipe</h1>
      {error ? <p className="error">{error}</p> : null}
      <RecipeForm action={createRecipeAction} submitLabel="Save recipe" />
    </>
  );
}
