import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { AppTheme, AppFont, AppShape, UserPreferences } from '@/types/studyPack';

interface ThemePreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'default',
  font: 'Inter',
  shape: 'default',
};

const ThemePreferencesContext = createContext<ThemePreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'notepilot-preferences';

export function ThemePreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return { ...defaultPreferences, ...JSON.parse(stored) };
        } catch {
          return defaultPreferences;
        }
      }
    }
    return defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    
    // Apply theme colors
    const root = document.documentElement;
    root.setAttribute('data-theme', preferences.theme);
    
    // Apply font - set CSS variables for body and display fonts
    const fontMap: Record<AppFont, { body: string; display: string }> = {
      'Inter': { body: "'Inter', sans-serif", display: "'Space Grotesk', sans-serif" },
      'Playfair Display': { body: "'Playfair Display', serif", display: "'Playfair Display', serif" },
      'JetBrains Mono': { body: "'JetBrains Mono', monospace", display: "'JetBrains Mono', monospace" },
      'Quicksand': { body: "'Quicksand', sans-serif", display: "'Quicksand', sans-serif" },
    };
    const fonts = fontMap[preferences.font];
    root.style.setProperty('--font-body', fonts.body);
    root.style.setProperty('--font-display', fonts.display);
    // Also directly apply to body for immediate effect
    document.body.style.fontFamily = fonts.body;
    console.log('Font changed to:', preferences.font, fonts);
    
    // Apply shape
    const radiusMap: Record<AppShape, string> = {
      sharp: '0.25rem',
      default: '0.75rem',
      rounded: '1.5rem',
    };
    root.style.setProperty('--radius', radiusMap[preferences.shape]);
  }, [preferences]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  return (
    <ThemePreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </ThemePreferencesContext.Provider>
  );
}

export function useThemePreferences() {
  const context = useContext(ThemePreferencesContext);
  if (!context) {
    throw new Error('useThemePreferences must be used within a ThemePreferencesProvider');
  }
  return context;
}
