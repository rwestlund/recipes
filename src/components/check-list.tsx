"use client";

import { useState } from "react";

export function CheckList({ items, numbered = false }: { items: string[]; numbered?: boolean }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  if (items.length === 0) return null;
  const List = numbered ? "ol" : "ul";
  return (
    <List className={numbered ? "steps" : "ings"}>
      {items.map((item, index) => {
        const on = done[index] === true;
        return (
          <li key={`${index}-${item.slice(0, 24)}`}>
            <button
              type="button"
              aria-pressed={on}
              className={on ? "checked" : undefined}
              onClick={() => setDone((prev) => ({ ...prev, [index]: !prev[index] }))}
            >
              {numbered ? (
                <span className="n">{index + 1}</span>
              ) : (
                <span className="tick" aria-hidden="true" />
              )}
              <span className="line">{item}</span>
            </button>
          </li>
        );
      })}
    </List>
  );
}
