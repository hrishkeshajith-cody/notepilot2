import { createContext, useContext, useState, ReactNode } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface StudyContext {
  subject?: string;
  grade?: string;
  chapter_title?: string;
  summary?: any;
  key_terms?: any[];
}

interface NotePilotContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: Message[];
  addMessage: (message: Omit<Message, "id">) => void;
  clearMessages: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  askAbout: (content: string, type: string) => void;
  studyContext: StudyContext | null;
  setStudyContext: (context: StudyContext | null) => void;
  sessionId: string;
  suggestedQuestions: string[];
  setSuggestedQuestions: (questions: string[]) => void;
}

const NotePilotContext = createContext<NotePilotContextType | undefined>(undefined);

// Generate a persistent session ID
const getOrCreateSessionId = () => {
  const stored = localStorage.getItem('notepilot_session_id');
  if (stored) return stored;
  
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('notepilot_session_id', newSessionId);
  return newSessionId;
};

export const NotePilotProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [studyContext, setStudyContext] = useState<StudyContext | null>(null);
  const [sessionId] = useState(getOrCreateSessionId());
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const addMessage = (message: Omit<Message, "id">) => {
    const newMessage = { ...message, id: crypto.randomUUID(), timestamp: new Date() };
    setMessages((prev) => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
    setSuggestedQuestions([]);
  };

  const askAbout = (content: string, type: string) => {
    setIsOpen(true);
    const userMessage = `Explain this ${type}: "${content}"`;
    addMessage({ role: "user", content: userMessage });
  };

  return (
    <NotePilotContext.Provider
      value={{
        isOpen,
        setIsOpen,
        messages,
        addMessage,
        clearMessages,
        isLoading,
        setIsLoading,
        askAbout,
        studyContext,
        setStudyContext,
        sessionId,
        suggestedQuestions,
        setSuggestedQuestions,
      }}
    >
      {children}
    </NotePilotContext.Provider>
  );
};

export const useNotePilot = () => {
  const context = useContext(NotePilotContext);
  if (!context) {
    throw new Error("useNotePilot must be used within a NotePilotProvider");
  }
  return context;
};
