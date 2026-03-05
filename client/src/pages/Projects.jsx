import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/Sidebar';
import ProjectModal from '../components/ProjectModal';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');

  useEffect(() => {
    api.get('/projects')
      .then((r) => setProjects(r.data))
      .finally(() => setLoading(false));
  }, []);

  function handleSaved(project) {
    setProjects((prev) => {
      const exists = prev.find((p) => p.id === project.id);
      return exists
        ? prev.map((p) => (p.id === project.id ? project : p))
        : [project, ...prev];
    });
    setShowModal(false);
    setEditing(null);
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  function openEdit(project, e) {
    e.stopPropagation();
    setEditing(project);
    setShowModal(true);
  }

  const statusFiltered = filter === 'all' ? projects : projects.filter((p) => p.status === filter);
  const filtered = search.trim()
    ? statusFiltered.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : statusFiltered;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <div className="page-header">
          <div>
            <h1>Projects</h1>
            <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            + New Project
          </button>
        </div>

        {/* Search + filter row */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            style={{ flex: '1', minWidth: '180px' }}
          />
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['all', 'active', 'on-hold', 'completed'].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(s)}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="spinner" />}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <h3>{filter === 'all' ? 'No projects yet' : `No ${filter} projects`}</h3>
            <p>{filter === 'all' ? 'Create your first project to get started.' : 'Try a different filter.'}</p>
          </div>
        )}

        <div className="projects-grid">
          {filtered.map((p) => {
            const pct = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
            return (
              <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                <div className="project-card-header">
                  <div className="project-card-title">{p.title}</div>
                  <span className={`badge badge-${p.priority}`}>{p.priority}</span>
                </div>
                {p.description && (
                  <div className="project-card-desc">{p.description.slice(0, 90)}{p.description.length > 90 ? '…' : ''}</div>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                  {isOverdue(p) && <span className="badge badge-overdue">overdue</span>}
                  {!isOverdue(p) && p.due_date && <span className="badge badge-low">Due {p.due_date}</span>}
                </div>
                <div className="project-card-footer">
                  <div className="progress-wrap">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                    {p.done_count}/{p.task_count} tasks
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => openEdit(p, e)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(p.id, e)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>

        {showModal && (
          <ProjectModal
            project={editing}
            onClose={() => { setShowModal(false); setEditing(null); }}
            onSaved={handleSaved}
          />
        )}
      </main>
    </div>
  );
}

function isOverdue(project) {
  if (!project.due_date || project.status === 'completed') return false;
  return new Date(project.due_date) < new Date(new Date().toDateString());
}
