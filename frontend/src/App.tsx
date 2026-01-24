import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemePreferencesProvider } from "@/hooks/useThemePreferences";
import { NotePilotProvider } from "@/contexts/NotePilotContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NotePilotChat } from "@/components/NotePilotChat";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import StudyApp from "./pages/StudyApp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemePreferencesProvider>
        <AuthProvider>
          <NotePilotProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route
                    path="/app"
                    element={
                      <ProtectedRoute>
                        <StudyApp />
                      </ProtectedRoute>
                    }
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              <NotePilotChat />
            </TooltipProvider>
          </NotePilotProvider>
        </AuthProvider>
      </ThemePreferencesProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
