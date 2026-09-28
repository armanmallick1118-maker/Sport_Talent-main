# PRANA Supabase Configuration & Database Architecture

This directory contains configuration, migrations, and documentation for the Supabase backend database powering PRANA (Sport Talent).

## Project Details

| Key | Value |
| --- | --- |
| **Project Reference / ID** | `lncywztearrkxtlowhtc` |
| **Project URL** | `https://lncywztearrkxtlowhtc.supabase.co` |
| **Region** | `ap-northeast-1` (Tokyo, AWS) |
| **Status** | Active / Healthy |
| **Database Engine** | PostgreSQL 17 |

## API Keys

- **Publishable Key**: `sb_publishable_LGDN7oREWWK5lz-zrcJwDA_usDit0SJ`
- **Legacy Anon Public Key**:
  ```text
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuY3l3enRlYXJya3h0bG93aHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTM2NDMsImV4cCI6MjEwNDg4OTY0M30.Dawdu6yDCry22VB8vloIDDTkkm6p5BJCSr4AJdSW4iE
  ```

## Database Connection Strings

### Direct PostgreSQL Connection
Use for Prisma migrations and direct database operations:
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.lncywztearrkxtlowhtc.supabase.co:5432/postgres"
```

### Connection Pooler (Transaction Mode - Port 6543)
Recommended for serverless runtimes (Vercel, Railway, Next.js API):
```bash
DATABASE_URL="postgresql://postgres.lncywztearrkxtlowhtc:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.co:6543/postgres?pgbouncer=true"
```

### Connection Pooler (Session Mode - Port 5432)
```bash
DATABASE_URL="postgresql://postgres.lncywztearrkxtlowhtc:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.co:5432/postgres"
```

## Schema & Tables

The database uses Prisma ORM managing the following models:
- **`User`**: Account authentication (email, bcrypt password_hash, role: athlete/scout/coach/admin).
- **`Profile`**: Athletic profile (full name, sport, position, bio, metrics, completion percentage).
- **`Assessment`**: Performance tests (drill type, scores, AI feedback, video references).
- **`FeedPost`**: Community social feed (author, sport, media URLs, likes, comments).
- **`Scout`**: Talent scouts and recruiters directory.
- **`Challenge` / `Leaderboard`**: Gamification and fitness ranking.

## Local Development CLI

```bash
# Link local workspace to remote Supabase project
npx supabase link --project-ref lncywztearrkxtlowhtc

# Pull remote database schema
npx supabase db pull
```
