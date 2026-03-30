"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
};

export function CopyPhoneNumberButton({ value }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      className="shrink-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied" : "Copy number"}
    </Button>
  );
}
