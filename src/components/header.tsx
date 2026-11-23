"use client";

import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";

export function Header({ editor }: { editor: boolean }) {
  const path = usePathname();
  const onIndex = path === "/";
  const onRecipe = /^\/recipes\/\d+$/.test(path);

  return (
    <header className="top">
      <a className="mark" href="/">
        {onIndex || onRecipe ? <img className="mark-icon" src="/mark.svg" alt="" /> : null}
        <span>Westlund Family Recipes</span>
      </a>
      {editor && onIndex ? (
        <nav>
          <a href="/recipes/new">New</a>
          <form action={logout}>
            <button className="text" type="submit">
              Lock
            </button>
          </form>
        </nav>
      ) : null}
      {!editor ? (
        <nav>
          <a href="/login">Edit</a>
        </nav>
      ) : null}
    </header>
  );
}
