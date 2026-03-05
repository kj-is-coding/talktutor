/**
 * Script to invite a new user
 *
 * Usage:
 *   node scripts/invite-user.mjs <email> <name>
 *
 * Example:
 *   node scripts/invite-user.mjs friend@example.com "John Doe"
 *
 * Prerequisites:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function generateToken() {
  return randomBytes(32).toString('base64url');
}

async function inviteUser(email, name) {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if already exists
  const { data: existing, error: checkError } = await supabase
    .from('invited_users')
    .select('id, accepted_at, invite_token')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (checkError) {
    console.error(`Error checking existing user: ${checkError.message}`);
    process.exit(1);
  }

  if (existing) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    if (existing.accepted_at) {
      console.log(`\n  ✓ ${email} already accepted invite`);
      console.log(`  They can log in directly at your app's login page.\n`);
    } else if (existing.invite_token) {
      const inviteUrl = `${baseUrl}/invite/${existing.invite_token}`;
      console.log(`\n  ✓ ${email} already invited (pending acceptance)`);
      console.log(`\n  Invite URL: ${inviteUrl}\n`);
    } else {
      console.log(`\n  ✓ ${email} already in system.\n`);
    }
    return;
  }

  // Create new invite
  const inviteToken = generateToken();
  const { error: insertError } = await supabase
    .from('invited_users')
    .insert({
      email: normalizedEmail,
      name,
      invite_token: inviteToken,
    });

  if (insertError) {
    console.error(`✗ Failed to invite ${email}: ${insertError.message}`);
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

  console.log(`\n  ✓ Invited ${email} (${name})`);
  console.log(`\n  Invite URL: ${inviteUrl}\n`);
}

// CLI usage
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('\n  Usage: node scripts/invite-user.mjs <email> <name>');
  console.log('  Example: node scripts/invite-user.mjs user@example.com "John Doe"\n');
  process.exit(1);
}

const [email, name] = args;
inviteUser(email, name);
