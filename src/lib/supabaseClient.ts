import { createClient } from '@supabase/supabase-js';

// Try both REACT_APP_ prefix and regular env vars
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

console.log('🔍 Checking Supabase configuration...');
console.log('✅ REACT_APP_SUPABASE_URL:', !!process.env.REACT_APP_SUPABASE_URL);
console.log('✅ SUPABASE_URL:', !!process.env.SUPABASE_URL);
console.log('✅ Final supabaseUrl:', !!supabaseUrl);
console.log('✅ REACT_APP_SUPABASE_ANON_KEY:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
console.log('✅ SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);
console.log('✅ Final supabaseAnonKey:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('supabaseUrl:', supabaseUrl ? 'present' : 'missing');
  console.error('supabaseAnonKey:', supabaseAnonKey ? 'present' : 'missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 