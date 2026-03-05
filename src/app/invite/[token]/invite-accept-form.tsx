"use client";

import { useState } from "react";
import { createClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

interface Props {
  email: string;
  name: string;
}

export function InviteAcceptForm({ email, name }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  const handleAccept = async () => {
    setStatus("loading");

    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          name, // Pre-fill name in user metadata
        },
      },
    });

    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <div className="w-full text-center animate-in">
        <div className="mx-auto mb-5 w-14 h-14 flex items-center justify-center rounded-2xl bg-success/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1.5">Check your email</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We sent a magic link to{" "}
          <span className="text-foreground font-medium">{email}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Email: <span className="text-foreground font-medium">{email}</span>
      </p>
      <Button
        onClick={handleAccept}
        disabled={status === "loading"}
        className="w-full h-12 rounded-xl text-[15px] font-medium"
      >
        {status === "loading" ? "Sending..." : "Accept Invitation"}
      </Button>
    </div>
  );
}
