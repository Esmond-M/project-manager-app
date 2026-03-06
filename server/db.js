const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'projects.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables on first run
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    email     TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL,
    role      TEXT    NOT NULL DEFAULT 'user',
    created_at TEXT   NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    description TEXT,
    status      TEXT    NOT NULL DEFAULT 'active',
    priority    TEXT    NOT NULL DEFAULT 'medium',
    due_date    TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'open',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// Add sort_order column if it doesn't exist yet (safe migration)
try {
  db.exec('ALTER TABLE tasks ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0');
  // Backfill existing rows so order matches insertion order
  db.exec(`
    UPDATE tasks SET sort_order = (
      SELECT COUNT(*) FROM tasks t2
      WHERE t2.project_id = tasks.project_id AND t2.id <= tasks.id
    ) - 1
  `);
} catch (e) {
  // Column already exists — ignore
}

// Seed demo account + sample data if not already present
const seedDemo = db.transaction(() => {
  const existing = db.prepare("SELECT id FROM users WHERE email = 'demo@example.com'").get();
  if (existing) return;

  const hash = bcrypt.hashSync('demo1234', 10);
  const { lastInsertRowid: userId } = db.prepare(
    "INSERT INTO users (name, email, password, role) VALUES ('Demo User', 'demo@example.com', ?, 'demo')"
  ).run(hash);

  const insertProject = db.prepare(
    'INSERT INTO projects (user_id, title, description, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertTask = db.prepare(
    'INSERT INTO tasks (project_id, title, status) VALUES (?, ?, ?)'
  );

  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  const daysFrom = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

  const p1 = insertProject.run(userId, 'Website Redesign', 'Redesign the company website with a modern look and improved performance.', 'active', 'high', daysFrom(14));
  insertTask.run(p1.lastInsertRowid, 'Gather design references', 'done');
  insertTask.run(p1.lastInsertRowid, 'Create wireframes', 'done');
  insertTask.run(p1.lastInsertRowid, 'Build homepage layout', 'open');
  insertTask.run(p1.lastInsertRowid, 'Mobile responsiveness pass', 'open');
  insertTask.run(p1.lastInsertRowid, 'Cross-browser testing', 'open');

  const p2 = insertProject.run(userId, 'API Integration', 'Connect third-party payment gateway and sync order data with internal CRM.', 'active', 'high', daysFrom(7));
  insertTask.run(p2.lastInsertRowid, 'Read payment gateway docs', 'done');
  insertTask.run(p2.lastInsertRowid, 'Set up sandbox credentials', 'done');
  insertTask.run(p2.lastInsertRowid, 'Implement checkout endpoint', 'open');
  insertTask.run(p2.lastInsertRowid, 'CRM sync webhook', 'open');

  const p3 = insertProject.run(userId, 'Client Onboarding Docs', 'Write onboarding documentation and video walk-through scripts for new clients.', 'on-hold', 'low', daysFrom(30));
  insertTask.run(p3.lastInsertRowid, 'Outline doc structure', 'done');
  insertTask.run(p3.lastInsertRowid, 'Write getting started guide', 'open');
  insertTask.run(p3.lastInsertRowid, 'Record screen-capture videos', 'open');

  const p4 = insertProject.run(userId, 'Bug Fixes — Q1', 'Resolve backlog of reported bugs from Q1 client feedback.', 'completed', 'medium', daysFrom(-5));
  insertTask.run(p4.lastInsertRowid, 'Fix login redirect issue', 'done');
  insertTask.run(p4.lastInsertRowid, 'Resolve image upload timeout', 'done');
  insertTask.run(p4.lastInsertRowid, 'Patch XSS in comment field', 'done');
});

seedDemo();

module.exports = db;
