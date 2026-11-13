import { logout } from "@/app/actions";

export function Header({ editor }: { editor: boolean }) {
  return (
    <header className="top">
      <a className="mark" href="/">
        Recipes
      </a>
      <nav>
        {editor ? (
          <>
            <a href="/recipes/new">New</a>
            <form action={logout}>
              <button className="text" type="submit">
                Lock
              </button>
            </form>
          </>
        ) : (
          <a href="/login">Edit</a>
        )}
      </nav>
    </header>
  );
}
