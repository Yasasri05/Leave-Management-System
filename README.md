# Leave Management System

A complete full-stack **Leave Management System** built with **Node.js, Express.js, MongoDB & React.js** on the backend and plain **HTML/CSS/JavaScript** on the frontend.

## ✨ Features

### Employee
- Register / Login (JWT authentication)
- Dashboard with leave statistics & leave balance
- Apply for Leave (Employee ID, Name, Leave Type, Start/End Date, Reason)
- AI Leave Type Suggestion as you type the reason
- AI Auto-Approval for 1–2 day leave requests
- View leave history & status (Pending / Approved / Rejected)
- Cancel a still-pending leave request

### Admin / Manager
- Admin login (same login page, role-based redirect)
- View all leave requests
- Search & filter by employee, leave type, status, date range
- Approve / Reject / Delete leave requests
- Dashboard stats: Total Employees, Total Leaves, Approved, Rejected, Pending
- Monthly leave report API (`/api/admin/report/monthly`)

### AI Features (rule-based, fully offline — no API key required)
- **Leave Type Suggestion** — e.g. "I have fever and need rest" → suggests **Sick**
- **Reason Summarization** — long reasons are shortened automatically
- **Auto-Approval Rule** — 1–2 day leave requests are instantly approved

### Worker Threads
- Whenever a leave is approved/rejected, a **Node.js `worker_threads`** worker
  spins up in the background to simulate sending an email notification.
  The main Express server stays fully responsive while this happens —
  see `workers/notificationWorker.js` and `utils/runNotificationWorker.js`.

## 🗂 Folder Structure

```
/project
 ├── models          # Mongoose schemas (Employee, Leave)
 ├── controllers      # Route handler logic (auth, leave, admin)
 ├── routes           # Express route definitions
 ├── middleware       # JWT auth, role guard, error handler
 ├── workers          # Worker thread script for notifications
 ├── utils            # AI helper + worker runner
 ├── config           # MongoDB connection
 ├── public           # CSS & client-side JS
 ├── views            # HTML pages (login, dashboards, forms)
 ├── seed.js          # Sample data seeder
 ├── server.js        # App entry point
 └── package.json
```

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` and edit if needed:
```bash
cp .env.example .env
```

### 4. Seed sample data (optional but recommended for demo)
```bash
npm run seed
```
This creates:
- **Admin:** `admin@company.com` / `Admin@123`
- **Employee:** `yasasri@company.com` / `Pass@123` (+ 3 more sample employees)
- 5 sample leave requests in different statuses

### 5. Run the server
```bash
npm start
# or for auto-restart during development:
npm run dev
```

Visit **http://localhost:5000**

## 🔌 API Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register employee/admin |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/profile` | Private | Get logged-in user |
| POST | `/api/leaves` | Employee | Apply for leave |
| GET | `/api/leaves/my` | Employee | Get own leave history + stats |
| DELETE | `/api/leaves/:id/cancel` | Employee | Cancel a pending leave |
| POST | `/api/leaves/ai/suggest-type` | Employee | AI leave type suggestion |
| GET | `/api/admin/leaves` | Admin | All leaves (supports query filters) |
| PUT | `/api/admin/leaves/:id/approve` | Admin | Approve a leave |
| PUT | `/api/admin/leaves/:id/reject` | Admin | Reject a leave |
| DELETE | `/api/admin/leaves/:id` | Admin | Delete a leave |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| GET | `/api/admin/employees` | Admin | List of all employees |
| GET | `/api/admin/report/monthly` | Admin | Monthly leave report |

## 🎓 Notes for Viva / Presentation
- **MVC Architecture**: `models/` → `controllers/` → `routes/`, kept cleanly separated.
- **JWT Authentication**: `middleware/auth.js` (`protect` + `adminOnly`).
- **Worker Threads**: demonstrated live by approving/rejecting a leave and watching the server console log the background notification.
- **AI Features**: implemented via keyword/heuristic matching in `utils/aiHelper.js` — no external API needed, runs fully offline, easy to explain in a viva.
- **Error Handling Middleware**: centralized in `middleware/errorHandler.js`.
