import { Separator } from "@/components/ui/separator";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";
import type { CommentWithAuthor } from "@/types";

interface CommentThreadProps {
  comments: CommentWithAuthor[];
  ideaId: string;
  ideaAuthorId: string;
  currentUserId?: string;
}

export function CommentThread({
  comments,
  ideaId,
  ideaAuthorId,
  currentUserId,
}: CommentThreadProps) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">
        Comments ({comments.length})
      </h3>

      {currentUserId && (
        <>
          <CommentForm ideaId={ideaId} />
          <Separator className="my-6" />
        </>
      )}

      {comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              ideaId={ideaId}
              ideaAuthorId={ideaAuthorId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
