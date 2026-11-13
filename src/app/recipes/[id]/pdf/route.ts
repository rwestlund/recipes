import { getRecipe } from "@/lib/recipes";
import { renderRecipePdf } from "@/lib/pdf";
import { parseId, pdfFilename } from "@/lib/text";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const id = parseId((await context.params).id);
  if (!id) return new Response("Not found", { status: 404 });
  const recipe = await getRecipe(id);
  if (!recipe) return new Response("Not found", { status: 404 });
  const bytes = await renderRecipePdf(recipe);
  const filename = pdfFilename(recipe.title);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
