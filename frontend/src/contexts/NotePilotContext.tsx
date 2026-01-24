import { createContext, useContext, useState, ReactNode } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
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
}

const NotePilotContext = createContext<NotePilotContextType | undefined>(undefined);

export const NotePilotProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (message: Omit<Message, "id">) => {
    const newMessage = { ...message, id: crypto.randomUUID() };
    setMessages((prev) => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
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
