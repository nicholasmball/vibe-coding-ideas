"use client";

import { useState, useTransition } from "react";
import { Bell, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateNotificationPreferences } from "@/actions/notifications";
import type { NotificationPreferences } from "@/types";

interface NotificationSettingsProps {
  preferences: NotificationPreferences;
}

const labels: Record<keyof NotificationPreferences, string> = {
  comments: "Comments on your ideas",
  votes: "Votes on your ideas",
  collaborators: "New collaborators",
  status_changes: "Idea status updates",
  task_mentions: "Task mentions",
};

export function NotificationSettings({
  preferences,
}: NotificationSettingsProps) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(preferences);
  const [isPending, startTransition] = useTransition();

  function toggle(key: keyof NotificationPreferences) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateNotificationPreferences(prefs);
        setOpen(false);
        toast.success("Notification preferences updated");
      } catch {
        toast.error("Failed to update preferences");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Notifications
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </DialogTitle>
          <DialogDescription>
            Choose which notifications you want to receive.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {(Object.keys(labels) as (keyof NotificationPreferences)[]).map(
            (key) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{labels[key]}</span>
                <Switch
                  checked={prefs[key]}
                  onCheckedChange={() => toggle(key)}
                />
              </div>
            )
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPrefs(preferences);
              setOpen(false);
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
