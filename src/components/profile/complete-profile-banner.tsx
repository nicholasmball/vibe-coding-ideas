"use client";

import { useState } from "react";
import Link from "next/link";
import { UserCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompleteProfileBannerProps {
  userId: string;
}

export function CompleteProfileBanner({ userId }: CompleteProfileBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <UserCircle className="h-5 w-5 shrink-0 text-primary" />
      <p className="flex-1 text-sm">
        Complete your profile so others can find and contact you.{" "}
        <Link
          href={`/profile/${userId}`}
          className="font-medium text-primary underline hover:text-primary/80"
        >
          Edit profile
        </Link>
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
