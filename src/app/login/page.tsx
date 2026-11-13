import { redirect } from "next/navigation";
import { login } from "@/app/actions";
import { editingConfigured, isEditor, safeNext } from "@/lib/auth";
import { one } from "@/lib/text";

export const metadata = { title: "Unlock editing" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeNext(one(params.next) || "/");
  if (await isEditor()) redirect(next);
  const error = one(params.error);
  const off = !editingConfigured();

  return (
    <>
      <h1>Unlock editing</h1>
      <p className="lede">Reading stays open. The household password unlocks changes.</p>
      {off ? <p className="error">Editing is off until EDIT_PASSWORD is set.</p> : null}
      {error === "1" ? <p className="error">That password is not right.</p> : null}
      {error === "off" ? <p className="error">Editing is off until EDIT_PASSWORD is set.</p> : null}
      <form action={login} className="form">
        <input type="hidden" name="next" value={next} />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
        />
        <button className="primary" type="submit">
          Unlock
        </button>
      </form>
    </>
  );
}
