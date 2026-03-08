import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { InputForm } from "@/components/InputForm";
import { StudyPackDisplay } from "@/components/StudyPackDisplay";
import { AppSidebar } from "@/components/AppSidebar";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { CommunityPage } from "@/components/CommunityPage";
import { InputFormData, StudyPack, CustomFlashcardSet } from "@/types/studyPack";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNotePilot } from "@/contexts/NotePilotContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const StudyApp = () => {
  const [studyPack, setStudyPack] = useState<StudyPack | null>(null);
  const [selectedFlashcardSet, setSelectedFlashcardSet] = useState<CustomFlashcardSet | null>(null);
  const [showCommunity, setShowCommunity] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const { setStudyContext } = useNotePilot();

  useEffect(() => {
    if (studyPack) {
      setStudyContext({
        subject: studyPack.meta.subject,
        grade: studyPack.meta.grade,
        chapter_title: studyPack.meta.chapter_title,
        summary: studyPack.summary,
        key_terms: studyPack.key_terms,
        notes: studyPack.notes,
        flashcards: studyPack.flashcards,
      });
    } else {
      setStudyContext(null);
    }
  }, [studyPack, setStudyContext]);

  const handleGenerate = async (data: InputFormData) => {
    setIsLoading(true);
    try {
      if (!user) {
        toast({ title: "Not authenticated", description: "Please log in to generate study packs.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-study-pack`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            grade: data.grade,
            subject: data.subject,
            chapterTitle: data.chapterTitle,
            language: data.language,
            chapterText: data.chapterText,
            pdfData: data.pdfData,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast({ title: "Rate limit reached", description: "Please wait a moment and try again.", variant: "destructive" });
        } else if (response.status === 402) {
          toast({ title: "Credits exhausted", description: "AI credits have been used up.", variant: "destructive" });
        } else {
          toast({ title: "Generation failed", description: result.error || "Failed to generate study pack.", variant: "destructive" });
        }
        setIsLoading(false);
        return;
      }
      

      setStudyPack(result);

      const saveResponse = await fetch(`${BACKEND_URL}/api/study-packs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          chapter_title: data.chapterTitle,
          subject: data.subject,
          grade: data.grade,
          summary: result.summary,
          key_terms: result.key_terms,
          flashcards: result.flashcards,
          quiz: result.quiz,
          notes: result.notes || [],
          important_questions: result.important_questions || { one_mark: [], three_mark: [], five_mark: [] },
        }),
      });

      if (!saveResponse.ok) {
        console.error("Failed to save study pack:", await saveResponse.text());
        toast({ title: "Notes ready!", description: `Generated materials for "${data.chapterTitle}" (save failed)` });
      } else {
        toast({ title: "Notes ready & saved!", description: `Generated and saved materials for "${data.chapterTitle}"` });
        setSidebarRefresh(prev => prev + 1);
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast({ title: "Error", description: "Failed to connect to AI service. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStudyPack(null);
    setSelectedFlashcardSet(null);
    setShowCommunity(false);
  };

  const handleSelectFlashcardSet = (set: CustomFlashcardSet) => {
    setStudyPack(null);
    setShowCommunity(false);
    setSelectedFlashcardSet(set);
  };

  const handleSelectStudyPack = (pack: StudyPack) => {
    setSelectedFlashcardSet(null);
    setShowCommunity(false);
    setStudyPack(pack);
  };

  const handleOpenCommunity = () => {
    setStudyPack(null);
    setSelectedFlashcardSet(null);
    setShowCommunity(true);
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      <AppSidebar
        onSelectPack={handleSelectStudyPack}
        onSelectFlashcardSet={handleSelectFlashcardSet}
        onOpenCommunity={handleOpenCommunity}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        refreshTrigger={sidebarRefresh}
      />

      {sidebarCollapsed && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setSidebarCollapsed(false)}
          className="fixed top-6 left-6 z-[100] p-3 rounded-full bg-card border-2 border-border shadow-xl hover:shadow-2xl transition-all hover:scale-110 backdrop-blur-sm"
          aria-label="Open sidebar"
          style={{ position: "fixed" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </motion.button>
      )}

      <div className={`flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300 ${sidebarCollapsed ? "ml-0" : "ml-80"}`}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <main className="flex-1 relative z-10 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
            {showCommunity ? (
              <CommunityPage
                onBack={handleBack}
                onOpenStudyPack={handleSelectStudyPack}
                onOpenFlashcardSet={handleSelectFlashcardSet}
                currentUserId={user?.user_id}
              />
            ) : selectedFlashcardSet ? (
              <FlashcardViewer
                flashcardSet={selectedFlashcardSet}
                onBack={handleBack}
                onUpdate={setSelectedFlashcardSet}
                onDelete={handleBack}
              />
            ) : studyPack ? (
              <StudyPackDisplay studyPack={studyPack} onBack={handleBack} />
            ) : (
              <div className="space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI-Powered Generation
                  </motion.div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
                    <span className="text-foreground">Put your grades on</span>
                    <br />
                    <span className="text-gradient">autopilot</span>
                  </h1>
                  <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                    Paste your chapter text or upload a PDF and get AI-generated summaries, flashcards, key terms, and quizzes.
                  </p>
                </motion.div>
                <div className="bg-card rounded-2xl border border-border shadow-xl p-6 md:p-8">
                  <InputForm onGenerate={handleGenerate} isLoading={isLoading} />
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="border-t border-border py-6 relative z-10">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">Notepilot • Making learning easier, one chapter at a time</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default StudyApp;
