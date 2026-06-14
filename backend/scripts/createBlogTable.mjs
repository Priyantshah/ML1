import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createUsersTable() {
    console.log('Checking app_users table...');
    const { data, error } = await supabase.from('app_users').select('id').limit(1);
    if (!error) {
        console.log('✅ app_users table already exists!');
        const { data: all } = await supabase.from('app_users').select('*');
        console.log('Current users:', all);
        return;
    }
    console.log('Table does not exist, error:', error.message);
    console.log('\nRun this SQL in your Supabase Dashboard (https://supabase.com/dashboard/project/eutwtlxpcobrxeyjkfqh/sql/new):\n');
    console.log(`
CREATE TABLE IF NOT EXISTS app_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture TEXT,
    provider TEXT DEFAULT 'google',
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS so service role can write freely
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
    `);
}

createUsersTable().catch(console.error);
