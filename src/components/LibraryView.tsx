import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Search, Plus, BookOpen, User, Quote, CheckSquare } from 'lucide-react';
import { PaperDrawer, AddPaperModal } from './PaperDetails';

export const LibraryView: React.FC = () => {
  const {
    papers,
    selectedPaperIdsForSynthesis,
    togglePaperSelectionForSynthesis,
    activePaperId,
    setActivePaperId
  } = useWorkspace();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Extract all tags dynamically
  const allTags = Array.from(
    new Set(papers.flatMap(p => p.tags))
  );

  // Filter papers
  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      paper.title.toLowerCase().includes(search.toLowerCase()) ||
      paper.authors.toLowerCase().includes(search.toLowerCase()) ||
      paper.journal.toLowerCase().includes(search.toLowerCase());

    const matchesTag = selectedTag ? paper.tags.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  return (
    <div className="library-container animate-fade-in">
      <div className="library-main">
        {/* Filter / Search Bar */}
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search className="search-input-icon" size={16} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by title, authors, or journal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            Add Paper
          </button>
        </div>

        {/* Dynamic Tag Filter Chips */}
        <div className="tag-filter-list" style={{ marginBottom: '24px' }}>
          <button
            className={`tag-pill ${selectedTag === null ? 'active' : ''}`}
            onClick={() => setSelectedTag(null)}
          >
            All Papers
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag-pill ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Papers Grid */}
        {filteredPapers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px' }}>No papers found</h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              Try adjusting your filters or click "Add Paper" to upload a new research document.
            </p>
          </div>
        ) : (
          <div className="papers-grid">
            {filteredPapers.map((paper) => {
              const isSelected = selectedPaperIdsForSynthesis.includes(paper.id);
              
              return (
                <div
                  key={paper.id}
                  className="paper-card"
                  onClick={() => setActivePaperId(paper.id)}
                >
                  <div className="paper-card-header">
                    <button
                      className={`paper-card-select ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePaperSelectionForSynthesis(paper.id);
                      }}
                    >
                      {isSelected ? <CheckSquare size={12} /> : null}
                    </button>
                    <span className="paper-card-year">{paper.year}</span>
                  </div>

                  <h4 className="paper-card-title">{paper.title}</h4>

                  <div className="paper-card-authors" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={12} style={{ color: 'var(--text-muted)' }} />
                    <span>{paper.authors}</span>
                  </div>

                  <div className="paper-card-journal" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={12} style={{ color: 'var(--text-muted)' }} />
                    <span>{paper.journal}</span>
                  </div>

                  <div className="paper-card-tags">
                    {paper.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="badge">
                        {tag}
                      </span>
                    ))}
                    {paper.tags.length > 3 && (
                      <span className="badge">+{paper.tags.length - 3}</span>
                    )}
                  </div>

                  <div className="paper-card-footer">
                    <span className="paper-card-citations-count">
                      <Quote size={12} />
                      {paper.citations.length} connections
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drawer and Modal details */}
      <PaperDrawer paperId={activePaperId} onClose={() => setActivePaperId(null)} />
      <AddPaperModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};
export default LibraryView;
