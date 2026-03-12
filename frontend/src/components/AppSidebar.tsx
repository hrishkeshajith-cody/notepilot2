import { useState, useEffect } from "react";
import { BookOpen, History, LogOut, ChevronLeft, ChevronRight, Moon, Sun, Palette, Trash2, Loader2, Layers, Globe, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useThemePreferences } from "@/hooks/useThemePreferences";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { FlashcardCreator } from "@/components/FlashcardCreator";
import { StudyPack, CustomFlashcardSet } from "@/types/studyPack";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

interface AppSidebarProps {
  onSelectPack: (pack: StudyPack) => void;
  onSelectFlashcardSet: (set: CustomFlashcardSet) => void;
  onOpenCommunity: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  refreshTrigger?: number;
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

export function AppSidebar({ onSelectPack, onSelectFlashcardSet, onOpenCommunity, isCollapsed, onToggleCollapse, refreshTrigger = 0 }: AppSidebarProps) {
  const [studyPacks, setStudyPacks] = useState<SavedStudyPack[]>([]);
  const [customFlashcards, setCustomFlashcards] = useState<CustomFlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreferences } = useThemePreferences();

  useEffect(() => {
    if (user) {
      fetchStudyPacks();
      fetchCustomFlashcards();
    }
  }, [user]);

  useEffect(() => {
    if (user && refreshTrigger > 0) {
      fetchStudyPacks();
    }
  }, [refreshTrigger]);

  const fetchStudyPacks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/study-packs`, { credentials: "include" });
      if (response.ok) setStudyPacks(await response.json());
    } catch (error) {
      console.error("Error fetching study packs:", error);
    }
    setIsLoading(false);
  };

  const fetchCustomFlashcards = async () => {
    setIsLoadingFlashcards(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/flashcards`, { credentials: "include" });
      if (response.ok) setCustomFlashcards(await response.json());
    } catch (error) {
      console.error("Error fetching custom flashcards:", error);
    }
    setIsLoadingFlashcards(false);
  };

  const handleFlashcardCreated = () => fetchCustomFlashcards();

  const handleSelectPack = (pack: SavedStudyPack) => {
    const studyPack: StudyPack = {
      meta: { subject: pack.subject, grade: pack.grade, chapter_title: pack.chapter_title, language: "English" },
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
    toast({ title: "Signed out", description: "You've been successfully signed out." });
    navigate("/");
  };

  const handleDeletePack = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      const response = await fetch(`${BACKEND_URL}/api/study-packs/${id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) throw new Error("Delete failed");
      setStudyPacks(studyPacks.filter((p) => p.id !== id));
      toast({ title: "Deleted", description: "Study pack removed." });
    } catch {
      toast({ title: "Delete failed", description: "Could not delete the study pack.", variant: "destructive" });
    }
    setDeletingId(null);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "All fields required", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirm password must match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to change password");
      }

      toast({ title: "Password changed!", description: "Your password has been updated successfully." });
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Failed to change password", description: error.message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = () => {
    if (user?.name) return user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    return user?.email?.slice(0, 2).toUpperCase() || "U";
  };

  const displayName = user?.name || user?.email || "User";

  return (
    <>
      <aside className={cn("fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300 overflow-hidden z-40", isCollapsed ? "w-0 border-0" : "w-80")}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-border">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <img src="/logo.png" alt="NotePilot" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="font-display font-bold text-foreground">Notepilot</h1>
                <p className="text-xs text-muted-foreground">AI Study Materials</p>
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className={cn("h-8 w-8", isCollapsed && "mx-auto")}>
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Profile Section */}
        <div className={cn("p-4 border-b border-border", isCollapsed && "flex flex-col items-center gap-2")}>
          {isCollapsed ? (
            <>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials()}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="h-8 w-8">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="flex-1 justify-start gap-2">
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

              {/* Change Password Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangePassword(true)}
                className="w-full justify-start gap-2 text-muted-foreground"
              >
                <KeyRound className="h-4 w-4" />
                Change Password
              </Button>

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

        {/* Community Button */}
        {!isCollapsed && (
          <div className="px-4 pt-3 pb-1">
            <Button variant="outline" size="sm" onClick={onOpenCommunity} className="w-full justify-start gap-2 border-primary/30 text-primary hover:bg-primary/10">
              <Globe className="w-4 h-4" />
              Community Library
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!isCollapsed && (
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Layers className="w-4 h-4" />
                  My Flashcards
                </div>
                <FlashcardCreator onCreated={handleFlashcardCreated} />
              </div>
            </div>
          )}

          {!isCollapsed && (
            <div className="px-2 max-h-40 overflow-y-auto">
              {isLoadingFlashcards ? (
                <div className="space-y-2 p-2">{[1, 2].map((i) => <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />)}</div>
              ) : customFlashcards.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3 px-2">No flashcard sets yet</p>
              ) : (
                <div className="space-y-1 py-2">
                  {customFlashcards.map((set) => (
                    <button key={set.set_id} onClick={() => onSelectFlashcardSet(set)} className="group relative w-full text-left rounded-lg transition-colors hover:bg-muted/50 p-3">
                      <p className="font-medium text-foreground text-sm truncate">{set.title}</p>
                      <p className="text-xs text-muted-foreground">{set.flashcards.length} cards</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Separator className="mx-4 my-2" />

          {!isCollapsed && (
            <div className="p-4 pb-2 pt-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <History className="w-4 h-4" />
                Recent Study Packs
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-2">
            {isLoading ? (
              <div className="space-y-2 p-2">{[1, 2, 3].map((i) => <div key={i} className={cn("h-12 bg-muted/50 rounded-lg animate-pulse", isCollapsed && "h-10 w-10 mx-auto")} />)}</div>
            ) : studyPacks.length === 0 ? (
              !isCollapsed && <p className="text-sm text-muted-foreground text-center py-4 px-2">No saved study packs yet</p>
            ) : (
              <div className="space-y-1 py-2">
                {studyPacks.map((pack) => (
                  <div key={pack.id} className={cn("group relative w-full text-left rounded-lg transition-colors hover:bg-muted/50", isCollapsed ? "p-2 flex justify-center" : "p-3")}>
                    <button onClick={() => handleSelectPack(pack)} className="w-full text-left">
                      {isCollapsed ? (
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">{pack.subject.slice(0, 2).toUpperCase()}</div>
                      ) : (
                        <>
                          <p className="font-medium text-foreground text-sm truncate pr-8">{pack.chapter_title}</p>
                          <p className="text-xs text-muted-foreground truncate">{pack.subject} • {pack.grade}</p>
                        </>
                      )}
                    </button>
                    {!isCollapsed && (
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDeletePack(e, pack.id)} disabled={deletingId === pack.id}>
                        {deletingId === pack.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
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
          <Button variant="ghost" size={isCollapsed ? "icon" : "default"} onClick={handleSignOut} className={cn("text-muted-foreground hover:text-foreground", !isCollapsed && "w-full justify-start")}>
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span className="ml-2">Sign out</span>}
          </Button>
        </div>
      </aside>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowChangePassword(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleChangePassword} disabled={isChangingPassword} className="flex-1 gradient-primary text-primary-foreground">
                {isChangingPassword ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Updating...</> : "Update Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
