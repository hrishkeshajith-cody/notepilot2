import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight, Layers, CheckCircle2, XCircle, Trophy, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flashcard } from "@/types/studyPack";
import { ExplainButton } from "./ExplainButton";
import { cn } from "@/lib/utils";

interface FlashcardsSectionProps {
  flashcards: Flashcard[];
}

type CardStatus = "unseen" | "known" | "unknown";

export const FlashcardsSection = ({ flashcards }: FlashcardsSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStatuses, setCardStatuses] = useState<Record<number, CardStatus>>(
    () => Object.fromEntries(flashcards.map((_, i) => [i, "unseen"]))
  );
  const [showSummary, setShowSummary] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);

  const knownCount = Object.values(cardStatuses).filter((s) => s === "known").length;
  const unknownCount = Object.values(cardStatuses).filter((s) => s === "unknown").length;
  const unseenCount = Object.values(cardStatuses).filter((s) => s === "unseen").length;
  const allAnswered = unseenCount === 0;

  const activeIndex = reviewMode ? reviewQueue[reviewIndex] : currentIndex;
  const currentCard = flashcards[activeIndex];

  const handleFlip = () => setIsFlipped(!isFlipped);

  const markCard = useCallback(
    (status: "known" | "unknown") => {
      setCardStatuses((prev) => ({ ...prev, [activeIndex]: status }));
      setIsFlipped(false);
      if (reviewMode) {
        if (reviewIndex < reviewQueue.length - 1) {
          setReviewIndex((i) => i + 1);
        } else {
          setShowSummary(true);
          setReviewMode(false);
        }
        return;
      }
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setShowSummary(true);
      }
    },
    [activeIndex, currentIndex, reviewMode, reviewIndex, reviewQueue, flashcards.length]
  );

  const startReview = () => {
    const unknownIndices = Object.entries(cardStatuses)
      .filter(([, s]) => s === "unknown")
      .map(([i]) => Number(i));
    setReviewQueue(unknownIndices);
    setReviewIndex(0);
    setReviewMode(true);
    setShowSummary(false);
    setIsFlipped(false);
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStatuses(Object.fromEntries(flashcards.map((_, i) => [i, "unseen"])));
    setShowSummary(false);
    setReviewMode(false);
    setReviewQueue([]);
    setReviewIndex(0);
  };

  const goTo = (idx: number) => {
    if (reviewMode) return;
    setIsFlipped(false);
    setCurrentIndex(idx);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (reviewMode) setReviewIndex((i) => Math.min(i + 1, reviewQueue.length - 1));
    else setCurrentIndex((i) => (i + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (reviewMode) setReviewIndex((i) => Math.max(i - 1, 0));
    else setCurrentIndex((i) => (i - 1 + flashcards.length) % flashcards.length);
  };

  const totalCards = reviewMode ? reviewQueue.length : flashcards.length;
  const displayIndex = reviewMode ? reviewIndex : currentIndex;
  const percentage = Math.round((knownCount / flashcards.length) * 100);

  if (showSummary) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <Card className="border-border shadow-md overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <Trophy className="w-16 h-16 mx-auto text-warning mb-2" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-1">Session Complete!</h2>
              <p className="text-muted-foreground">Here's how you did on {flashcards.length} cards</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{knownCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Got it ✓</p>
              </div>
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{unknownCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Need review</p>
              </div>
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-2xl font-bold text-primary">{percentage}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">Mastered</p>
              </div>
            </div>
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-full h-full -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                <circle cx="48" cy="48" r="40" stroke="url(#fc-gradient)" strokeWidth="8" fill="none"
                  strokeDasharray={`${(percentage / 100) * 251} 251`} strokeLinecap="round" />
                <defs>
                  <linearGradient id="fc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">{percentage}%</span>
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              {unknownCount > 0 && (
                <Button onClick={startReview} className="gradient-primary text-primary-foreground gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Review {unknownCount} missed
                </Button>
              )}
              <Button variant="outline" onClick={resetSession} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg font-display">
              <Layers className="w-5 h-5 text-primary" />
              {reviewMode ? "Review Mode" : "Flashcards"}
              {reviewMode && <Badge variant="outline" className="text-xs border-warning text-warning">Missed cards</Badge>}
            </span>
            <div className="flex items-center gap-2">
              <ExplainButton content={`Q: ${currentCard.q} A: ${currentCard.a}`} type="flashcard" />
              <span className="text-sm font-normal text-muted-foreground">{displayIndex + 1} / {totalCards}</span>
            </div>
          </CardTitle>
          <div className="mt-2 space-y-1.5">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex gap-0.5">
              {flashcards.map((_, i) => {
                const s = cardStatuses[i];
                return (
                  <motion.div key={i}
                    className={cn("flex-1 h-full rounded-full transition-colors duration-300",
                      s === "known" ? "bg-emerald-500" : s === "unknown" ? "bg-rose-500" : "bg-muted-foreground/20"
                    )}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{knownCount} known</span>
              {unseenCount > 0 && <span>{unseenCount} remaining</span>}
              <span className="text-rose-600 dark:text-rose-400 font-medium">{unknownCount} to review</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative h-64 cursor-pointer" onClick={handleFlip}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeIndex}-${isFlipped}`}
                initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.28 }}
                className={cn(
                  "absolute inset-0 rounded-xl p-6 flex flex-col items-center justify-center text-center",
                  isFlipped ? "gradient-accent" : "gradient-primary"
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70 mb-3">
                  {isFlipped ? "Answer" : "Question"}
                </p>
                <p className="text-lg md:text-xl font-semibold text-primary-foreground leading-relaxed">
                  {isFlipped ? currentCard.a : currentCard.q}
                </p>
                {!isFlipped && <p className="absolute bottom-4 text-xs text-primary-foreground/50">Tap to reveal answer</p>}
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {isFlipped ? (
              <motion.div key="rate" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => markCard("unknown")}
                  className="h-12 gap-2 border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 hover:border-rose-400 dark:border-rose-800 dark:text-rose-400">
                  <XCircle className="w-5 h-5" />
                  Still learning
                </Button>
                <Button onClick={() => markCard("known")}
                  className="h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                  <CheckCircle2 className="w-5 h-5" />
                  Got it!
                </Button>
              </motion.div>
            ) : (
              <motion.div key="nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-between gap-4">
                <Button variant="outline" size="icon" onClick={handlePrev} className="h-10 w-10">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="outline" onClick={handleFlip} className="flex-1 gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Flip Card
                </Button>
                <Button variant="outline" size="icon" onClick={handleNext} className="h-10 w-10">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {!reviewMode && (
            <div className="flex justify-center gap-1.5 flex-wrap">
              {flashcards.map((_, index) => {
                const s = cardStatuses[index];
                return (
                  <button key={index} onClick={() => goTo(index)}
                    className={cn("h-2 rounded-full transition-all",
                      index === currentIndex ? "w-4 bg-primary" :
                      s === "known" ? "w-2 bg-emerald-500" :
                      s === "unknown" ? "w-2 bg-rose-500" :
                      "w-2 bg-border hover:bg-muted-foreground"
                    )}
                  />
                );
              })}
            </div>
          )}

          {allAnswered && !showSummary && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button onClick={() => setShowSummary(true)} className="w-full gradient-primary text-primary-foreground gap-2">
                <Sparkles className="w-4 h-4" />
                See session results
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
