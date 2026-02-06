import { Badge } from "@/components/ui/badge";
import { COMMENT_TYPE_CONFIG } from "@/lib/constants";
import type { CommentType } from "@/types";

export function CommentTypeBadge({ type }: { type: CommentType }) {
  const config = COMMENT_TYPE_CONFIG[type];
  if (type === "comment") return null;
  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.color} border text-[10px]`}>
      {config.label}
    </Badge>
  );
}
