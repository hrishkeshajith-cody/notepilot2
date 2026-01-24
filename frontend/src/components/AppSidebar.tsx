import { useState, useEffect } from "react";
import { BookOpen, History, LogOut, ChevronLeft, ChevronRight, Moon, Sun, Palette, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useThemePreferences } from "@/hooks/useThemePreferences";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { StudyPack } from "@/types/studyPack";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AppSidebarProps {
  onSelectPack: (pack: StudyPack) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface Profile {
  full_name: string | null;
}

interface SavedStudyPack {
  id: string;
  chapter_title: string;
  subject: string;
  grade: string;
  created_at: string;
  summary: any;
  key_terms: any;
  flashcards: any;
  quiz: any;
  notes: any;
  important_questions: any;
}

export function AppSidebar({ onSelectPack, isCollapsed, onToggleCollapse }: AppSidebarProps) {
  const [studyPacks, setStudyPacks] = useState<SavedStudyPack[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreferences } = useThemePreferences();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStudyPacks();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const fetchStudyPacks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("study_packs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching study packs:", error);
    } else {
      setStudyPacks(data || []);
    }
    setIsLoading(false);
  };

  const handleSelectPack = (pack: SavedStudyPack) => {
    const studyPack: StudyPack = {
      meta: {
        subject: pack.subject,
        grade: pack.grade,
        chapter_title: pack.chapter_title,
        language: "English",
      },
      summary: pack.summary,
      key_terms: pack.key_terms,
      flashcards: pack.flashcards,
      quiz: pack.quiz,
      notes: pack.notes || [],
      important_questions: pack.important_questions || { one_mark: [], three_mark: [], five_mark: [] },
    };
    onSelectPack(studyPack);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  const handleDeletePack = async (e: React.MouseEvent, id: string) => {
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
      setStudyPacks(studyPacks.filter((p) => p.id !== id));
      toast({
        title: "Deleted",
        description: "Study pack removed.",
      });
    }
    setDeletingId(null);
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U";
  };

  const displayName = profile?.full_name || user?.email || "User";

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-80"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-primary">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground">Notepilot</h1>
              <p className="text-xs text-muted-foreground">AI Study Materials</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className={cn("h-8 w-8", isCollapsed && "mx-auto")}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Profile Section */}
      <div className={cn("p-4 border-b border-border", isCollapsed && "flex flex-col items-center gap-2")}>
        {isCollapsed ? (
          <>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{displayName}</p>
                {profile?.full_name && user?.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex-1 justify-start gap-2"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light" : "Dark"}
              </Button>
              <Collapsible open={customizeOpen} onOpenChange={setCustomizeOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Palette className="h-4 w-4" />
                    Customize
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>

            <Collapsible open={customizeOpen} onOpenChange={setCustomizeOpen}>
              <CollapsibleContent className="pt-2">
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <ThemeCustomizer
                    currentTheme={preferences.theme}
                    currentFont={preferences.font}
                    currentShape={preferences.shape}
                    onChange={(updates) => updatePreferences(updates)}
                    compact
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

      {/* Study Packs History */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!isCollapsed && (
          <div className="p-4 pb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <History className="w-4 h-4" />
              Recent Study Packs
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto px-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-12 bg-muted/50 rounded-lg animate-pulse",
                    isCollapsed && "h-10 w-10 mx-auto"
                  )}
                />
              ))}
            </div>
          ) : studyPacks.length === 0 ? (
            !isCollapsed && (
              <p className="text-sm text-muted-foreground text-center py-4 px-2">
                No saved study packs yet
              </p>
            )
          ) : (
            <div className="space-y-1 py-2">
              {studyPacks.map((pack) => (
                <div
                  key={pack.id}
                  className={cn(
                    "group relative w-full text-left rounded-lg transition-colors hover:bg-muted/50",
                    isCollapsed ? "p-2 flex justify-center" : "p-3"
                  )}
                >
                  <button
                    onClick={() => handleSelectPack(pack)}
                    className="w-full text-left"
                  >
                    {isCollapsed ? (
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {pack.subject.slice(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-foreground text-sm truncate pr-8">
                          {pack.chapter_title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {pack.subject} • {pack.grade}
                        </p>
                      </>
                    )}
                  </button>
                  {!isCollapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeletePack(e, pack.id)}
                      disabled={deletingId === pack.id}
                    >
                      {deletingId === pack.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Sign Out */}
      <div className={cn("p-4", isCollapsed && "flex justify-center")}>
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          onClick={handleSignOut}
          className={cn("text-muted-foreground hover:text-foreground", !isCollapsed && "w-full justify-start")}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="ml-2">Sign out</span>}
        </Button>
      </div>
    </aside>
  );
}
