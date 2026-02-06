import { IdeaForm } from "@/components/ideas/idea-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Idea - VibeCodes",
  description: "Share your vibe coding project idea with the community",
};

export default function NewIdeaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <IdeaForm />
    </div>
  );
}
