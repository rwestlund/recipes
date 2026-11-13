import { notFound, redirect } from "next/navigation";
import { addLinkAction, addPhotoAction, deletePhotoAction, deleteRecipeAction, removeLinkAction, updateRecipeAction } from "@/app/actions";
import { RecipeForm } from "@/components/recipe-form";
import { isEditor } from "@/lib/auth";
import { getRecipe, outgoingLinks, photoIds, searchTitles } from "@/lib/recipes";
import { one, parseId } from "@/lib/text";

type Params = { id: string };
type Search = { error?: string | string[]; find?: string | string[] };

export default async function EditRecipePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const id = parseId((await params).id);
  if (!id) notFound();
  if (!(await isEditor())) redirect(`/login?next=${encodeURIComponent(`/recipes/${id}/edit`)}`);
  const recipe = await getRecipe(id);
  if (!recipe) notFound();
  const query = await searchParams;
  const error = one(query.error);
  const find = one(query.find);
  const [photos, outgoing, matches] = await Promise.all([
    photoIds(id),
    outgoingLinks(id),
    find ? searchTitles(find, id) : Promise.resolve([]),
  ]);
  const linked = new Set(outgoing.map((link) => link.id));
  const available = matches.filter((match) => !linked.has(match.id));

  return (
    <>
      <h1>Edit</h1>
      {error ? <p className="error">{error}</p> : null}
      <RecipeForm action={updateRecipeAction} recipe={recipe} submitLabel="Save recipe" />

      <section className="panel">
        <h2>Photos</h2>
        {photos.length > 0 ? (
          <div className="photos">
            {photos.map((photoId) => (
              <figure key={photoId}>
                <img src={`/photos/${photoId}`} alt="" />
                <form action={deletePhotoAction}>
                  <input type="hidden" name="recipe" value={id} />
                  <input type="hidden" name="photo" value={photoId} />
                  <button className="text" type="submit">
                    Remove photo
                  </button>
                </form>
              </figure>
            ))}
          </div>
        ) : (
          <p className="hint">No photo yet.</p>
        )}
        {photos.length < 8 ? (
          <form action={addPhotoAction} className="form" encType="multipart/form-data">
            <input type="hidden" name="recipe" value={id} />
            <label htmlFor="photo">Camera or library</label>
            <input id="photo" name="photo" type="file" accept="image/*" capture="environment" required />
            <button className="secondary" type="submit">
              Add photo
            </button>
          </form>
        ) : null}
      </section>

      <section className="panel">
        <h2>Links</h2>
        {outgoing.length > 0 ? (
          <ul className="links">
            {outgoing.map((link) => (
              <li key={link.id}>
                <a href={`/recipes/${link.id}`}>{link.title}</a>
                <form action={removeLinkAction}>
                  <input type="hidden" name="src" value={id} />
                  <input type="hidden" name="dest" value={link.id} />
                  <button className="text" type="submit">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">No linked recipes yet.</p>
        )}
        <form className="search" action={`/recipes/${id}/edit`} method="get">
          <label className="sr" htmlFor="find">
            Find a recipe to link
          </label>
          <input id="find" name="find" type="search" defaultValue={find} placeholder="Find a recipe to link" />
          <button className="secondary" type="submit">
            Find
          </button>
        </form>
        {find && available.length === 0 ? <p className="hint">No title matches that.</p> : null}
        {available.length > 0 ? (
          <ul className="links">
            {available.map((match) => (
              <li key={match.id}>
                <span>{match.title}</span>
                <form action={addLinkAction}>
                  <input type="hidden" name="src" value={id} />
                  <input type="hidden" name="dest" value={match.id} />
                  <button className="text" type="submit">
                    Link
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <form action={deleteRecipeAction} className="danger-zone">
        <input type="hidden" name="id" value={id} />
        <label className="check" htmlFor="confirm">
          <input id="confirm" name="confirm" type="checkbox" value="yes" required />
          Delete this recipe
        </label>
        <button className="danger" type="submit">
          Delete recipe
        </button>
      </form>
    </>
  );
}
