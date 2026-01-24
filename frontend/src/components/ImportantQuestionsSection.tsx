import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, ChevronUp, Award } from "lucide-react";
import { ImportantQuestions } from "@/types/studyPack";
import { Badge } from "@/components/ui/badge";
import { ExplainButton } from "./ExplainButton";

interface ImportantQuestionsSectionProps {
  questions: ImportantQuestions;
}

type MarkCategory = "one_mark" | "three_mark" | "five_mark";

const categoryConfig: Record<MarkCategory, { label: string; marks: number; color: string }> = {
  one_mark: { label: "1 Mark Questions", marks: 1, color: "bg-emerald-500" },
  three_mark: { label: "3 Mark Questions", marks: 3, color: "bg-amber-500" },
  five_mark: { label: "5 Mark Questions", marks: 5, color: "bg-rose-500" },
};

export const ImportantQuestionsSection = ({ questions }: ImportantQuestionsSectionProps) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<MarkCategory>("one_mark");

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const categories: MarkCategory[] = ["one_mark", "three_mark", "five_mark"];
  const currentQuestions = questions[activeCategory] || [];

  if (!questions || (questions.one_mark?.length === 0 && questions.three_mark?.length === 0 && questions.five_mark?.length === 0)) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No important questions available for this study pack.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Important Questions</h2>
          <p className="text-sm text-muted-foreground">
            Practice questions organized by marks
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => {
          const config = categoryConfig[category];
          const count = questions[category]?.length || 0;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeCategory === category
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${config.color}`} />
              {config.label}
              <Badge variant="secondary" className="ml-1 text-xs">
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {currentQuestions.map((q, index) => {
              const questionId = `${activeCategory}-${index}`;
              const isExpanded = expandedQuestions.has(questionId);
              const config = categoryConfig[activeCategory];

              return (
                <motion.div
                  key={questionId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleQuestion(questionId)}
                    className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {index + 1}
                      </span>
                      <Badge className={`${config.color} text-white`}>
                        {config.marks} Mark{config.marks > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0 flex items-start gap-2">
                      <p className="font-medium text-foreground">{q.question}</p>
                      <ExplainButton
                        content={`${q.question} Answer: ${q.answer}`}
                        type="important question"
                        className="shrink-0"
                      />
                    </div>
                    <div className="shrink-0 text-muted-foreground">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-2 border-t border-border bg-secondary/30">
                          <div className="flex items-start gap-2">
                            <Award className="w-4 h-4 text-accent mt-1 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
                                Model Answer
                              </p>
                              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {q.answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-2 pt-4 text-sm text-muted-foreground"
      >
        <HelpCircle className="w-4 h-4" />
        <span>
          {(questions.one_mark?.length || 0) + (questions.three_mark?.length || 0) + (questions.five_mark?.length || 0)} important questions total
        </span>
      </motion.div>
    </motion.div>
  );
};
