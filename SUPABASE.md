# Supabase Cloud Database & Configuration

This project is configured with a hosted **Supabase PostgreSQL** database.

---

## 🔑 Supabase Project Credentials

| Property | Value |
|---|---|
| **Project Reference** | `lncywztearrkxtlowhtc` |
| **Project URL** | `https://lncywztearrkxtlowhtc.supabase.co` |
| **Supabase Dashboard** | [https://supabase.com/dashboard/project/lncywztearrkxtlowhtc](https://supabase.com/dashboard/project/lncywztearrkxtlowhtc) |
| **Region** | AWS `ap-northeast-1` (Tokyo) |
| **Engine** | PostgreSQL 17 |
| **Status** | `ACTIVE_HEALTHY` |

### API Keys

- **Publishable Key**:
  ```text
  sb_publishable_LGDN7oREWWK5lz-zrcJwDA_usDit0SJ
  ```

- **Legacy Anon Public Key**:
  ```text
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuY3l3enRlYXJya3h0bG93aHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTM2NDMsImV4cCI6MjEwNDg4OTY0M30.Dawdu6yDCry22VB8vloIDDTkkm6p5BJCSr4AJdSW4iE
  ```

---

## 🔌 Database Connection Strings

### 1. Direct Connection (Port 5432)
Used for Prisma schema migrations (`npx prisma migrate dev`, `npx prisma db push`):
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.lncywztearrkxtlowhtc.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.lncywztearrkxtlowhtc.supabase.co:5432/postgres"
```

### 2. Transaction Pooler (Port 6543 / PgBouncer)
Recommended for Railway, Vercel, and containerized serverless deployments:
```env
DATABASE_URL="postgresql://postgres.lncywztearrkxtlowhtc:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.co:6543/postgres?pgbouncer=true"
```

### 3. Session Pooler (Port 5432)
```env
DATABASE_URL="postgresql://postgres.lncywztearrkxtlowhtc:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.co:5432/postgres"
```

---

## 📁 Repository Supabase Files

- [`supabase/config.toml`](supabase/config.toml) — Supabase CLI project configuration
- [`supabase/README.md`](supabase/README.md) — Detailed schema and CLI documentation
- [`frontend/src/lib/supabase.ts`](frontend/src/lib/supabase.ts) — Frontend Supabase client helper
- [`backend/config/supabase.js`](backend/config/supabase.js) — Backend Supabase connection helper
- [`.env.example`](.env.example) — Complete environment variable reference template
