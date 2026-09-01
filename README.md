# DentaAI: AI-Based Dental Disease Detection & Health Management System

**DentaAI** is a comprehensive, end-to-end digital healthcare platform designed to automate dental disease detection using Artificial Intelligence and facilitate seamless patient-doctor consultations. Built as an MCA Final Year Project, it leverages modern web technologies and deep learning to deliver real-time diagnostic insights and secure clinical workflows.

---

## 🚀 Project Overview

DentaAI bridges the gap between automated medical imaging analysis and professional clinical consultation. Patients can upload intraoral scans which are analyzed by a custom-trained Deep Learning model. The AI returns a localized prediction (e.g., caries, gingivitis, healthy) along with a confidence score. Patients can then securely share this AI report and book a consultation with a specialist directly through the platform.

### Key Workflows
**The Full Consultation Lifecycle:**
1. **AI Scan**: Patient uploads a dental image.
2. **Report**: Python/Flask AI service generates a diagnostic prediction.
3. **Consult Specialist**: Patient selects a doctor and attaches the AI report.
4. **Payment Confirmed**: Patient completes the secure simulated checkout (`paymentStatus: Paid`).
5. **Pending**: Consultation appears in the Doctor's Pending Reviews queue.
6. **Accepted**: Doctor accepts the case.
7. **In Consultation**: Doctor opens the diagnostic workspace and real-time chat.
8. **Completed**: Doctor provides the Final Diagnosis and Treatment Plan to conclude the session.

---

## ✨ Features

### Patient Portal
- **AI Scanning**: Upload dental X-rays/images for instant deep-learning diagnosis.
- **My Reports**: Access historical AI diagnostic reports and algorithmic confidence scores.
- **Find Doctors**: Browse a directory of verified dental specialists and book appointments.
- **Secure Payments**: Encrypted simulated checkout gateway for consultation fees.
- **Real-Time Chat**: Communicate directly with assigned doctors in a secure environment.
- **Consultation Tracking**: Monitor the lifecycle of cases from `Pending` to `Completed`.

### Doctor Portal
- **Pending Reviews**: Accept or decline new incoming patient consultation requests.
- **Active Consultations**: Manage ongoing cases (`Accepted` / `In Consultation`).
- **Diagnostic Workspace**: View the patient's uploaded images, AI prediction, and primary complaints in a dedicated clinical dashboard.
- **Clinical Verification**: Override or confirm AI results by submitting a Final Diagnosis and Treatment Plan.
- **Real-Time Chat**: Message patients seamlessly for follow-up questions.

---

## 🏗️ Project Architecture & Technologies

DentaAI utilizes a microservices-inspired architecture, separating the heavy AI inference layer from the primary transactional backend.

- **Frontend (Client UI)**: React.js (Vite), Framer Motion, Vanilla CSS (Glassmorphism UI)
- **Primary Backend (API Layer)**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **AI Inference Engine**: Python, Flask, TensorFlow/Keras (Model served via REST API)
- **Real-Time Messaging**: Polling / Socket implementation in React/Express.

---

## ⚙️ Installation & Setup Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (Running locally on `mongodb://127.0.0.1:27017`)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/dental-ai-system.git
cd dental-ai-system
```

### 2. Setup the Node/Express Backend
```bash
cd backend
npm install
```
**Environment Configuration (`backend/.env`):**
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/dental_ai
JWT_SECRET=your_super_secret_key
FLASK_API_URL=http://127.0.0.1:5001
```
**Start the Node Server:**
```bash
npm start
# or 
node server.js
```
*The API will run on `http://localhost:5000`.*

### 3. Setup the Python/Flask AI Service
Open a new terminal window:
```bash
cd backend
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```
**Start the Flask Server:**
```bash
python app.py
```
*The AI engine will run on `http://localhost:5001`.*

### 4. Setup the React Frontend
Open a third terminal window:
```bash
cd frontend
npm install
```
**Start the React Development Server:**
```bash
npm run dev
```
*The frontend will be accessible at `http://localhost:5173`.*

---

## 🔐 Local Demo Accounts

To explore the doctor features without registering a new specialist, a seed script automatically provisions a test doctor account.

**Test Doctor:**
- **Name**: Dr. Priya Menon
- **Email**: `priya.menon@dentaai.com`
- **Password**: `password123`
- **Role**: Doctor

---

## 📝 License & Academic Integrity
This project was developed as a Master of Computer Applications (MCA) final year project. 

*UI Design prioritizes premium aesthetics, featuring modern glassmorphism, dynamic micro-animations, and responsive layouts.*
