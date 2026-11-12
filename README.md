# DentaAI: AI-Based Dental Disease Detection & Health Management System

**DentaAI** is a comprehensive, end-to-end digital healthcare platform designed to automate dental disease detection using Artificial Intelligence and facilitate seamless patient-doctor consultations. Built as an MCA Final Year Project, it leverages modern web technologies and deep learning to deliver real-time diagnostic insights and secure clinical workflows.

---

## ⚡ Quick Start (Universal 1-Command Runner)

You can launch all three services (**Frontend**, **Backend**, and **Python AI Engine**) simultaneously in a single terminal with a single command from the project root:

```bash
npm run dev
# or
npm start
```

**Alternative shortcuts on Windows:**
```powershell
.\start.ps1
# or double-click
run.bat
```

This automatically checks and clears ports, launches all services concurrently, and displays an interactive status banner:
* 🌐 **Frontend UI**: `http://localhost:5173`
* ⚙️ **Backend API**: `http://localhost:5000`
* 🧠 **AI Model Engine**: `http://localhost:5002`

*Press `Ctrl + C` in that terminal at any time to gracefully shut down all 3 services.*

---

## 🚀 Project Overview

DentaAI bridges the gap between automated medical imaging analysis and professional clinical consultation. Patients upload intraoral scans which are analyzed by a custom-trained Deep Learning model (**MobileNetV2**). The AI returns a localized prediction (e.g. Caries, Gingivitis, Calculus, Hypodontia, Mouth Ulcer, Tooth Discoloration) along with an algorithmic confidence score. Patients can then securely share this AI report and book a consultation with a specialist directly through the platform.

### Key Workflows
**The Full Consultation Lifecycle:**
1. **AI Scan**: Patient uploads an intraoral dental photograph.
2. **Report**: Python/Flask AI service generates a diagnostic prediction in $<50$ ms.
3. **Consult Specialist**: Patient selects a verified doctor and attaches the scan report.
4. **Payment Confirmed**: Patient completes the secure simulated checkout (`paymentStatus: Paid`).
5. **Pending**: Consultation appears in the Doctor's Pending Reviews queue.
6. **Accepted**: Doctor accepts the case.
7. **In Consultation**: Doctor opens the diagnostic workspace, inspects the scan, and chats in real time.
8. **Completed**: Doctor provides the Final Diagnosis and Treatment Plan to conclude the session and generate a printable PDF prescription.

---

## ✨ Features

### Patient Portal
- **AI Scanning**: Upload dental images for instant deep-learning diagnosis across 6 disease classes.
- **My Reports**: Access historical AI diagnostic reports and algorithmic confidence scores.
- **Find Doctors**: Browse a directory of verified dental specialists and book appointments.
- **Secure Payments**: Encrypted simulated checkout gateway for consultation fees.
- **Real-Time Chat**: Communicate directly with assigned doctors via WebSockets.
- **Consultation Tracking**: Monitor the lifecycle of cases from `Pending` to `Completed`.

### Doctor Portal
- **Pending Reviews**: Accept or decline new incoming patient consultation requests.
- **Active Consultations**: Manage ongoing cases (`Accepted` / `In Consultation`).
- **Diagnostic Workspace**: View the patient's uploaded images, AI predictions, and primary complaints.
- **Clinical Verification**: Override or confirm AI results by submitting a Final Diagnosis and Treatment Plan.
- **Real-Time Chat**: Message patients seamlessly for follow-up questions.
- **E-Prescription Builder**: Issue structured digital prescriptions with medications, dosage, and verification signatures.

---

## 🏗️ Project Architecture & Technologies

DentaAI utilizes a microservices-inspired architecture, separating the heavy AI inference layer from the primary transactional backend:

- **Frontend (Client UI)**: React 19 (Vite), Framer Motion, Vanilla CSS (Glassmorphism UI)
- **Primary Backend (API Layer)**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **AI Inference Engine**: Python, Flask, TensorFlow/Keras (MobileNetV2 served via REST API)
- **Real-Time Messaging**: WebSockets (Socket.IO)

---

## 🌐 Production Deployment & Publishing Guide

DentaAI is pre-configured for automated cloud deployment: **Frontend on Vercel**, **Backend & AI on Render**, and **Database on MongoDB Atlas**.

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Configure full-stack deployment"
git push origin main
```

### Step 2: Set Up Free Cloud Database (MongoDB Atlas)
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a **Free (M0)** cluster.
2. Under **Network Access**, add `0.0.0.0/0` (Allow access from anywhere).
3. Under **Database Access**, create a user and password.
4. Copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dental_ai?retryWrites=true&w=majority
   ```

### Step 3: Deploy Backend & AI Service (Render.com)
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New + > Blueprint**.
2. Connect your `dental-ai-system` repository.
3. Render reads `render.yaml` and auto-provisions both services:
   - `dentaai-backend` (Node.js API)
   - `dentaai-ai-service` (Python AI Engine)
4. When prompted, paste your `MONGODB_URI` from Step 2 and click **Apply**.
5. Copy your live backend URL (e.g. `https://dentaai-backend.onrender.com`).

### Step 4: Deploy Frontend (Vercel.com)
1. Go to [vercel.com](https://vercel.com) and click **Add New... > Project**.
2. Import your `dental-ai-system` repository.
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite` (detected automatically)
4. Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Render backend URL (e.g. `https://dentaai-backend.onrender.com`)
5. Click **Deploy**.

*Final Touch*: In Render under `dentaai-backend` settings, set `CORS_ORIGINS` to your live Vercel URL (e.g. `https://dental-ai-system.vercel.app`).

---

## 🛠️ Manual Multi-Terminal Setup (Local Development)

If you prefer running services in separate terminal windows instead of the universal runner:

### 1. Backend (Node.js)
```bash
cd backend
npm install
npm start
```
*API runs on `http://localhost:5000`.*

### 2. AI Inference Engine (Python)
```bash
cd ai_model
pip install -r requirements.txt
python app.py
```
*AI service runs on `http://127.0.0.1:5002`.*

### 3. Frontend (React / Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🔐 Local Demo Accounts

To test the doctor and admin features immediately without registering:

* **Demo Doctor**: `priya.menon@dentaai.com` | Password: `DoctorPassword123!`
* **Demo Admin**: `admin@dentaai.com` | Password: `AdminPassword123!`
* **Patient**: Self-register directly via the UI `/register` screen.

To re-seed test accounts locally:
```bash
cd backend
node seedDoctor.js
node seedAdmin.js
```

---

## 📄 Academic Documentation & Presentations

Pre-formatted LaTeX documents ready for Overleaf are included in the repository:

* 📑 **Project Report**: [`Documents/dentaai_report.tex`](Documents/dentaai_report.tex) — Comprehensive technical report covering system architecture, MobileNetV2 mathematical formulation, database schema, and security hardening.
* 📊 **2nd Review Presentation**: [`Documents/dentaai_presentation.tex`](Documents/dentaai_presentation.tex) — Strictly 12-slide LaTeX Beamer presentation following departmental review guidelines (Title, SDS, Model/Methodology, and Performance Metrics).

---

## 📝 License & Academic Integrity
Developed as a Master of Computer Applications (MCA) final year project. UI design features modern glassmorphism, dynamic micro-animations, and responsive layouts.
