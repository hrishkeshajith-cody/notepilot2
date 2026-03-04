import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Trash2, Mic, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotePilot } from "@/contexts/NotePilotContext";
import { useToast } from "@/hooks/use-toast";

export const NotePilotChat = () => {
  const {
    isOpen,
    setIsOpen,
    messages,
    addMessage,
    clearMessages,
    isLoading,
    setIsLoading,
    studyContext,
    sessionId,
    suggestedQuestions,
    setSuggestedQuestions,
  } = useNotePilot();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize Web Speech API for voice input with enhanced settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        try {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true; // Keep listening
          recognitionRef.current.interimResults = true; // Show real-time results
          recognitionRef.current.lang = 'en-US';
          recognitionRef.current.maxAlternatives = 3; // Get multiple alternatives for better accuracy

          recognitionRef.current.onstart = () => {
            console.log('Voice recognition started');
            setIsListening(true);
            setInterimTranscript("");
          };

          recognitionRef.current.onresult = (event: any) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                final += transcript + ' ';
              } else {
                interim += transcript;
              }
            }

            // Update interim transcript for real-time display
            setInterimTranscript(interim);

            // If we have final results, add to input
            if (final) {
              setInput(prev => (prev + ' ' + final).trim());
              setInterimTranscript("");
            }
          };

          recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
              setIsListening(false);
              setInterimTranscript("");
            }
          };

          recognitionRef.current.onend = () => {
            console.log('Voice recognition ended');
            if (isListening) {
              // Auto-restart if still in listening mode (unless user stopped it)
              try {
                recognitionRef.current.start();
              } catch (err) {
                setIsListening(false);
                setInterimTranscript("");
              }
            } else {
              setInterimTranscript("");
            }
          };
        } catch (err) {
          console.error('Failed to initialize speech recognition:', err);
        }
      }
    }
  }, [isListening]);

  // Handle auto-response when a new user message is added via askAbout
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user" && !isLoading && messages.length > 0) {
      // Check if this message was already processed
      const hasResponse = messages.length > 1 && messages[messages.length - 2]?.role === "user";
      if (!hasResponse) {
        generateResponse(lastMessage.content);
      }
    }
  }, [messages]);

  const generateResponse = async (userMessage: string) => {
    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
      
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          study_context: studyContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat API error");
      }

      const data = await response.json();

      addMessage({
        role: "assistant",
        content: data.response || "I couldn't generate a response. Please try again.",
      });

      // Update suggested questions
      if (data.suggested_questions && data.suggested_questions.length > 0) {
        setSuggestedQuestions(data.suggested_questions);
      }
    } catch (error) {
      console.error("NotePilot AI error:", error);
      addMessage({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again!",
      });
      toast({
        title: "Chat error",
        description: "Failed to get response from AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    addMessage({ role: "user", content: input.trim() });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      // Silently fail - browser doesn't support it
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        setInterimTranscript("");
      } catch (err) {
        console.error('Error stopping recognition:', err);
        setIsListening(false);
        setInterimTranscript("");
      }
    } else {
      try {
        setInput(""); // Clear input when starting voice
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">NotePilot AI</h3>
                  <p className="text-xs text-muted-foreground">Your study assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearMessages}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Hey there! 👋</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    I'm NotePilot AI, your friendly study assistant. I have memory of our conversation and can help with your studies!
                  </p>
                  {studyContext && (
                    <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-xs text-primary font-medium">
                        📚 I can see you're studying: {studyContext.chapter_title}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                          message.role === "user"
                            ? "gradient-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-foreground rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && !isLoading && (
              <div className="px-4 py-2 border-t border-border bg-secondary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Suggested questions:</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSuggestedQuestions([])}
                    className="h-6 w-6 p-0 hover:bg-secondary"
                    title="Dismiss suggestions"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-xs px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border bg-secondary/30">
              {/* Real-time voice transcription display */}
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 p-3 bg-primary/10 border border-primary/30 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-5 bg-primary rounded-full animate-pulse" style={{ animationDelay: "75ms" }} />
                      <span className="w-1 h-6 bg-primary rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 h-5 bg-primary rounded-full animate-pulse" style={{ animationDelay: "225ms" }} />
                      <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs font-medium text-primary">Listening...</span>
                  </div>
                  {(input || interimTranscript) && (
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{input}</span>
                      {interimTranscript && (
                        <span className="text-muted-foreground italic"> {interimTranscript}</span>
                      )}
                    </p>
                  )}
                  {!input && !interimTranscript && (
                    <p className="text-xs text-muted-foreground italic">Speak now, I'm listening...</p>
                  )}
                </motion.div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={toggleVoiceInput}
                  disabled={isLoading}
                  size="icon"
                  variant={isListening ? "default" : "outline"}
                  className={`shrink-0 transition-all ${isListening ? "gradient-primary text-primary-foreground scale-110 shadow-lg" : "hover:scale-105"}`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Mic className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Listening..." : "Ask me anything..."}
                  disabled={isLoading || isListening}
                  className={`flex-1 bg-background transition-all ${isListening ? "border-primary/50" : ""}`}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="gradient-primary text-primary-foreground shrink-0 hover:scale-105 transition-transform"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
