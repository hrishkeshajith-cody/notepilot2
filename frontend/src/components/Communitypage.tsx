import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, BookOpen, Layers, ArrowLeft, User, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudyPack, CustomFlashcardSet } from "@/types/studyPack";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

interface CommunityStudyPack {
  id: string;
  user_id: string;
  author_name: string;
  chapter_title: string;
  subject: string;
  grade: string;
  created_at: string;
  summary?: { tl_dr?: string };
}

interface CommunityFlashcardSet {
  set_id: string;
  user_id: string;
  author_name: string;
  title: string;
  description?: string;
  created_at: string;
}

interface CommunityPageProps {
  onBack: () => void;
  onOpenStudyPack: (pack: StudyPack) => void;
  onOpenFlashcardSet: (set: CustomFlashcardSet) => void;
  currentUserId?: string;
}

export const CommunityPage = ({ onBack, onOpenStudyPack, onOpenFlashcardSet, currentUserId }: CommunityPageProps) => {
  const [tab, setTab] = useState<"study-packs" | "flashcards">("study-packs");
  const [studyPacks, setStudyPacks] = useState<CommunityStudyPack[]>([]);
  const [flashcards, setFlashcards] = useState<CommunityFlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCommunityContent();
  }, []);

  const fetchCommunityContent = async () => {
    setLoading(true);
    try {
      const [packsRes, flashRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/community/study-packs`, { credentials: "include" }),
        fetch(`${BACKEND_URL}/api/community/flashcards`, { credentials: "include" }),
      ]);
      if (packsRes.ok) setStudyPacks(await packsRes.json());
      if (flashRes.ok) setFlashcards(await flashRes.json());
    } catch (e) {
      console.error("Failed to fetch community content", e);
    } finally {
      setLoading(false);
    }
  };

  const openStudyPack = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/community/study-packs/${id}`, { credentials: "include" });
      if (res.ok) {
        const pack = await res.json();
        // Map to StudyPack shape
        const studyPack: StudyPack = {
          meta: { subject: pack.subject, grade: pack.grade, chapter_title: pack.chapter_title, language: "" },
          summary: pack.summary || { tl_dr: "", important_points: [] },
          key_terms: pack.key_terms || [],
          flashcards: pack.flashcards || [],
          quiz: pack.quiz || { instructions: "", questions: [] },
          notes: pack.notes || [],
          important_questions: pack.important_questions || { one_mark: [], three_mark: [], five_mark: [] },
        };
        onOpenStudyPack(studyPack);
      }
    } catch (e) {
      console.error("Failed to open study pack", e);
    }
  };

  const openFlashcardSet = async (setId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/flashcards/${setId}`, { credentials: "include" });
      if (res.ok) {
        onOpenFlashcardSet(await res.json());
      }
    } catch (e) {
      console.error("Failed to open flashcard set", e);
    }
  };

  const filteredPacks = studyPacks.filter(p =>
    p.chapter_title.toLowerCase().includes(search.toLowerCase()) ||
    p.subject.toLowerCase().includes(search.toLowerCase()) ||
    p.author_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFlashcards = flashcards.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.author_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Community Library</h1>
            <p className="text-sm text-muted-foreground">Study packs & flashcards created by everyone</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by subject, chapter, or author..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-secondary/50 rounded-lg p-1 border border-border w-fit">
        <Button
          onClick={() => setTab("study-packs")}
          variant={tab === "study-packs" ? "default" : "ghost"}
          size="sm"
          className={`gap-2 ${tab === "study-packs" ? "gradient-primary text-primary-foreground" : ""}`}
        >
          <BookOpen className="w-4 h-4" />
          Study Packs
          <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">{studyPacks.length}</span>
        </Button>
        <Button
          onClick={() => setTab("flashcards")}
          variant={tab === "flashcards" ? "default" : "ghost"}
          size="sm"
          className={`gap-2 ${tab === "flashcards" ? "gradient-primary text-primary-foreground" : ""}`}
        >
          <Layers className="w-4 h-4" />
          Flashcard Sets
          <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">{flashcards.length}</span>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : tab === "study-packs" ? (
        filteredPacks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No study packs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPacks.map((pack, i) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openStudyPack(pack.id)}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {pack.chapter_title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{pack.subject} • Grade {pack.grade}</p>
                  </div>
                  {pack.user_id === currentUserId && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0 ml-2">Yours</span>
                  )}
                </div>
                {pack.summary?.tl_dr && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{pack.summary.tl_dr}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {pack.author_name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(pack.created_at)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        filteredFlashcards.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No flashcard sets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFlashcards.map((set, i) => (
              <motion.div
                key={set.set_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openFlashcardSet(set.set_id)}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{set.title}</h3>
                  {set.user_id === currentUserId && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0 ml-2">Yours</span>
                  )}
                </div>
                {set.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{set.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {set.author_name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(set.created_at)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}
    </motion.div>
  );
};
