import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Loader2,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CustomFlashcardSet, CustomFlashcardItem } from "@/types/studyPack";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FlashcardViewerProps {
  flashcardSet: CustomFlashcardSet;
  onBack: () => void;
  onUpdate: (updatedSet: CustomFlashcardSet) => void;
  onDelete: () => void;
}

export const FlashcardViewer = ({ flashcardSet, onBack, onUpdate, onDelete }: FlashcardViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(flashcardSet.title);
  const [editedCards, setEditedCards] = useState<CustomFlashcardItem[]>([...flashcardSet.flashcards]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const currentCard = flashcardSet.flashcards[currentIndex];
  const totalCards = flashcardSet.flashcards.length;

  const goToNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalCards);
    }, 150);
  };

  const goToPrevious = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
    }, 150);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleEditCardChange = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...editedCards];
    updated[index][field] = value;
    setEditedCards(updated);
  };

  const handleAddCard = () => {
    setEditedCards([...editedCards, { question: "", answer: "" }]);
  };

  const handleRemoveCard = (index: number) => {
    if (editedCards.length > 1) {
      setEditedCards(editedCards.filter((_, i) => i !== index));
    }
  };

  const handleSaveEdits = async () => {
    const validCards = editedCards.filter(
      (card) => card.question.trim() && card.answer.trim()
    );

    if (validCards.length === 0) {
      toast({
        title: "No valid flashcards",
        description: "Please ensure at least one card has both question and answer",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
      const response = await fetch(`${backendUrl}/api/flashcards/${flashcardSet.set_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: editedTitle,
          flashcards: validCards,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update flashcards");
      }

      const updatedSet = await response.json();
      onUpdate(updatedSet);
      setIsEditing(false);
      
      toast({
        title: "Flashcards updated!",
        description: `Saved ${validCards.length} flashcards`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
      const response = await fetch(`${backendUrl}/api/flashcards/${flashcardSet.set_id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete flashcards");
      }

      toast({
        title: "Flashcards deleted",
        description: "The flashcard set has been removed",
      });
      
      onDelete();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete flashcard set. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelEditing = () => {
    setEditedTitle(flashcardSet.title);
    setEditedCards([...flashcardSet.flashcards]);
    setIsEditing(false);
  };

  // Edit Mode View
  if (isEditing) {
    return (
      <div className="space-y-6" data-testid="flashcard-editor">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={cancelEditing} data-testid="cancel-edit-btn">
              <X className="w-5 h-5" />
            </Button>
            <h2 className="text-2xl font-bold">Edit Flashcard Set</h2>
          </div>
          <Button 
            onClick={handleSaveEdits} 
            disabled={isSaving}
            className="gap-2 gradient-primary text-primary-foreground"
            data-testid="save-edits-btn"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Title</label>
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="mt-1"
            data-testid="edit-title-input"
          />
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {editedCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border border-border rounded-lg space-y-3 bg-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Card {index + 1}
                </span>
                {editedCards.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCard(index)}
                    data-testid={`remove-card-${index}-btn`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Question</label>
                <Textarea
                  value={card.question}
                  onChange={(e) => handleEditCardChange(index, "question", e.target.value)}
                  rows={2}
                  data-testid={`edit-question-${index}`}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Answer</label>
                <Textarea
                  value={card.answer}
                  onChange={(e) => handleEditCardChange(index, "answer", e.target.value)}
                  rows={3}
                  data-testid={`edit-answer-${index}`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <Button variant="outline" onClick={handleAddCard} className="w-full" data-testid="add-card-btn">
          Add Another Card
        </Button>
      </div>
    );
  }

  // Flashcard View Mode
  return (
    <div className="space-y-6" data-testid="flashcard-viewer">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{flashcardSet.title}</h2>
            {flashcardSet.description && (
              <p className="text-sm text-muted-foreground">{flashcardSet.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="gap-2"
            data-testid="edit-btn"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-destructive hover:text-destructive"
                data-testid="delete-btn"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Flashcard Set?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{flashcardSet.title}" and all {totalCards} flashcards. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <BookOpen className="w-4 h-4" />
        <span>Card {currentIndex + 1} of {totalCards}</span>
      </div>

      {/* Flashcard */}
      <div className="flex justify-center">
        <div 
          className="w-full max-w-lg perspective-1000 cursor-pointer"
          onClick={flipCard}
          data-testid="flashcard-flip-area"
        >
          <motion.div
            className="relative w-full h-72 preserve-3d"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front (Question) */}
            <div 
              className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 p-6 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">Question</span>
              <p className="text-lg md:text-xl text-center font-medium">{currentCard?.question}</p>
              <span className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</span>
            </div>

            {/* Back (Answer) */}
            <div 
              className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 border-2 border-accent/20 p-6 flex flex-col items-center justify-center"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-4">Answer</span>
              <p className="text-lg md:text-xl text-center">{currentCard?.answer}</p>
              <span className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={goToPrevious}
          className="gap-2"
          data-testid="prev-card-btn"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
          className="rounded-full"
          data-testid="reset-btn"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={goToNext}
          className="gap-2"
          data-testid="next-card-btn"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-lg mx-auto">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
};
