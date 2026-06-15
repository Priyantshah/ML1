import { createClient } from '@supabase/supabase-js';

// Public Supabase credentials (anon key is safe to expose in client code).
// Falls back to hardcoded values when VITE_ env vars are not injected at build time.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://eutwtlxpcobrxeyjkfqh.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHd0bHhwY29icnhleWprZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTQwNzMsImV4cCI6MjA3OTI3MDA3M30.54kLsMuMHF6ncINKo9XQAeZuqRKT5qMW8v9XqeMzacA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
