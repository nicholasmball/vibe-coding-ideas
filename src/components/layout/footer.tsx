import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="shrink-0 border-t border-border py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 px-3">
            <Sparkles className="h-3 w-3" />
            <span>&copy; {new Date().getFullYear()} VibeCodes</span>
          </div>
          <span className="text-border">&middot;</span>
          <Link href="/guide" className="px-3 hover:text-foreground">
            Guide
          </Link>
          <span className="text-border">&middot;</span>
          <Link href="/terms" className="px-3 hover:text-foreground">
            Terms of Service
          </Link>
          <span className="text-border">&middot;</span>
          <Link href="/privacy" className="px-3 hover:text-foreground">
            Privacy Policy
          </Link>
          <span className="text-border">&middot;</span>
          <a
            href="https://github.com/NickBall/vibe-coding-ideas"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
