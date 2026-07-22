import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { UploadCloud, FileText, Trash2, MessageSquare, BookOpen, Clock, FileSpreadsheet, Plus } from 'lucide-react';
import { PaperDrawer, AddPaperModal } from './PaperDetails';

export const DashboardView: React.FC = () => {
  const {
    projects,
    activeProjectId,
    
    userProfile,
    uploadedPDFs,
    simulatePDFUpload,
    deleteUploadedPDF,
    papers,
    activePaperId,
    setActivePaperId,
    setCurrentTab
  } = useWorkspace();

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const [expandedPdfId, setExpandedPdfId] = useState<string | null>(null);
  const [activeSimplifyLevel, setActiveSimplifyLevel] = useState<'eli5' | 'standard' | 'detailed'>('eli5');
  const [selectedSimulatedFile, setSelectedSimulatedFile] = useState('graph_neural_networks.pdf');

  // Library States
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const simulateUploadOptions = [
    { name: 'graph_neural_networks.pdf', size: '3.4 MB', pages: 18 },
    { name: 'transformers_survey.pdf', size: '4.1 MB', pages: 28 },
    { name: 'academic_ethics_2025.pdf', size: '1.2 MB', pages: 8 },
    { name: 'force_layout_algorithms.pdf', size: '1.8 MB', pages: 12 }
  ];

  const handleSimulatedUpload = () => {
    const option = simulateUploadOptions.find(o => o.name === selectedSimulatedFile);
    if (option) {
      simulatePDFUpload(option.name, option.size, option.pages);
    }
  };

  const toggleExpandPdf = (id: string) => {
    setExpandedPdfId(prev => prev === id ? null : id);
  };

  const handleSendToChat = () => {
    setCurrentTab('chatbot');
  };

  const handleExportMatrixCSV = () => {
    if (papers.length === 0) return;
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Paper,Authors,Year,Journal\n';
    papers.forEach(p => {
      csvContent += `"${p.title}","${p.authors}",${p.year},"${p.journal}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeProject.name.replace(/\s+/g, '_').toLowerCase()}_matrix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      paper.title.toLowerCase().includes(search.toLowerCase()) ||
      paper.authors.toLowerCase().includes(search.toLowerCase()) ||
      paper.journal.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="dashboard-grid-layout animate-fade-in">
      
      {/* LEFT COLUMN: Main Activity Feed & File Uploads (Scrollable) */}
      <div className="dashboard-left-scroll">
        
        {/* Project Greeting Banner */}
        <div className="profile-card">
          <div className="profile-avatar">
            {userProfile.name.charAt(0)}
          </div>
          <div className="profile-info">
            <span className="profile-badge">Project: {activeProject.name}</span>
            <h2 className="profile-name">Hello, {userProfile.name}!</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {activeProject.description || 'Manage documents, scans, and citation matrix.'}
            </p>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="premium-card">
          <div className="premium-card-title">
            <UploadCloud size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Upload Document Scans</span>
          </div>
          <div className="upload-dropzone">
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Scan local PDF references to summarize or converse page-by-page.
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <select
                className="input-field"
                value={selectedSimulatedFile}
                onChange={(e) => setSelectedSimulatedFile(e.target.value)}
              >
                {simulateUploadOptions.map(opt => (
                  <option key={opt.name} value={opt.name}>{opt.name} ({opt.size})</option>
                ))}
              </select>
              <button type="button" className="btn btn-primary" onClick={handleSimulatedUpload}>
                Scan File
              </button>
            </div>
          </div>
        </div>

        {/* Upload History Table */}
        <div className="premium-card">
          <div className="premium-card-title">
            <FileText size={18} style={{ color: 'var(--accent-secondary)' }} />
            <span>Document Scans History ({uploadedPDFs.length})</span>
          </div>

          {uploadedPDFs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No documents scanned in this project.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {uploadedPDFs.map(pdf => {
                const isExpanded = expandedPdfId === pdf.id;
                return (
                  <div key={pdf.id} style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={16} style={{ color: 'var(--danger)' }} />
                        <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{pdf.fileName}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({pdf.fileSize})</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => toggleExpandPdf(pdf.id)}>
                          {isExpanded ? 'Close Summary' : 'Quick Study'}
                        </button>
                        <button className="btn btn-icon-only" style={{ color: 'var(--danger)', padding: '4px' }} onClick={() => deleteUploadedPDF(pdf.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                          <strong>AI Summary:</strong> {pdf.summary}
                        </div>

                        <div>
                          <strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Choose Complexity:</strong>
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                            {['eli5', 'standard', 'detailed'].map((level) => (
                              <button
                                key={level}
                                className="tag-pill"
                                style={{
                                  fontSize: '11px',
                                  padding: '3px 8px',
                                  borderColor: activeSimplifyLevel === level ? 'var(--accent-primary)' : 'var(--border-color)',
                                  background: activeSimplifyLevel === level ? 'var(--accent-light)' : 'transparent',
                                  color: activeSimplifyLevel === level ? 'var(--accent-primary)' : 'var(--text-secondary)'
                                }}
                                onClick={() => setActiveSimplifyLevel(level as any)}
                              >
                                {level === 'eli5' ? '👶 ELI5' : level === 'standard' ? '🎒 College' : '💼 Executive'}
                              </button>
                            ))}
                          </div>

                          <div className="copilot-result-box" style={{ background: 'var(--bg-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                            {activeSimplifyLevel === 'eli5' && pdf.simplifiedText.eli5}
                            {activeSimplifyLevel === 'standard' && pdf.simplifiedText.standard}
                            {activeSimplifyLevel === 'detailed' && <div style={{ whiteSpace: 'pre-wrap' }}>{pdf.simplifiedText.detailed}</div>}
                          </div>
                        </div>

                        <button className="btn btn-primary" style={{ alignSelf: 'flex-end', fontSize: '12px' }} onClick={handleSendToChat}>
                          <MessageSquare size={14} />
                          Open Split Reader
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Project Stats & Reference Panel (Scrollable) */}
      <div className="dashboard-right-pane">
        
        {/* Project Target Card */}
        <div className="premium-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Deadline</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              {activeProject.deadline}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="stat-card-flat">
              <span className="stat-card-title">Scanned</span>
              <span className="stat-card-value">{uploadedPDFs.length}</span>
            </div>
            <div className="stat-card-flat">
              <span className="stat-card-title">References</span>
              <span className="stat-card-value">{papers.length}</span>
            </div>
          </div>
        </div>

        {/* Embedded Reference Library */}
        <div className="dashboard-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} style={{ color: 'var(--accent-secondary)' }} />
              References Library
            </h4>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn btn-icon-only" style={{ padding: '4px' }} onClick={handleExportMatrixCSV} title="Export CSV list">
                <FileSpreadsheet size={14} />
              </button>
              <button className="btn btn-icon-only" style={{ padding: '4px' }} onClick={() => setIsAddModalOpen(true)} title="Add reference">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <input
            type="text"
            className="input-field"
            style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
            placeholder="Filter library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
            {filteredPapers.map(paper => (
              <div key={paper.id} className="premium-card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setActivePaperId(paper.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {paper.title}
                  </span>
                  <span className="badge">{paper.year}</span>
                </div>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {paper.authors.split(',')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <PaperDrawer paperId={activePaperId} onClose={() => setActivePaperId(null)} />
      <AddPaperModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
export default DashboardView;
