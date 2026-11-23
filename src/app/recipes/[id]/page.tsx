import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CheckList } from "@/components/check-list";
import { ShareRecipe } from "@/components/share-recipe";
import { WakeLock } from "@/components/wake-lock";
import { isEditor } from "@/lib/auth";
import { getRecipe, incomingLinks, outgoingLinks, photoIds, type Recipe } from "@/lib/recipes";
import { parseId } from "@/lib/text";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const id = parseId((await params).id);
  if (!id) return { title: "Recipe" };
  const recipe = await getRecipe(id);
  if (!recipe) return { title: "Recipe" };
  const description = previewDescription(recipe);
  const pageUrl = await absoluteUrl(`/recipes/${recipe.id}`);
  const [photoId] = await photoIds(recipe.id);
  const imageUrl = photoId ? await absoluteUrl(`/photos/${photoId}`) : "";
  return {
    title: recipe.title,
    description,
    alternates: pageUrl.startsWith("https://") ? { canonical: pageUrl } : undefined,
    openGraph: {
      title: recipe.title,
      description,
      url: pageUrl.startsWith("https://") ? pageUrl : undefined,
      type: "article",
      ...(imageUrl.startsWith("https://") ? { images: [{ url: imageUrl, type: "image/jpeg", alt: recipe.title }] } : {}),
    },
    ...(imageUrl.startsWith("https://")
      ? {
          twitter: {
            card: "summary_large_image" as const,
            title: recipe.title,
            description,
            images: [imageUrl],
          },
        }
      : {}),
  };
}

export default async function RecipePage({ params }: { params: Promise<Params> }) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const recipe = await getRecipe(id);
  if (!recipe) notFound();
  const [photos, outgoing, incoming, editor] = await Promise.all([
    photoIds(id),
    outgoingLinks(id),
    incomingLinks(id),
    isEditor(),
  ]);
  const usedIn = incoming.filter((link) => !outgoing.some((item) => item.id === link.id));
  const facts = [
    recipe.amount ? ["Amount", recipe.amount] : null,
    recipe.time ? ["Time", recipe.time] : null,
  ].filter((fact): fact is [string, string] => fact !== null);

  return (
    <article>
      {photos.length > 0 ? (
        <div className="photos">
          {photos.map((photoId) => (
            <img key={photoId} src={`/photos/${photoId}`} alt={recipe.title} />
          ))}
        </div>
      ) : null}
      <h1>{recipe.title}</h1>
      {recipe.summary ? <p className="lede">{recipe.summary}</p> : null}
      {facts.length > 0 ? (
        <dl className="facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="actions">
        <WakeLock />
        <a className="primary" href={`/recipes/${recipe.id}/pdf`}>
          Print recipe
        </a>
        <ShareRecipe id={recipe.id} title={recipe.title} />
      </div>
      {recipe.tags.length > 0 ? (
        <p className="tags">
          {recipe.tags.map((tag) => (
            <a key={tag} href={`/?q=${encodeURIComponent(tag)}`}>
              {tag}
            </a>
          ))}
        </p>
      ) : null}
      {recipe.ingredients.length > 0 ? (
        <section>
          <h2>Ingredients</h2>
          <CheckList items={recipe.ingredients} />
        </section>
      ) : null}
      {recipe.directions.length > 0 ? (
        <section>
          <h2>Steps</h2>
          <CheckList items={recipe.directions} numbered />
        </section>
      ) : null}
      {recipe.notes.trim() ? (
        <section>
          <h2>Notes</h2>
          <div className="notes">{recipe.notes}</div>
        </section>
      ) : null}
      {outgoing.length > 0 ? (
        <section>
          <h2>With this</h2>
          <ul className="links">
            {outgoing.map((link) => (
              <li key={link.id}>
                <a href={`/recipes/${link.id}`}>{link.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {usedIn.length > 0 ? (
        <section>
          <h2>Used in</h2>
          <ul className="links">
            {usedIn.map((link) => (
              <li key={link.id}>
                <a href={`/recipes/${link.id}`}>{link.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="editlink">
        {editor ? (
          <a href={`/recipes/${recipe.id}/edit`}>Edit recipe</a>
        ) : (
          <a href={`/login?next=${encodeURIComponent(`/recipes/${recipe.id}/edit`)}`}>Edit recipe</a>
        )}
      </p>
    </article>
  );
}

function previewDescription(recipe: Recipe): string {
  const summary = recipe.summary.replace(/\s+/g, " ").trim();
  const ingredients = recipe.ingredients
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  const text = summary || ingredients || "A Westlund family recipe.";
  if (text.length <= 180) return text;
  return `${text.slice(0, 179).trimEnd()}…`;
}

async function absoluteUrl(path: string): Promise<string> {
  const headerList = await headers();
  const raw = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const host = raw.split(",")[0]?.trim() ?? "";
  if (!/^[A-Za-z0-9.-]+(?::\d+)?$/.test(host)) return path;
  return `https://${host}${path}`;
}
