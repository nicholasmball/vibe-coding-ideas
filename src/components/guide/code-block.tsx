"use client";

import { CopyButton } from "./copy-button";

export function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative rounded-lg border-2 border-primary/30 bg-muted p-4 pr-10">
      <pre className="m-0 text-sm whitespace-pre-wrap break-words">
        <code>{code}</code>
      </pre>
      <CopyButton
        text={code}
        className="absolute right-2 top-2"
      />
    </div>
  );
}
