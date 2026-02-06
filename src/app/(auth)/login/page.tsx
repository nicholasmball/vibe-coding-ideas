import Link from "next/link";
import { Sparkles } from "lucide-react";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">VibeCodes</span>
          </Link>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Log in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OAuthButtons />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
