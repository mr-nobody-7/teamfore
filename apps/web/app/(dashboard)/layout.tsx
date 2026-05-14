"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/hooks/use-role";
import { useRole } from "@/hooks/use-role";
import api from "@/lib/axios";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  const handleFeedbackSubmit = async () => {
    const message = feedbackMessage.trim();
    if (!message) {
      toast.error("Please enter your feedback before submitting");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await api.post("/feedback", { message });
      toast.success("Thanks! Your feedback was submitted.");
      setFeedbackMessage("");
      setIsFeedbackOpen(false);
    } catch {
      toast.error("Could not submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="product-theme relative flex min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.14),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_35%)]" />
      <Sidebar
        userRole={role as UserRole | undefined}
        userName={user?.name}
        userEmail={user?.email}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />

      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col md:pl-64">
        <Navbar
          userName={user?.name}
          userEmail={user?.email}
          onLogout={logout}
          onMenuClick={openMobileSidebar}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <Button
        type="button"
        className="fixed right-4 bottom-4 z-50 shadow-lg"
        onClick={() => setIsFeedbackOpen(true)}
      >
        Feedback
      </Button>

      <InstallPrompt />

      <Dialog
        open={isFeedbackOpen}
        onOpenChange={(open) => {
          setIsFeedbackOpen(open);
          if (!open) {
            setFeedbackMessage("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share feedback</DialogTitle>
            <DialogDescription>What&apos;s on your mind?</DialogDescription>
          </DialogHeader>

          <textarea
            value={feedbackMessage}
            onChange={(event) => setFeedbackMessage(event.target.value)}
            placeholder="Tell us what would make TeamFore better..."
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-28 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
            maxLength={2000}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsFeedbackOpen(false);
                setFeedbackMessage("");
              }}
              disabled={isSubmittingFeedback}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleFeedbackSubmit}
              disabled={isSubmittingFeedback}
            >
              {isSubmittingFeedback ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
