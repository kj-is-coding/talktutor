import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const token = 'Ne_O9Otj5Mn4IFUufCI3b6owbKezWOL5-quF796ITRc';

// Check this specific token
const { data, error } = await db.from('invited_users').select('*').eq('invite_token', token).single();
console.log('Token lookup result:');
console.log(JSON.stringify(data, null, 2));
console.log('Error:', error?.message);

// Show all records
const { data: all } = await db.from('invited_users').select('*');
console.log('\nAll records:', all?.length || 0);
all?.forEach(r => console.log(`- ${r.invite_token?.slice(0,20)}... | email: ${r.email} | claimed: ${r.claimed_at} | accepted: ${r.accepted_at} | is_generic: ${r.is_generic}`));
