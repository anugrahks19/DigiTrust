# Deployment Guide

This guide outlines how to host the **DigiTrust-AVP** platform using free-tier friendly services.

## Architecture Overview

- **Backend**: Python FastAPI (Host on **Render** or **Railway**)
- **Frontend**: Static HTML/JS (Host on **Vercel** or **Netlify**)
- **Database**: SQLite (built-in) or PostgreSQL (for production persistence)

---

## Part 1: Backend Deployment (Render)

We recommend **Render** for the backend as it supports Python/FastAPI out of the box.

### Prerequisites
1. Push your code to a **GitHub repository**.
2. Sign up at [render.com](https://render.com).

### Steps
1. **Create Web Service**:
   - Dashboard → New + → Web Service
   - Connect your GitHub repo.

2. **Configure Settings**:
   - **Name**: `digitrust-backend`
   - **Root Directory**: `backend` (Important: Point to the backend folder)
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`

3. **Environment Variables**:
   - Scroll down to "Environment Variables"
   - Add keys from your `.env` file (if any).
   - *Note*: The default SQLite database will work but data resets on redeploys. For permanent data, add a `DATABASE_URL` pointing to a PostgreSQL instance.

4. **Deploy**:
   - Click "Create Web Service".
   - Once live, copy your backend URL (e.g., `https://digitrust-backend.onrender.com`).

### ⚡ Pro Tip: Keeping Render Awake (24/7 Hack)
Render's free tier sleeps after 15 minutes of inactivity. To keep it 24/7:
1. Sign up for a free account at **[UptimeRobot](https://uptimerobot.com)** or **[cron-job.org](https://cron-job.org)**.
2. Create a new HTTP monitor/job.
3. URL: `https://your-app-name.onrender.com/health` (Use your specific URL).
4. Interval: Every **14 minutes**.
5. This sends a "ping" to your server, resetting the inactivity timer so it never sleeps.

---

## Part 2: Alternative 24/7 Backend (AWS EC2 Free Tier)

If you want a professional server that never sleeps (and have a credit card for verification):

1. **Launch Instance**:
   - Log in to AWS Console → EC2 → Launch Instance.
   - Name: `DigiTrust-Server`.
   - AMI: **Ubuntu Server 24.04 LTS** (Free Tier Eligible).
   - Instance Type: **t2.micro** or **t3.micro** (Free Tier Eligible).
   - Key Pair: Create a new one and download the `.pem` file.

2. **Security Group**:
   - Allow SSH (Port 22), HTTP (Port 80), and Custom TCP (Port 8000).

3. **Deploy Code**:
   - SSH into your instance: `ssh -i key.pem ubuntu@your-ec2-ip`
   - Clone repo: `git clone https://github.com/your/repo.git`
   - Install Python/Pip: `sudo apt update && sudo apt install python3-pip`
   - Run: `cd repo/backend && pip install -r requirements.txt`
   - Run in background: `nohup uvicorn main:app --host 0.0.0.0 --port 8000 &`

---

## Part 3: Frontend Deployment (Vercel)

We recommend **Vercel** for high-performance static hosting.

### Steps
1. **Import Project**:
   - Go to [vercel.com](https://vercel.com) → "Add New..." → Project.
   - Import your GitHub repository.

2. **Configure Project**:
   - **Framework Preset**: select "Other" (since it's vanilla JS).
   - **Root Directory**: Edit this to `frontend`.

3. **Connect to Backend**:
   - You need to tell the frontend where the backend lives.
   - Open `frontend/js/app.js` (or your api config file) in your code.
   - Update the API base URL:
     ```javascript
     // Change localhost to your Render URL
     const API_BASE_URL = "https://digitrust-backend.onrender.com/api"; 
     ```
   - *Tip*:Ideally, use a configuration file so you can switch between localhost and production easily.

4. **Deploy**:
   - Click "Deploy".
   - Vercel will give you a live URL (e.g., `https://digitrust-avp.vercel.app`).

---

## Part 4: Final Checks

1. **CORS Configuration**:
   - Ensure your Backend allows the Frontend URL.
   - In `backend/main.py`:
     ```python
     app.add_middleware(
         CORSMiddleware,
         allow_origins=["https://digitrust-avp.vercel.app"], # Your Vercel URL
         ...
     )
     ```

2. **Test It**:
   - Open your Vercel URL.
   - Try validating an address.
   - Check the Network tab to ensure requests are hitting the Render backend, not localhost.
