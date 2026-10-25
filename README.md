# SAMARTH — Skills Deserve Opportunity

## Good work deserves to be seen, valued, and trusted.

SAMARTH brings customers and skilled local professionals together through transparent service quotes, skill-based matching, and opportunities to build lasting trust.

---

## 🌟 Core Value Proposition

- **Transparent Pricing & Quotes**: Workers submit itemized quotes (Labour + Materials + Travel = Locked Total) with zero hidden fees.
- **Explainable Fair Matching**: A rule-based engine evaluates candidate workers based on Skill Fit (35%), Proximity (25%), Availability (20%), and Budget Fit (20%) with transparent scoring reasons.
- **Verified Skilled Craftspeople**: Manual administrative verification workflow with government ID and trade experience review.
- **End-to-End Booking Lifecycle**:
  `REQUESTED / OPEN` → `QUOTE SUBMITTED` → `QUOTE APPROVED / BOOKING CONFIRMED` → `IN PROGRESS` → `COMPLETED` → `VERIFIED REVIEW`.

---

## ⚡ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React Icons |
| **Backend** | Python 3.12, Django 6.0, Django REST Framework |
| **Database** | SQLite with normalized relational schema |
| **Authentication** | Django Token-based Authentication & Session Auth |
| **Design Tokens** | Primary Deep Teal (`#116B63`), Dark Teal (`#0B4945`), Soft Mint (`#EAF5F1`), Surface White (`#FFFFFF`), Text (`#172B2A`) |

---

## 🔑 Demo Accounts & Evaluator Credentials

The application includes an **MVP Evaluator Bar** directly on top of every page for 1-click instant role switching. Alternatively, log in using these pre-seeded accounts:

| Role | Username / Email | Password | Primary Details |
|---|---|---|---|
| **Customer** | `customer_rohan` / `customer@samarth.in` | `customer123` | Rohan Sharma, Koramangala 5th Block |
| **Customer** | `customer_priya` / `priya@example.com` | `customer123` | Priya Patel, Indiranagar |
| **Worker (Electrician)** | `worker_ramesh` / `worker.electrician@samarth.in` | `worker123` | Ramesh Kumar, Senior Certified Electrician (Verified Pro) |
| **Worker (Plumber)** | `worker_suresh` / `worker.plumber@samarth.in` | `worker123` | Suresh Patel, Master Sanitary Plumber (Verified Pro) |
| **Worker (Carpenter)** | `worker_manoj` / `worker.carpenter@samarth.in` | `worker123` | Manoj Verma, Custom Woodwork Artisan (Verified Pro) |
| **Worker (Appliance Tech)** | `worker_amit` / `worker.appliance@samarth.in` | `worker123` | Amit Singh, AC & Refrigeration Specialist (Verified Pro) |
| **Worker (Pending)** | `worker_dinesh` / `dinesh@samarth.in` | `worker123` | Dinesh Yadav, Wireman (Awaiting Admin Verification) |
| **Platform Admin** | `admin` / `admin@samarth.in` | `admin123` | SAMARTH Admin Control Officer |

---

## 🚀 5-Step MVP Tour Walkthrough

1. **Step 1: Explore & Post Request**
   - Click **Customer (Rohan)** in the top demo bar.
   - Click **Post Service Request** or view the pre-seeded open request (*"Main Kitchen MCB Tripping Under Load"*).
   - Click **View Matches** to see candidates ranked by the Fair Matching Algorithm.
   - Click *"Why this match score?"* on Ramesh Kumar to inspect the factor breakdown (Skill 35%, Proximity 25%, Availability 20%, Budget 20%).

2. **Step 2: Submit Itemized Quote**
   - Click **Electrician (Ramesh)** in the top demo bar.
   - Notice the incoming request matching Ramesh's electrical trade in Koramangala.
   - Click **Submit Itemized Quote** and select a 1-click preset (e.g. *Standard Fix ₹500* or *With Spares ₹900*).

3. **Step 3: Approve Quote & Confirm Booking**
   - Switch back to **Customer (Rohan)**.
   - Open matches for the request, observe the submitted quote card with itemized breakdown.
   - Click **Approve Quote & Confirm Booking**. The booking transitions to `CONFIRMED`.

4. **Step 4: Execute & Complete Service**
   - Switch to **Electrician (Ramesh)**.
   - Under *Active Jobs*, click **Start Work** (`IN_PROGRESS`), then **Mark Finished** (`COMPLETED`).
   - Notice the worker's *Total Real Earnings* metric updates live from database records!

5. **Step 5: Verified Review & Admin Oversight**
   - Switch to **Customer (Rohan)**. Leave a 5-star rating & feedback.
   - Switch to **Admin Officer**. Inspect platform gross volume and review pending worker **Dinesh Yadav** in the *Verification Queue*, then click **Approve Verification**!

---

## 💻 Local Setup & Development

### 1. Backend Setup (Django & DRF)
```bash
cd backend
# Apply migrations
cd backend

# Seed complete demonstration data
python manage.py seed_data

# Run automated tests
python manage.py test api

# Launch development server (default port 8000)
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend Setup (React & Vite)
```bash
cd frontend
# Install dependencies
npm install

# Build production bundle
npm run build

# Launch development server (default port 5173)
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## ☁️ Deploy to Vercel and Render

The frontend is deployed to Vercel and the Django API plus PostgreSQL database
to Render. The root `render.yaml` defines the backend web service and database.

### 1. Deploy the backend on Render

1. Push this repository to GitHub and create a new **Blueprint** in Render using
   the repository. Render reads `render.yaml` and creates the API service and
   PostgreSQL database.
2. When prompted for `CORS_ALLOWED_ORIGINS`, enter the full Vercel site origin,
   such as `https://your-project.vercel.app` (no trailing slash). Add any
   additional Vercel/custom domains as comma-separated origins.
3. After deployment, copy the API URL, for example
   `https://samarth-api.onrender.com`.

Render installs `backend/requirements.txt`, collects static files, and runs
database migrations before starting the web service. The database URL, secret
key, allowed hosts, and production debug setting are configured by the
Blueprint. Do not run `seed_data` on a production database; it resets the
passwords of demo accounts. To create a production administrator, open the
Render service shell and run `python manage.py createsuperuser`.

### 2. Deploy the frontend on Vercel

1. Import the same GitHub repository into Vercel and set **Root Directory** to
   `frontend`. Vercel uses `frontend/vercel.json` to serve the React app on
   direct route visits.
2. Add the environment variable `VITE_API_BASE_URL` with the full API base URL,
   for example `https://samarth-api.onrender.com/api`.
3. Deploy or redeploy the frontend after setting the variable.
4. If the Vercel domain changes, update the Render service's
   `CORS_ALLOWED_ORIGINS` environment variable and redeploy/restart the API.

For local development, `VITE_API_BASE_URL` can remain unset; the app keeps its
local API URL and Vite development proxy.

---

## 📐 Icon & Accessibility Standards

- All icons use standard **Lucide React** stroke weights and sizing (14–16px inline badges, 18–20px inputs/buttons, 20–24px navigation).
- Icons strictly use `shrink-0` and Flexbox `inline-flex items-center gap-2` centering (no emoji substitutions or manual whitespace).
- Accessible `aria-label` tags and visible focus states on all interactive controls.
