import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Upload, FileText, Loader2, Save, Trash2, ClipboardPaste } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [flashcards, setFlashcards] = useState<Flashcard[]>([{ question: "", answer: "" }]);
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Import tab state
  const [importText, setImportText] = useState("");
  const [termSeparator, setTermSeparator] = useState("tab");
  const [cardSeparator, setCardSeparator] = useState("newline");
  const [importPreview, setImportPreview] = useState<Flashcard[]>([]);

  const { toast } = useToast();

  const parseImportText = (text: string, termSep: string, cardSep: string): Flashcard[] => {
    const cardDelimiter = cardSep === "newline" ? "\n" : ";";
    const termDelimiter = termSep === "tab" ? "\t" : ",";

    return text
      .split(cardDelimiter)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const sepIndex = line.indexOf(termDelimiter);
        if (sepIndex === -1) return null;
        return {
          question: line.slice(0, sepIndex).trim(),
          answer: line.slice(sepIndex + 1).trim(),
        };
      })
      .filter((card): card is Flashcard => card !== null && card.question.length > 0 && card.answer.length > 0);
  };

  const handleImportTextChange = (text: string) => {
    setImportText(text);
    setImportPreview(parseImportText(text, termSeparator, cardSeparator));
  };

  const handleSeparatorChange = (type: "term" | "card", value: string) => {
    if (type === "term") {
      setTermSeparator(value);
      setImportPreview(parseImportText(importText, value, cardSeparator));
    } else {
      setCardSeparator(value);
      setImportPreview(parseImportText(importText, termSeparator, value));
    }
  };

  const handleSaveImport = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Please enter a title for your flashcard set", variant: "destructive" });
      return;
    }
    if (importPreview.length === 0) {
      toast({ title: "No cards detected", description: "Check your text format and separators", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
      const response = await fetch(`${backendUrl}/api/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description, flashcards: importPreview }),
      });

      if (!response.ok) throw new Error("Failed to save flashcards");

      toast({ title: "Flashcards saved!", description: `Created ${importPreview.length} flashcards` });
      setIsOpen(false);
      resetForm();
      onCreated();
    } catch (error) {
      toast({ title: "Save failed", description: "Failed to save flashcards. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCard = () => setFlashcards([...flashcards, { question: "", answer: "" }]);

  const handleRemoveCard = (index: number) => {
    if (flashcards.length > 1) setFlashcards(flashcards.filter((_, i) => i !== index));
  };

  const handleCardChange = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...flashcards];
    updated[index][field] = value;
    setFlashcards(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ["text/plain", "application/pdf"];
      if (!validTypes.includes(selectedFile.type)) {
        toast({ title: "Invalid file type", description: "Please upload a .txt or .pdf file", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleGenerateFromFile = async () => {
    if (!file && !textContent.trim()) {
      toast({ title: "No content provided", description: "Please upload a file or enter text", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
      const formData = new FormData();
      formData.append("title", title || "Generated Flashcards");
      if (file) formData.append("file", file);
      else formData.append("content", textContent);

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
      toast({ title: "Flashcards generated!", description: `Created ${data.flashcards.length} flashcards` });
      setIsOpen(false);
      resetForm();
      onCreated();
    } catch (error: any) {
      toast({ title: "Generation failed", description: error.message || "Failed to generate flashcards", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveManual = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Please enter a title for your flashcard set", variant: "destructive" });
      return;
    }

    const validCards = flashcards.filter((card) => card.question.trim() && card.answer.trim());
    if (validCards.length === 0) {
      toast({ title: "No valid flashcards", description: "Please add at least one complete flashcard", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
      const response = await fetch(`${backendUrl}/api/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description, flashcards: validCards }),
      });

      if (!response.ok) throw new Error("Failed to save flashcards");

      toast({ title: "Flashcards saved!", description: `Created ${validCards.length} flashcards` });
      setIsOpen(false);
      resetForm();
      onCreated();
    } catch (error) {
      toast({ title: "Save failed", description: "Failed to save flashcards. Please try again.", variant: "destructive" });
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
    setImportText("");
    setImportPreview([]);
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
            Create flashcards manually, import from text, or generate with AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" placeholder="e.g., Biology Chapter 3" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input id="description" placeholder="Brief description of this flashcard set" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="import">
                <ClipboardPaste className="w-4 h-4 mr-1" /> Import
              </TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="upload">AI Generate</TabsTrigger>
            </TabsList>

            {/* ── IMPORT TAB ── */}
            <TabsContent value="import" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Copy and paste your data here (from Word, Excel, Google Docs, etc.)
              </p>

              <Textarea
                placeholder={`Word 1\tDefinition 1\nWord 2\tDefinition 2\nWord 3\tDefinition 3`}
                value={importText}
                onChange={(e) => handleImportTextChange(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />

              {/* Separator options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Between term and definition</Label>
                  <Select value={termSeparator} onValueChange={(v) => handleSeparatorChange("term", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tab">Tab</SelectItem>
                      <SelectItem value="comma">Comma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Between cards</Label>
                  <Select value={cardSeparator} onValueChange={(v) => handleSeparatorChange("card", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newline">New line</SelectItem>
                      <SelectItem value="semicolon">Semicolon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview */}
              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Preview — {importPreview.length} cards detected
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-3 bg-secondary/20">
                    {importPreview.slice(0, 10).map((card, i) => (
                      <div key={i} className="flex gap-3 text-sm py-1 border-b border-border/50 last:border-0">
                        <span className="font-medium min-w-[120px] truncate">{card.question}</span>
                        <span className="text-muted-foreground truncate">{card.answer}</span>
                      </div>
                    ))}
                    {importPreview.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{importPreview.length - 10} more cards
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSaveImport}
                disabled={isSaving || importPreview.length === 0}
                className="w-full gap-2 gradient-primary text-primary-foreground"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Import {importPreview.length > 0 ? `${importPreview.length} Cards` : "Cards"}</>
                )}
              </Button>
            </TabsContent>

            {/* ── MANUAL TAB ── */}
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
                        <span className="text-sm font-medium text-muted-foreground">Card {index + 1}</span>
                        {flashcards.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveCard(index)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div>
                        <Label>Question</Label>
                        <Textarea placeholder="Enter question..." value={card.question} onChange={(e) => handleCardChange(index, "question", e.target.value)} rows={2} />
                      </div>
                      <div>
                        <Label>Answer</Label>
                        <Textarea placeholder="Enter answer..." value={card.answer} onChange={(e) => handleCardChange(index, "answer", e.target.value)} rows={3} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAddCard} className="gap-2 flex-1">
                  <Plus className="w-4 h-4" /> Add Another Card
                </Button>
                <Button onClick={handleSaveManual} disabled={isSaving} className="gap-2 flex-1 gradient-primary text-primary-foreground">
                  {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Flashcards</>}
                </Button>
              </div>
            </TabsContent>

            {/* ── AI GENERATE TAB ── */}
            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Upload File (.txt or .pdf)</Label>
                  <div className="mt-2">
                    <Input id="file-upload" type="file" accept=".txt,.pdf" onChange={handleFileChange} className="cursor-pointer" />
                    {file && (
                      <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" /> {file.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="text-content">Paste Text</Label>
                  <Textarea id="text-content" placeholder="Paste your study material here..." value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={10} className="font-mono text-sm" />
                </div>

                <Button onClick={handleGenerateFromFile} disabled={isGenerating || (!file && !textContent.trim())} className="w-full gap-2 gradient-primary text-primary-foreground">
                  {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Flashcards...</> : <><Upload className="w-4 h-4" /> Generate Flashcards with AI</>}
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
