const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(auth);

// Helper: verify project belongs to user
function getProject(projectId, userId) {
  return db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(projectId, userId);
}

// GET /api/projects/:projectId/tasks
router.get('/', (req, res) => {
  const project = getProject(req.params.projectId, req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const tasks = db.prepare(
    'SELECT * FROM tasks WHERE project_id = ? ORDER BY sort_order ASC, id ASC'
  ).all(req.params.projectId);

  res.json(tasks);
});

// POST /api/projects/:projectId/tasks
router.post(
  '/',
  [body('title').trim().notEmpty().withMessage('Task title is required')],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const project = getProject(req.params.projectId, req.user.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { title, status = 'open' } = req.body;
    const { maxOrder } = db.prepare(
      'SELECT COALESCE(MAX(sort_order), -1) as maxOrder FROM tasks WHERE project_id = ?'
    ).get(req.params.projectId);
    const result = db.prepare(
      'INSERT INTO tasks (project_id, title, status, sort_order) VALUES (?, ?, ?, ?)'
    ).run(req.params.projectId, title, status, maxOrder + 1);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(task);
  }
);

// PATCH /api/projects/:projectId/tasks/:taskId
router.patch('/:taskId', (req, res) => {
  const project = getProject(req.params.projectId, req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const task = db.prepare(
    'SELECT * FROM tasks WHERE id = ? AND project_id = ?'
  ).get(req.params.taskId, req.params.projectId);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const { title, status } = req.body;
  db.prepare(
    `UPDATE tasks SET
      title  = COALESCE(?, title),
      status = COALESCE(?, status)
     WHERE id = ?`
  ).run(title ?? null, status ?? null, req.params.taskId);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
  res.json(updated);
});

// DELETE /api/projects/:projectId/tasks/:taskId
router.delete('/:taskId', (req, res) => {
  const project = getProject(req.params.projectId, req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const task = db.prepare(
    'SELECT id FROM tasks WHERE id = ? AND project_id = ?'
  ).get(req.params.taskId, req.params.projectId);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.taskId);
  res.json({ message: 'Task deleted' });
});

// PATCH /api/projects/:projectId/tasks/reorder
router.patch('/reorder', (req, res) => {
  const project = getProject(req.params.projectId, req.user.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids array required' });
  }

  const update = db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ? AND project_id = ?');
  const reorder = db.transaction((orderedIds) => {
    orderedIds.forEach((id, index) => update.run(index, id, req.params.projectId));
  });
  reorder(ids);

  res.json({ message: 'Order saved' });
});

module.exports = router;
