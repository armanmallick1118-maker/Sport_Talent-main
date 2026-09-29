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

---

## 🏋️ Computer Vision Exercise Correction Engine (`sports-main`)

The `sports-main/Exercise-Correction-main` module provides real-time biomechanical posture correction, kinematic angle calculation, and repetition counting for 6 exercises:

- **Squats**: Tracks hip and knee joint angles (165° standby, 90° target apex), detects knee valgus and improper depth.
- **Lunges**: Dual-leg tracking, monitors forward knee flexion (165° -> 90°) and torso verticality.
- **Bicep Curls**: Tracks elbow angle range (150° extension -> 45° full contraction) with side selection (left, right, both).
- **Planks**: Evaluates core and hip alignment (160°–180° straight spinal hold), includes real-time hold-timer and form score.
- **Push-ups**: Evaluates chest-to-ground depth via elbow angle (160° plank -> 90° bottom) and lumbar sag.
- **Glute Bridges**: Measures pelvic elevation and hip extension (130° flexion -> 175° bridge lock).

### Starting the Exercise CV Server
```bash
# Start the Python AI/CV API Server (Port 8002)
python sports-main/Exercise-Correction-main/api_server.py 8002
```
Frontend automatically proxies `/cv/*` requests to `http://127.0.0.1:8002`. In addition, PRANA features an in-browser client-side kinematic tracking fallback so live workouts and form scoring run seamlessly even without a local Python runtime.