import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../api';
import Sidebar from '../components/Sidebar';
import ProjectModal from '../components/ProjectModal';

const TASK_STATUSES = ['open', 'in-progress', 'done'];

function SortableTask({ task, onStatusChange, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-item${task.status === 'done' ? ' done' : ''}`}
    >
      <span
        className="task-drag-handle"
        {...attributes}
        {...listeners}
        title="Drag to reorder"
      >⠿</span>
      <input
        type="checkbox"
        checked={task.status === 'done'}
        onChange={() => onStatusChange(task.id, task.status === 'done' ? 'open' : 'done')}
        style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
      />
      <span className="task-title">{task.title}</span>
      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
        style={{ width: 'auto', fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
      >
        {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button className="btn btn-danger btn-sm" onClick={() => onDelete(task.id)}>✕</button>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [showEdit, setShowEdit]   = useState(false);
  const [newTask, setNewTask]     = useState('');
  const [addingTask, setAddingTask] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }));

  useEffect(() => {
    api.get(`/projects/${id}`)
      .then((r) => setProject(r.data))
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTask.trim()) return;
    setAddingTask(true);
    try {
      const res = await api.post(`/projects/${id}/tasks`, { title: newTask.trim() });
      setProject((p) => ({ ...p, tasks: [...(p.tasks ?? []), res.data] }));
      setNewTask('');
    } finally {
      setAddingTask(false);
    }
  }

  async function handleTaskStatus(taskId, status) {
    const res = await api.patch(`/projects/${id}/tasks/${taskId}`, { status });
    setProject((p) => ({
      ...p,
      tasks: p.tasks.map((t) => (t.id === taskId ? res.data : t)),
    }));
  }

  async function handleDeleteTask(taskId) {
    await api.delete(`/projects/${id}/tasks/${taskId}`);
    setProject((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }));
  }

  async function handleDeleteProject() {
    if (!confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  }

  function handleProjectSaved(updated) {
    setProject((p) => ({ ...p, ...updated }));
    setShowEdit(false);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const tasks = project.tasks ?? [];
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(tasks, oldIndex, newIndex);

    setProject((p) => ({ ...p, tasks: reordered }));
    await api.patch(`/projects/${id}/tasks/reorder`, { ids: reordered.map((t) => t.id) });
  }

  if (loading) return (
    <div className="layout">
      <Sidebar />
      <main className="main"><div className="spinner" /></main>
    </div>
  );

  if (!project) return null;

  const tasks = project.tasks ?? [];
  const done  = tasks.filter((t) => t.status === 'done').length;
  const pct   = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
  const isOverdue = project.due_date && project.status !== 'completed'
    && new Date(project.due_date + 'T23:59:59') < new Date();

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        {/* Back link */}
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1.25rem' }} onClick={() => navigate('/projects')}>
          ← Back to Projects
        </button>

        {/* Project header */}
        <div className="page-header">
          <div>
            <h1 style={{ marginBottom: '0.4rem' }}>{project.title}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge badge-${project.status}`}>{project.status}</span>
              <span className={`badge badge-${project.priority}`}>{project.priority} priority</span>
              {project.due_date && (
                <span className={`badge ${isOverdue ? 'badge-overdue' : 'badge-low'}`}>
                  {isOverdue ? '⚠ Overdue · ' : 'Due '}{ project.due_date}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost" onClick={() => setShowEdit(true)}>Edit</button>
            <button className="btn btn-danger" onClick={handleDeleteProject}>Delete</button>
          </div>
        </div>

        {project.description && (
          <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem', maxWidth: '640px' }}>
            {project.description}
          </p>
        )}

        {isOverdue && (
          <div className="alert alert-overdue" style={{ marginBottom: '1.5rem' }}>
            ⚠ This project is past its due date.
          </div>
        )}

        {/* Progress */}
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontWeight: 600 }}>Progress</span>
            <span style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>{done}/{tasks.length} tasks done · {pct}%</span>
          </div>
          <div className="progress-wrap" style={{ height: '8px' }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Tasks section */}
        <h2>Tasks</h2>

        {/* Add task form */}
        <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task…"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={addingTask || !newTask.trim()}>
            Add
          </button>
        </form>

        {tasks.length === 0 && (
          <div className="empty-state" style={{ padding: '1.5rem' }}>
            <p>No tasks yet. Add one above.</p>
          </div>
        )}

        <div className="task-list">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onStatusChange={handleTaskStatus}
                  onDelete={handleDeleteTask}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {showEdit && (
          <ProjectModal project={project} onClose={() => setShowEdit(false)} onSaved={handleProjectSaved} />
        )}
      </main>
    </div>
  );
}
