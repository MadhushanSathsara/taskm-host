import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check that the environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anonymous Key are required');
}

// Create the Supabase client instance
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };
