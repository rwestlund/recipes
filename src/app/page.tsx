import { listRecipes } from "@/lib/recipes";
import { one, searchWords } from "@/lib/text";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const query = one((await searchParams).q);
  const words = searchWords(query);
  const recipes = await listRecipes(words);
  const count = recipes.length === 1 ? "1 recipe" : `${recipes.length} recipes`;

  return (
    <>
      <form className="search" action="/" method="get" role="search">
        <label className="sr" htmlFor="q">
          Search titles and tags
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search titles and tags"
          enterKeyHint="search"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {query ? (
          <a className="clear" href="/">
            Clear
          </a>
        ) : null}
      </form>
      <p className="count">{words.length > 0 ? `${count} match` : count}</p>
      {recipes.length === 0 ? (
        <p className="empty">Nothing in the titles or tags matches those words.</p>
      ) : (
        <ul className="index">
          {recipes.map((recipe) => {
            const meta = [recipe.time, ...recipe.tags].filter((part) => part.trim() !== "");
            return (
              <li key={recipe.id}>
                <a href={`/recipes/${recipe.id}`}>
                  <span className="name">{recipe.title}</span>
                  {recipe.summary ? <span className="dek">{recipe.summary}</span> : null}
                  {meta.length > 0 ? <span className="rowmeta">{meta.join(" · ")}</span> : null}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
