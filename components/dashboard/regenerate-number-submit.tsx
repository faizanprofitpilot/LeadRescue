"use client";

import { useFormStatus } from "react-dom";

/** Link-style submit inside provision form; shows pending state. */
export function RegenerateNumberSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-foreground text-sm font-medium underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50"
    >
      {pending ? "Working…" : "Generate a different number"}
    </button>
  );
}
