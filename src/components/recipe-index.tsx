"use client";

import { useEffect, useState } from "react";
import { matchesRecipe, searchWords } from "@/lib/text";

const DEBOUNCE_MS = 150;

type IndexRecipe = {
  id: number;
  title: string;
  summary: string;
  time: string;
  tags: string[];
  photoId: number | null;
};

export function RecipeIndex({ recipes, initialQuery }: { recipes: IndexRecipe[]; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [applied, setApplied] = useState(initialQuery);

  useEffect(() => {
    const timer = window.setTimeout(() => setApplied(query), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const next = applied.trim() === "" ? "/" : `/?q=${encodeURIComponent(applied)}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== next) window.history.replaceState(null, "", next);
  }, [applied]);

  const words = searchWords(applied);
  const shown = recipes.filter((recipe) => matchesRecipe(recipe.title, recipe.tags, words));
  const count = shown.length === 1 ? "1 recipe" : `${shown.length} recipes`;

  return (
    <>
      <form
        className="search"
        role="search"
        action="/"
        method="get"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="sr" htmlFor="q">
          Search titles and tags
        </label>
        <input
          id="q"
          name="q"
          type="search"
          value={query}
          placeholder="Search titles and tags"
          enterKeyHint="search"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query ? (
          <button className="clear" type="button" onClick={() => setQuery("")}>
            Clear
          </button>
        ) : null}
      </form>
      <p className="count">{words.length > 0 ? `${count} match` : count}</p>
      {shown.length === 0 ? (
        <p className="empty">Nothing in the titles or tags matches those words.</p>
      ) : (
        <ul className="index">
          {shown.map((recipe) => {
            const meta = [recipe.time, ...recipe.tags].filter((part) => part.trim() !== "");
            return (
              <li key={recipe.id}>
                <a href={`/recipes/${recipe.id}`}>
                  <img
                    className="thumb"
                    src={recipe.photoId ? `/photos/${recipe.photoId}` : "/placeholder.svg"}
                    alt=""
                  />
                  <span className="copy">
                    <span className="name">{recipe.title}</span>
                    {recipe.summary ? <span className="dek">{recipe.summary}</span> : null}
                    {meta.length > 0 ? <span className="rowmeta">{meta.join(" · ")}</span> : null}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
