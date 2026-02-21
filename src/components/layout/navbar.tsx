"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, Plus, LogOut, User as UserIcon, Menu, LayoutDashboard, BookOpen, Users, Rss, Shield } from "lucide-react";
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
import { useState, useEffect } from "react";

export function Navbar() {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // Close mobile menu on route change (e.g. browser back/forward)
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    const supabase = createClient();
    supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.is_admin ?? false));
  }, [user?.id]);

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
                  <Button variant={isActive("/dashboard") ? "secondary" : "ghost"} className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/feed">
                  <Button variant={isActive("/feed") ? "secondary" : "ghost"} className="gap-2">
                    <Rss className="h-4 w-4" />
                    Feed
                  </Button>
                </Link>
                <Link href="/members">
                  <Button variant={isActive("/members") ? "secondary" : "ghost"} className="gap-2">
                    <Users className="h-4 w-4" />
                    Members
                  </Button>
                </Link>
                <Link href="/ideas/new">
                  <Button variant={isActive("/ideas/new") ? "secondary" : "ghost"} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Idea
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant={isActive("/admin") ? "secondary" : "ghost"} className="gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
              </>
            )}
            <Link href="/guide">
              <Button variant={isActive("/guide") ? "secondary" : "ghost"} className="gap-2">
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
                  aria-label="Open navigation menu"
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
              {loading ? (
                <div className="flex flex-col gap-2 py-2">
                  <div className="h-9 animate-pulse rounded-md bg-muted" />
                  <div className="h-9 animate-pulse rounded-md bg-muted" />
                  <div className="h-9 animate-pulse rounded-md bg-muted" />
                </div>
              ) : user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant={isActive("/dashboard") ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link
                    href="/feed"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant={isActive("/feed") ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                      <Rss className="h-4 w-4" />
                      Feed
                    </Button>
                  </Link>
                  <Link
                    href="/members"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant={isActive("/members") ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                      <Users className="h-4 w-4" />
                      Members
                    </Button>
                  </Link>
                  <Link
                    href="/ideas/new"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant={isActive("/ideas/new") ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                      <Plus className="h-4 w-4" />
                      New Idea
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant={isActive("/admin") ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant={isActive(`/profile/${user.id}`) ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                      <UserIcon className="h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Link
                    href="/guide"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant={isActive("/guide") ? "secondary" : "ghost"} className="w-full justify-start gap-2">
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
