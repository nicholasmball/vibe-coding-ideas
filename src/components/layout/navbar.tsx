"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, LogOut, User as UserIcon, Menu, LayoutDashboard, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function Navbar() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = user?.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">VibeCodes</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-4 md:flex">
            {user && (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/feed">
                  <Button variant="ghost">Feed</Button>
                </Link>
                <Link href="/ideas/new">
                  <Button variant="ghost" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Idea
                  </Button>
                </Link>
              </>
            )}
            <Link href="/guide">
              <Button variant="ghost" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Guide
              </Button>
            </Link>
            <ThemeToggle />
            {user && <NotificationBell />}
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt={user.user_metadata?.full_name ?? "User"}
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user.user_metadata?.full_name ?? "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/profile/${user.id}`}
                      className="flex items-center gap-2"
                    >
                      <UserIcon className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost">Log In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            {user && <NotificationBell />}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Menu</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link
                    href="/feed"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start">
                      Feed
                    </Button>
                  </Link>
                  <Link
                    href="/ideas/new"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Plus className="h-4 w-4" />
                      New Idea
                    </Button>
                  </Link>
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <UserIcon className="h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Link
                    href="/guide"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <BookOpen className="h-4 w-4" />
                      Guide
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start gap-2 text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/guide" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <BookOpen className="h-4 w-4" />
                      Guide
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
