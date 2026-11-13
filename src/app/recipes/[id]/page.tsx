import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckList } from "@/components/check-list";
import { ShareSheet } from "@/components/share-sheet";
import { isEditor } from "@/lib/auth";
import { getRecipe, incomingLinks, outgoingLinks, photoIds, sourceHref } from "@/lib/recipes";
import { parseId } from "@/lib/text";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const id = parseId((await params).id);
  if (!id) return { title: "Recipe" };
  const recipe = await getRecipe(id);
  return { title: recipe?.title ?? "Recipe" };
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
  const href = sourceHref(recipe.source);
  const facts = [
    recipe.amount ? ["Amount", recipe.amount] : null,
    recipe.time ? ["Time", recipe.time] : null,
    recipe.oven ? ["Oven", recipe.oven] : null,
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
        <a className="primary" href={`/recipes/${recipe.id}/pdf`}>
          Baking sheet
        </a>
        <ShareSheet url={`/recipes/${recipe.id}/pdf`} title={recipe.title} />
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
      {recipe.source || recipe.authorName ? (
        <p className="credit">
          {href ? (
            <a href={href} rel="noreferrer">
              {recipe.source}
            </a>
          ) : recipe.source ? (
            <span>{recipe.source}</span>
          ) : null}
          {recipe.authorName ? <span>{recipe.authorName}</span> : null}
        </p>
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
