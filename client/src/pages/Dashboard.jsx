import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ProjectModal from '../components/ProjectModal';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/projects')
      .then((r) => setProjects(r.data))
      .finally(() => setLoading(false));
  }, []);

  const active    = projects.filter((p) => p.status === 'active').length;
  const onHold    = projects.filter((p) => p.status === 'on-hold').length;
  const completed = projects.filter((p) => p.status === 'completed').length;
  const overdue   = projects.filter((p) => isOverdue(p)).length;
  const totalTasks = projects.reduce((s, p) => s + (p.task_count ?? 0), 0);
  const doneTasks  = projects.reduce((s, p) => s + (p.done_count ?? 0), 0);

  function handleProjectSaved(project) {
    setProjects((prev) => [project, ...prev]);
    setShowModal(false);
  }

  const recent = [...projects].slice(0, 4);

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <div style={{ marginBottom: '1.75rem' }}>
          <h1>Good {greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your projects today.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{projects.length}</div>
            <div className="stat-label">Total Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{active}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{onHold}</div>
            <div className="stat-label">On Hold</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%</div>
            <div className="stat-label">Tasks Done</div>
          </div>
          {overdue > 0 && (
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{overdue}</div>
              <div className="stat-label">Overdue</div>
            </div>
          )}
        </div>

        <div className="topbar">
          <h2 style={{ marginBottom: 0 }}>Recent Projects</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
        </div>

        {loading && <div className="spinner" />}

        {!loading && recent.length === 0 && (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first project to get started.</p>
          </div>
        )}

        <div className="projects-grid">
          {recent.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
          ))}
        </div>

        {showModal && (
          <ProjectModal onClose={() => setShowModal(false)} onSaved={handleProjectSaved} />
        )}
      </main>
    </div>
  );
}

function ProjectCard({ project, onClick }) {
  const pct = project.task_count > 0
    ? Math.round((project.done_count / project.task_count) * 100)
    : 0;

  return (
    <div className="project-card" onClick={onClick}>
      <div className="project-card-header">
        <div className="project-card-title">{project.title}</div>
        <span className={`badge badge-${project.priority}`}>{project.priority}</span>
      </div>
      {project.description && (
        <div className="project-card-desc">{project.description.slice(0, 90)}{project.description.length > 90 ? '…' : ''}</div>
      )}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span className={`badge badge-${project.status}`}>{project.status}</span>
        {isOverdue(project) && <span className="badge badge-overdue">overdue</span>}
        {!isOverdue(project) && project.due_date && (
          <span className="badge badge-low">Due {project.due_date}</span>
        )}
      </div>
      <div className="project-card-footer">
        <div className="progress-wrap">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
          {project.done_count}/{project.task_count} tasks
        </span>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function isOverdue(project) {
  if (!project.due_date || project.status === 'completed') return false;
  return new Date(project.due_date) < new Date(new Date().toDateString());
}
