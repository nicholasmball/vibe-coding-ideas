import { Lightbulb } from "lucide-react";
import { NotFoundPage } from "@/components/layout/not-found-page";

export default function IdeaNotFound() {
  return (
    <NotFoundPage
      icon={Lightbulb}
      title="Idea not found"
      description="This idea doesn't exist, has been removed, or you don't have permission to view it."
      backHref="/ideas"
      backLabel="Browse ideas"
    />
  );
}
