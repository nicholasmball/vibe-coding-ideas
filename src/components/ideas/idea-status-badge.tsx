import { Badge } from "@/components/ui/badge";
import { STATUS_CONFIG } from "@/lib/constants";
import type { IdeaStatus } from "@/types";

export function IdeaStatusBadge({ status }: { status: IdeaStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.color} border`}>
      {config.label}
    </Badge>
  );
}
