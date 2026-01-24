import { motion } from "framer-motion";
import { ScrollText } from "lucide-react";
import { NoteSection } from "@/types/studyPack";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExplainButton } from "./ExplainButton";

interface NotesSectionProps {
  notes: NoteSection[];
}

export const NotesSection = ({ notes }: NotesSectionProps) => {
  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No detailed notes available for this study pack.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <ScrollText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Detailed Notes</h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive explanations covering the entire chapter
          </p>
        </div>
      </div>

      {/* Notes Accordion */}
      <Accordion type="multiple" defaultValue={notes.map((_, i) => `note-${i}`)} className="space-y-3">
        {notes.map((note, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <AccordionItem
              value={`note-${index}`}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3 text-left flex-1">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-foreground">{note.title}</span>
                  <ExplainButton
                    content={`${note.title}: ${note.content.substring(0, 200)}`}
                    type="note"
                  />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="pl-10 prose prose-sm dark:prose-invert max-w-none">
                  <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>

      {/* Footer tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-2 pt-4 text-sm text-muted-foreground"
      >
        <ScrollText className="w-4 h-4" />
        <span>{notes.length} sections covering the complete chapter</span>
      </motion.div>
    </motion.div>
  );
};
