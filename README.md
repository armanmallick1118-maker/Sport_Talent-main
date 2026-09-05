# 🏆 Sport Talent - Advanced Athlete Assessment Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Welcome to the **Sport Talent** repository! This is a comprehensive, full-stack application designed to track, assess, and evaluate athletic talent through digital assessments, AI-driven analysis, and social networking features (the Talent Card and Feed).

This repository is built with a modular, highly scalable technology stack combining a modern mobile frontend, a highly extensible API backend, and an intelligent Python-driven AI pipeline.

---

## 🏗️ High-Level Architecture & Technology Stack

The project is structured into three main layers:

### 1. The Mobile Frontend (Flutter / Dart)
The user interface is built as a cross-platform mobile application using **Flutter**.
- Consumes the RESTful APIs exposed by the Node.js backend.
- Displays dynamic UI elements such as the "Talent Card" radar charts, live feed, and video assessment upload flows.

### 2. The Core API Backend (Node.js & Express)
The main nervous system of the platform, built with **Node.js** and **Express.js**.
- **Routing & Controllers:** Standard MVC-style separation for Authentication, Athletes, and Assessments.
- **ORM & Database:** Uses **Prisma ORM**. Currently configured with SQLite for development, but designed to connect to **PostgreSQL** in production for scalable, relational data storage.
- **Security:** Implements `bcryptjs` for password hashing and `jsonwebtoken` (JWT) for secure authentication.

### 3. The AI Analysis Pipeline (Python)
A dedicated microservice architecture designed to handle heavy video processing and metric extraction.
- Uses **Python** scripts (`analyzer.py`) to parse athlete videos and generate physical metrics.
- Integrated via child processes currently, with plans to decouple into a standalone **FastAPI** service for asynchronous, non-blocking AI jobs.

---

## 🔌 The "Drop-In" Plugin Architecture

To ensure massive scalability and prevent code conflicts among a growing team of developers, the backend features a custom **Dynamic Plugin System**.

Instead of writing new features into the core `server.js` file, developers can simply create a new folder inside `backend/plugins/`. 
- **Auto-Discovery:** The core engine automatically scans the `plugins/` folder on startup.
- **Isolation:** Each plugin contains its own dedicated routes, logic, and controllers.
- **Full-Stack Capabilities:** Plugins can serve raw JSON data for the mobile app, or render full HTML UI pages independently.

*To learn how to build a plugin, read the [Plugin Developer Guide](./backend/plugins/README.md).*

---

## 🗄️ Database Schema Overview

The relational database is managed by **Prisma** and contains the following core entities:
* **User & Profile:** Manages authentication (athlete vs scout) and user bios.
* **AssessmentType & UserAssessment:** Tracks the various tests (e.g., 10m sprint, vertical jump) and the scores/videos uploaded by users.
* **RadarMetric:** Aggregates a user's scores into physical attributes (Speed, Technique, Agility, Endurance, Strength) to power the frontend Talent Card.
* **FeedPost:** Manages the social timeline for achievements and platform announcements.

---

## 🌟 PRANA Web Application (`localhost:3000`)

The flagship web interface is built with **Next.js 16 (Turbopack)**, **React 19**, and **Tailwind CSS**, located in `Sport_Talent-main-yoyo/apps/web`.

### ✨ Core Features
- **🪐 Circular PRANA Intelligence Ring:** An interactive 13-node orbiting navigation system connecting all features of the athlete lifecycle.
- **🤖 Coach Jack AI Assistant:** High-performance conversational AI powered by Groq LLaMA 3.3 70B & 120B with dynamic user profile personalization, custom diet plans, workout generation, and seamless in-chat goal creation.
- **🎯 Interactive Goal Engine:** Milestones, habit tracking, templates, and transfer to Coach Jack.
- **📍 Sports & Fitness Radar:** Geospatial facility discovery with Indian Rupee (₹) pricing for gyms, Olympic tracks, swimming pools, turf arenas, and biomechanics labs.
- **⚡ Dynamic Recovery & Sleep Engine:** Chronotype analysis, REM/Deep cycle breakdown, and autonomic readiness scoring.
- **🧠 24/7 Mental Wellness & Crisis Support:** Dedicated athlete mental resilience tools with direct toll-free crisis helpline access.
- **📹 Live CV Motion Coach:** Real-time athlete posture kinematics via native webcam with Rep & Form detection.

### 🚀 Running the Web App Locally

1. Navigate to the web application directory:
   ```bash
   cd Sport_Talent-main-yoyo/apps/web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Start the server:
   ```bash
   node server.js
   ```
   The backend API will run on `http://localhost:8000`.