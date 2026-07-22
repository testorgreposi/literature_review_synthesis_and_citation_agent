import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Paper, CitationStyle, SynthesisTheme, SynthesisMatrixRow, DraftDocument, UploadedPDF, UserProfile, ChatMessage, ResearchProject, AuthUser } from '../types';

interface WorkspaceContextProps {
  projects: ResearchProject[];
  activeProjectId: string;
  activeProject: ResearchProject;
  setActiveProjectId: (id: string) => void;
  createNewProject: (name: string, description: string, deadline: string) => void;
  deleteProject: (id: string) => void;

  papers: Paper[];
  selectedPaperIdsForSynthesis: string[];
  activeDocument: DraftDocument;
  themes: SynthesisTheme[];
  matrixRows: SynthesisMatrixRow[];
  currentTab: 'dashboard' | 'chatbot' | 'matrix' | 'graph' | 'editor';
  citationStyle: CitationStyle;
  themeMode: 'light' | 'dark';
  activePaperId: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setCurrentTab: (tab: 'dashboard' | 'chatbot' | 'matrix' | 'graph' | 'editor') => void;
  setCitationStyle: (style: CitationStyle) => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setActivePaperId: (id: string | null) => void;
  togglePaperSelectionForSynthesis: (id: string) => void;
  addPaper: (paper: Omit<Paper, 'id'>) => void;
  updatePaperNotes: (id: string, notes: string) => void;
  updateDocumentContent: (content: string) => void;
  updateDocumentTitle: (title: string) => void;
  updateMatrixCell: (paperId: string, themeId: string, value: string) => void;
  addMatrixTheme: (label: string) => void;
  removeMatrixTheme: (themeId: string) => void;
  generateCitation: (paper: Paper, style: CitationStyle) => string;
  generateAllCitationsForDoc: () => string[];
  triggerAISynthesis: (prompt: string) => Promise<string>;
  
  userProfile: UserProfile;
  uploadedPDFs: UploadedPDF[];
  chatbotMessages: ChatMessage[];
  simulatePDFUpload: (fileName: string, fileSize: string, pages: number) => void;
  deleteUploadedPDF: (id: string) => void;
  sendChatbotMessage: (text: string, activePdfId: string | null) => void;
  clearChatHistory: () => void;

  user: AuthUser | null;
  signIn: (email: string, pass: string, name?: string) => Promise<boolean>;
  signUp: (email: string, pass: string, name: string) => Promise<boolean>;
  signOut: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);
const API_URL = 'http://localhost:8080/api';

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj-1');
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'chatbot' | 'matrix' | 'graph' | 'editor'>('dashboard');
  const [citationStyle, setCitationStyle] = useState<CitationStyle>('APA');
  
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme_mode');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Alex Mercer',
    role: 'Student',
    institution: 'State University',
    projectTitle: 'Literature Syntheses Agent',
    targetDeadline: '2026-08-24',
    savedSummariesCount: 1
  });

  const [chatbotMessages, setChatbotMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-start',
      sender: 'bot',
      text: '👋 Welcome to BIG BALLOON! I am your study chatbot assistant. Select a project in the sidebar, open a PDF on the dashboard or select it in the chat panel, and AURA will guide you page-by-page. Ask questions, get summaries, or request bullet points!',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Sync projects from Java Backend on load
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/projects`);
      if (res.ok) {
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects);
        }
      }
    } catch (err) {
      console.error('Failed to connect to Java server, using static fallback.', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme_mode', themeMode);
    const body = document.body;
    if (themeMode === 'dark') {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
  }, [themeMode]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  // Auth Methods communicating with Java Server
  const signIn = async (email: string, pass: string, name?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, name })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setUserProfile(prev => ({ ...prev, name: data.name }));
        fetchProjects();
        return true;
      }
    } catch (err) {
      // Offline fallback
      const fallback: AuthUser = { email, name: name || email.split('@')[0], isLoggedIn: true };
      setUser(fallback);
      setUserProfile(prev => ({ ...prev, name: fallback.name }));
      return true;
    }
    return false;
  };

  const signUp = async (email: string, pass: string, name: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, name })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setUserProfile(prev => ({ ...prev, name: data.name }));
        fetchProjects();
        return true;
      }
    } catch (err) {
      // Offline fallback
      const fallback: AuthUser = { email, name, isLoggedIn: true };
      setUser(fallback);
      setUserProfile(prev => ({ ...prev, name }));
      return true;
    }
    return false;
  };

  const signOut = () => {
    setUser(null);
    setCurrentTab('dashboard');
  };

  // Resolve active project
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || {
    id: 'proj-default',
    name: 'Default Project',
    description: 'Literature review workspace.',
    deadline: '2026-08-24',
    papers: [],
    uploadedPDFs: [],
    activeDocument: { id: 'doc-def', title: 'Default Draft', content: '# Welcome', lastSaved: '12:00' },
    themes: [],
    matrixRows: [],
    selectedPaperIdsForSynthesis: []
  };

  const papers = activeProject.papers;
  const uploadedPDFs = activeProject.uploadedPDFs;
  const activeDocument = activeProject.activeDocument;
  const themes = activeProject.themes || [];
  const matrixRows = activeProject.matrixRows || [];
  const selectedPaperIdsForSynthesis = activeProject.selectedPaperIdsForSynthesis || [];

  const createNewProject = async (name: string, description: string, deadline: string) => {
    try {
      const res = await fetch(`${API_URL}/projects/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, deadline })
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
        // Set new active project
        if (data.projects.length > 0) {
          setActiveProjectId(data.projects[data.projects.length - 1].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/projects/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePaperSelectionForSynthesis = (_id: string) => {
    // Local state toggle is fine
  };

  const addPaper = async (paperInput: Omit<Paper, 'id'>) => {
    try {
      const res = await fetch(`${API_URL}/papers/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paperInput, activeProjectId })
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updatePaperNotes = (_id: string, _notes: string) => {
    // Student simple stub notes
  };

  const updateDocumentContent = async (content: string) => {
    try {
      const res = await fetch(`${API_URL}/document/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeProjectId, title: activeDocument.title, content })
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateDocumentTitle = async (title: string) => {
    try {
      const res = await fetch(`${API_URL}/document/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeProjectId, title, content: activeDocument.content })
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateMatrixCell = (_paperId: string, _themeId: string, _value: string) => {};
  const addMatrixTheme = (_label: string) => {};
  const removeMatrixTheme = (_themeId: string) => {};

  const generateCitation = (paper: Paper, _style: CitationStyle): string => {
    return `${paper.authors} (${paper.year}). ${paper.title}.`;
  };

  const generateAllCitationsForDoc = (): string[] => {
    return [];
  };

  const triggerAISynthesis = async (_prompt: string): Promise<string> => {
    return 'Summary matrix report output.';
  };

  // Upload PDF scan simulation to Java backend
  const simulatePDFUpload = async (fileName: string, fileSize: string, pages: number) => {
    try {
      const res = await fetch(`${API_URL}/pdf/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeProjectId, fileName, fileSize, pages })
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUploadedPDF = (_id: string) => {
    // Delete PDF
  };

  const clearChatHistory = () => {
    setChatbotMessages([
      { id: 'msg-start', sender: 'bot', text: 'Chat history cleared.', timestamp: '' }
    ]);
  };

  const sendChatbotMessage = (text: string, _activePdfId: string | null) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatbotMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: `🤖 [Local Query Response] "${text}" matches active sections outline. Citation references compiled.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatbotMessages(prev => [...prev, botMsg]);
    }, 500);
  };

  return (
    <WorkspaceContext.Provider value={{
      projects,
      activeProjectId,
      activeProject,
      setActiveProjectId,
      createNewProject,
      deleteProject,

      papers,
      selectedPaperIdsForSynthesis,
      activeDocument,
      themes,
      matrixRows,
      currentTab,
      citationStyle,
      themeMode,
      activePaperId,
      searchQuery,
      setSearchQuery,
      setCurrentTab,
      setCitationStyle,
      setThemeMode,
      setActivePaperId,
      togglePaperSelectionForSynthesis,
      addPaper,
      updatePaperNotes,
      updateDocumentContent,
      updateDocumentTitle,
      updateMatrixCell,
      addMatrixTheme,
      removeMatrixTheme,
      generateCitation,
      generateAllCitationsForDoc,
      triggerAISynthesis,
      
      userProfile,
      uploadedPDFs,
      chatbotMessages,
      simulatePDFUpload,
      deleteUploadedPDF,
      sendChatbotMessage,
      clearChatHistory,

      user,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
