import React, { useState, useRef } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Sparkles, Search, Clipboard, Check, FileDown, BookOpen, Quote, Edit } from 'lucide-react';
import type { CitationStyle } from '../types';

export const EditorView: React.FC = () => {
  const {
    activeDocument,
    updateDocumentContent,
    updateDocumentTitle,
    papers,
    citationStyle,
    setCitationStyle
  } = useWorkspace();

  const [activeSideTab, setActiveSideTab] = useState<'ai' | 'citations'>('citations');
  const [citationSearch, setCitationSearch] = useState('');
  const [copilotPrompt, setCopilotPrompt] = useState('Suggest a transitioning paragraph that links literature reviews to network visualizations.');
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [bibCopied, setBibCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter papers for citation panel
  const filteredPapersForCiting = papers.filter(
    (p) =>
      p.title.toLowerCase().includes(citationSearch.toLowerCase()) ||
      p.authors.toLowerCase().includes(citationSearch.toLowerCase())
  );

  const handleInsertCitation = (paperId: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const text = activeDocument.content;

    const citationToken = ` [cite:${paperId}]`;
    const newContent = text.substring(0, startPos) + citationToken + text.substring(endPos);

    updateDocumentContent(newContent);

    // Refocus and place cursor after inserted citation
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = startPos + citationToken.length;
    }, 50);
  };

  const handleCopyBibliography = () => {
    // Find references section
    const startIdx = activeDocument.content.indexOf('<!-- REFERENCES_START -->');
    const endIdx = activeDocument.content.indexOf('<!-- REFERENCES_END -->');

    if (startIdx !== -1 && endIdx !== -1) {
      const bibText = activeDocument.content
        .substring(startIdx + '<!-- REFERENCES_START -->'.length, endIdx)
        .trim();
      navigator.clipboard.writeText(bibText);
      setBibCopied(true);
      setTimeout(() => setBibCopied(false), 2000);
    }
  };

  const triggerAICopilotAction = (actionType: 'improve' | 'expand' | 'summarize') => {
    setIsAILoading(true);
    setAiSuggestion('');

    setTimeout(() => {
      let suggestion = '';
      if (actionType === 'improve') {
        suggestion = `Based on academic style guidelines:\n\n"Conducting literature reviews is a vital part of academic discovery, guiding researchers through existing studies to identify gaps."\n\n**Suggested revision (More authoritative)**:\n"Systematic literature aggregation and evaluation represent critical prerequisites for scientific discovery, mapping established inquiries to expose latent research voids."`;
      } else if (actionType === 'expand') {
        suggestion = `Expanded paragraph based on your prompt:\n\n"To bridge conceptual representations and citation records, researchers rely on visual networks. These networks, mapping articles to nodes and citations to directional edges, model the academic universe as a graph. This visualization helps highlight citation clusters, isolating disciplinary bridges that manual metadata reviews typically overlook."`;
      } else {
        suggestion = `Key points extracted from active papers:\n\n- Systematic reviews (Kitchenham, 2007) require planning, conducting, and reporting protocols.\n- AI tools (Chen, 2024) improve write-up velocity by 40% but introduce draft inaccuracies.\n- Graphs (Kovacs, 2021) clusters literature visually to spot interdisciplinary trends.`;
      }
      setAiSuggestion(suggestion);
      setIsAILoading(false);
    }, 1200);
  };

  const handleInsertAISuggestion = () => {
    const textarea = textareaRef.current;
    if (!textarea || !aiSuggestion) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const text = activeDocument.content;

    const contentToInsert = `\n\n${aiSuggestion}\n\n`;
    const newContent = text.substring(0, startPos) + contentToInsert + text.substring(endPos);

    updateDocumentContent(newContent);
    setAiSuggestion('');
  };

  const handleDownloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([activeDocument.content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeDocument.title.replace(/\s+/g, "_").toLowerCase()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="editor-container animate-fade-in">
      {/* Main Drafting Editor Pane */}
      <main className="editor-main-pane">
        <div className="editor-paper-container">
          <input
            type="text"
            className="editor-title-input"
            value={activeDocument.title}
            onChange={(e) => updateDocumentTitle(e.target.value)}
            placeholder="Review Title"
          />

          <textarea
            ref={textareaRef}
            className="editor-textarea"
            value={activeDocument.content}
            onChange={(e) => updateDocumentContent(e.target.value)}
            placeholder="Start writing your literature review here. Use the citation sidebar to search and insert references. The bibliography below will auto-compile..."
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Auto-saved to local storage</span>
            <span>Last Updated: {activeDocument.lastSaved}</span>
          </div>
        </div>
      </main>

      {/* Editor Sidebar Panel */}
      <aside className="editor-side-pane">
        <div className="side-pane-tabs">
          <button
            className={`side-pane-tab ${activeSideTab === 'citations' ? 'active' : ''}`}
            onClick={() => setActiveSideTab('citations')}
          >
            Citations Agent
          </button>
          <button
            className={`side-pane-tab ${activeSideTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveSideTab('ai')}
          >
            AI Copilot
          </button>
        </div>

        <div className="side-pane-content">
          {activeSideTab === 'citations' ? (
            <>
              {/* Style selector */}
              <div className="form-group">
                <label>Bibliography Style</label>
                <select
                  className="input-field"
                  value={citationStyle}
                  onChange={(e) => setCitationStyle(e.target.value as CitationStyle)}
                >
                  <option value="APA">APA (7th Edition)</option>
                  <option value="MLA">MLA (9th Edition)</option>
                  <option value="Chicago">Chicago Author-Date</option>
                  <option value="Harvard">Harvard Reference</option>
                  <option value="BibTeX">BibTeX Database</option>
                </select>
              </div>

              {/* Search papers */}
              <div className="search-input-wrapper" style={{ maxWidth: '100%' }}>
                <Search className="search-input-icon" size={14} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search papers to cite..."
                  value={citationSearch}
                  onChange={(e) => setCitationSearch(e.target.value)}
                />
              </div>

              {/* List of papers to cite */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
                {filteredPapersForCiting.map((paper) => {
                  // Get simple tag representation (e.g. Smith, 2021)
                  const lastName = paper.authors.split(',')[0].split(' ').pop();
                  const inlineLabel = `(${lastName}, ${paper.year})`;

                  return (
                    <div key={paper.id} className="citation-search-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {paper.title}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {inlineLabel}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {paper.authors}
                      </span>
                      <button
                        className="btn btn-outline citation-insert-btn"
                        onClick={() => handleInsertCitation(paper.id)}
                      >
                        <Quote size={10} />
                        Insert Citation
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <button className="btn btn-secondary" onClick={handleCopyBibliography}>
                  {bibCopied ? (
                    <>
                      <Check size={14} style={{ color: 'var(--success)' }} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard size={14} />
                      <span>Copy Bib</span>
                    </>
                  )}
                </button>
                <button className="btn btn-secondary" onClick={handleDownloadMarkdown}>
                  <FileDown size={14} />
                  <span>Export MD</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Copilot Options */}
              <div className="copilot-card">
                <span className="copilot-card-title">
                  <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
                  AI Writing Assistant
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Highlight or prompt the copilot to refine drafting tone, verify citations, or outline key paragraphs.
                </span>

                <div className="copilot-action-grid">
                  <button className="copilot-action-btn" onClick={() => triggerAICopilotAction('improve')}>
                    <Edit size={14} style={{ color: 'var(--accent-primary)' }} />
                    <span>Improve Tone</span>
                  </button>
                  <button className="copilot-action-btn" onClick={() => triggerAICopilotAction('summarize')}>
                    <BookOpen size={14} style={{ color: 'var(--accent-secondary)' }} />
                    <span>Summarize Sources</span>
                  </button>
                </div>
              </div>

              {/* Free-form prompt */}
              <div className="form-group">
                <label>Custom Copilot Instruction</label>
                <textarea
                  className="drawer-notes-area"
                  value={copilotPrompt}
                  onChange={(e) => setCopilotPrompt(e.target.value)}
                  style={{ minHeight: '60px' }}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '8px' }} 
                  onClick={() => triggerAICopilotAction('expand')}
                  disabled={isAILoading}
                >
                  {isAILoading ? 'Thinking...' : 'Generate Text'}
                </button>
              </div>

              {/* Copilot Result Display */}
              {aiSuggestion && (
                <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label>Suggested Content</label>
                  <div className="copilot-result-box" style={{ flex: 1, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                    {aiSuggestion}
                  </div>
                  <button 
                    className="btn btn-outline" 
                    style={{ marginTop: '8px', width: '100%' }}
                    onClick={handleInsertAISuggestion}
                  >
                    Insert at cursor
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
};
export default EditorView;
