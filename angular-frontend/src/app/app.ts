import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from './workspace.service';
import type { Paper } from './types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly workspaceService = inject(WorkspaceService);

  // Local Component States
  readonly activePdfId = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly inputText = signal('');
  
  // Modals & Drawers
  readonly isAddPaperModalOpen = signal(false);
  readonly inspectedPaperId = signal<string | null>(null);
  readonly inspectedPaper = computed(() => {
    const papers = this.workspaceService.papers();
    return papers.find(p => p.id === this.inspectedPaperId());
  });

  // Settings Forms
  readonly projName = signal('');
  readonly projDesc = signal('');
  readonly activeModel = signal('GPT-4o');

  // Profile Forms
  readonly profName = signal('Nasheer');
  readonly profEmail = signal('nasheer@example.com');
  readonly profAffil = signal('Codewit Institute of Engineering & Technology');

  // New Paper Form
  readonly newPaperTitle = signal('');
  readonly newPaperAuthors = signal('');
  readonly newPaperYear = signal(2026);
  readonly newPaperJournal = signal('');
  readonly newPaperAbstract = signal('');

  constructor() {
    // Initialize form states from service when loaded
    const activeProj = this.workspaceService.activeProject();
    this.projName.set(activeProj.name);
    this.projDesc.set(activeProj.description);
    
    // Set default active PDF if any exists
    const pdfs = this.workspaceService.uploadedPDFs();
    if (pdfs.length > 0) {
      this.activePdfId.set(pdfs[0].id);
    }
  }

  // Getters for computed signals from service
  get currentTab() { return this.workspaceService.currentTab(); }
  get user() { return this.workspaceService.user(); }
  get projects() { return this.workspaceService.projects(); }
  get papers() { return this.workspaceService.papers(); }
  get uploadedPDFs() { return this.workspaceService.uploadedPDFs(); }
  get activeDocument() { return this.workspaceService.activeDocument(); }
  get chatbotMessages() { return this.workspaceService.chatbotMessages(); }
  get citationStyle() { return this.workspaceService.citationStyle(); }

  setTab(tab: 'dashboard' | 'projects' | 'documents' | 'synthesis' | 'chatbot' | 'citations' | 'settings' | 'profile') {
    this.workspaceService.currentTab.set(tab);
  }

  handleSimulatedUpload() {
    this.workspaceService.simulatePDFUpload('graph_neural_networks.pdf', '2.4 MB', 12);
    // Auto-select uploaded PDF
    setTimeout(() => {
      const pdfs = this.workspaceService.uploadedPDFs();
      if (pdfs.length > 0) {
        this.activePdfId.set(pdfs[pdfs.length - 1].id);
      }
    }, 100);
  }

  handleDeletePDF(id: string) {
    this.workspaceService.deleteUploadedPDF(id);
    if (this.activePdfId() === id) {
      const remaining = this.workspaceService.uploadedPDFs();
      this.activePdfId.set(remaining.length > 0 ? remaining[0].id : null);
    }
  }

  handleSendChat(e?: Event) {
    if (e) e.preventDefault();
    const text = this.inputText().trim();
    if (!text) return;
    this.workspaceService.sendChatbotMessage(text, this.activePdfId());
    this.inputText.set('');
  }

  handleQuickPrompt(promptText: string) {
    this.workspaceService.sendChatbotMessage(promptText, this.activePdfId());
  }

  getFilteredPapers() {
    const query = this.searchQuery().toLowerCase();
    const list = this.papers;
    if (!query) return list;
    return list.filter((p: Paper) => 
      p.title.toLowerCase().includes(query) || 
      p.authors.toLowerCase().includes(query)
    );
  }

  saveSettings() {
    const activeProj = this.workspaceService.activeProject();
    activeProj.name = this.projName();
    activeProj.description = this.projDesc();
    alert('Settings saved successfully!');
  }

  saveProfile() {
    this.workspaceService.userProfile.update(prev => ({
      ...prev,
      name: this.profName(),
      institution: this.profAffil()
    }));
    alert('Profile updated successfully!');
  }

  toggleTheme() {
    const current = this.workspaceService.themeMode();
    this.workspaceService.themeMode.set(current === 'light' ? 'dark' : 'light');
  }

  openAddPaperModal() {
    this.isAddPaperModalOpen.set(true);
  }

  closeAddPaperModal() {
    this.isAddPaperModalOpen.set(false);
  }

  submitNewPaper(e: Event) {
    e.preventDefault();
    if (!this.newPaperTitle().trim()) return;

    this.workspaceService.addPaper({
      title: this.newPaperTitle().trim(),
      authors: this.newPaperAuthors().trim() || 'Unknown Authors',
      year: this.newPaperYear(),
      journal: this.newPaperJournal().trim() || 'Conference/Journal',
      tags: ['Manual Add'],
      abstract: this.newPaperAbstract().trim() || 'No abstract available.',
      notes: '',
      citations: []
    });

    // Reset Form
    this.newPaperTitle.set('');
    this.newPaperAuthors.set('');
    this.newPaperYear.set(2026);
    this.newPaperJournal.set('');
    this.newPaperAbstract.set('');
    this.closeAddPaperModal();
  }

  // Simple Auth stubs
  authEmail = signal('');
  authPassword = signal('');
  authName = signal('');
  isSignUpMode = signal(false);

  handleAuthSubmit(e: Event) {
    e.preventDefault();
    if (this.isSignUpMode()) {
      this.workspaceService.signUp(this.authEmail(), this.authPassword(), this.authName() || 'User');
    } else {
      this.workspaceService.signIn(this.authEmail(), this.authPassword());
    }
  }
}
