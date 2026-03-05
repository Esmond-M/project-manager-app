const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/projects  — list all projects for the logged-in user
router.get('/', (req, res) => {
  const projects = db.prepare(
    `SELECT p.*, 
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS done_count
     FROM projects p
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`
  ).all(req.user.id);

  res.json(projects);
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const project = db.prepare(
    'SELECT * FROM projects WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!project) return res.status(404).json({ message: 'Project not found' });

  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC'
  ).all(project.id);

  res.json({ ...project, tasks });
});

// POST /api/projects
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('status').optional().isIn(['active', 'on-hold', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description = '', status = 'active', priority = 'medium', due_date = null } = req.body;

    const result = db.prepare(
      `INSERT INTO projects (user_id, title, description, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.user.id, title, description, status, priority, due_date);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(project);
  }
);

// PUT /api/projects/:id
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty(),
    body('status').optional().isIn(['active', 'on-hold', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const existing = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ message: 'Project not found' });

    const { title, description, status, priority, due_date } = req.body;

    db.prepare(
      `UPDATE projects SET
        title       = COALESCE(?, title),
        description = COALESCE(?, description),
        status      = COALESCE(?, status),
        priority    = COALESCE(?, priority),
        due_date    = COALESCE(?, due_date),
        updated_at  = datetime('now')
       WHERE id = ?`
    ).run(title ?? null, description ?? null, status ?? null, priority ?? null, due_date ?? null, req.params.id);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json(project);
  }
);

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ message: 'Project not found' });

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Project deleted' });
});

module.exports = router;
