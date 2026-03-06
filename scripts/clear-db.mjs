import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// Delete from invited_users (the correct table name)
const { error, count } = await db.from('invited_users').delete().gte('created_at', '2000-01-01');
console.log('Deleted:', count, 'Error:', error?.message);
