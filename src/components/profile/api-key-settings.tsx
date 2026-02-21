"use client";

import { useState, useTransition } from "react";
import { Key, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { saveApiKey, removeApiKey } from "@/actions/profile";

interface ApiKeySettingsProps {
  hasKey: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ApiKeySettings({ hasKey, open: controlledOpen, onOpenChange: controlledOnOpenChange }: ApiKeySettingsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (v: boolean) => { controlledOnOpenChange!(v); if (!v) { setApiKey(""); setShowKey(false); } } : (v: boolean) => { setInternalOpen(v); if (!v) { setApiKey(""); setShowKey(false); } };
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!apiKey.trim()) return;
    startTransition(async () => {
      try {
        await saveApiKey(apiKey);
        setApiKey("");
        setOpen(false);
        toast.success("API key saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save API key");
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      try {
        await removeApiKey();
        setApiKey("");
        toast.success("API key removed");
      } catch {
        toast.error("Failed to remove API key");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Key className="h-4 w-4" />
            AI API Key
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Anthropic API Key
          </DialogTitle>
          <DialogDescription>
            Bring your own Anthropic API key to use AI features. Your key is encrypted and stored securely.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {hasKey && (
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="flex items-center gap-2 text-sm">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">sk-ant-••••••••</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={handleRemove}
                disabled={isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium">
              {hasKey ? "Replace with new key" : "Enter your API key"}
            </label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10"
                onClick={() => setShowKey(!showKey)}
                tabIndex={-1}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Get your key from{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.anthropic.com
              </a>
              . Your key is encrypted at rest and never exposed to the browser.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { setOpen(false); setApiKey(""); }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !apiKey.trim()}
          >
            {isPending ? "Saving..." : "Save Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
