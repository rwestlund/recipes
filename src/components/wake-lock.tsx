"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "recipes-wake-lock";
const FAILURE = "The browser would not keep the screen awake.";

export function WakeLock() {
  const [on, setOn] = useState(false);
  const [failure, setFailure] = useState("");
  const sentinel = useRef<WakeLockSentinel | null>(null);
  const wanted = useRef(false);

  async function acquire(): Promise<void> {
    if (!("wakeLock" in navigator)) throw new Error("unsupported");
    const next = await navigator.wakeLock.request("screen");
    next.addEventListener("release", () => {
      if (sentinel.current === next) sentinel.current = null;
    });
    sentinel.current = next;
  }

  function turnOff() {
    wanted.current = false;
    setOn(false);
    localStorage.removeItem(STORAGE_KEY);
    void sentinel.current?.release();
    sentinel.current = null;
  }

  useEffect(() => {
    let cancelled = false;
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      wanted.current = true;
      acquire()
        .then(() => {
          if (cancelled) return;
          setOn(true);
          setFailure("");
        })
        .catch(() => {
          if (cancelled) return;
          wanted.current = false;
          localStorage.removeItem(STORAGE_KEY);
          setOn(false);
          setFailure(FAILURE);
        });
    }

    const onVisible = () => {
      if (document.visibilityState !== "visible" || !wanted.current || sentinel.current) return;
      acquire()
        .then(() => {
          setOn(true);
          setFailure("");
        })
        .catch(() => {
          wanted.current = false;
          localStorage.removeItem(STORAGE_KEY);
          setOn(false);
          setFailure(FAILURE);
        });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel.current?.release();
    };
  }, []);

  async function onChange(checked: boolean) {
    setFailure("");
    if (!checked) {
      turnOff();
      return;
    }
    try {
      await acquire();
      wanted.current = true;
      localStorage.setItem(STORAGE_KEY, "1");
      setOn(true);
    } catch {
      turnOff();
      setFailure(FAILURE);
    }
  }

  return (
    <div className="wake">
      <label>
        <input
          type="checkbox"
          checked={on}
          onChange={(event) => void onChange(event.target.checked)}
        />
        Keep screen awake
      </label>
      {failure ? <p className="error">{failure}</p> : null}
    </div>
  );
}
