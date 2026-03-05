import { useState } from 'react';
import api from '../api';

const STATUSES = ['active', 'on-hold', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function ProjectModal({ project, onClose, onSaved }) {
  const editing = Boolean(project?.id);
  const [form, setForm] = useState({
    title:       project?.title       ?? '',
    description: project?.description ?? '',
    status:      project?.status      ?? 'active',
    priority:    project?.priority    ?? 'medium',
    due_date:    project?.due_date    ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, due_date: form.due_date || null };
      const res = editing
        ? await api.put(`/projects/${project.id}`, payload)
        : await api.post('/projects', payload);
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ marginBottom: 0 }}>{editing ? 'Edit Project' : 'New Project'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Project name" autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="What is this project about?" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" name="due_date" value={form.due_date ?? ''} onChange={handleChange} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
