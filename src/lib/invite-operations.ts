'use server';

import { supabaseAdmin } from './supabase-client';
import { randomBytes } from 'crypto';

export interface InvitedUser {
  id: string;
  email: string;
  name: string;
  inviteToken: string | null;
  invitedBy: string | null;
  invitedAt: Date;
  acceptedAt: Date | null;
}

function rowToInvitedUser(row: Record<string, unknown>): InvitedUser {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    inviteToken: row.invite_token as string | null,
    invitedBy: row.invited_by as string | null,
    invitedAt: new Date(row.invited_at as string),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at as string) : null,
  };
}

/**
 * Generate a secure random invite token
 */
function generateInviteToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Check if an email is on the whitelist
 */
export async function isEmailWhitelisted(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseAdmin as any)
    .from('invited_users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error) {
    console.error('Error checking whitelist:', error);
    return false;
  }

  return !!data;
}

/**
 * Add a new invited user to the whitelist
 * Returns the invite token that can be used to create an invite link
 */
export async function inviteUser(
  email: string,
  name: string,
  invitedBy?: string
): Promise<{ success: boolean; inviteToken?: string; error?: string }> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if already invited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabaseAdmin as any)
    .from('invited_users')
    .select('id, accepted_at, invite_token')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) {
    // Already invited - return existing token if not yet accepted
    if (!existing.accepted_at && existing.invite_token) {
      return { success: true, inviteToken: existing.invite_token as string };
    }
    return { success: true }; // Already accepted, no token needed
  }

  // Create new invite
  const inviteToken = generateInviteToken();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin as any)
    .from('invited_users')
    .insert({
      email: normalizedEmail,
      name,
      invite_token: inviteToken,
      invited_by: invitedBy || null,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, inviteToken };
}

/**
 * Get invited user by token (for invite link flow)
 */
export async function getInvitedUserByToken(token: string): Promise<InvitedUser | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseAdmin as any)
    .from('invited_users')
    .select('*')
    .eq('invite_token', token)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return rowToInvitedUser(data);
}

/**
 * Mark invited user as accepted (after first login)
 */
export async function markInviteAccepted(email: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabaseAdmin as any)
    .from('invited_users')
    .update({
      accepted_at: new Date().toISOString(),
      invite_token: null, // Clear token after use
    })
    .eq('email', email.toLowerCase().trim());
}

/**
 * Get all invited users (for admin UI)
 */
export async function getAllInvitedUsers(): Promise<InvitedUser[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseAdmin as any)
    .from('invited_users')
    .select('*')
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('Error fetching invited users:', error);
    return [];
  }

  return (data || []).map(rowToInvitedUser);
}

/**
 * Remove user from whitelist
 */
export async function removeInvitedUser(email: string): Promise<{ success: boolean; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin as any)
    .from('invited_users')
    .delete()
    .eq('email', email.toLowerCase().trim());

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
