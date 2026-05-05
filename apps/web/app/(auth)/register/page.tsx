"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { posthog } from "@/lib/posthog";
import { registerWorkspace } from "@/services/auth.service";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workspaceName: z
    .string()
    .min(3, "Workspace name must be at least 3 characters"),
  leaveTypes: z.array(z.string().min(1)),
});

type RegisterForm = z.infer<typeof registerSchema>;

const DEFAULT_LEAVE_TYPES: string[] = [
  "CASUAL",
  "SICK",
  "VACATION",
  "PERSONAL",
];

const LEAVE_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "CASUAL", label: "Casual Leave" },
  { value: "SICK", label: "Sick Leave" },
  { value: "VACATION", label: "Earned Leave" },
  { value: "PERSONAL", label: "Comp Off" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      workspaceName: "",
      leaveTypes: DEFAULT_LEAVE_TYPES,
    },
  });

  const leaveTypes = form.watch("leaveTypes");

  const getErrorMessage = (error: unknown): string | undefined => {
    if (!isAxiosError(error)) {
      return undefined;
    }

    const data = error.response?.data as
      | { message?: string; error?: string }
      | undefined;

    if (typeof data?.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }

    if (typeof data?.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }

    if (error.response?.status === 409) {
      return "Email already in use";
    }

    return undefined;
  };

  const handleNext = async () => {
    const fieldsByStep: Record<1 | 2 | 3, Array<keyof RegisterForm>> = {
      1: ["name", "email", "password"],
      2: ["workspaceName"],
      3: [],
    };

    const isValid = await form.trigger(fieldsByStep[step]);
    if (!isValid) return;

    if (step < 3) {
      setStep((step + 1) as 2 | 3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2);
    }
  };

  const onSubmit = async (values: RegisterForm) => {
    setIsSubmitting(true);
    try {
      await registerWorkspace({
        name: values.name,
        email: values.email,
        password: values.password,
        workspaceName: values.workspaceName,
        leaveTypes: values.leaveTypes,
      });

      posthog.capture("user_signed_up");
      toast.success("Workspace created successfully.");
      await refetch();
      router.push("/dashboard");
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message ?? "Could not create workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create Workspace</CardTitle>
          <CardDescription>Get started with TeamFore</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Step {step} of 3</span>
                  <span>{Math.round((step / 3) * 100)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>

              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@company.com"
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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {step === 2 && (
                <FormField
                  control={form.control}
                  name="workspaceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your team&apos;s space. You can invite others
                        after setup.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {step === 3 && (
                <FormField
                  control={form.control}
                  name="leaveTypes"
                  render={() => (
                    <FormItem>
                      <FormLabel>Leave types</FormLabel>
                      <div className="space-y-3 rounded-md border p-3">
                        {LEAVE_TYPE_OPTIONS.map((option) => {
                          const checked = leaveTypes.includes(option.value);
                          return (
                            <label
                              key={option.value}
                              className="flex cursor-pointer items-center gap-3 text-sm"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-input"
                                checked={checked}
                                onChange={(event) => {
                                  if (event.target.checked) {
                                    form.setValue("leaveTypes", [
                                      ...leaveTypes,
                                      option.value,
                                    ]);
                                    return;
                                  }

                                  form.setValue(
                                    "leaveTypes",
                                    leaveTypes.filter(
                                      (type) => type !== option.value,
                                    ),
                                  );
                                }}
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex items-center justify-between gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1 || isSubmitting}
                >
                  Back
                </Button>

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Finishing..." : "Finish"}
                  </Button>
                )}
              </div>
            </form>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
