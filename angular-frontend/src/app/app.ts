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

  // Local Component States (Signal for programmatical reactive state)
  readonly activePdfId = signal<string | null>(null);
  
  // Local Mutable Properties for [(ngModel)] Form Bindings
  searchQuery = '';
  inputText = '';
  
  // Dashboard & Navigation Sub-Tabs
  activeEditorTab: 'synthesis' | 'notes' | 'chatbot' | 'outlines' = 'synthesis';
  activeLibraryFilter: 'all' | 'recent' | 'favorites' | 'trash' = 'all';
  activeSettingsSubTab: 'general' | 'collaborators' | 'ai' | 'export' | 'citation' | 'delete' = 'general';

  // Favorites tracking
  favoritePaperIds = signal<Set<string>>(new Set());

  // Modals & Drawers
  readonly isAddPaperModalOpen = signal(false);
  readonly inspectedPaperId = signal<string | null>(null);
  readonly inspectedPaper = computed(() => {
    const papers = this.workspaceService.papers();
    return papers.find(p => p.id === this.inspectedPaperId());
  });
  inspectedPaperNotes = '';

  // Settings Forms
  projName = '';
  projDesc = '';
  activeModel = 'GPT-4o';

  // Profile Forms
  profName = 'Nasheer';
  profEmail = 'nasheer@example.com';
  profAffil = 'Codewit Institute of Engineering & Technology';

  // New Paper Form
  newPaperTitle = '';
  newPaperAuthors = '';
  newPaperYear = 2026;
  newPaperJournal = '';
  newPaperAbstract = '';

  // Auth Forms
  authEmail = '';
  authPassword = '';
  authName = '';
  isSignUpMode = false;

  constructor() {
    // Initialize form states from service when loaded
    const activeProj = this.workspaceService.activeProject();
    this.projName = activeProj.name;
    this.projDesc = activeProj.description;
    
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

  setTab(tab: 'dashboard' | 'projects' | 'documents' | 'synthesis' | 'chatbot' | 'citations' | 'outlines' | 'extracts' | 'notes' | 'templates' | 'settings' | 'profile') {
    this.workspaceService.currentTab.set(tab);
  }

  isUploading = false;

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Error: File size exceeds the maximum limit of 10MB.');
      input.value = '';
      return;
    }

    // Validate type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Error: Only PDF documents are allowed.');
      input.value = '';
      return;
    }

    // Prevent duplicate filenames
    const hasDuplicate = this.uploadedPDFs.some(pdf => pdf.fileName === file.name);
    if (hasDuplicate) {
      alert('Error: A document with this filename is already uploaded in the project.');
      input.value = '';
      return;
    }

    this.isUploading = true;

    try {
      const success = await this.workspaceService.uploadPDFFile(file);
      if (success) {
        setTimeout(() => {
          const pdfs = this.workspaceService.uploadedPDFs();
          if (pdfs.length > 0) {
            this.activePdfId.set(pdfs[pdfs.length - 1].id);
          }
        }, 100);
      } else {
        alert('Error: Failed to upload file to the server.');
      }
    } catch (err) {
      alert('Error: Failed to upload file due to a connection error.');
    } finally {
      this.isUploading = false;
      input.value = '';
    }
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
    const text = this.inputText.trim();
    if (!text) return;
    this.workspaceService.sendChatbotMessage(text, this.activePdfId());
    this.inputText = '';
  }

  handleQuickPrompt(promptText: string) {
    this.workspaceService.sendChatbotMessage(promptText, this.activePdfId());
  }

  getFilteredPapers() {
    const query = this.searchQuery.toLowerCase();
    let list = this.papers;

    // Filter by Active Library Filter Tab
    if (this.activeLibraryFilter === 'recent') {
      list = list.filter((p: Paper) => p.year >= 2017);
    } else if (this.activeLibraryFilter === 'favorites') {
      list = list.filter((p: Paper) => this.isFavorite(p.id));
    } else if (this.activeLibraryFilter === 'trash') {
      // Return empty or select subset for demo
      list = [];
    }

    if (!query) return list;
    return list.filter((p: Paper) => 
      p.title.toLowerCase().includes(query) || 
      p.authors.toLowerCase().includes(query)
    );
  }

  toggleFavorite(id: string, event?: Event) {
    if (event) event.stopPropagation();
    this.favoritePaperIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  isFavorite(id: string): boolean {
    return this.favoritePaperIds().has(id);
  }

  inspectPaper(id: string | null) {
    this.inspectedPaperId.set(id);
    if (id) {
      const paper = this.papers.find(p => p.id === id);
      this.inspectedPaperNotes = paper ? paper.notes : '';
    } else {
      this.inspectedPaperNotes = '';
    }
  }

  savePaperNotes() {
    const id = this.inspectedPaperId();
    if (id) {
      this.workspaceService.updatePaperNotes(id, this.inspectedPaperNotes);
      // Update local paper notes immediately
      const paper = this.papers.find(p => p.id === id);
      if (paper) {
        paper.notes = this.inspectedPaperNotes;
      }
      alert('Paper notes saved successfully!');
    }
  }

  saveSettings() {
    const activeProj = this.workspaceService.activeProject();
    activeProj.name = this.projName;
    activeProj.description = this.projDesc;
    alert('Settings saved successfully!');
  }

  saveProfile() {
    this.workspaceService.userProfile.update(prev => ({
      ...prev,
      name: this.profName,
      institution: this.profAffil
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
    if (!this.newPaperTitle.trim()) return;

    this.workspaceService.addPaper({
      title: this.newPaperTitle.trim(),
      authors: this.newPaperAuthors.trim() || 'Unknown Authors',
      year: this.newPaperYear,
      journal: this.newPaperJournal.trim() || 'Conference/Journal',
      tags: ['Manual Add'],
      abstract: this.newPaperAbstract.trim() || 'No abstract available.',
      notes: '',
      citations: []
    });

    // Reset Form
    this.newPaperTitle = '';
    this.newPaperAuthors = '';
    this.newPaperYear = 2026;
    this.newPaperJournal = '';
    this.newPaperAbstract = '';
    this.closeAddPaperModal();
  }

  handleAuthSubmit(e: Event) {
    e.preventDefault();
    if (this.isSignUpMode) {
      this.workspaceService.signUp(this.authEmail, this.authPassword, this.authName || 'User');
    } else {
      this.workspaceService.signIn(this.authEmail, this.authPassword);
    }
  }
}
