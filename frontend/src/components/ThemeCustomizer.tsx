import React from 'react';
import { AppTheme, AppFont, AppShape } from '@/types/studyPack';
import { Check, Type as FontIcon, Sparkles } from 'lucide-react';

interface ThemeOption { id: AppTheme; name: string; color: string; }
const THEMES: ThemeOption[] = [
  { id: 'original', name: 'Original', color: '#7C5DFA' },
  { id: 'default', name: 'Indigo', color: '#6366f1' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'violet', name: 'Violet', color: '#8b5cf6' },
  { id: 'rose', name: 'Rose', color: '#f43f5e' },
  { id: 'amber', name: 'Amber', color: '#f59e0b' },
];

const FONTS: { id: AppFont; name: string }[] = [
  { id: 'Inter', name: 'Modern Sans' },
  { id: 'Playfair Display', name: 'Classic Serif' },
  { id: 'JetBrains Mono', name: 'Developer Mono' },
  { id: 'Quicksand', name: 'Friendly Rounded' },
];

const SHAPES: { id: AppShape; name: string; radius: string }[] = [
  { id: 'sharp', name: 'Sharp', radius: '4px' },
  { id: 'default', name: 'Modern', radius: '12px' },
  { id: 'rounded', name: 'Soft', radius: '24px' },
];

interface ThemeCustomizerProps {
  currentTheme: AppTheme;
  currentFont: AppFont;
  currentShape: AppShape;
  onChange: (updates: { theme?: AppTheme; font?: AppFont; shape?: AppShape }) => void;
  compact?: boolean;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ 
  currentTheme, currentFont, currentShape, onChange, compact = false 
}) => {
  return (
    <div className="space-y-6">
      {/* Color Palette */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Color Palette</label>
        <div className="grid grid-cols-6 gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onChange({ theme: theme.id })}
              className={`group flex flex-col items-center gap-2 p-2 rounded-xl border transition-all
                ${currentTheme === theme.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-transparent hover:bg-muted'}`}
            >
              <div className="relative w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: theme.color }}>
                {theme.id === 'original' && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7C5DFA] to-[#00C9A7] opacity-100"></div>
                )}
                {currentTheme === theme.id && <Check className="w-4 h-4 text-white relative z-10" />}
                {theme.id === 'original' && currentTheme !== 'original' && <Sparkles className="w-3 h-3 text-white/50 relative z-10" />}
              </div>
              {!compact && <span className="text-[9px] font-bold text-muted-foreground uppercase">{theme.name}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Typography</label>
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map((font) => (
            <button
              key={font.id}
              onClick={() => onChange({ font: font.id })}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left
                ${currentFont === font.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
              style={{ fontFamily: font.id }}
            >
              <FontIcon className={`w-4 h-4 ${currentFont === font.id ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-xs font-bold truncate">{font.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interface Shape */}
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Interface Shape</label>
        <div className="grid grid-cols-3 gap-2">
          {SHAPES.map((shape) => (
            <button
              key={shape.id}
              onClick={() => onChange({ shape: shape.id })}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                ${currentShape === shape.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}
            >
              <div 
                className={`w-5 h-5 border-2 ${currentShape === shape.id ? 'border-primary bg-primary/10' : 'border-muted-foreground/30'}`}
                style={{ borderRadius: shape.radius }}
              />
              <span className="text-[9px] font-bold uppercase">{shape.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
