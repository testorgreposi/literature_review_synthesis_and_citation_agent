import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Plus, Trash2, Cpu, FileText, X } from 'lucide-react';
import type { Paper } from '../types';

export const MatrixView: React.FC = () => {
  const {
    papers,
    themes,
    matrixRows,
    updateMatrixCell,
    addMatrixTheme,
    removeMatrixTheme,
    selectedPaperIdsForSynthesis,
    togglePaperSelectionForSynthesis,
    triggerAISynthesis,
    updateDocumentContent,
    activeDocument,
    setCurrentTab
  } = useWorkspace();

  const [newThemeName, setNewThemeName] = useState('');
  const [editingCell, setEditingCell] = useState<{ paperId: string; themeId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSynthDialogOpen, setIsSynthDialogOpen] = useState(false);
  const [synthPrompt, setSynthPrompt] = useState('Write a synthesis comparing the methodology and main findings of the selected literature, focusing on potential research gaps.');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthResult, setSynthResult] = useState('');

  const handleCellDoubleClick = (paperId: string, themeId: string, currentValue: string) => {
    setEditingCell({ paperId, themeId });
    setEditValue(currentValue);
  };

  const handleCellSave = (paperId: string, themeId: string) => {
    updateMatrixCell(paperId, themeId, editValue);
    setEditingCell(null);
  };

  const handleAddThemeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim()) return;
    addMatrixTheme(newThemeName.trim());
    setNewThemeName('');
  };

  const handleCellAISynthesis = async (paper: Paper, themeId: string, themeLabel: string) => {
    setEditingCell({ paperId: paper.id, themeId });
    setEditValue('Analyzing source content via AURA Agent...');
    
    // Simulate AI cell extraction
    setTimeout(() => {
      let mockValue = '';
      if (themeLabel.toLowerCase().includes('methodology')) {
        mockValue = `Extracted from Abstract: The study utilizes a quantitative framework with secondary source validation. Key variables include citation weights and node clustering factors.`;
      } else if (themeLabel.toLowerCase().includes('finding')) {
        mockValue = `Extracted findings: Confirmed that visual networks accelerate literature synthesis by 30% and reduce duplicate reading.`;
      } else if (themeLabel.toLowerCase().includes('limitations')) {
        mockValue = `Extracted limitations: Limited to peer-reviewed english journals; excludes preprint servers.`;
      } else {
        mockValue = `AI generated insights for ${themeLabel}: Integrates primary guidelines with recent software developments.`;
      }
      setEditValue(mockValue);
    }, 1000);
  };

  const handleRunAISynthesis = async () => {
    if (selectedPaperIdsForSynthesis.length === 0) {
      alert('Please select at least one paper using the checkmarks in the matrix rows or the library view.');
      return;
    }
    setIsSynthesizing(true);
    setSynthResult('');
    try {
      const result = await triggerAISynthesis(synthPrompt);
      setSynthResult(result);
    } catch (e) {
      setSynthResult('Failed to run AI synthesis agent.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleInsertSynthToEditor = () => {
    if (!synthResult) return;
    
    // Insert after introduction or top of document
    const editorContent = activeDocument.content;
    const insertionPoint = editorContent.indexOf('## The Digital Transformation of Syntheses');
    
    let updatedContent = '';
    if (insertionPoint !== -1) {
      updatedContent = 
        editorContent.substring(0, insertionPoint) + 
        `\n\n## Auto-Generated Literature Synthesis\n${synthResult}\n\n` + 
        editorContent.substring(insertionPoint);
    } else {
      updatedContent = editorContent + `\n\n## Auto-Generated Literature Synthesis\n${synthResult}\n`;
    }
    
    updateDocumentContent(updatedContent);
    setIsSynthDialogOpen(false);
    setSynthResult('');
    setCurrentTab('editor');
  };

  return (
    <div className="matrix-container animate-fade-in">
      {/* Toolbar / Actions */}
      <div className="matrix-toolbar">
        <form onSubmit={handleAddThemeSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            className="input-field"
            style={{ width: '220px' }}
            placeholder="Add new theme column..."
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            <Plus size={16} />
            Add Column
          </button>
        </form>

        <div className="matrix-toolbar-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setIsSynthDialogOpen(true)}
            disabled={selectedPaperIdsForSynthesis.length === 0}
            style={{
              opacity: selectedPaperIdsForSynthesis.length === 0 ? 0.6 : 1,
              cursor: selectedPaperIdsForSynthesis.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <Cpu size={16} />
            Generate Synthesis ({selectedPaperIdsForSynthesis.length} selected)
          </button>
        </div>
      </div>

      {/* Synthesis Matrix Table */}
      <div className="matrix-table-wrapper">
        <table className="matrix-table">
          <thead>
            <tr>
              <th>Paper Reference</th>
              {themes.map((theme) => (
                <th key={theme.id}>
                  <div className="matrix-theme-header">
                    <span>{theme.label}</span>
                    <button
                      className="btn-icon-only"
                      style={{ padding: '2px', color: 'var(--text-muted)' }}
                      onClick={() => removeMatrixTheme(theme.id)}
                      title={`Remove column: ${theme.label}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {papers.map((paper) => {
              const row = matrixRows.find((r) => r.paperId === paper.id);
              const isSelected = selectedPaperIdsForSynthesis.includes(paper.id);

              return (
                <tr 
                  key={paper.id}
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                    transition: 'background-color var(--transition-fast)'
                  }}
                >
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePaperSelectionForSynthesis(paper.id)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>
                          {paper.authors.split(',')[0].split(' ').pop()} ({paper.year})
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {paper.title}
                      </span>
                    </div>
                  </td>

                  {themes.map((theme) => {
                    const cellValue = row?.themeValues[theme.id] || '';
                    const isCellEditing =
                      editingCell?.paperId === paper.id && editingCell?.themeId === theme.id;

                    return (
                      <td
                        key={theme.id}
                        onDoubleClick={() => handleCellDoubleClick(paper.id, theme.id, cellValue)}
                        style={{ position: 'relative' }}
                      >
                        {isCellEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <textarea
                              className="drawer-notes-area"
                              style={{ minHeight: '60px', padding: '6px', fontSize: '12px' }}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              autoFocus
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                                onClick={() => setEditingCell(null)}
                              >
                                Cancel
                              </button>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '2px 6px', fontSize: '10px' }}
                                onClick={() => handleCellSave(paper.id, theme.id)}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="matrix-cell-editable">
                            {cellValue ? (
                              <span>{cellValue}</span>
                            ) : (
                              <span className="matrix-cell-empty">Double click to add notes...</span>
                            )}
                            <button
                              className="btn btn-icon-only pulse-glow-active"
                              style={{
                                position: 'absolute',
                                right: '4px',
                                bottom: '4px',
                                padding: '2px',
                                opacity: 0.1,
                                transition: 'opacity 0.2s',
                              }}
                              onClick={() => handleCellAISynthesis(paper, theme.id, theme.label)}
                              title="Extract via AURA AI Agent"
                            >
                              <Cpu size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Synthesis Dialog Modal */}
      {isSynthDialogOpen && (
        <div className="modal-overlay" onClick={() => setIsSynthDialogOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">AURA Synthesis Copilot</h3>
              <button className="btn-icon-only" onClick={() => setIsSynthDialogOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ gap: '16px' }}>
              <div className="form-group">
                <label>Selected Literature for Synthesis</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {papers
                    .filter((p) => selectedPaperIdsForSynthesis.includes(p.id))
                    .map((p) => (
                      <span key={p.id} className="badge badge-accent">
                        {p.authors.split(',')[0].split(' ').pop()} ({p.year})
                      </span>
                    ))}
                </div>
              </div>

              <div className="form-group">
                <label>Synthesis Agent Instructions / Research Question</label>
                <textarea
                  className="drawer-notes-area"
                  value={synthPrompt}
                  onChange={(e) => setSynthPrompt(e.target.value)}
                  placeholder="e.g., Synthesize findings regarding LLM usage..."
                  style={{ minHeight: '80px' }}
                />
              </div>

              {synthResult && (
                <div className="form-group">
                  <label>Generated Report Preview</label>
                  <div 
                    className="copilot-result-box" 
                    style={{ 
                      maxHeight: '220px', 
                      overflowY: 'auto', 
                      fontFamily: 'var(--font-sans)', 
                      fontSize: '12px',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {synthResult}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsSynthDialogOpen(false)}
              >
                Close
              </button>
              {synthResult ? (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleInsertSynthToEditor}
                >
                  <FileText size={14} />
                  Insert into Draft
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleRunAISynthesis}
                  disabled={isSynthesizing}
                >
                  {isSynthesizing ? 'Synthesizing...' : 'Run Agent Synthesis'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MatrixView;
