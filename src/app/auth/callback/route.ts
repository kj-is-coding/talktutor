import { createClient } from "@/lib/auth";
import { markInviteAccepted } from "@/lib/invite-operations";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/chat";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Mark invite as accepted if this user was invited
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        await markInviteAccepted(user.email);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
