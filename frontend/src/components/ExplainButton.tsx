import { Sparkles } from "lucide-react";
import { useNotePilot } from "@/contexts/NotePilotContext";
import { cn } from "@/lib/utils";

interface ExplainButtonProps {
  content: string;
  type: string;
  className?: string;
}

export const ExplainButton = ({ content, type, className }: ExplainButtonProps) => {
  const { askAbout } = useNotePilot();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    askAbout(content, type);
  };

  return (
    <button
      onClick={handleClick}
      title="Explain with NotePilot AI"
      className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded-full",
        "bg-primary/10 hover:bg-primary/20 text-primary",
        "transition-all duration-200 hover:scale-110",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        className
      )}
    >
      <Sparkles className="w-3.5 h-3.5" />
    </button>
  );
};
