import React, { useState } from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import AuthView from './components/AuthView';
import MatrixView from './components/MatrixView';
import { PaperDrawer, AddPaperModal } from './components/PaperDetails';
import { 
  Bot, Send, Trash2, Table, Share2, LayoutGrid, 
  MessageSquare, Star, Settings, FileText, 
  Compass, HelpCircle, Bell, Search,
  Bold, Italic, Underline, Link, Quote, Code, RotateCcw, RotateCw, Download, FileDown
} from 'lucide-react';

const AppShell: React.FC = () => {
  const { 
    user, 
    projects, 
    setActiveProjectId,

    papers,
    uploadedPDFs,
    simulatePDFUpload,
    deleteUploadedPDF,
    activeDocument,
    updateDocumentContent,
    updateDocumentTitle,
    chatbotMessages,
    sendChatbotMessage,
    citationStyle,
    setCitationStyle
  } = useWorkspace();

  // LitReview Tabs: dashboard | projects | documents | synthesis | chatbot | citations | settings | profile
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'documents' | 'synthesis' | 'chatbot' | 'citations' | 'settings' | 'profile'>('dashboard');
  
  // Workspace States
  const [activePdfId, setActivePdfId] = useState<string | null>(
    uploadedPDFs.length > 0 ? uploadedPDFs[0].id : null
  );
  const selectedSimulatedFile = 'graph_neural_networks.pdf';
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / Drawer triggers
  const [isAddPaperModalOpen, setIsAddPaperModalOpen] = useState(false);
  const [inspectedPaperId, setInspectedPaperId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  
  // Settings Form States
  const [projName, setProjName] = useState(projects[0]?.name || 'Deep Learning in Medical Imaging');
  const [projDesc, setProjDesc] = useState(projects[0]?.description || 'A comprehensive literature review on deep learning techniques.');
  const [activeModel, setActiveModel] = useState('GPT-4o');

  // Profile Form States
  const [profName, setProfName] = useState('Nasheer');
  const [profEmail, setProfEmail] = useState('nasheer@example.com');
  const [profAffil, setProfAffil] = useState('Codewit Institute of Engineering & Technology');

  // Guard routing - If not logged in, render AuthView
  if (!user || !user.isLoggedIn) {
    return <AuthView />;
  }

  const handleSimulatedUpload = () => {
    simulatePDFUpload(selectedSimulatedFile, '2.4 MB', 12);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatbotMessage(inputText, activePdfId);
    setInputText('');
  };

  const handleQuickPrompt = (promptText: string) => {
    sendChatbotMessage(promptText, activePdfId);
  };

  const filteredPapers = papers.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.authors.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      
      {/* 1. INDIGO SIDEBAR NAVIGATION (Matches Image) */}
      <aside className="sidebar-litreview">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">R</div>
          <div className="sidebar-brand-title">
            RESEARCH FLOW AI
            <span>Research Assistant</span>
          </div>
        </div>

        <nav className="sidebar-nav-list">
          <button className={`sidebar-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutGrid size={16} />
            <span>Dashboard</span>
          </button>
          <button className={`sidebar-nav-btn ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
            <Compass size={16} />
            <span>Projects</span>
          </button>
          <button className={`sidebar-nav-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
            <FileText size={16} />
            <span>Documents</span>
          </button>
          <button className={`sidebar-nav-btn ${activeTab === 'synthesis' ? 'active' : ''}`} onClick={() => setActiveTab('synthesis')}>
            <Table size={16} />
            <span>Synthesis</span>
          </button>
          <button className={`sidebar-nav-btn ${activeTab === 'chatbot' ? 'active' : ''}`} onClick={() => setActiveTab('chatbot')}>
            <MessageSquare size={16} />
            <span>AI Chat</span>
          </button>
          <button className={`sidebar-nav-btn ${activeTab === 'citations' ? 'active' : ''}`} onClick={() => setActiveTab('citations')}>
            <Share2 size={16} />
            <span>Citations</span>
          </button>
          <button className={`sidebar-nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Storage Panel */}
        <div className="sidebar-storage-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Storage Used</span>
            <span>2.4 GB / 10 GB</span>
          </div>
          <div className="sidebar-storage-bar">
            <div className="sidebar-storage-fill" />
          </div>
        </div>

        {/* User Card */}
        <div className="sidebar-user-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('profile')}>
          <div className="sidebar-user-avatar">N</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, display: 'block', color: 'white' }}>{profName}</span>
            <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Researcher</span>
          </div>
          <Settings size={14} style={{ color: '#64748b' }} />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="console-layout">
        
        {/* Global LitReview Top Bar */}
        <header className="header-litreview">
          <div className="header-project-info">
            <span className="header-project-title">{projName}</span>
            <span className="badge badge-accent">Active Project</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="header-search-wrapper">
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="text" className="header-search-input" placeholder="Search anything..." />
            </div>

            <button className="btn btn-icon-only"><HelpCircle size={16} /></button>
            <button className="btn btn-icon-only"><Bell size={16} /></button>
            
            <div className="sidebar-user-avatar" style={{ width: 28, height: 28, fontSize: '11px', cursor: 'pointer' }} onClick={() => setActiveTab('profile')}>N</div>
          </div>
        </header>

        {/* TAB WORKSPACE */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          
          {/* TAB 1: DASHBOARD (Unified 3-Pane Document Workspace) */}
          {activeTab === 'dashboard' && (
            <div className="workspace-pane-split animate-fade-in">
              
              {/* Left Column: Documents Selector */}
              <aside className="doc-sidebar-pane">
                <div className="doc-sidebar-header">
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>Documents ({uploadedPDFs.length})</span>
                  <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleSimulatedUpload}>
                    + Upload
                  </button>
                </div>
                <div className="doc-sidebar-search">
                  <input type="text" className="input-field" style={{ width: '100%', padding: '6px' }} placeholder="Search documents..." />
                </div>
                <div className="doc-sidebar-list">
                  {uploadedPDFs.map(pdf => (
                    <div 
                      key={pdf.id}
                      className={`doc-sidebar-item ${activePdfId === pdf.id ? 'active' : ''}`}
                      onClick={() => {
                        setActivePdfId(pdf.id);
                      }}
                    >
                      <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{pdf.fileName}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span className="badge" style={{ backgroundColor: '#e2f0d9', color: '#385723', borderColor: 'transparent' }}>Processed</span>
                        <button className="btn" style={{ padding: '2px', color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); deleteUploadedPDF(pdf.id); }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>

              {/* Center Column: Interactive Text Editor Canvas */}
              <main className="editor-canvas-pane">
                <div className="editor-canvas-tabs">
                  <button className="editor-canvas-tab-btn active">Synthesis</button>
                  <button className="editor-canvas-tab-btn">Notes</button>
                  <button className="editor-canvas-tab-btn">AI Chat</button>
                  <button className="editor-canvas-tab-btn">Outlines</button>
                </div>

                <div className="editor-toolbar-ribbon">
                  <select className="project-selector-select" style={{ width: '110px', padding: '4px' }}><option>Heading 2</option></select>
                  <button className="btn btn-icon-only"><Bold size={13} /></button>
                  <button className="btn btn-icon-only"><Italic size={13} /></button>
                  <button className="btn btn-icon-only"><Underline size={13} /></button>
                  <span style={{ width: '1px', height: '16px', backgroundColor: '#e2e8f0', margin: '0 4px' }} />
                  <button className="btn btn-icon-only"><Link size={13} /></button>
                  <button className="btn btn-icon-only"><Quote size={13} /></button>
                  <button className="btn btn-icon-only"><Code size={13} /></button>
                  <span style={{ width: '1px', height: '16px', backgroundColor: '#e2e8f0', margin: '0 4px' }} />
                  <button className="btn btn-icon-only"><RotateCcw size={13} /></button>
                  <button className="btn btn-icon-only"><RotateCw size={13} /></button>

                  <button className="btn btn-secondary" style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '11px' }}><Download size={12} /> Export</button>
                  <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }}><Share2 size={12} /> Share</button>
                </div>

                <div className="editor-canvas-body">
                  <div className="editor-canvas-sheet">
                    <input 
                      type="text" 
                      className="editor-title-input" 
                      style={{ fontSize: '22px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }} 
                      value={activeDocument.title} 
                      onChange={(e) => updateDocumentTitle(e.target.value)}
                    />
                    
                    {/* Purple AI Summary callout display (Matches Image) */}
                    <div className="ai-summary-callout">
                      <strong style={{ fontSize: '12.5px', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Bot size={14} />
                        AI Summary
                      </strong>
                      <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#5b21b6', lineHeight: 1.5 }}>
                        This research evaluates position-aware latency limits in caching modules. It verifies that localized memory partitions yield hit rate improvements of up to 18% under mixed database operations.
                      </p>
                    </div>

                    <textarea 
                      className="editor-textarea" 
                      style={{ minHeight: '320px', fontFamily: 'Georgia, serif', fontSize: '14px', lineHeight: '1.7' }}
                      value={activeDocument.content}
                      onChange={(e) => updateDocumentContent(e.target.value)}
                    />
                  </div>
                </div>
              </main>

              {/* Right Column: Citations pane */}
              <aside className="citations-right-pane">
                <div className="citations-pane-header">
                  <button className="citations-pane-tab active">Citations (18)</button>
                  <button className="citations-pane-tab">Extracts (32)</button>
                </div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
                  {filteredPapers.map(paper => (
                    <div key={paper.id} className="console-card" style={{ padding: '10px' }} onClick={() => setInspectedPaperId(paper.id)}>
                      <strong style={{ fontSize: '12px', display: 'block' }}>{paper.authors.split(',')[0]} et al.</strong>
                      <span style={{ fontSize: '11px', color: '#64748b', display: 'block', margin: '2px 0' }}>{paper.title}</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{paper.journal} &bull; {paper.year}</span>
                    </div>
                  ))}
                  <button className="btn btn-secondary" style={{ marginTop: 'auto', padding: '8px' }} onClick={() => setIsAddPaperModalOpen(true)}>
                    + Add Citation
                  </button>
                </div>
              </aside>

            </div>
          )}

          {/* TAB 2: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="library-workspace-layout animate-fade-in">
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Research Projects Workspaces</h2>
              <div className="library-cards-grid">
                {projects.map(p => (
                  <div key={p.id} className="library-card-premium" onClick={() => setActiveProjectId(p.id)}>
                    <h3 style={{ fontSize: '15px', margin: 0 }}>{p.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{p.description}</p>
                    <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: 600 }}>Target: {p.deadline}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS (Review Library - Matches Image) */}
          {activeTab === 'documents' && (
            <div className="library-workspace-layout animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Review Library</h1>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>All your saved papers, organized and ready to use.</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="input-field" placeholder="Search papers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <button className="btn btn-secondary" onClick={() => setIsAddPaperModalOpen(true)}>+ Add Paper</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e2e8f0', marginTop: '24px' }}>
                <button className="editor-canvas-tab-btn active">All Papers</button>
                <button className="editor-canvas-tab-btn">Recently Added</button>
                <button className="editor-canvas-tab-btn">Favorites</button>
                <button className="editor-canvas-tab-btn">Trash</button>
              </div>

              <div className="library-cards-grid">
                {filteredPapers.map(paper => (
                  <div key={paper.id} className="library-card-premium" onClick={() => setInspectedPaperId(paper.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>Paper</span>
                      <Star size={14} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                    </div>
                    <h4 style={{ fontSize: '13.5px', margin: '4px 0 0', lineHeight: 1.4 }}>{paper.title}</h4>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{paper.authors}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>{paper.journal}</span>
                      <span className="badge">{paper.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SYNTHESIS */}
          {activeTab === 'synthesis' && (
            <div className="matrix-room-layout animate-fade-in">
              <div>
                <h2 style={{ margin: 0, fontSize: '18px' }}>Synthesis Comparison Matrix</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Compare parameters systematically across bibliography sources.</span>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <MatrixView />
              </div>
            </div>
          )}

          {/* TAB 5: AI CHAT */}
          {activeTab === 'chatbot' && (
            <div className="chatbot-room-layout animate-fade-in" style={{ backgroundColor: 'white' }}>
              
              {/* Chat Thread */}
              <div className="chatbot-room-chat" style={{ flex: 1 }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={16} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <strong style={{ fontSize: '13.5px', display: 'block' }}>AURA Chat Workspace</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Conversational AI Reader</span>
                  </div>
                </div>

                <div className="chat-messages-scroll" style={{ padding: '32px' }}>
                  {chatbotMessages.map(msg => (
                    <div key={msg.id} className={`chat-bubble ${msg.sender === 'bot' ? 'chat-bubble-bot' : 'chat-bubble-user'}`}>
                      <span>{msg.text}</span>
                    </div>
                  ))}
                </div>

                {/* Prompt Hints List */}
                <div style={{ padding: '16px 32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Suggested Queries</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="tag-pill" onClick={() => handleQuickPrompt('Explain U-Net architecture and its applications.')}>
                      Explain U-Net architecture...
                    </button>
                    <button className="tag-pill" onClick={() => handleQuickPrompt('Compare GNN and Transformer models.')}>
                      Compare GNN and Transformer...
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSendChat} className="chat-input-row" style={{ padding: '16px 32px' }}>
                  <input
                    type="text"
                    className="input-field"
                    style={{ flex: 1, padding: '10px 14px' }}
                    placeholder="Ask anything about your documents..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary">
                    <Send size={14} />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 6: CITATIONS (Citation Manager) */}
          {activeTab === 'citations' && (
            <div className="matrix-room-layout animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px' }}>Citation Manager</h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Manage and organize all citations in your project</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-secondary"><FileDown size={14} /> Export BibTeX</button>
                  <button className="btn btn-secondary"><FileDown size={14} /> Export RIS</button>
                </div>
              </div>

              <div className="matrix-table-wrapper" style={{ marginTop: '16px' }}>
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Citation Key</th>
                      <th>In-Text</th>
                      <th>Source Title</th>
                      <th>Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {papers.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>[cite:{p.id}]</td>
                        <td>({p.authors.split(',')[0]}, {p.year})</td>
                        <td>{p.title}</td>
                        <td>{p.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="library-workspace-layout animate-fade-in" style={{ maxWidth: '720px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Project Settings</h2>
              <div className="form-card-body">
                <div className="form-group">
                  <label>Project Name</label>
                  <input type="text" className="input-field" style={{ width: '100%' }} value={projName} onChange={(e) => setProjName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="input-field" style={{ width: '100%', minHeight: '80px' }} value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Default Citation Style</label>
                  <select className="project-selector-select" style={{ width: '100%' }} value={citationStyle} onChange={(e) => setCitationStyle(e.target.value as any)}>
                    <option value="APA">APA 7th</option>
                    <option value="MLA">MLA 9th</option>
                    <option value="Chicago">Chicago Author-Date</option>
                    <option value="Harvard">Harvard Style</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>AI Model Scaffolding</label>
                  <select className="project-selector-select" style={{ width: '100%' }} value={activeModel} onChange={(e) => setActiveModel(e.target.value)}>
                    <option value="GPT-4o">GPT-4o (Default)</option>
                    <option value="Claude-3.5">Claude 3.5 Sonnet</option>
                    <option value="Gemini-Pro">Gemini 1.5 Pro</option>
                  </select>
                </div>

                <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => alert('Settings saved successfully!')}>
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: PROFILE */}
          {activeTab === 'profile' && (
            <div className="library-workspace-layout animate-fade-in" style={{ maxWidth: '720px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Profile Settings</h2>
              <div className="form-card-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="input-field" style={{ width: '100%' }} value={profName} onChange={(e) => setProfName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="input-field" style={{ width: '100%' }} value={profEmail} onChange={(e) => setProfEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Affiliation / Institution</label>
                  <input type="text" className="input-field" style={{ width: '100%' }} value={profAffil} onChange={(e) => setProfAffil(e.target.value)} />
                </div>
                
                <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => alert('Profile updated successfully!')}>
                  Save Profile
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      <PaperDrawer paperId={inspectedPaperId} onClose={() => setInspectedPaperId(null)} />
      <AddPaperModal isOpen={isAddPaperModalOpen} onClose={() => setIsAddPaperModalOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <WorkspaceProvider>
      <AppShell />
    </WorkspaceProvider>
  );
}

export default App;
