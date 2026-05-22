import { createClient } from '@supabase/supabase-js';

// Supabase connection for browser-side, no-auth feedback submissions.
// These are public anon credentials from the frontend environment; never use a service role key here.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The feedback insert flow targets the existing cartruth.feedback table:
// registration, make, model, usefulness, issue_type, details, website_feedback,
// ownership_score, verdict, confidence, user_agent, and page_url.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseConfigStatus() {
  return {
    // Confirm these are the frontend-safe NEXT_PUBLIC variables.
    usesUrlEnv: 'NEXT_PUBLIC_SUPABASE_URL',
    usesAnonKeyEnv: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
  };
}
