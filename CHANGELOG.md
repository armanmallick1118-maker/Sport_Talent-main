# Sport Talent & ATHENA Platform - Comprehensive Changelog & Technology Catalog

This document serves as the master record of all technologies, libraries, architectural updates, and features integrated across the Sport Talent & ATHENA ecosystem.

---

## 1. Complete Technology Stack Catalog

### 1.1. Frontend & Client Technologies
| Technology | Version / Category | Purpose in Project |
| :--- | :--- | :--- |
| **Next.js 14** | App Router (`apps/web`) | Primary athlete dashboard, server/client component orchestration, fast SSR, and client-side routing (`localhost:3000`). |
| **React 18** | Client UI Library | Component hierarchy, state hooks (`useState`, `useEffect`, `useRef`), and reactive telemetry binding. |
| **TypeScript** | Static Typing | Strict interfaces for athlete biometrics, digital twin scores, radar pings, and API payloads. |
| **Vite 5** | ESM Bundler (`frontend`) | Rapid-development client interface with instant Hot Module Replacement (HMR) (`localhost:5173`). |
| **TailwindCSS** | CSS Framework | Utility-first styling, responsive dark-mode slate theme, custom glows, and glassmorphism. |
| **Recharts** | Data Visualization | 8-Axis Digital Twin Radar Charts, longitudinal progress curves, and readiness bar charts. |
| **Lucide React** | Iconography | Modern, clean feather icon suite used throughout dashboards, sidebars, and HUD cards. |
| **Three.js & react-globe.gl** | 3D WebGL Visualization | Interactive 3D planetary talent globe rendering national athletic hotspots and scouts. |
| **HTML5 Canvas API** | Graphics & Video Capture | Real-time 30–60 FPS video frame extraction, pose skeletal rendering, and polar radar sweeping. |
| **HTML5 Video API** | Media Streaming | Multi-format local video playback (`.mp4`, `.webm`, `.mov`), time scrubbing, and frame grabbing. |

### 1.2. Backend & Gateway Technologies
| Technology | Version / Category | Purpose in Project |
| :--- | :--- | :--- |
| **Node.js (v18+)** | Runtime Environment | High-throughput asynchronous backend server runtime (`localhost:8000`). |
| **Express.js** | Web Framework | REST API endpoints, routing, middleware chaining, and dynamic plugin hot-mounting. |
| **Prisma ORM** | Object-Relational Mapping | Schema definition, automated migrations, and type-safe database queries. |
| **SQLite (`dev.db`)** | Embedded Database | Zero-configuration persistence for athlete profiles, assessment scores, and feed articles. |
| **JSON Web Tokens (`jsonwebtoken`)** | Authentication (RFC 7519) | Stateless session tokens, claims verification, and protected route access. |
| **bcryptjs** | Cryptography | One-way salted password hashing for athlete security. |
| **Helmet & Morgan** | Security & Logging | HTTP security headers, CORS resource policy configuration, and detailed request tracing. |
| **Dynamic Plugin Architecture** | Modular Gateway | Auto-discovery and hot-mounting of sub-apps from `backend/plugins/` (e.g. Geospatial Heatmap). |

### 1.3. Computer Vision & Biomechanics Technologies
| Technology | Version / Category | Purpose in Project |
| :--- | :--- | :--- |
| **Python 3.10+** | AI Runtime (`plugin-cv_model`) | Dedicated computer vision microservice (`localhost:8002`). |
| **Flask** | Micro Web Framework | Lightweight microservice delivering `/video_feed` (MJPEG) and `/analyze_frame` (JSON API). |
| **OpenCV (`cv2` / `opencv-python`)** | Image & Video Processing | Matrix manipulation, colorspace transformations (BGR to RGB), and JPEG compression. |
| **MediaPipe Pose** | Google Deep Learning Framework | Real-time extraction of 33 3D skeletal landmarks with coordinate visibility confidence. |
| **Vector Biomechanics Trigonometry** | Biomechanical Calculations | Dot-product angle calculation ($\theta = \arccos((\vec{u}\cdot\vec{v})/(\|\vec{u}\|\|\vec{v}\|))$) for joints. |
| **Kinematic Rep State Machine** | Dynamic Rep Counting | Three-phase inflection tracking (`START` $\rightarrow$ `INFLECTION` $\rightarrow$ `COMPLETED`) for squats/pushups. |

### 1.4. Artificial Intelligence & Generative Pipelines
| Technology | Version / Category | Purpose in Project |
| :--- | :--- | :--- |
| **Groq High-Speed Inference Engine** | LLM Engine (`groq-sdk`) | Ultra-fast inference with `openai/gpt-oss-120b` (Primary) and `qwen/qwen3.8-27b` (Fallback) delivering sub-2-second coaching intelligence. |
| **Google Gemini Generative AI** | LLM (`@google/generative-ai`) | Powers natural language dialog, coaching prompts, and sports journalist article generation. |
| **Coach Jack Persona Engine** | Multi-Persona Prompt Core | 4 distinct operational attitudes: Strict Mentor, Sports Scientist, Supportive Coach, Dietitian. |
| **Biometric & Unfitness Verdict Matcher** | Cross-Examination AI | Harvests multi-hub telemetry, diagnoses unfitness, interrogates athlete, and matches subjective user verdict against objective data. |
| **Sports Dietitian Fueling Engine** | Nutritional Math | Mifflin-St Jeor BMR formulation with macronutrient distribution targets (g/kg protein, carbs, fats). |
| **Node-Cron** | Task Scheduler | Automated background jobs executing daily at 07:00 AM for sports journalism synthesis. |

### 1.5. DevOps, Scripts & Containers
| Technology | Version / Category | Purpose in Project |
| :--- | :--- | :--- |
| **Docker & Docker Compose** | Containerization | Multi-container definitions for web, backend, and computer vision microservices. |
| **PowerShell (`start-all.ps1`)** | Windows Automation | One-click simultaneous launch of all frontend, backend, and CV microservices. |
| **Bash (`start-all.sh`)** | Unix Automation | Terminal orchestration script with colored log outputs and process health monitoring. |
| **Git** | Version Control | Multi-branch Git workflow (`main`, `plugin`) hosted on GitHub. |

---

## 2. Chronological Architectural Changelog

### Version 2.4.0 - Authentic CV Video & Live Camera Kinematics (Zero Dummy Data)
- **Direct Video File Upload Processing (`/analyze_video_upload`)**:
  - Upgraded Python Athena Motion server (`plugin-cv_model/server.py`) to process uploaded videos frame-by-frame using OpenCV and MediaPipe Pose.
  - Computes real joint angles, rep hysteresis transitions, real consistency standard deviations, and extracts keyframe snapshots at peak inflection depth.
- **Live Camera Telemetry & Workout Sessions**:
  - Added `/live_session/start`, `/live_session/telemetry`, and `/live_session/stop` endpoints on port 8002.
  - Real-time HUD showing live joint angle gauge, live reps, and active movement phase (`START`, `ECCENTRIC`, `INFLECTION`, `CONCENTRIC`).
  - Compiles full verified kinematic reports upon stopping the live workout session.
- **Biomechanical Estimations Suite**:
  - Automatically estimates Concentric Power Output (Watts), Metabolic Energy Burn (kcal), Joint Strain Index (Patellofemoral Flexion), and Cadence Tempo Ratio without arbitrary numbers.
- **Zero Dummy Data & No-Person Detection Guard**:
  - Removed all `Math.random()` numbers and static deviation strings.
  - Automatically detects when no human body is visible and alerts the athlete.

### Version 2.3.0 - Groq Ultra-Fast AI & Holistic Verdict Matching Engine
- **Groq 120B / 27B AI Backend Integration**:
  - Integrated Groq SDK into `backend/plugins/ai_suggestions/index.js` using `openai/gpt-oss-120b` as primary model and `qwen/qwen3.8-27b` as cascading fallback.
  - Implemented `optionalAuth` to ensure reliable responses for both authenticated and guest athletes without 401 token errors.
- **Cross-App Holistic Telemetry Aggregation**:
  - `AICoachView.tsx` harvests telemetry from all webapp subsystems: Digital Twin (8-axis scores), Readiness (score, sleep architecture, fatigue), Lab Biomarkers (hs-CRP, glucose, vitD), and Athena Motion CV Kinematics (reps, peak depth, form deviations).
- **Biometric Audit & Unfitness Verdict Matching**:
  - Added **"Run Unfitness Diagnostic Audit"** to pinpoint athlete bottlenecks.
  - Built **"Verdict Studio"**: Athlete submits their personal explanation/verdict (e.g. sleep issues, knee soreness, stress); Coach Jack matches objective telemetry with the subjective verdict to synthesize prescriptive protocols.

### Version 2.2.0 (Unified ATHENA & Sport Talent Ecosystem)
- **Coach Jack 4-Persona Upgrade**:
  - Implemented live Persona Switcher: *Strict Mentor*, *Sports Scientist*, *Lenient/Supportive Coach*, and *Elite Sports Dietitian*.
  - Added integrated **Macro & Calorie Fueling Calculator** with real-time target adjustments based on bodyweight and training goal.
- **Dynamic Profile Completeness & Inclusive Gender**:
  - Implemented inclusive gender selector: **Male**, **Female**, and **Custom** (with custom input field).
  - Built real-time dynamic 0%–100% profile completion meter highlighting missing fields.
  - Added dynamic sports tags with a custom fitness interest tag creator.
- **CV Video Upload & Multi-Pass Biomechanics**:
  - Enabled local video file upload (`.mp4`, `.webm`, `.mov`) with custom video player controls.
  - Linked to Athena Motion (`http://127.0.0.1:8002/analyze_frame`) for multi-pass kinematic evaluation.
- **Interactive 360° Geospatial Talent Radar**:
  - Created `GeospatialRadarView.tsx` with animated radar sweep, range slider (10km–500km), quadrant filters, and athlete/scout dossier inspection cards.
  - Connected live to `/api/v1/plugins/geospatial/heatmap` on port 8000.
- **Fitness Engine & Digital Twin Live Synchronization**:
  - Adjusting physical assessment sliders dynamically recalibrates 8-axis twin scores and immediately reshapes Recharts radar charts.
  - Verified all interactive navigation links across the Dashboard.

### Version 2.1.0
- Merged Vite frontend components into Next.js (`apps/web` on port 3000).
- Integrated Lab Reports & Metabolic Biomarker Hub (`HealthHubView.tsx`).
- Connected Athena Motion Flask microservice on port 8002.

### Version 2.0.0
- Introduced the 8-Axis Digital Fitness Twin model (Strength, Cardio, Endurance, Mobility, Flexibility, Balance, Agility, Consistency).
- Built the What-If Intervention & Stress Simulator.
- Implemented readiness and recovery scoring engine.

### Version 1.1.0
- Added Node.js dynamic plugin architecture (`backend/plugins/`).
- Added Google Gemini AI news generation cron job (`newsCron.js`).
- Implemented 3D interactive talent globe using `react-globe.gl` and Three.js.

### Version 1.0.0
- Initial release with React/Vite frontend, Node/Express backend, and SQLite/Prisma database.
- Implemented JWT authentication and physical assessment radar metrics.
