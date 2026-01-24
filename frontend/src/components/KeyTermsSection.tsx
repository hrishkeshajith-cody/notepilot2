import { motion } from "framer-motion";
import { BookMarked } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyTerm } from "@/types/studyPack";
import { ExplainButton } from "./ExplainButton";

interface KeyTermsSectionProps {
  terms: KeyTerm[];
}

export const KeyTermsSection = ({ terms }: KeyTermsSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <BookMarked className="w-5 h-5 text-primary" />
            Key Terms ({terms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {terms.map((term, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <AccordionItem
                  value={`term-${index}`}
                  className="border border-border rounded-lg px-4 data-[state=open]:bg-secondary/50"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-semibold text-foreground">{term.term}</span>
                      <ExplainButton
                        content={`${term.term}: ${term.meaning}`}
                        type="key term"
                      />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-2">
                      <p className="text-foreground">{term.meaning}</p>
                      {term.example && (
                        <p className="text-sm text-muted-foreground italic border-l-2 border-accent pl-3">
                          Example: {term.example}
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
};
