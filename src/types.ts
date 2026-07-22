export interface Paper {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi?: string;
  tags: string[];
  abstract: string;
  notes: string;
  citations: string[]; // List of other Paper IDs this paper cites
  url?: string;
}

export type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'Harvard' | 'BibTeX';

export interface SynthesisTheme {
  id: string;
  label: string;
}

export interface SynthesisMatrixRow {
  paperId: string;
  themeValues: Record<string, string>; // Maps themeId to text value
}

export interface DraftDocument {
  id: string;
  title: string;
  content: string;
  lastSaved: string;
}

export interface PDFSection {
  id: string;
  title: string;
  pageNumber: number;
  content: string;
}

export interface UploadedPDF {
  id: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  pages: number;
  summary: string;
  simplifiedText: {
    eli5: string;      // Explain like I'm 5
    standard: string;  // Standard undergraduate summary
    detailed: string;  // Detailed executive key points
  };
  associatedPaperId?: string; // Link to reference library if applicable
  sections?: PDFSection[];    // Structured PDF text sections for side-by-side reader
}

export interface UserProfile {
  name: string;
  role: 'Student' | 'Researcher' | 'Employee';
  institution: string;
  projectTitle: string;
  targetDeadline: string;
  savedSummariesCount: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface ResearchProject {
  id: string;
  name: string;
  description: string;
  deadline: string;
  papers: Paper[];
  uploadedPDFs: UploadedPDF[];
  activeDocument: DraftDocument;
  themes: SynthesisTheme[];
  matrixRows: SynthesisMatrixRow[];
  selectedPaperIdsForSynthesis: string[];
}

export interface AuthUser {
  email: string;
  name: string;
  isLoggedIn: boolean;
}
