import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flashcard } from "@/types/studyPack";
import { ExplainButton } from "./ExplainButton";

interface FlashcardsSectionProps {
  flashcards: Flashcard[];
}

export const FlashcardsSection = ({ flashcards }: FlashcardsSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const currentCard = flashcards[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg font-display">
              <Layers className="w-5 h-5 text-primary" />
              Flashcards
            </span>
            <div className="flex items-center gap-2">
              <ExplainButton
                content={`Q: ${currentCard.q} A: ${currentCard.a}`}
                type="flashcard"
              />
              <span className="text-sm font-normal text-muted-foreground">
                {currentIndex + 1} / {flashcards.length}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Flashcard */}
          <div
            className="relative h-64 cursor-pointer perspective-1000"
            onClick={handleFlip}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentIndex}-${isFlipped}`}
                initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`absolute inset-0 rounded-xl p-6 flex flex-col items-center justify-center text-center ${
                  isFlipped
                    ? "gradient-accent"
                    : "gradient-primary"
                }`}
                style={{ backfaceVisibility: "hidden" }}
              >
                <p className="text-sm font-medium text-primary-foreground/80 mb-2">
                  {isFlipped ? "Answer" : "Question"}
                </p>
                <p className="text-lg md:text-xl font-semibold text-primary-foreground leading-relaxed">
                  {isFlipped ? currentCard.a : currentCard.q}
                </p>
                <p className="absolute bottom-4 text-xs text-primary-foreground/60">
                  Click to flip
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="h-10 w-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              onClick={handleFlip}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Flip Card
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-10 w-10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 flex-wrap">
            {flashcards.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-primary w-4"
                    : "bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
