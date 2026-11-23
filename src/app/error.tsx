"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <h1>Something went wrong</h1>
      <p className="lede">The page could not be loaded.</p>
      <button className="primary" type="button" onClick={() => reset()}>
        Try again
      </button>
    </>
  );
}
