"use client";

import { ErrorState } from "@/components/ui/states";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): JSX.Element {
  return (
    <section>
      <ErrorState title="Something failed" body={error.message} />
      <button className="button" onClick={reset} type="button">
        Retry
      </button>
    </section>
  );
}
