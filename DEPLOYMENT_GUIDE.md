# 🚀 SAMARTH Deployment Guide: Render (Backend) & Vercel (Frontend)

This guide walks you through deploying the **SAMARTH** platform with:
- **Backend**: Django REST Framework + Gunicorn + PostgreSQL on [Render](https://render.com)
- **Frontend**: React + Vite + Tailwind CSS on [Vercel](https://vercel.com)

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Step 1: Push Code to GitHub](#step-1-push-code-to-github)
3. [Step 2: Deploy Backend on Render](#step-2-deploy-backend-on-render)
4. [Step 3: Deploy Frontend on Vercel](#step-3-deploy-frontend-on-vercel)
5. [Step 4: Final Connection (CORS & Verification)](#step-4-final-connection-cors--verification)
6. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## 1. Prerequisites
- A GitHub repository containing this project.
- A free [Render account](https://render.com).
- A free [Vercel account](https://vercel.com).

---

## Step 1: Push Code to GitHub

Make sure all your changes are committed and pushed to your remote GitHub repository:

```bash
git add .
git commit -m "Configure initial setup for Render backend and Vercel frontend deployment"
git push origin main
```

---

## Step 2: Deploy Backend on Render

You can deploy on Render using either **Option A (Render Blueprint - Recommended)** or **Option B (Manual Web Service)**.

### Option A: Render Blueprint (`render.yaml`) — Recommended 🌟

1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** (top right) → **Blueprint**.
3. Connect your GitHub repository.
4. Render will detect `render.yaml` and show:
   - A free **PostgreSQL Database** (`samarth-database`)
   - A free **Python Web Service** (`samarth-api`)
5. Click **Apply**.
6. Render will automatically:
   - Provision the database
   - Inject the `DATABASE_URL`
   - Run `bash ./build.sh` (installs dependencies, runs migrations, and collects static files)
   - Start the service with Gunicorn on `$PORT`
7. Once deployed, note your backend URL (e.g., `https://samarth-api.onrender.com`).
8. Test the health check endpoint in your browser:
   ```
   https://samarth-api.onrender.com/api/health/
   ```
   You should see: `{"status": "healthy", "service": "samarth-api", ...}`

---

### Option B: Manual Web Service Setup on Render

If you prefer to configure manually:

1. **Create PostgreSQL Database**:
   - In Render Dashboard: Click **New +** → **PostgreSQL**.
   - Name: `samarth-db`
   - Plan: **Free**
   - Click **Create Database** and copy the **Internal Database URL** (or External if needed).

2. **Create Web Service**:
   - Click **New +** → **Web Service**.
   - Connect your GitHub repository.
   - Configure the following settings:
     | Field | Value |
     |---|---|
     | **Name** | `samarth-api` |
     | **Region** | Choose nearest (e.g. Frankfurt, Singapore, Oregon) |
     | **Branch** | `main` |
     | **Root Directory** | `backend` |
     | **Runtime** | `Python 3` |
     | **Build Command** | `bash ./build.sh` |
     | **Start Command** | `gunicorn samarth_project.wsgi:application --bind 0.0.0.0:$PORT` |
     | **Plan** | **Free** |

3. **Add Environment Variables**:
   Under the **Environment Variables** section, add:
   | Key | Value | Notes |
   |---|---|---|
   | `PYTHON_VERSION` | `3.12.8` | Ensures Python 3.12 is used |
   | `DJANGO_DEBUG` | `false` | Production mode |
   | `DJANGO_SECRET_KEY` | *(Click Generate or paste random 50-char string)* | Keep secret |
   | `DJANGO_ALLOWED_HOSTS` | `.onrender.com,localhost,127.0.0.1` | Allows Render URLs |
   | `DATABASE_URL` | *(Paste PostgreSQL connection string from step 1)* | From Render DB |
   | `AUTO_SEED_DATA` | `true` | Seeds initial categories, skills, and demo users |
   | `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | You will add your Vercel URL here in Step 4 |

4. Click **Create Web Service**.

---

### Optional: Seeding Data on Render via Shell
If you did not set `AUTO_SEED_DATA=true`, you can seed data at any time via the Render Shell:
1. Go to your Web Service in Render → Click **Shell** in the left sidebar.
2. Run:
   ```bash
   python manage.py seed_data
   ```
3. To create a custom superuser:
   ```bash
   python manage.py createsuperuser
   ```

---

## Step 3: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`Vecnaverse`).
4. In the **Configure Project** screen:
   - **Project Name**: `samarth-frontend` (or your preferred name)
   - **Framework Preset**: **Vite** (detected automatically)
   - **Root Directory**: Click **Edit** and select **`frontend`** ⚠️ *(CRITICAL!)*
5. **Environment Variables**:
   - Expand the **Environment Variables** section.
   - Add:
     - **Name**: `VITE_API_BASE_URL`
     - **Value**: `https://<YOUR-RENDER-API-NAME>.onrender.com/api`
       *(Example: `https://samarth-api.onrender.com/api`)*
6. Click **Deploy**.
7. In about 30–60 seconds, your frontend will be live at `https://<your-project>.vercel.app`!

---

## Step 4: Final Connection (CORS & Verification)

### 1. Update Backend CORS Origin on Render
1. Go to your Render Dashboard → Select your `samarth-api` Web Service.
2. Go to **Environment**.
3. Update `CORS_ALLOWED_ORIGINS` to include your new Vercel domain:
   ```env
   CORS_ALLOWED_ORIGINS=https://samarth-frontend.vercel.app,http://localhost:5173
   ```
   *(Note: The backend also has built-in regex matching `https://*.vercel.app`, so preview branches and deployments work automatically!)*
4. Render will automatically redeploy with the updated environment variables.

### 2. Verify Your Deployment
1. Open your live Vercel URL in your browser.
2. You can switch between demo accounts using the top evaluator bar:
   - **Customer**: `customer_rohan` / `customer123`
   - **Electrician**: `worker_ramesh` / `worker123`
   - **Plumber**: `worker_suresh` / `worker123`
   - **Admin**: `admin` / `admin123`
3. Try posting a service request or viewing matches to ensure real-time communication with the Render backend.

---

## 🛠️ Summary of Configuration Files Added/Updated

| File | Purpose |
|---|---|
| [`render.yaml`](file:///render.yaml) | Blueprint defining the Render Python web service, PostgreSQL database, health checks, and build steps |
| [`backend/build.sh`](file:///backend/build.sh) | Production build script for Render (pip install, collectstatic, migrate, optional seed) |
| [`backend/Procfile`](file:///backend/Procfile) | Declares Gunicorn start command for Render / containerized runners |
| [`backend/runtime.txt`](file:///backend/runtime.txt) | Explicitly specifies Python 3.12.8 runtime for Render |
| [`backend/samarth_project/settings.py`](file:///backend/samarth_project/settings.py) | Dynamic `ALLOWED_HOSTS`, automated Vercel `CORS_ALLOWED_ORIGIN_REGEXES`, `CSRF_TRUSTED_ORIGINS`, and WhiteNoise static files |
| [`backend/api/views.py`](file:///backend/api/views.py) & [`backend/api/urls.py`](file:///backend/api/urls.py) | Added `/api/health/` and `/healthz` endpoints for instant zero-DB ping verification |
| [`backend/.env.example`](file:///backend/.env.example) | Documentation of all backend environment variables |
| [`frontend/vercel.json`](file:///frontend/vercel.json) | Vercel SPA client-side routing rewrites and static asset caching |
| [`frontend/src/api/client.js`](file:///frontend/src/api/client.js) | Resilient `BASE_URL` normalization for `VITE_API_BASE_URL` with or without trailing `/api` |
| [`frontend/.env.example`](file:///frontend/.env.example) | Template for frontend Vercel environment variables |
| [`.gitignore`](file:///.gitignore) | Clean root `.gitignore` ignoring virtualenvs, pycache, build artifacts, and SQLite DB |

---

## ❓ Troubleshooting & FAQs

### Q: Why do API requests show "Network Error" or CORS issues?
- Ensure `VITE_API_BASE_URL` is set in Vercel project settings and ends with (or points to) your Render service.
- Verify that your Render backend is awake. On Render's free tier, inactive services sleep after 15 minutes of inactivity; the first request may take 30–50 seconds to spin up.

### Q: Why do page reloads on routes (like `/workers` or `/dashboard`) return 404?
- This is solved by [`frontend/vercel.json`](file:///frontend/vercel.json) which rewrites all route requests to `/index.html` for single-page app (SPA) routing. Make sure the Root Directory on Vercel is set to `frontend`.

### Q: How do I seed fresh demo data on Render?
- Either set `AUTO_SEED_DATA=true` in Render Web Service environment variables and redeploy, or open the **Render Web Shell** and run `python manage.py seed_data`.
