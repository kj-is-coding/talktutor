import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Use raw SQL via RPC to truncate
const { error } = await db.rpc('truncate_invited_users');
if (error) {
  // Try alternative - get all and delete
  const { data } = await db.from('invited_users').select('id');
  if (data && data.length > 0) {
    const ids = data.map(r => r.id);
    const { error: delError, count } = await db.from('invited_users').delete().in('id', ids);
    console.log('Deleted via IDs:', count, 'Error:', delError?.message);
  } else {
    console.log('No records to delete or error getting records');
  }
} else {
  console.log('Truncated via RPC');
}
