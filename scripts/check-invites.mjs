import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Check current records
const { data, error } = await db.from('invited_users').select('*').limit(10);
console.log('Current records:', data?.length || 0);
console.log('Sample:', JSON.stringify(data?.[0], null, 2));
console.log('Error:', error?.message);
