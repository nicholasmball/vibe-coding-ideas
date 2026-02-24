import { SearchX } from "lucide-react";
import { NotFoundPage } from "@/components/layout/not-found-page";

export default function NotFound() {
  return (
    <NotFoundPage
      icon={SearchX}
      title="Page not found"
      description="This page doesn't exist or you don't have permission to view it."
      backHref="/feed"
      backLabel="Browse ideas"
    />
  );
}
