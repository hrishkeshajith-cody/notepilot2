import { motion } from "framer-motion";
import { Lightbulb, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExplainButton } from "./ExplainButton";

interface SummarySectionProps {
  tldr: string;
  importantPoints: string[];
}

export const SummarySection = ({ tldr, importantPoints }: SummarySectionProps) => {
  return (
    <div className="space-y-6">
      {/* TL;DR Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="gradient-primary p-1">
            <CardHeader className="bg-card rounded-t-md pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <Lightbulb className="w-5 h-5 text-primary" />
                TL;DR
                <ExplainButton content={tldr} type="summary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-card rounded-b-md pt-2">
              <p className="text-foreground leading-relaxed">{tldr}</p>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Important Points */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-border shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {importantPoints.map((point, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full gradient-accent flex items-center justify-center text-sm font-semibold text-accent-foreground">
                    {index + 1}
                  </span>
                  <span className="text-foreground leading-relaxed flex-1">{point}</span>
                  <ExplainButton content={point} type="key point" className="shrink-0 mt-0.5" />
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
