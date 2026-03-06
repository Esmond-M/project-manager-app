# Project Manager App

A lightweight project and task management tool. Track what you're working on, break it into tasks, and keep an eye on progress — without the bloat of tools like Jira or Asana.

**Live demo:** [esmondmccain.com/project-manager-app](https://esmondmccain.com/project-manager-app/) — use the "Try Demo" button to explore without registering.

## Tech Stack

- **Frontend:** React 18, Vite 5, React Router 6 (HashRouter)
- **Backend:** Node.js, Express 5
- **Database:** SQLite (via better-sqlite3)
- **Auth:** JWT + bcryptjs

## Features

- Register and log in — each account is isolated, no data bleed between users
- Create projects with status (active / on-hold / completed), priority, and due date
- Add tasks per project and move them through open → in-progress → done
- Drag-and-drop task reordering — order persists server-side
- Overdue project highlight — badge and banner when the due date has passed
- Dashboard overview with live stats and progress tracking
- Demo account — explore a pre-seeded workspace without registering
- Clean dark UI, no external component library

## Running Locally

### Backend
```bash
cd server
copy .env.example .env   # then set your own JWT_SECRET
npm install
node index.js
```

### Frontend
```bash
cd client
npm install
npm run dev
```

API: `http://localhost:5000`  
App: `http://localhost:5173`

## Deployment

The backend runs on [Render](https://render.com) (free tier — cold starts after 15 min of inactivity).  
The frontend is built with `npm run build` and served as a static site embedded in a WordPress theme.

## Notes

- The database file (`server/projects.db`) is created automatically on first run — no setup needed
- Demo data (`demo@example.com`) is seeded automatically on first server start
- `.env` is gitignored; never commit real secrets
- To reset all data, delete `projects.db` and restart the server
