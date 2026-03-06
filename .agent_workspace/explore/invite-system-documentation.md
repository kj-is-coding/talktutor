# Invite System Documentation

## Overview

The invite system provides a private beta access control mechanism with two types of invite flows:
1. **Standard Invite** - Admin knows recipient's email/name upfront
2. **Generic Invite** - Admin generates a shareable link; recipient enters their own details

---

## File Reference

### Core Files

| File | Purpose |
|------|---------|
| `/Users/karl/work/language-app/src/lib/invite-operations.ts` | Core invite logic (server-side operations) |
| `/Users/karl/work/language-app/src/app/invite/[token]/page.tsx` | Invite landing page (server component) |
| `/Users/karl/work/language-app/src/app/invite/[token]/invite-accept-form.tsx` | Invite form (client component) |
| `/Users/karl/work/language-app/src/app/api/invite/claim/route.ts` | API endpoint for claiming generic invites |
| `/Users/karl/work/language-app/src/middleware.ts` | Auth middleware (skips /invite paths) |
| `/Users/karl/work/language-app/src/lib/auth.ts` | Server-side auth client & session management |
| `/Users/karl/work/language-app/src/lib/auth-client.ts` | Browser-side auth client |
| `/Users/karl/work/language-app/src/lib/supabase-client.ts` | Supabase client instances (regular + admin) |
| `/Users/karl/work/language-app/src/app/auth/callback/route.ts` | Auth callback (marks invite as accepted) |
| `/Users/karl/work/language-app/src/app/login/page.tsx` | Login page (checks whitelist) |
| `/Users/karl/work/language-app/scripts/invite-user.mjs` | CLI script for creating invites |

### Database Migrations

| File | Purpose |
|------|---------|
| `/Users/karl/work/language-app/supabase/migrations/002_invite_system.sql` | Initial invite system schema |
| `/Users/karl/work/language-app/supabase/migrations/003_generic_invites.sql` | Generic invite support (nullable email/name) |

---

## Database Schema

### `invited_users` Table

```sql
CREATE TABLE IF NOT EXISTS invited_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,                    -- NULLABLE (for generic invites)
  name TEXT,                     -- NULLABLE (for generic invites)
  invite_token TEXT UNIQUE,      -- Secure token for invite link
  invited_by UUID,               -- User who created the invite
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,       -- Set when user completes magic link
  is_generic BOOLEAN DEFAULT FALSE,  -- True for generic invites
  claimed_at TIMESTAMPTZ,        -- Set when generic invite is claimed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invited_users_email ON invited_users(email);
CREATE INDEX idx_invited_users_token ON invited_users(invite_token);
CREATE UNIQUE INDEX idx_invited_users_email_unique ON invited_users(email) WHERE email IS NOT NULL;

-- RLS enabled, no policies (service role only)
ALTER TABLE invited_users ENABLE ROW LEVEL SECURITY;
```

### Key Column Semantics

| Column | Standard Invite | Generic Invite |
|--------|-----------------|----------------|
| `email` | Set at creation | NULL until claimed |
| `name` | Set at creation | NULL until claimed |
| `is_generic` | `false` | `true` |
| `claimed_at` | NULL | Set when user enters info |
| `accepted_at` | Set after magic link | Set after magic link |

---

## Complete Flow Diagrams

### Flow 1: Generic Invite (Primary Use Case)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ADMIN: Run CLI script                                       │
│     node scripts/invite-user.mjs --generic                      │
│     Creates: {email: null, name: null, is_generic: true,        │
│                invite_token: "xxx"}                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. SHARE: Admin shares link: /invite/xxx                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. USER VISITS: GET /invite/xxx                                │
│     - Middleware skips auth check (public path)                 │
│     - Page.tsx calls getInvitedUserByToken(token)               │
│     - If valid & !claimedAt: shows form with name/email inputs  │
│     - If already claimed: redirects to /login                   │
│     - If already accepted: redirects to /login                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. USER SUBMITS: POST /api/invite/claim                        │
│     Body: {token, email, name}                                  │
│                                                                 │
│     claimGenericInvite() does:                                  │
│     a) Validates token is generic & not claimed                 │
│     b) Checks if email already accepted (reject if so)          │
│     c) Updates row: email, name, claimed_at                     │
│     d) Creates auth user via admin API (if not exists)          │
│     e) Generates magiclink token for auto-auth                  │
│     f) Returns sessionToken for immediate login                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. AUTO-AUTH ATTEMPT                                           │
│     - API calls supabase.auth.verifyOtp() with sessionToken     │
│     - If success: redirects to /app/chat (session established)  │
│     - If fail: redirects to /login?email=... (fallback)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. AUTH CALLBACK (if magic link used)                          │
│     GET /auth/callback?token=xxx&type=magiclink                 │
│     - Verifies OTP and creates session                          │
│     - Calls markInviteAccepted(email)                           │
│       → Sets accepted_at, clears invite_token                   │
│     - Redirects to /app/chat                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Standard Invite (Email Known Upfront)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ADMIN: Run CLI script                                       │
│     node scripts/invite-user.mjs user@example.com "John Doe"    │
│     Creates: {email, name, is_generic: false, invite_token}     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. USER VISITS: GET /invite/xxx                                │
│     - Page shows pre-filled name/email                          │
│     - Click "Accept" → redirects to /login?email=...            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. LOGIN PAGE                                                   │
│     - Email pre-filled from URL param                           │
│     - Calls /api/auth/check-whitelist → isEmailWhitelisted()    │
│     - Sends magic link via signInWithOtp()                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. AUTH CALLBACK (same as generic flow)                        │
│     - Creates session, marks invite accepted                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Functions in invite-operations.ts

### `generateInviteToken(): string`
- Uses `crypto.randomBytes(32).toString('base64url')`
- Creates URL-safe 43-character token

### `isEmailWhitelisted(email): Promise<boolean>`
- Checks if email exists in `invited_users` table
- Used by login page to gate access

### `inviteUser(email, name, invitedBy?): Promise<{success, inviteToken?, error?}>`
- Creates standard invite with known email/name
- Returns existing token if already invited but not accepted
- Returns success without token if already accepted

### `createGenericInvite(invitedBy?): Promise<{success, inviteToken?, error?}>`
- Creates invite with `email: null, name: null, is_generic: true`
- Token can be shared as link

### `claimGenericInvite(token, email, name): Promise<{success, error?, sessionToken?}>`
- Validates token is generic and not yet claimed
- Handles edge case: deletes existing unclaimed row with same email
- Creates auth user via admin API with `email_confirm: true`
- Generates magiclink token for immediate authentication
- Returns `sessionToken` for auto-login

### `getInvitedUserByToken(token): Promise<InvitedUser | null>`
- Fetches invite details for page rendering
- Returns null if invalid token

### `markInviteAccepted(email): Promise<void>`
- Sets `accepted_at = now()`
- Clears `invite_token` (prevents reuse)

---

## Middleware Behavior

From `/Users/karl/work/language-app/src/middleware.ts`:

```typescript
export async function middleware(request: NextRequest) {
  // Skip auth for invite pages - they are public
  if (request.nextUrl.pathname.startsWith('/invite')) {
    return NextResponse.next();
  }
  return await updateSession(request);
}
```

**Key point:** All `/invite/*` paths are public (no auth required). This allows unauthenticated users to access invite links.

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (for admin ops) | Service role key for admin API |
| `NEXT_PUBLIC_SITE_URL` | Optional | Override base URL for invite links |
| `BYPASS_AUTH` | Optional | Set to "true" in development to bypass auth |

---

## Vercel Considerations

### Base URL Detection

From `/Users/karl/work/language-app/src/app/api/admin/invite/route.ts`:

```typescript
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';
```

**Gotcha:** `VERCEL_URL` is automatically set by Vercel. If deploying to production, either:
1. Set `NEXT_PUBLIC_SITE_URL` explicitly, OR
2. Let Vercel auto-detect via `VERCEL_URL`

### Cookie Handling

Server-side auth client uses `@supabase/ssr` with Next.js `cookies()` API. This works correctly on Vercel's edge runtime.

### Vercel Authentication

**CRITICAL:** If Vercel Authentication is enabled in project settings, it will intercept ALL requests (including `/invite/*`) before they reach your app. This causes invite links to redirect to `https://vercel.com/login`.

**Solution:** Disable Vercel Authentication in project settings if you want public invite access.

---

## Setup Steps to Replicate

### 1. Database Setup

Run migrations in Supabase SQL editor:

```sql
-- Migration 002: Initial invite system
CREATE TABLE IF NOT EXISTS invited_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  invite_token TEXT UNIQUE,
  invited_by UUID,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invited_users_email ON invited_users(email);
CREATE INDEX IF NOT EXISTS idx_invited_users_token ON invited_users(invite_token);
ALTER TABLE invited_users ENABLE ROW LEVEL SECURITY;

-- Migration 003: Generic invites
ALTER TABLE invited_users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE invited_users ALTER COLUMN name DROP NOT NULL;
ALTER TABLE invited_users ADD COLUMN is_generic BOOLEAN DEFAULT FALSE;
ALTER TABLE invited_users ADD COLUMN claimed_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invited_users_email_unique ON invited_users(email) WHERE email IS NOT NULL;
```

### 2. Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Code Patterns

**Server-side admin operations:**
```typescript
import { supabaseAdmin } from '@/lib/supabase-client';
// Use supabaseAdmin for invite operations (bypasses RLS)
```

**Server-side session client:**
```typescript
import { createClient } from '@/lib/auth';
const supabase = await createClient();
```

**Browser-side client:**
```typescript
import { createClient } from '@/lib/auth-client';
const supabase = createClient();
```

---

## Common Gotchas

1. **Service Role Key Required:** `invite-operations.ts` uses `supabaseAdmin` which requires `SUPABASE_SERVICE_ROLE_KEY`. Without it, the admin client falls back to anon key which won't bypass RLS.

2. **NULL Email Uniqueness:** PostgreSQL allows multiple NULL values in a UNIQUE column. The partial index `WHERE email IS NOT NULL` ensures uniqueness only for non-NULL emails.

3. **Magic Link Token Extraction:** The `claimGenericInvite` function extracts the token from the magic link URL via regex: `magicLink.match(/token=([^&]+)/)`.

4. **Cookie Setting in Server Components:** The `createClient()` in `auth.ts` has a try-catch around cookie setting because Server Components can't set cookies.

5. **BYPASS_AUTH Mode:** When `BYPASS_AUTH=true` and `NODE_ENV=development`, all auth checks are skipped and a test user is returned.

6. **Invite Token Cleanup:** `markInviteAccepted()` clears `invite_token` to prevent reuse, but keeps the row for whitelist purposes.

7. **Vercel Authentication Interference:** Vercel's project-level SSO/Auth intercepts requests before they reach Next.js middleware. Must be disabled for public invite paths.

8. **Duplicate Email Handling:** When claiming a generic invite, if the email exists in another unclaimed row, that row is deleted first to prevent unique constraint violations.

---

## CLI Usage

### Create a generic invite (shareable link):
```bash
node scripts/invite-user.mjs --generic
```

### Create a standard invite (known email):
```bash
node scripts/invite-user.mjs user@example.com "John Doe"
```

---

## Testing

The project includes a Playwright test script for automated testing:
```
/Users/karl/work/language-app/scripts/test-invite-flow.mjs
```

Run with:
```bash
INVITE_URL=http://localhost:3000/invite/TOKEN node scripts/test-invite-flow.mjs
```

---

## Summary

- The invite system uses a Supabase database table (`invited_users`) as both an email whitelist and invite token store
- Two invite types exist: **Standard** (known email) and **Generic** (shareable link)
- Generic invites allow claiming with user-provided email, then auto-create auth users and attempt immediate login via OTP verification
- The middleware explicitly skips auth for `/invite/*` paths to allow public access
- Service role key is required for admin operations since RLS is enabled with no policies
- The flow: Create invite → Visit link → Claim (for generic) → Auth → Mark accepted
- **Critical:** Disable Vercel Authentication in project settings to allow public invite access
