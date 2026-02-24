import Link from "next/link";
import { UserX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MemberNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <UserX className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Member not found</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            This member doesn&apos;t exist or their account has been removed.
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" asChild>
            <Link href="/members" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Member directory
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
