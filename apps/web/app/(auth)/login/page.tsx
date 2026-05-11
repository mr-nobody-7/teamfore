"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/auth-context";
import api from "@/lib/axios";
import { posthog } from "@/lib/posthog";
import type { ApiResponse, SafeUser } from "@/types/api";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refetch } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    window.location.href = "/api/auth/google";
  };

  // Already logged in → skip to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginForm) {
    setIsLoading(true);
    try {
      const { data } = await api.post<ApiResponse<{ user: SafeUser }>>(
        "/auth/login",
        values,
      );
      posthog.capture("user_logged_in");
      toast.success(`Welcome back, ${data.data.user.name}!`);
      refetch();
      router.push("/dashboard");
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : undefined;
      toast.error(message ?? "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0c17]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-[#14111d] via-[#0f0c17] to-[#0a0813] px-4">
      <div className="flex min-h-screen flex-col items-center justify-center">
        {/* Brand section */}
        <div className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 backdrop-blur">
              <Image
                src="/brand/mark-64.svg"
                alt="TeamFore"
                width={20}
                height={20}
                className="h-5 w-5"
              />
            </div>
            <span className="font-display text-xl tracking-tight text-white">
              TeamFore
            </span>
          </Link>
          <p className="text-sm text-zinc-400">Workforce Control Surface</p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-linear-to-b from-[#252033] to-[#1a1725] p-8 shadow-[0_28px_70px_-30px_rgba(0,0,0,0.9)]">
          <div className="mb-8 space-y-1">
            <h1 className="text-2xl font-bold text-white">Sign in</h1>
            <p className="text-sm text-zinc-400">
              Access your workspace and manage your team
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-zinc-300">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="email"
                        className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-zinc-300">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-linear-to-b from-violet-400 to-violet-600 text-white shadow-[0_14px_30px_-14px_rgba(124,58,237,0.75)] hover:shadow-[0_14px_30px_-14px_rgba(124,58,237,0.9)] transition-all hover:-translate-y-px"
                disabled={isLoading}
              >
                {isLoading ? "Signing in…" : "Sign in"}
              </Button>

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-transparent px-2 text-zinc-500">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10 hover:text-white disabled:border-white/10 disabled:bg-white/5 disabled:text-zinc-500 disabled:opacity-100"
                onClick={handleGoogleSignIn}
              >
                Continue with Google
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-zinc-400">
            New workspace?{" "}
            <Link
              href="/register"
              className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
            >
              Create account
            </Link>
          </p>

          {/* Footer links */}
          <div className="mt-8 border-t border-white/8 pt-6 flex gap-4 justify-center text-xs text-zinc-500">
            <Link
              href="/privacy"
              className="hover:text-zinc-300 transition-colors"
            >
              Privacy
            </Link>
            <span>•</span>
            <Link
              href="/terms"
              className="hover:text-zinc-300 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
