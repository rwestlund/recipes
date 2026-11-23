import type { Recipe } from "@/lib/recipes";

export function RecipeForm({
  action,
  recipe,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  recipe?: Recipe;
  submitLabel: string;
}) {
  return (
    <form action={action} className="form">
      {recipe ? <input type="hidden" name="id" value={recipe.id} /> : null}
      <label htmlFor="title">Title</label>
      <input id="title" name="title" required defaultValue={recipe?.title ?? ""} maxLength={200} />

      <label htmlFor="summary">Summary</label>
      <textarea id="summary" name="summary" rows={2} defaultValue={recipe?.summary ?? ""} />

      <label htmlFor="amount">Amount</label>
      <input id="amount" name="amount" defaultValue={recipe?.amount ?? ""} />

      <label htmlFor="time">Time</label>
      <input id="time" name="time" defaultValue={recipe?.time ?? ""} />

      <label htmlFor="tags">Tags</label>
      <input id="tags" name="tags" defaultValue={recipe?.tags.join(", ") ?? ""} placeholder="dessert, chocolate" />

      <label htmlFor="ingredients">Ingredients, one line each</label>
      <textarea
        id="ingredients"
        name="ingredients"
        rows={10}
        defaultValue={recipe?.ingredients.join("\n") ?? ""}
        placeholder={"1 cup flour\n2 eggs"}
      />

      <label htmlFor="directions">Steps, one line each</label>
      <textarea id="directions" name="directions" rows={10} defaultValue={recipe?.directions.join("\n") ?? ""} />

      <label htmlFor="notes">Notes</label>
      <textarea id="notes" name="notes" rows={6} defaultValue={recipe?.notes ?? ""} />

      <div className="savebar">
        <button className="primary" type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
