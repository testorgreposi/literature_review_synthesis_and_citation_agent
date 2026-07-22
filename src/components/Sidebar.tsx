import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { LayoutGrid, MessageSquare, FileText, Table, Share2, Moon, Sun, Plus, Trash2, X, LogOut, User } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    createNewProject,
    deleteProject,
    
    currentTab,
    setCurrentTab,
    papers,
    activeDocument,
    themeMode,
    setThemeMode,
    uploadedPDFs,

    user,
    signOut
  } = useWorkspace();

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjDeadline, setNewProjDeadline] = useState('2026-09-01');

  const navItems = [
    { id: 'dashboard', label: 'Study Dashboard', icon: LayoutGrid },
    { id: 'chatbot', label: 'Study Chatbot', icon: MessageSquare },
    { id: 'editor', label: 'Draft Editor', icon: FileText },
    { id: 'matrix', label: 'Synthesis Matrix', icon: Table },
    { id: 'graph', label: 'Citation Network', icon: Share2 },
  ] as const;

  const totalPapers = papers.length;
  const totalPDFs = uploadedPDFs.length;

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    createNewProject(newProjName.trim(), newProjDesc.trim(), newProjDeadline);
    setNewProjName('');
    setNewProjDesc('');
    setIsNewProjectModalOpen(false);
  };

  const handleDeleteActiveProject = () => {
    if (confirm(`Are you sure you want to delete the project: "${projects.find(p => p.id === activeProjectId)?.name}"?`)) {
      deleteProject(activeProjectId);
    }
  };

  return (
    <aside className="sidebar">
      {/* Rebrand to BIG BALLOON */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">B</div>
        <div className="sidebar-logo-text">
          BIG BALLOON
          <span>Research Platform</span>
        </div>
      </div>

      {/* Project Selector dropdown */}
      <div className="project-selector-wrapper">
        <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="project-selector-label">Projects</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className="btn btn-icon-only" 
              style={{ padding: '2px', color: 'var(--text-muted)' }} 
              onClick={() => setIsNewProjectModalOpen(true)}
              title="Create New Project"
            >
              <Plus size={14} />
            </button>
            <button 
              className="btn btn-icon-only" 
              style={{ padding: '2px', color: 'var(--danger)' }} 
              onClick={handleDeleteActiveProject}
              disabled={projects.length <= 1}
              title="Delete Active Project"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        <select
          className="project-selector-select"
          value={activeProjectId}
          onChange={(e) => setActiveProjectId(e.target.value)}
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Navigation</div>
        <div className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${currentTab === item.id ? 'active' : ''}`}
                onClick={() => setCurrentTab(item.id)}
              >
                <Icon size={18} />
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {item.id === 'editor' ? (activeDocument.title || 'Draft Editor') : item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-stats">
        <div className="sidebar-stats-title">Stats Summary</div>
        <div className="sidebar-stats-grid">
          <div className="sidebar-stat-card">
            <span className="sidebar-stat-val">{totalPDFs}</span>
            <span className="sidebar-stat-label">PDFs</span>
          </div>
          <div className="sidebar-stat-card">
            <span className="sidebar-stat-val">{totalPapers}</span>
            <span className="sidebar-stat-label">Sources</span>
          </div>
        </div>
      </div>

      {/* User Session Profile and Sign Out */}
      <div 
        style={{ 
          marginTop: 'auto', 
          padding: '12px 10px', 
          backgroundColor: 'var(--bg-tertiary)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={12} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user?.name || 'Researcher'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {user?.email || 'email@workspace.edu'}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
          <button 
            className="theme-toggle-btn"
            style={{ padding: '3px 8px', borderRadius: '4px' }}
            onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
          >
            {themeMode === 'light' ? <Moon size={12} /> : <Sun size={12} />}
          </button>
          <button 
            className="btn" 
            style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }} 
            onClick={signOut}
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewProjectModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Study Project</h3>
              <button className="btn-icon-only" onClick={() => setIsNewProjectModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Project Name *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    required 
                    placeholder="e.g., Thesis Chapter 2"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    className="input-field" 
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="Brief description of your research goals..."
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Target Deadline</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={newProjDeadline}
                    onChange={(e) => setNewProjDeadline(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewProjectModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;
