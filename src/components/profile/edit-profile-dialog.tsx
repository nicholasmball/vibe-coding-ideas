"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateProfile } from "@/actions/profile";
import type { User } from "@/types";

interface EditProfileDialogProps {
  user: User;
}

export function EditProfileDialog({ user }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    try {
      await updateProfile(formData);
      setOpen(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information visible to other users.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium">
              Display Name
            </label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={user.full_name ?? ""}
              placeholder="Your name"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={user.bio ?? ""}
              placeholder="A short bio about yourself"
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="github_username" className="text-sm font-medium">
              GitHub Username
            </label>
            <Input
              id="github_username"
              name="github_username"
              defaultValue={user.github_username ?? ""}
              placeholder="your-username"
              maxLength={39}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact_info" className="text-sm font-medium">
              Contact Info
            </label>
            <Input
              id="contact_info"
              name="contact_info"
              defaultValue={user.contact_info ?? ""}
              placeholder="Discord, Twitter, email, etc."
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              How others can reach you privately to discuss ideas.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
