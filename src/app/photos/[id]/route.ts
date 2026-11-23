import { photoBytes } from "@/lib/recipes";
import { parseId } from "@/lib/text";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const id = parseId((await context.params).id);
  if (!id) return new Response("Not found", { status: 404 });
  const bytes = await photoBytes(id);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
