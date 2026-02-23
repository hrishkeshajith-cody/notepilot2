import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, FileText, Layers, Brain, ArrowLeft, ScrollText, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SummarySection } from "./SummarySection";
import { KeyTermsSection } from "./KeyTermsSection";
import { FlashcardsSection } from "./FlashcardsSection";
import { QuizSection } from "./QuizSection";
import { NotesSection } from "./NotesSection";
import { ImportantQuestionsSection } from "./ImportantQuestionsSection";
import { StudyPack } from "@/types/studyPack";

interface StudyPackDisplayProps {
  studyPack: StudyPack;
  onBack: () => void;
}

export const StudyPackDisplay = ({ studyPack, onBack }: StudyPackDisplayProps) => {
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Create New Pack
        </Button>

        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {studyPack.meta.chapter_title}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-primary border-primary">
            Grade {studyPack.meta.grade}
          </Badge>
          <Badge variant="outline" className="text-accent border-accent">
            {studyPack.meta.subject}
          </Badge>
          <Badge variant="secondary">
            {studyPack.meta.language}
          </Badge>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6 bg-secondary p-1 rounded-lg gap-1">
            <TabsTrigger
              value="summary"
              className="flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md text-xs sm:text-sm"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md text-xs sm:text-sm"
            >
              <ScrollText className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger
              value="terms"
              className="flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md text-xs sm:text-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Terms</span>
            </TabsTrigger>
            <TabsTrigger
              value="flashcards"
              className="flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md text-xs sm:text-sm"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </TabsTrigger>
            <TabsTrigger
              value="questions"
              className="flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md text-xs sm:text-sm"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Questions</span>
            </TabsTrigger>
            <TabsTrigger
              value="quiz"
              className="flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md text-xs sm:text-sm"
            >
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Quiz</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-0">
            <SummarySection
              tldr={studyPack.summary.tl_dr}
              importantPoints={studyPack.summary.important_points}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <NotesSection notes={studyPack.notes || []} />
          </TabsContent>

          <TabsContent value="terms" className="mt-0">
            <KeyTermsSection terms={studyPack.key_terms} />
          </TabsContent>

          <TabsContent value="flashcards" className="mt-0">
            <FlashcardsSection flashcards={studyPack.flashcards} />
          </TabsContent>

          <TabsContent value="questions" className="mt-0">
            <ImportantQuestionsSection 
              questions={studyPack.important_questions || { one_mark: [], three_mark: [], five_mark: [] }} 
            />
          </TabsContent>

          <TabsContent value="quiz" className="mt-0">
            <QuizSection
              instructions={studyPack.quiz.instructions}
              questions={studyPack.quiz.questions}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};
