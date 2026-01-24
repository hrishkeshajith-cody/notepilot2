export type AppTheme = 'default' | 'emerald' | 'violet' | 'rose' | 'amber' | 'original';
export type AppFont = 'Inter' | 'Playfair Display' | 'JetBrains Mono' | 'Quicksand';
export type AppShape = 'sharp' | 'default' | 'rounded';

export interface StudyPackMeta {
  subject: string;
  grade: string;
  chapter_title: string;
  language: string;
}

export interface KeyTerm {
  term: string;
  meaning: string;
  example: string;
}

export interface Flashcard {
  q: string;
  a: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard" | string;
}

export interface Quiz {
  instructions: string;
  questions: QuizQuestion[];
}

export interface NoteSection {
  title: string;
  content: string;
}

export interface ImportantQuestion {
  question: string;
  answer: string;
}

export interface ImportantQuestions {
  one_mark: ImportantQuestion[];
  three_mark: ImportantQuestion[];
  five_mark: ImportantQuestion[];
}

export interface StudyPack {
  meta: StudyPackMeta;
  summary: {
    tl_dr: string;
    important_points: string[];
  };
  notes?: NoteSection[];
  key_terms: KeyTerm[];
  flashcards: Flashcard[];
  quiz: Quiz;
  important_questions?: ImportantQuestions;
}

export interface InputFormData {
  grade: string;
  subject: string;
  chapterTitle: string;
  language: string;
  chapterText: string;
  pdfData?: string;
}

export interface UserPreferences {
  theme: AppTheme;
  font: AppFont;
  shape: AppShape;
}
