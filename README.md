# Project Manager App

A full-stack SaaS-style project management app built for portfolio use and day-to-day tracking.

## Stack

- **Frontend:** React 18, Vite 5, React Router 6
- **Backend:** Node.js, Express
- **Database:** SQLite (via better-sqlite3)
- **Auth:** JWT + bcryptjs

## Features

- User registration & login (JWT auth)
- Create, edit, delete projects with status tracking
- Add tasks to projects (open / in-progress / done)
- Dashboard with project overview
- Role-aware data (each user sees only their own projects)

## Getting Started

### 1. Server
```bash
cd server
cp .env.example .env     # fill in JWT_SECRET
node index.js
```

### 2. Client
```bash
cd client
npm run dev
```

Server runs on `http://localhost:5000`  
Client runs on `http://localhost:5173`
