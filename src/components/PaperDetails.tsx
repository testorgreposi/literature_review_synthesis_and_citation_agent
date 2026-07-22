import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import type { CitationStyle, Paper } from '../types';

interface PaperDrawerProps {
  paperId: string | null;
  onClose: () => void;
}

export const PaperDrawer: React.FC<PaperDrawerProps> = ({ paperId, onClose }) => {
  const { papers, updatePaperNotes, generateCitation, citationStyle } = useWorkspace();
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [localStyle, setLocalStyle] = useState<CitationStyle>(citationStyle);

  const paper: Paper | undefined = papers.find(p => p.id === paperId);

  useEffect(() => {
    if (paper) {
      setNotes(paper.notes || '');
    }
  }, [paperId, paper]);

  if (!paper) return null;

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    updatePaperNotes(paper.id, val);
  };

  const handleCopyCitation = () => {
    const citation = generateCitation(paper, localStyle);
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const citationStyles: CitationStyle[] = ['APA', 'MLA', 'Chicago', 'Harvard', 'BibTeX'];

  return (
    <div className={`paper-drawer ${paperId ? 'open' : ''}`}>
      <div className="paper-drawer-header">
        <h3 className="paper-drawer-title">Document Reference</h3>
        <button className="btn-icon-only" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="paper-drawer-body">
        <div className="drawer-section">
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 600 }}>{paper.title}</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{paper.authors}</p>
        </div>

        <div className="drawer-section">
          <span className="drawer-section-title">Metadata</span>
          <div className="drawer-metadata-grid">
            <span className="drawer-metadata-label">Journal:</span>
            <span className="drawer-metadata-val">{paper.journal}</span>

            <span className="drawer-metadata-label">Year:</span>
            <span className="drawer-metadata-val">{paper.year}</span>

            {paper.doi && (
              <>
                <span className="drawer-metadata-label">DOI:</span>
                <span className="drawer-metadata-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  {paper.doi}
                </span>
              </>
            )}

            {paper.url && (
              <>
                <span className="drawer-metadata-label">Link:</span>
                <span className="drawer-metadata-val">
                  <a href={paper.url} target="_blank" rel="noreferrer" className="btn" style={{ padding: '0', fontSize: '13px', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Access Source <ExternalLink size={12} />
                  </a>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="drawer-section">
          <span className="drawer-section-title">Tags</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {paper.tags.map((t, idx) => (
              <span key={idx} className="badge badge-accent">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="drawer-section">
          <span className="drawer-section-title">Abstract</span>
          <div className="drawer-abstract-text">{paper.abstract}</div>
        </div>

        <div className="drawer-section">
          <span className="drawer-section-title">Interactive Notes</span>
          <textarea
            className="drawer-notes-area"
            value={notes}
            onChange={handleNotesChange}
            placeholder="Type notes, summarize findings, or draft synthesis points here. These notes are shared and indexable by the synthesis matrix..."
          />
        </div>

        <div className="drawer-section">
          <span className="drawer-section-title">Citation Generator</span>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            {citationStyles.map((style) => (
              <button
                key={style}
                className="tag-pill"
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  border: localStyle === style ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: localStyle === style ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  color: localStyle === style ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
                onClick={() => setLocalStyle(style)}
              >
                {style}
              </button>
            ))}
          </div>
          <div className="drawer-citation-box">
            <span style={{ display: 'block', paddingRight: '24px', whiteSpace: localStyle === 'BibTeX' ? 'pre-wrap' : 'normal', fontFamily: localStyle === 'BibTeX' ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: localStyle === 'BibTeX' ? '11px' : '12px' }}>
              {generateCitation(paper, localStyle)}
            </span>
            <button className="btn btn-icon-only drawer-citation-copy" onClick={handleCopyCitation}>
              {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AddPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPaperModal: React.FC<AddPaperModalProps> = ({ isOpen, onClose }) => {
  const { addPaper } = useWorkspace();
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [journal, setJournal] = useState('');
  const [doi, setDoi] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [abstract, setAbstract] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !authors) return;

    addPaper({
      title,
      authors,
      year: Number(year),
      journal,
      doi: doi || undefined,
      url: url || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      abstract: abstract || 'No abstract provided.',
      citations: [],
      notes: ''
    });

    // Reset Form
    setTitle('');
    setAuthors('');
    setYear(new Date().getFullYear());
    setJournal('');
    setDoi('');
    setUrl('');
    setTags('');
    setAbstract('');
    onClose();
  };

  const handleDOIAutofill = () => {
    // Simulate auto-filling details from crossref/DOI
    if (!doi) return;
    setTitle('Generated Paper from DOI: ' + doi);
    setAuthors('Smith, J., & Doe, A.');
    setYear(2023);
    setJournal('International Journal of Advanced Research');
    setAbstract('This abstract was auto-filled using the DOI resolver simulator. In real environments, Aura queries open API endpoints like Crossref or OpenAlex to resolve academic metadata, authors, publishers, abstracts, and reference counts instantly.');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add Reference Paper</h3>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group" style={{ flexDirection: 'row', gap: '8px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Autofill via DOI (Simulated)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., 10.1145/10123.10124"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                />
              </div>
              <button type="button" className="btn btn-secondary" onClick={handleDOIAutofill} disabled={!doi}>
                Resolve DOI
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

            <div className="form-group">
              <label>Paper Title *</label>
              <input
                type="text"
                className="input-field"
                required
                placeholder="e.g., Attention Is All You Need"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Authors * (comma separated)</label>
              <input
                type="text"
                className="input-field"
                required
                placeholder="e.g., Ashish Vaswani, Noam Shazeer"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div className="form-group">
                <label>Publication Year</label>
                <input
                  type="number"
                  className="input-field"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Journal / Venue</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., NeurIPS"
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>URL Link</label>
              <input
                type="url"
                className="input-field"
                placeholder="e.g., https://arxiv.org/abs/1706.03762"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Deep Learning, Transformer, NLP"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Abstract</label>
              <textarea
                className="input-field"
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder="Paste the abstract here..."
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Paper
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
