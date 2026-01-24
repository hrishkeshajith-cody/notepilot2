import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/types/studyPack";
import { cn } from "@/lib/utils";
import { ExplainButton } from "./ExplainButton";

interface QuizSectionProps {
  instructions: string;
  questions: QuizQuestion[];
}

export const QuizSection = ({ instructions, questions }: QuizSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentIndex];
  const hasAnswered = selectedAnswer !== null;
  const isCorrect = selectedAnswer === currentQuestion?.correct_index;

  const handleSelectAnswer = (index: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(index);
    setAnswers({ ...answers, [currentQuestion.id]: index });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers({});
    setShowResults(false);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_index) correct++;
    });
    return correct;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-success/10 text-success border-success/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "hard":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-border shadow-md overflow-hidden">
          <div className="gradient-hero p-1">
            <CardContent className="bg-card rounded-md p-8 text-center">
              <Trophy className="w-16 h-16 mx-auto text-warning mb-4" />
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                Quiz Complete!
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                You scored {score} out of {questions.length}
              </p>
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(percentage / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--accent))" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-foreground">
                  {percentage}%
                </span>
              </div>
              <Button onClick={handleRestart} className="gradient-primary text-primary-foreground">
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    );
  }

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
              <Brain className="w-5 h-5 text-primary" />
              Quiz
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {currentIndex + 1} / {questions.length}
            </span>
          </CardTitle>
          {instructions && (
            <p className="text-sm text-muted-foreground mt-1">{instructions}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentIndex + (hasAnswered ? 1 : 0)) / questions.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2 flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {currentQuestion.question}
                  </h3>
                  <ExplainButton
                    content={`${currentQuestion.question} (Answer: ${currentQuestion.options[currentQuestion.correct_index]})`}
                    type="quiz question"
                    className="shrink-0 mt-1"
                  />
                </div>
                <Badge
                  variant="outline"
                  className={cn("capitalize shrink-0", getDifficultyColor(currentQuestion.difficulty))}
                >
                  {currentQuestion.difficulty}
                </Badge>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectOption = index === currentQuestion.correct_index;
                  const showCorrect = hasAnswered && isCorrectOption;
                  const showWrong = hasAnswered && isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleSelectAnswer(index)}
                      disabled={hasAnswered}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3",
                        !hasAnswered &&
                          "hover:border-primary hover:bg-primary/5 cursor-pointer",
                        hasAnswered && "cursor-default",
                        showCorrect && "border-success bg-success/10",
                        showWrong && "border-destructive bg-destructive/10",
                        !showCorrect &&
                          !showWrong &&
                          isSelected &&
                          "border-primary bg-primary/10"
                      )}
                      whileHover={!hasAnswered ? { scale: 1.01 } : {}}
                      whileTap={!hasAnswered ? { scale: 0.99 } : {}}
                    >
                      <span
                        className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                          showCorrect
                            ? "bg-success text-success-foreground"
                            : showWrong
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-secondary text-secondary-foreground"
                        )}
                      >
                        {showCorrect ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : showWrong ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </span>
                      <span className="text-foreground">{option}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {hasAnswered && currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-lg bg-secondary border border-border"
                  >
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">Explanation: </span>
                      {currentQuestion.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Next Button */}
          {hasAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button onClick={handleNext} className="w-full gradient-primary text-primary-foreground">
                {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
