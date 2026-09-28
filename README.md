# PRANA — Personal Responsive Adaptive Network & Analytics

Vitality, Wellness, Athletic Performance & Digital Twin Platform.

---

## ⚡ Live Services

- **Production Backend (Railway):** [https://sporttalent-production.up.railway.app](https://sporttalent-production.up.railway.app)
- **Production Frontend (Vercel):** [https://sport-talent-main-yoyo.vercel.app](https://sport-talent-main-yoyo.vercel.app)
- **Supabase Cloud Dashboard:** [https://supabase.com/dashboard/project/lncywztearrkxtlowhtc](https://supabase.com/dashboard/project/lncywztearrkxtlowhtc)

---

## 🗄️ Supabase Cloud Database Configuration

PRANA is configured with a managed Supabase PostgreSQL database:

| Configuration | Value |
| --- | --- |
| **Project Reference** | `lncywztearrkxtlowhtc` |
| **Project URL** | `https://lncywztearrkxtlowhtc.supabase.co` |
| **Publishable Key** | `sb_publishable_LGDN7oREWWK5lz-zrcJwDA_usDit0SJ` |
| **Region** | AWS `ap-northeast-1` (Tokyo) |
| **Database Engine** | PostgreSQL 17 |
| **Status** | Active / Healthy |

### Connection Strings

- **Direct PostgreSQL Connection:**
  ```env
  DATABASE_URL="postgresql://postgres:[PASSWORD]@db.lncywztearrkxtlowhtc.supabase.co:5432/postgres"
  ```
- **Connection Pooler (Transaction Mode / PgBouncer):**
  ```env
  DATABASE_URL="postgresql://postgres.lncywztearrkxtlowhtc:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.co:6543/postgres?pgbouncer=true"
  ```
- **Connection Pooler (Session Mode):**
  ```env
  DATABASE_URL="postgresql://postgres.lncywztearrkxtlowhtc:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.co:5432/postgres"
  ```

For additional Supabase setup details, see [`supabase/README.md`](supabase/README.md).

---

## 🚀 Quick Start

### Frontend (Next.js 16 + React 19)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend (Node.js + Express + Prisma)
```bash
cd backend
npm install
npm start
```
Runs at [http://127.0.0.1:8000](http://127.0.0.1:8000).