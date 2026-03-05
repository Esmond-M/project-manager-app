# Project Manager App

A lightweight project and task management tool. Track what you're working on, break it into tasks, and keep an eye on progress — without the bloat of tools like Jira or Asana.

## Tech Stack

- **Frontend:** React 18, Vite 5, React Router 6
- **Backend:** Node.js, Express
- **Database:** SQLite (via better-sqlite3)
- **Auth:** JWT + bcryptjs

## Features

- Register and log in — each account is isolated, no data bleed between users
- Create projects with status (active / on-hold / completed), priority, and due date
- Add tasks per project and move them through open → in-progress → done
- Dashboard overview with live stats and progress tracking
- Clean dark UI, no external component library

## Running Locally

### Backend
```bash
cd server
copy .env.example .env   # then set your own JWT_SECRET
node index.js
```

### Frontend
```bash
cd client
npm run dev
```

API: `http://localhost:5000`  
App: `http://localhost:5173`

## Notes

- The database file (`server/projects.db`) is created automatically on first run — no setup needed
- `.env` is gitignored; never commit real secrets
- To reset all data, delete `projects.db` and restart the server
