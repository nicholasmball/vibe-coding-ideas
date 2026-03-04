"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import type { User } from "@/types";

interface MarkdownProps {
  children: string;
  className?: string;
  teamMembers?: User[];
}

function renderMentions(text: string, teamMembers?: User[]): React.ReactNode[] {
  // Sort known names longest-first so "Matt Hammond" matches before "Matt"
  const knownNames = (teamMembers ?? [])
    .filter((m) => m.full_name)
    .map((m) => ({ name: m.full_name!, id: m.id, isBot: !!m.is_bot }))
    .sort((a, b) => b.name.length - a.name.length);

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    const atIndex = remaining.indexOf("@");
    if (atIndex === -1) {
      parts.push(remaining);
      break;
    }

    // Add text before @
    if (atIndex > 0) {
      parts.push(remaining.slice(0, atIndex));
    }

    const afterAt = remaining.slice(atIndex + 1);

    // Try to match a known team member name (longest match wins)
    let matched = false;
    for (const { name, id, isBot } of knownNames) {
      if (afterAt.toLowerCase().startsWith(name.toLowerCase())) {
        const charAfter = afterAt[name.length];
        // Boundary: end-of-string or non-word character
        if (charAfter === undefined || !/\w/.test(charAfter)) {
          const href = isBot ? "/agents" : `/profile/${id}`;
          parts.push(
            <Link
              key={keyCounter++}
              href={href}
              className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
            >
              @{afterAt.slice(0, name.length)}
            </Link>
          );
          remaining = afterAt.slice(name.length);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      // Fallback: highlight unrecognized @mentions as styled spans
      const mentionMatch = afterAt.match(/^([A-Za-z][\w]*(?:\s[A-Za-z][\w]*)*)/);
      if (mentionMatch) {
        parts.push(
          <span key={keyCounter++} className="font-medium text-blue-400/70">
            @{mentionMatch[1]}
          </span>
        );
        remaining = afterAt.slice(mentionMatch[1].length);
      } else {
        // Standalone @ with no word following
        parts.push("@");
        remaining = afterAt;
      }
    }
  }

  return parts.length > 0 ? parts : [text];
}

/** Recursively process React children, replacing string nodes containing @ with mention elements */
function processMentionChildren(
  children: React.ReactNode,
  teamMembers?: User[]
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string" && child.includes("@")) {
      return <>{renderMentions(child, teamMembers)}</>;
    }
    return child;
  });
}

export function Markdown({ children, className, teamMembers }: MarkdownProps) {
  const m = (c: React.ReactNode) => processMentionChildren(c, teamMembers);

  return (
    <div className={`min-w-0 overflow-hidden break-words ${className ?? ""}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold mt-4 mb-2">{m(children)}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold mt-3 mb-2">{m(children)}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-bold mt-3 mb-1">{m(children)}</h3>
        ),
        p: ({ children }) => <p className="mb-3 last:mb-0">{m(children)}</p>,
        ul: ({ children }) => (
          <ul className="mb-3 ml-6 list-disc space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 ml-6 list-decimal space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li>{m(children)}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80"
          >
            {children}
          </a>
        ),
        code: ({ className, children, node, ...props }) => {
          // Block code: has language class OR parent is <pre>
          const isBlock = className?.includes("language-") ||
            node?.position?.start?.line !== node?.position?.end?.line;
          if (isBlock) {
            return (
              <code
                className={`block rounded-lg bg-muted p-4 text-sm whitespace-pre ${className ?? ""}`}
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-muted px-1.5 py-0.5 text-sm break-all" {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="mb-3 last:mb-0 overflow-x-auto max-w-full">{children}</pre>,
        blockquote: ({ children }) => (
          <blockquote className="mb-3 border-l-2 border-primary/30 pl-4 italic text-muted-foreground">
            {m(children)}
          </blockquote>
        ),
        hr: () => <hr className="my-4 border-border" />,
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-muted px-3 py-2 text-left font-medium">
            {m(children)}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-3 py-2">{m(children)}</td>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{m(children)}</strong>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
    </div>
  );
}
