import { UserX } from "lucide-react";
import { NotFoundPage } from "@/components/layout/not-found-page";

export default function MemberNotFound() {
  return (
    <NotFoundPage
      icon={UserX}
      title="Member not found"
      description="This member doesn't exist or their account has been removed."
      backHref="/members"
      backLabel="Member directory"
    />
  );
}
