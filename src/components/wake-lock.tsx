"use client";

import { useEffect, useRef, useState } from "react";

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
    void sentinel.current?.release();
    sentinel.current = null;
  }

  useEffect(() => {
    localStorage.removeItem("recipes-wake-lock");
    const onVisible = () => {
      if (document.visibilityState !== "visible" || !wanted.current || sentinel.current) return;
      acquire()
        .then(() => {
          setOn(true);
          setFailure("");
        })
        .catch(() => {
          wanted.current = false;
          setOn(false);
          setFailure(FAILURE);
        });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
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
