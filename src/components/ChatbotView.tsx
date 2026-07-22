import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Send, FileText, Bot, User, Trash2 } from 'lucide-react';

export const ChatbotView: React.FC = () => {
  const {
    uploadedPDFs,
    chatbotMessages,
    sendChatbotMessage,
    clearChatHistory
  } = useWorkspace();

  const [inputText, setInputText] = useState('');
  const [activePdfId, setActivePdfId] = useState<string | null>(
    uploadedPDFs.length > 0 ? uploadedPDFs[0].id : null
  );

  // Section index reader state
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Set default active section when active pdf changes
  useEffect(() => {
    const selectedPdf = uploadedPDFs.find(p => p.id === activePdfId);
    if (selectedPdf && selectedPdf.sections && selectedPdf.sections.length > 0) {
      setActiveSectionId(selectedPdf.sections[0].id);
    } else {
      setActiveSectionId(null);
    }
  }, [activePdfId, uploadedPDFs]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatbotMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendChatbotMessage(inputText, activePdfId);
    setInputText('');
  };

  const handleQuickPrompt = (promptText: string) => {
    sendChatbotMessage(promptText, activePdfId);
  };

  const handleQuerySection = (sectionTitle: string, sectionContent: string) => {
    sendChatbotMessage(`Summarize this section: "${sectionTitle}". Content: ${sectionContent}`, activePdfId);
  };

  const handleHighlightToChat = (text: string) => {
    sendChatbotMessage(`Highlight reference: ${text}. What does this mean in the context of this paper?`, activePdfId);
  };

  const activePdf = uploadedPDFs.find(p => p.id === activePdfId);
  const activeSection = activePdf?.sections?.find(s => s.id === activeSectionId);

  return (
    <div className="chatbot-container animate-fade-in">
      {/* 1. Sidebar - PDF document selector */}
      <aside className="chatbot-sidebar">
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
          Select Document
        </h4>

        {uploadedPDFs.length === 0 ? (
          <div style={{ padding: '16px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            No PDFs scanned yet. Add mock files on the dashboard first!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
            {uploadedPDFs.map(pdf => (
              <button
                key={pdf.id}
                className={`sidebar-nav-item ${activePdfId === pdf.id ? 'active' : ''}`}
                onClick={() => setActivePdfId(pdf.id)}
                style={{ padding: '8px 10px', fontSize: '13px' }}
              >
                <FileText size={16} style={{ color: activePdfId === pdf.id ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>
                  {pdf.fileName}
                </span>
              </button>
            ))}
          </div>
        )}

        <button className="btn btn-secondary" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }} onClick={clearChatHistory}>
          <Trash2 size={14} />
          Clear Chat Log
        </button>
      </aside>

      {/* 2. Split Screen content */}
      <div className="chatbot-split-screen">
        
        {/* Left split: Interactive PDF Reader Sheet */}
        <div className="pdf-reader-pane">
          {activePdf ? (
            <>
              {/* Table of Contents section buttons */}
              {activePdf.sections && activePdf.sections.length > 0 && (
                <div className="pdf-reader-toc">
                  {activePdf.sections.map(s => (
                    <button
                      key={s.id}
                      className={`pdf-toc-btn ${activeSectionId === s.id ? 'active' : ''}`}
                      onClick={() => setActiveSectionId(s.id)}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Render Georgia Paper Sheet */}
              <div className="pdf-page-display">
                {activeSection ? (
                  <div className="pdf-paper-sheet">
                    <div className="pdf-sheet-header">
                      <span>{activePdf.fileName} &bull; Page {activeSection.pageNumber} of {activePdf.pages}</span>
                    </div>
                    
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, color: '#111111', margin: '0 0 16px' }}>
                      {activeSection.title}
                    </h3>
                    
                    <p className="pdf-text-highlightable" style={{ color: '#222222', fontSize: '14.5px', lineHeight: '1.7', margin: 0 }}>
                      {activeSection.content}
                    </p>

                    {/* Quick highlight / Query block */}
                    <div style={{ marginTop: '32px', padding: '16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Document Scaffolding Actions
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => handleQuerySection(activeSection.title, activeSection.content)}
                        >
                          Summarize Section
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => handleHighlightToChat(activeSection.content.substring(0, 80) + '...')}
                        >
                          Query selection context
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#ffffff', textAlign: 'center', opacity: 0.8 }}>
                    Select a section to begin reading.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <FileText size={48} style={{ margin: '0 auto 16px' }} />
                <span>Upload PDFs on the dashboard to view them here.</span>
              </div>
            </div>
          )}
        </div>

        {/* Right split: Conversational Chatbot */}
        <div className="chatbot-main-area">
          {/* Chat Header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} />
            </div>
            <div>
              <strong style={{ fontSize: '14px', display: 'block' }}>AURA Chat assistant</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Conversational AI Reader</span>
            </div>
          </div>

          {/* Messages list */}
          <div className="chat-messages-scroll" ref={scrollRef}>
            {chatbotMessages.map(msg => (
              <div
                key={msg.id}
                className={`chat-bubble ${msg.sender === 'bot' ? 'chat-bubble-bot' : 'chat-bubble-user'}`}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ marginTop: '2px', display: 'inline-block' }}>
                    {msg.sender === 'bot' ? <Bot size={14} style={{ color: 'var(--accent-primary)' }} /> : <User size={14} />}
                  </span>
                  <div style={{ flex: 1 }}>
                    {msg.text}
                  </div>
                </div>
                <span style={{ display: 'block', textAlign: 'right', fontSize: '9px', opacity: 0.6, marginTop: '6px' }}>
                  {msg.timestamp}
                </span>
              </div>
            ))}
          </div>

          {/* Prompt shortcuts */}
          {activePdf && (
            <div className="chat-level-toggles">
              <button className="tag-pill" style={{ fontSize: '11px' }} onClick={() => handleQuickPrompt(`Explain "${activePdf.fileName}" simply.`)}>
                👶 Explain simply (ELI5)
              </button>
              <button className="tag-pill" style={{ fontSize: '11px' }} onClick={() => handleQuickPrompt(`Give me the detailed key points of "${activePdf.fileName}".`)}>
                💼 Detailed Bullet Points
              </button>
            </div>
          )}

          {/* Input field */}
          <form onSubmit={handleSend} className="chat-input-row">
            <input
              type="text"
              className="input-field"
              style={{ flex: 1, padding: '12px 16px' }}
              placeholder={activePdf ? "Ask about the document content..." : "Query AURA study rooms..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 18px' }} disabled={!inputText.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
export default ChatbotView;
