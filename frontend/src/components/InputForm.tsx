import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Languages, FileText, Sparkles, Upload, X, FileType, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputFormData } from "@/types/studyPack";

interface InputFormProps {
  onGenerate: (data: InputFormData) => void;
  isLoading: boolean;
}

const grades = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
];

const languages = ["English", "Hindi", "Malayalam", "Tamil", "Telugu", "Kannada", "Other"];

export const InputForm = ({ onGenerate, isLoading }: InputFormProps) => {
  const [formData, setFormData] = useState<InputFormData>({
    grade: "",
    subject: "",
    chapterTitle: "",
    language: "English",
    chapterText: "",
    pdfData: undefined,
  });
  const [pdfFile, setPdfFile] = useState<{ name: string; data: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.grade && formData.subject && formData.chapterTitle && (formData.chapterText || pdfFile)) {
      onGenerate(formData);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert("Please upload a PDF smaller than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(",")[1];
      setPdfFile({ name: file.name, data: base64Data });
      setFormData(prev => ({ ...prev, pdfData: base64Data }));
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setPdfFile(null);
    setFormData(prev => ({ ...prev, pdfData: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const isValid = formData.grade && formData.subject && formData.chapterTitle && (formData.chapterText.length > 50 || pdfFile);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Grade */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <Label htmlFor="grade" className="flex items-center gap-2 text-foreground font-medium">
              <GraduationCap className="w-4 h-4 text-primary" />
              Grade
            </Label>
            <Select
              value={formData.grade}
              onValueChange={(value) => setFormData({ ...formData, grade: value })}
            >
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Subject */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <Label htmlFor="subject" className="flex items-center gap-2 text-foreground font-medium">
              <BookOpen className="w-4 h-4 text-primary" />
              Subject
            </Label>
            <Input
              id="subject"
              placeholder="e.g., Science, History, Math"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="bg-card border-border"
            />
          </motion.div>

          {/* Chapter Title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="chapterTitle" className="flex items-center gap-2 text-foreground font-medium">
              <FileText className="w-4 h-4 text-primary" />
              Chapter Title
            </Label>
            <Input
              id="chapterTitle"
              placeholder="e.g., Photosynthesis, World War II"
              value={formData.chapterTitle}
              onChange={(e) => setFormData({ ...formData, chapterTitle: e.target.value })}
              className="bg-card border-border"
            />
          </motion.div>

          {/* Language */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <Label htmlFor="language" className="flex items-center gap-2 text-foreground font-medium">
              <Languages className="w-4 h-4 text-primary" />
              Language
            </Label>
            <Select
              value={formData.language}
              onValueChange={(value) => setFormData({ ...formData, language: value })}
            >
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        </div>

        {/* PDF Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="space-y-2"
        >
          <Label className="flex items-center gap-2 text-foreground font-medium">
            <Upload className="w-4 h-4 text-primary" />
            Upload PDF (optional)
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="pdf-upload"
          />
          
          {pdfFile ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-card rounded-lg border border-border">
                  <FileType className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">
                    {pdfFile.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-accent" />
                    <p className="text-xs font-medium text-accent">Attached Successfully</p>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearFile}
                className="flex-shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex flex-col items-center justify-center gap-3 p-8 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center border border-border">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Drop your PDF here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">Max 10MB • PDF files only</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Chapter Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <Label htmlFor="chapterText" className="flex items-center gap-2 text-foreground font-medium">
            <FileText className="w-4 h-4 text-primary" />
            Chapter Text {pdfFile && "(optional when PDF is uploaded)"}
          </Label>
          <Textarea
            id="chapterText"
            placeholder="Paste the chapter text here or upload a PDF above (minimum 50 characters)..."
            value={formData.chapterText}
            onChange={(e) => setFormData({ ...formData, chapterText: e.target.value })}
            className="min-h-[200px] bg-card border-border resize-y"
          />
          <p className="text-sm text-muted-foreground">
            {formData.chapterText.length} characters
          </p>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full h-12 text-lg font-semibold gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Study Pack
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
};
