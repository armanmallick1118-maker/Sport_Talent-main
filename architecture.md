# ATHENA & Sport Talent: Full-Proof System Architecture

## 1. Executive Architecture Overview

The **ATHENA & Sport Talent Platform** is a distributed, multi-tier sports science and athletic intelligence ecosystem. It unifies high-performance athletic telemetry, computer vision biomechanics, mathematical digital twinning, and geospatial talent discovery into a reactive, microservice-powered architecture.

```mermaid
flowchart TB
    subgraph Client_Tier ["Client & Presentation Tier"]
        WEB["ATHENA Unified Web App<br/>(Next.js 14 / React / Tailwind / Recharts)<br/>Port: 3000"]
        VITE["Legacy Athlete Portal<br/>(Vite / React / React-Globe)<br/>Port: 5173"]
    end

    subgraph Gateway_Tier ["API & Orchestration Tier"]
        EXPRESS["Express.js Core Gateway & API<br/>(Node.js / Dynamic Plugin Architecture)<br/>Port: 8000"]
        PLUGIN_GEO["Geospatial Plugin<br/>(/api/v1/plugins/geospatial)"]
        AUTH_ROUTER["JWT Auth & Athlete Router<br/>(/api/v1/auth, /api/v1/athletes)"]
        ASSESS_ROUTER["Physical Assessments Router<br/>(/api/v1/assessments)"]
    end

    subgraph CV_Tier ["Computer Vision & Biomechanics Tier"]
        ATHENA_CV["Athena Motion Kinematics Engine<br/>(Python / Flask / OpenCV / MediaPipe)<br/>Port: 8002"]
        VIDEO_PIPE["Video Upload & Scrubbing Processor"]
        FRAME_EXTRACT["MJPEG Stream & Frame Analyzer<br/>(/video_feed & /analyze_frame)"]
        REP_COUNTER["Kinematic State Machine & Angle Evaluator"]
    end

    subgraph AI_Twin_Tier ["AI & Digital Twin Intelligence Tier"]
        TWIN_ENGINE["8-Axis Digital Twin Vector Engine<br/>(Strength, Cardio, Endurance, Agility, etc.)"]
        COACH_JACK["Coach Jack Multi-Persona AI Core<br/>(Strict, Scientist, Lenient, Dietitian)"]
        NUTRITION_CALC["Dynamic Macro & Fueling Matrix"]
        SIMULATOR["What-If Stress & Intervention Simulator"]
    end

    subgraph Data_Tier ["Persistence & Database Tier"]
        SQLITE["Relational Store (SQLite / Prisma ORM)"]
        LOCAL_STATE["Browser State & LocalStorage Cache"]
    end

    %% Interactions
    WEB -->|"REST / JSON"| EXPRESS
    WEB -->|"Direct Kinematics / HTTP"| ATHENA_CV
    WEB <-->|"Real-Time Reactive State"| TWIN_ENGINE
    WEB <-->|"Interactive Persona Switching"| COACH_JACK
    WEB <-->|"Client Persistence"| LOCAL_STATE

    VITE -->|"REST"| EXPRESS

    EXPRESS --> AUTH_ROUTER
    EXPRESS --> ASSESS_ROUTER
    EXPRESS --> PLUGIN_GEO
    AUTH_ROUTER --> SQLITE
    ASSESS_ROUTER --> SQLITE

    ATHENA_CV --> VIDEO_PIPE
    ATHENA_CV --> FRAME_EXTRACT
    FRAME_EXTRACT --> REP_COUNTER

    COACH_JACK --> NUTRITION_CALC
    TWIN_ENGINE --> SIMULATOR
    EXPRESS -.->|"Plugin Sync"| WEB
```

---

## 2. Multi-Tier Microservice Topology

The platform operates across four primary operational ports, ensuring fault tolerance, independent scaling, and zero single points of failure:

| Service Layer | Port | Technology | Primary Functionality |
| :--- | :--- | :--- | :--- |
| **Next.js Unified Web App** | `3000` | Next.js 14, React 18, TypeScript, TailwindCSS, Recharts, Lucide | Core athlete dashboard, Digital Twin, Coach Jack interface, Geospatial 360° Radar, and Video Kinematics portal. |
| **Express.js Backend API** | `8000` | Node.js, Express, Helmet, Morgan, Prisma, SQLite | Secure JWT authentication, athlete profiles, physical assessment history, and dynamic modular plugin routes. |
| **Athena Motion CV Service** | `8002` | Python 3.10+, Flask, OpenCV (`cv2`), MediaPipe Pose (33 keypoints) | Live webcam streaming, local video frame extraction, joint angle trigonometry, and rep count validation. |
| **Vite Athlete Client** | `5173` | React, Vite, Three.js, React-Globe | Legacy 3D globe visualization and cross-platform athlete onboarding. |

---

## 3. Subsystem Architecture & Data Flow

### 3.1. Computer Vision & Athena Motion Kinematics (Port 8002)

```mermaid
sequenceDiagram
    autonumber
    actor Athlete as Athlete / User
    participant UI as CVExerciseView (Next.js :3000)
    participant ServerCV as Athena Motion Server (Python :8002)
    participant MediaPipe as MediaPipe Pose Detection
    participant Engine as Kinematic State Machine

    Athlete->>UI: Uploads Video File (.mp4, .webm) or Starts Webcam
    UI->>UI: Render HTML5 Canvas & Video Scrubber
    loop Real-Time Video Scrub / Playback
        UI->>ServerCV: POST /analyze_frame (Base64 JPEG Frame)
        ServerCV->>MediaPipe: Process RGB Landmark Coordinates (33 Landmarks)
        MediaPipe-->>ServerCV: Normalized 3D Keypoints (x, y, z, visibility)
        ServerCV->>Engine: Calculate Joint Angles (Vectors & Trigonometry)
        Note over Engine: angle = arccos((BA · BC) / (|BA| * |BC|))
        Engine->>Engine: Evaluate Rep State (ECCENTRIC -> INFLECTION -> CONCENTRIC)
        Engine-->>ServerCV: Rep Count, Peak Depth Angle, Form Score, Deviation Log
        ServerCV-->>UI: Return JSON Kinematics Payload
        UI->>UI: Overlay Skeletal Geometry & Update Live Rep HUD
    end
    UI->>Athlete: Render Biomechanical Consistency & Form Report
```

#### Technical Formulation:
1. **Pose Landmark Extraction**: MediaPipe Pose extracts 33 3D body landmarks. For squat and pushup evaluations, the platform isolates:
   - Hip ($L_{23}$ / $L_{24}$), Knee ($L_{25}$ / $L_{26}$), Ankle ($L_{27}$ / $L_{28}$)
   - Shoulder ($L_{11}$ / $L_{12}$), Elbow ($L_{13}$ / $L_{14}$), Wrist ($L_{15}$ / $L_{16}$)
2. **Angle Calculation**:
   $$\theta = \arccos\left(\frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|}\right) \times \frac{180}{\pi}$$
   Where $\vec{u} = A - B$ and $\vec{v} = C - B$ represent the limb vectors around joint $B$.
3. **Rep State Machine**:
   - `START` $\rightarrow$ Neutral extension ($\theta > 160^\circ$).
   - `INFLECTION` $\rightarrow$ Joint flexion reaches full contraction depth ($\theta < 90^\circ$ for squats).
   - `COMPLETED` $\rightarrow$ Joint returns to extension; rep count incremented, rep duration and peak depth saved.

---

### 3.2. Dynamic Digital Twin & Fitness Engine Sync

```mermaid
flowchart LR
    subgraph Inputs ["Physical Assessment Inputs"]
        P1["Pushups (Max Reps)"]
        P2["Squats (Max Reps)"]
        P3["Plank Hold (Sec)"]
        P4["Situps (Max Reps)"]
        P5["2.4km Pace (min/km)"]
        P6["Sit-and-Reach (cm)"]
        P7["Single-Leg Stance (sec)"]
    end

    subgraph Calculation ["Real-Time Dynamic Normalization"]
        MATH["Mathematical Vector Normalizer<br/>Weighted Baselines & Curve Clamping"]
    end

    subgraph Twin_Vector ["8-Axis Dimensional Twin State"]
        V_STR["Strength (0-100)"]
        V_END["Endurance (0-100)"]
        V_CAR["Cardio (0-100)"]
        V_MOB["Mobility (0-100)"]
        V_FLX["Flexibility (0-100)"]
        V_BAL["Balance (0-100)"]
        V_AGI["Agility (0-100)"]
        V_CON["Consistency (0-100)"]
    end

    subgraph Views ["Synchronized Real-Time Views"]
        RADAR["Recharts 8-Axis Radar Chart<br/>(DigitalTwinView.tsx)"]
        DASH["Main Dashboard Readiness<br/>(DashboardView.tsx)"]
        SIM["What-If Intervention Engine<br/>(SimulatorView.tsx)"]
    end

    Inputs --> MATH
    MATH --> Twin_Vector
    Twin_Vector --> RADAR
    Twin_Vector --> DASH
    Twin_Vector --> SIM
```

- When the athlete adjusts physical sliders in `FitnessEngineView.tsx`:
  - $S_{\text{strength}} = \text{clamp}\left(\frac{\text{Pushups}}{50} \times 50 + \frac{\text{Squats}}{60} \times 50, 20, 100\right)$
  - $S_{\text{cardio}} = \text{clamp}\left(100 - (\text{Pace} - 3.5) \times 12, 30, 100\right)$
  - $S_{\text{mobility}} = \text{clamp}\left(50 + \frac{\text{Reach}}{35} \times 50, 30, 100\right)$
- Clicking **"Sync & Recalibrate My Twin"** triggers top-level state propagation in `page.tsx`, reshaping all Recharts visualizations and longitudinal curves without page reload.

---

### 3.3. Coach Jack Multi-Attitude AI & Nutrition Engine

Coach Jack contains 4 deterministic prompt persona drivers and an embedded sports dietitian calculation suite:

```mermaid
stateDiagram-v2
    [*] --> SelectPersona
    SelectPersona --> StrictMentor: Discipline, Form Critique, No Excuses
    SelectPersona --> SportsScientist: VO2 Max, Heart Rate Zones, Biometrics
    SelectPersona --> SupportiveCoach: Pacing, Mental Health, Active Recovery
    SelectPersona --> SportsDietitian: Fueling, Macro Breakdown, Hydration

    state SportsDietitian {
        [*] --> InputWeightAndGoal
        InputWeightAndGoal --> CalculateBMR: Mifflin-St Jeor / Gender Formulations
        CalculateBMR --> ComputeMacros: Protein (1.6-2.2g/kg), Carbs (4-7g/kg), Fats (0.8-1.2g/kg)
        ComputeMacros --> RenderFuelingPlan
    }
```

---

### 3.4. Interactive 360° Geospatial Talent Radar

The Geospatial Radar simulates military-grade active sonar sweeps for national sports talent discovery:

```mermaid
flowchart TD
    A["Radar Angle Sweep θ (0° to 360° Animation)"] --> B["Active Ray Casting Over Coordinate Grid"]
    B --> C["Filter: Range Radius (10km - 500km)"]
    C --> D["Filter: Region (North / South / East / West)"]
    D --> E["Filter: Sport & Role (Athlete vs Scout)"]
    E --> F["Polar to Cartesian Projection (r, θ) -> (x, y)"]
    F --> G["Render Blips & Ping Waves on Canvas"]
    G --> H["User Clicks Blip -> Render Instant Dossier Card"]
    H --> I["Sync with Backend /api/v1/plugins/geospatial/heatmap"]
```

---

## 4. Security, Authentication & Session Architecture

- **Token Handling**: Standard RFC 7519 JSON Web Tokens (JWT) signed using HMAC-SHA256.
- **Client Storage**: Tokens and verification states are cached in `localStorage` under keys `athena_token`, `athena_user`, and `athena_profile_completion`.
- **Route Protection**: Next.js App Router client components evaluate session presence. Unauthenticated requests redirect immediately to `/login`.
- **Dynamic Profile Completeness Verification**:
  $$\text{Completeness} = \left(\frac{\sum_{i=1}^N \mathbb{I}(\text{field}_i \text{ is valid})}{N}\right) \times 100\%$$
  Fields evaluated: Full Name, Gender, Date of Birth, Height, Weight, Primary Sport, Experience Level, Geographic Location, and Target Goal.

---

## 5. Dynamic Backend Plugin System (Port 8000)

The Node.js Express server implements an automated plugin discovery engine:
1. On boot, `backend/server.js` scans the `backend/plugins/` directory.
2. For every subdirectory containing an `index.js`, the server requires the module.
3. If valid `baseRoute` and `router` exports exist, Express mounts the sub-application dynamically.
4. This decouples specialized features (such as `geospatial` heatmap intelligence) from core authentication, enabling zero-downtime additions and zero git merge conflicts.

---

## 6. High Availability & Deployment Topology

```mermaid
graph TD
    subgraph Host_Environment ["Host Machine / Container Cluster"]
        direction TB
        subgraph Port_3000 ["Frontend Layer"]
            NEXT["Next.js SSR & Client Engine<br/>Node.js Daemon"]
        end
        subgraph Port_8000 ["API Layer"]
            EXPR["Express.js Server<br/>Prisma ORM Client"]
            DB[(SQLite / Postgres)]
            EXPR --> DB
        end
        subgraph Port_8002 ["CV AI Layer"]
            FLASK["Flask / MediaPipe Server<br/>OpenCV Dynamic Linkages"]
        end
    end

    NEXT -->|Internal Loopback| EXPR
    NEXT -->|Bi-directional Frames| FLASK
```

This ensures complete decoupling: if the computer vision process requires heavy GPU/CPU cycles for high-frame-rate video analysis, the primary web application and authentication servers remain fully responsive.
