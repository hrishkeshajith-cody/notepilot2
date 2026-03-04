import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Upload, FileText, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardCreatorProps {
  onCreated: () => void;
}

export const FlashcardCreator = ({ onCreated }: FlashcardCreatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { question: "", answer: "" }
  ]);
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleAddCard = () => {
    setFlashcards([...flashcards, { question: "", answer: "" }]);
  };

  const handleRemoveCard = (index: number) => {
    if (flashcards.length > 1) {
      setFlashcards(flashcards.filter((_, i) => i !== index));
    }
  };

  const handleCardChange = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...flashcards];
    updated[index][field] = value;
    setFlashcards(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['text/plain', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a .txt or .pdf file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleGenerateFromFile = async () => {
    if (!file && !textContent.trim()) {
      toast({
        title: "No content provided",
        description: "Please upload a file or enter text",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
      const formData = new FormData();
      formData.append("title", title || "Generated Flashcards");
      
      if (file) {
        formData.append("file", file);
      } else {
        formData.append("content", textContent);
      }

      const response = await fetch(`${backendUrl}/api/flashcards/from-text`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate flashcards");
      }

      const data = await response.json();
      
      toast({
        title: "Flashcards generated!",
        description: `Created ${data.flashcards.length} flashcards`,
      });

      setIsOpen(false);
      resetForm();
      onCreated();
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate flashcards",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveManual = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your flashcard set",
        variant: "destructive",
      });
      return;
    }

    const validCards = flashcards.filter(
      (card) => card.question.trim() && card.answer.trim()
    );

    if (validCards.length === 0) {
      toast({
        title: "No valid flashcards",
        description: "Please add at least one complete flashcard",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
      const response = await fetch(`${backendUrl}/api/flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          flashcards: validCards,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save flashcards");
      }

      toast({
        title: "Flashcards saved!",
        description: `Created ${validCards.length} flashcards`,
      });

      setIsOpen(false);
      resetForm();
      onCreated();
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFlashcards([{ question: "", answer: "" }]);
    setFile(null);
    setTextContent("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4" />
          Create Flashcards
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Flashcards</DialogTitle>
          <DialogDescription>
            Create flashcards manually or generate them from text/PDF files
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Biology Chapter 3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="Brief description of this flashcard set"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Tabs for creation methods */}
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="upload">Upload & Generate</TabsTrigger>
            </TabsList>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {flashcards.map((card, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-4 border border-border rounded-lg space-y-3 bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Card {index + 1}
                        </span>
                        {flashcards.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCard(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div>
                        <Label>Question</Label>
                        <Textarea
                          placeholder="Enter question..."
                          value={card.question}
                          onChange={(e) =>
                            handleCardChange(index, "question", e.target.value)
                          }
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Answer</Label>
                        <Textarea
                          placeholder="Enter answer..."
                          value={card.answer}
                          onChange={(e) =>
                            handleCardChange(index, "answer", e.target.value)
                          }
                          rows={3}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleAddCard}
                  className="gap-2 flex-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Card
                </Button>
                <Button
                  onClick={handleSaveManual}
                  disabled={isSaving}
                  className="gap-2 flex-1 gradient-primary text-primary-foreground"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Flashcards
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Upload & Generate Tab */}
            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Upload File (.txt or .pdf)</Label>
                  <div className="mt-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".txt,.pdf"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {file && (
                      <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {file.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="text-content">Paste Text</Label>
                  <Textarea
                    id="text-content"
                    placeholder="Paste your study material here..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleGenerateFromFile}
                  disabled={isGenerating || (!file && !textContent.trim())}
                  className="w-full gap-2 gradient-primary text-primary-foreground"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Flashcards...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Generate Flashcards with AI
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  AI will analyze your content and create 10-20 flashcards automatically
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
