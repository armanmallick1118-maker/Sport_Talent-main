/**
 * Supabase client configuration for PRANA frontend.
 * Project ID: lncywztearrkxtlowhtc
 * Project URL: https://lncywztearrkxtlowhtc.supabase.co
 */

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lncywztearrkxtlowhtc.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuY3l3enRlYXJya3h0bG93aHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTM2NDMsImV4cCI6MjEwNDg4OTY0M30.Dawdu6yDCry22VB8vloIDDTkkm6p5BJCSr4AJdSW4iE';

export const SUPABASE_CONFIG = {
  projectId: 'lncywztearrkxtlowhtc',
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  publishableKey: 'sb_publishable_LGDN7oREWWK5lz-zrcJwDA_usDit0SJ',
};

export default SUPABASE_CONFIG;
