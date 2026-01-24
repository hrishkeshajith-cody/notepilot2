import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, Clock, BookOpen, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { StudyPack } from "@/types/studyPack";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface SavedStudyPack {
  id: string;
  chapter_title: string;
  subject: string;
  grade: string;
  summary: unknown;
  key_terms: unknown;
  flashcards: unknown;
  quiz: unknown;
  created_at: string;
}

interface StudyPackHistoryProps {
  onSelectPack: (pack: StudyPack) => void;
}

export const StudyPackHistory = ({ onSelectPack }: StudyPackHistoryProps) => {
  const [packs, setPacks] = useState<SavedStudyPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPacks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("study_packs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch study packs:", error);
      toast({
        title: "Failed to load history",
        description: "Could not fetch your saved study packs.",
        variant: "destructive",
      });
    } else {
      setPacks(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  const handleSelect = (pack: SavedStudyPack) => {
    const studyPack: StudyPack = {
      meta: {
        subject: pack.subject,
        grade: pack.grade,
        chapter_title: pack.chapter_title,
        language: "English",
      },
      summary: pack.summary as StudyPack["summary"],
      key_terms: pack.key_terms as StudyPack["key_terms"],
      flashcards: pack.flashcards as StudyPack["flashcards"],
      quiz: pack.quiz as StudyPack["quiz"],
    };
    onSelectPack(studyPack);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);

    const { error } = await supabase
      .from("study_packs")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Delete failed",
        description: "Could not delete the study pack.",
        variant: "destructive",
      });
    } else {
      setPacks(packs.filter((p) => p.id !== id));
      toast({
        title: "Deleted",
        description: "Study pack removed from history.",
      });
    }
    setDeletingId(null);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Recent Notes</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Recent Notes</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {packs.length} saved
        </span>
      </div>

      {packs.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No saved notes yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Generate your first study pack!
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-2">
          <div className="space-y-2">
            {packs.map((pack, index) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelect(pack)}
                className="group p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {pack.chapter_title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {pack.subject}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {pack.grade}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(pack.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(e, pack.id)}
                    disabled={deletingId === pack.id}
                  >
                    {deletingId === pack.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
