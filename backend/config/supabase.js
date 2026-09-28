/**
 * Supabase configuration and PostgreSQL client utility for PRANA backend.
 * Project ID: lncywztearrkxtlowhtc
 * Project URL: https://lncywztearrkxtlowhtc.supabase.co
 */

const { Pool } = require('pg');

const SUPABASE_CONFIG = {
  projectId: 'lncywztearrkxtlowhtc',
  projectUrl: 'https://lncywztearrkxtlowhtc.supabase.co',
  publishableKey: 'sb_publishable_LGDN7oREWWK5lz-zrcJwDA_usDit0SJ',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuY3l3enRlYXJya3h0bG93aHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTM2NDMsImV4cCI6MjEwNDg4OTY0M30.Dawdu6yDCry22VB8vloIDDTkkm6p5BJCSr4AJdSW4iE',
  directHost: 'db.lncywztearrkxtlowhtc.supabase.co',
  poolerHost: 'aws-0-ap-northeast-1.pooler.supabase.co',
  poolerUser: 'postgres.lncywztearrkxtlowhtc',
  poolerPort: 6543,
};

function createSupabasePool(password) {
  return new Pool({
    host: SUPABASE_CONFIG.poolerHost,
    port: SUPABASE_CONFIG.poolerPort,
    user: SUPABASE_CONFIG.poolerUser,
    password: password || process.env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });
}

module.exports = {
  SUPABASE_CONFIG,
  createSupabasePool,
};
