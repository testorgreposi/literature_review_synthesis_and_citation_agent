import { Injectable, signal, computed, effect } from '@angular/core';
import type { Paper, CitationStyle, SynthesisTheme, SynthesisMatrixRow, DraftDocument, UploadedPDF, UserProfile, ChatMessage, ResearchProject, AuthUser } from './types';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private readonly API_URL = 'http://localhost:8080/api';

  // Signals
  readonly user = signal<AuthUser | null>(null);
  readonly projects = signal<ResearchProject[]>([]);
  readonly activeProjectId = signal<string>('proj-1');
  readonly currentTab = signal<'dashboard' | 'projects' | 'documents' | 'synthesis' | 'chatbot' | 'citations' | 'outlines' | 'extracts' | 'notes' | 'templates' | 'settings' | 'profile'>('dashboard');
  readonly citationStyle = signal<CitationStyle>('APA');
  readonly themeMode = signal<'light' | 'dark'>('light');
  readonly activePaperId = signal<string | null>(null);
  readonly searchQuery = signal<string>('');
  
  readonly userProfile = signal<UserProfile>({
    name: 'Nasheer',
    role: 'Researcher',
    institution: 'Codewit Institute of Engineering & Technology',
    projectTitle: 'RESEARCH FLOW AI',
    targetDeadline: '2026-09-01',
    savedSummariesCount: 1
  });

  readonly chatbotMessages = signal<ChatMessage[]>([
    {
      id: 'msg-start',
      sender: 'bot',
      text: '👋 Welcome to RESEARCH FLOW AI! I am your study chatbot assistant. Open a PDF on the dashboard or select it in the chat panel, and AURA will guide you page-by-page.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Computed state
  readonly activeProject = computed(() => {
    const list = this.projects();
    const activeId = this.activeProjectId();
    return list.find(p => p.id === activeId) || list[0] || this.fallbackProject();
  });

  readonly papers = computed(() => this.activeProject().papers);
  readonly uploadedPDFs = computed(() => this.activeProject().uploadedPDFs);
  readonly activeDocument = computed(() => this.activeProject().activeDocument);
  readonly themes = computed(() => this.activeProject().themes || []);
  readonly matrixRows = computed(() => this.activeProject().matrixRows || []);
  readonly selectedPaperIdsForSynthesis = computed(() => this.activeProject().selectedPaperIdsForSynthesis || []);

  constructor() {
    // Load auth from localStorage
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      this.user.set(JSON.parse(savedUser));
    }

    // Load theme mode
    const savedTheme = localStorage.getItem('theme_mode') as 'light' | 'dark';
    if (savedTheme) {
      this.themeMode.set(savedTheme);
    }

    // Effect for theme class
    effect(() => {
      const mode = this.themeMode();
      localStorage.setItem('theme_mode', mode);
      const body = document.body;
      if (mode === 'dark') {
        body.classList.add('dark-theme');
      } else {
        body.classList.remove('dark-theme');
      }
    });

    // Effect for user localStorage
    effect(() => {
      const u = this.user();
      if (u) {
        localStorage.setItem('auth_user', JSON.stringify(u));
      } else {
        localStorage.removeItem('auth_user');
      }
    });

    // Fetch initial projects
    this.fetchProjects();
  }

  private fallbackProject(): ResearchProject {
    return {
      id: 'proj-1',
      name: 'Modern Research Workflows',
      description: 'Literature review exploring systematic mapping and AI ethics.',
      deadline: '2026-08-24',
      papers: [],
      uploadedPDFs: [],
      activeDocument: {
        id: 'doc-1',
        title: 'Literature Review: Modern Research Workflows',
        content: '# Literature Review\n\nProtocols adaptation standard SLR guidelines.',
        lastSaved: '12:00 PM'
      },
      themes: [],
      matrixRows: [],
      selectedPaperIdsForSynthesis: []
    };
  }

  async fetchProjects() {
    try {
      const res = await fetch(`${this.API_URL}/projects`);
      if (res.ok) {
        const data = await res.json();
        if (data.projects) {
          this.projects.set(data.projects);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend server connection failed, using static data.');
    }
    // Set fallback if projects empty
    if (this.projects().length === 0) {
      this.projects.set([this.fallbackProject()]);
    }
  }

  async signIn(email: string, pass: string, name?: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.API_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, name })
      });
      if (res.ok) {
        const data = await res.json();
        this.user.set(data);
        this.userProfile.update(prev => ({ ...prev, name: data.name }));
        this.fetchProjects();
        return true;
      }
    } catch (err) {
      // Offline fallback
      const fallback: AuthUser = { email, name: name || email.split('@')[0], isLoggedIn: true };
      this.user.set(fallback);
      this.userProfile.update(prev => ({ ...prev, name: fallback.name }));
      this.fetchProjects();
      return true;
    }
    return false;
  }

  async signUp(email: string, pass: string, name: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, name })
      });
      if (res.ok) {
        const data = await res.json();
        this.user.set(data);
        this.userProfile.update(prev => ({ ...prev, name: data.name }));
        this.fetchProjects();
        return true;
      }
    } catch (err) {
      // Offline fallback
      const fallback: AuthUser = { email, name, isLoggedIn: true };
      this.user.set(fallback);
      this.userProfile.update(prev => ({ ...prev, name }));
      this.fetchProjects();
      return true;
    }
    return false;
  }

  signOut() {
    this.user.set(null);
    this.currentTab.set('dashboard');
  }

  async createNewProject(name: string, description: string, deadline: string) {
    try {
      const res = await fetch(`${this.API_URL}/projects/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, deadline })
      });
      if (res.ok) {
        const data = await res.json();
        this.projects.set(data.projects);
        if (data.projects.length > 0) {
          this.activeProjectId.set(data.projects[data.projects.length - 1].id);
        }
        return;
      }
    } catch (err) {
      console.error(err);
    }

    // Offline implementation
    const newProj: ResearchProject = {
      id: `proj-${Date.now()}`,
      name,
      description,
      deadline,
      papers: [],
      uploadedPDFs: [],
      activeDocument: { id: `doc-${Date.now()}`, title: `Draft: ${name}`, content: '', lastSaved: 'Now' },
      themes: [],
      matrixRows: [],
      selectedPaperIdsForSynthesis: []
    };
    this.projects.update(list => [...list, newProj]);
    this.activeProjectId.set(newProj.id);
  }

  async deleteProject(id: string) {
    try {
      const res = await fetch(`${this.API_URL}/projects/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        this.projects.set(data.projects);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    // Offline implementation
    this.projects.update(list => list.filter(p => p.id !== id));
    if (this.activeProjectId() === id) {
      const remaining = this.projects();
      if (remaining.length > 0) {
        this.activeProjectId.set(remaining[0].id);
      }
    }
  }

  async addPaper(paperInput: Omit<Paper, 'id'>) {
    try {
      const res = await fetch(`${this.API_URL}/papers/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...paperInput, activeProjectId: this.activeProjectId() })
      });
      if (res.ok) {
        const data = await res.json();
        this.projects.set(data.projects);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    // Offline implementation
    const newPaper: Paper = {
      ...paperInput,
      id: `paper-${Date.now()}`
    };
    this.projects.update(list => list.map(p => {
      if (p.id === this.activeProjectId()) {
        return {
          ...p,
          papers: [...p.papers, newPaper]
        };
      }
      return p;
    }));
  }

  async updateDocumentContent(content: string) {
    try {
      const res = await fetch(`${this.API_URL}/document/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeProjectId: this.activeProjectId(), title: this.activeDocument().title, content })
      });
      if (res.ok) {
        const data = await res.json();
        this.projects.set(data.projects);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    // Offline implementation
    this.projects.update(list => list.map(p => {
      if (p.id === this.activeProjectId()) {
        return {
          ...p,
          activeDocument: { ...p.activeDocument, content }
        };
      }
      return p;
    }));
  }

  async updateDocumentTitle(title: string) {
    try {
      const res = await fetch(`${this.API_URL}/document/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeProjectId: this.activeProjectId(), title, content: this.activeDocument().content })
      });
      if (res.ok) {
        const data = await res.json();
        this.projects.set(data.projects);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    // Offline implementation
    this.projects.update(list => list.map(p => {
      if (p.id === this.activeProjectId()) {
        return {
          ...p,
          activeDocument: { ...p.activeDocument, title }
        };
      }
      return p;
    }));
  }

  async uploadPDFFile(file: File): Promise<boolean> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('activeProjectId', this.activeProjectId());

    try {
      const res = await fetch(`${this.API_URL}/pdf/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        this.projects.set(data.projects);
        return true;
      }
    } catch (err) {
      console.error(err);
    }

    // Offline implementation
    const newPDF: UploadedPDF = {
      id: `pdf-${Date.now()}`,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      pages: 12,
      summary: 'Simulated upload summary.',
      simplifiedText: { eli5: 'ELI5 summary', standard: 'Standard summary', detailed: 'Detailed summary' }
    };
    this.projects.update(list => list.map(p => {
      if (p.id === this.activeProjectId()) {
        return {
          ...p,
          uploadedPDFs: [...p.uploadedPDFs, newPDF]
        };
      }
      return p;
    }));
    return true;
  }

  deleteUploadedPDF(id: string) {
    this.projects.update(list => list.map(p => {
      if (p.id === this.activeProjectId()) {
        return {
          ...p,
          uploadedPDFs: p.uploadedPDFs.filter(pdf => pdf.id !== id)
        };
      }
      return p;
    }));
  }

  clearChatHistory() {
    this.chatbotMessages.set([
      { id: 'msg-start', sender: 'bot', text: 'Chat history cleared.', timestamp: '' }
    ]);
  }

  async updatePaperNotes(paperId: string, notes: string) {
    try {
      const res = await fetch(`${this.API_URL}/papers/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, notes })
      });
      if (res.ok) {
        const data = await res.json();
        this.projects.set(data.projects);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    // Offline fallback
    this.projects.update(list => list.map(p => {
      if (p.id === this.activeProjectId()) {
        return {
          ...p,
          papers: p.papers.map(paper => paper.id === paperId ? { ...paper, notes } : paper)
        };
      }
      return p;
    }));
  }

  async sendChatbotMessage(text: string, activePdfId: string | null) {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString()
    };
    this.chatbotMessages.update(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${this.API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });
      if (res.ok) {
        const data = await res.json();
        this.chatbotMessages.update(prev => [...prev, data]);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        text: `🤖 [RESEARCH FLOW AI] Fallback: "${text}" received. Configure GEMINI_API_KEY environment variable to use real Gemini AI!`,
        timestamp: new Date().toLocaleTimeString()
      };
      this.chatbotMessages.update(prev => [...prev, botMsg]);
    }
  }
}
