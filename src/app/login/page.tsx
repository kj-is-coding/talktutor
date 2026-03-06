"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/auth-client";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const authError = searchParams.get("error");
  const emailParam = searchParams.get("email");

  // Clean up URL by removing error parameter if email is present (from invite redirect)
  useEffect(() => {
    if (emailParam && authError) {
      router.replace("/login?email=" + encodeURIComponent(emailParam));
    }
  }, [emailParam, authError, router]);

  const [email, setEmail] = useState(emailParam || "");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    // Check email whitelist via API
    try {
      const checkResponse = await fetch('/api/auth/check-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const { isWhitelisted } = await checkResponse.json();

      if (!isWhitelisted) {
        setStatus("error");
        setError("This app is in private beta. Contact the developer for access.");
        return;
      }
    } catch (err) {
      console.error('Whitelist check failed:', err);
      setStatus("error");
      setError("Unable to verify access. Please try again.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  };

  if (status === "sent") {
    return (
      <div className="text-center animate-in">
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
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <>
      {authError && !emailParam && (
        <div className="w-full rounded-xl px-4 py-3 mb-5 text-center text-sm text-destructive bg-destructive/10 border border-destructive/20">
          Authentication failed. Please try again.
        </div>
      )}

      <form onSubmit={handleLogin} className="w-full">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          className="mb-3 h-12 text-[15px] rounded-xl bg-muted border-border focus-visible:ring-primary"
        />

        {error && (
          <p className="mb-3 text-sm text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          disabled={status === "loading"}
          className="w-full h-12 rounded-xl text-[15px] font-medium"
        >
          {status === "loading" ? "Sending..." : "Continue with email"}
        </Button>
      </form>
    </>
  );
}

function LoginFallback() {
  return (
    <div className="w-full space-y-3">
      <div className="skeleton rounded-xl h-12" />
      <div className="skeleton rounded-xl h-12" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 w-12 h-12 flex items-center justify-center rounded-xl bg-primary/10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 8 6 6" />
            <path d="m4 14 6-6 2-3" />
            <path d="M2 5h12" />
            <path d="M7 2h1" />
            <path d="m22 22-5-10-5 10" />
            <path d="M14 18h6" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-1 text-center tracking-tight">TalkTutor</h1>
        <p className="text-sm text-muted-foreground mb-8 text-center">
          Practice conversations with AI
        </p>

        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
