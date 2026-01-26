import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: supabaseUser } = useAuth();
  
  // Three states: null = checking, true = authenticated, false = not authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
    location.state?.user ? true : null
  );
  const [user, setUser] = useState(location.state?.user || null);

  useEffect(() => {
    // If user data was passed from AuthCallback, skip server check
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }

    // Check server-side authentication
    const checkAuth = async () => {
      try {
        const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
        const response = await fetch(`${backendUrl}/api/auth/me`, {
          credentials: "include", // Send cookies
        });

        if (!response.ok) {
          throw new Error("Not authenticated");
        }

        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        // If Emergent auth fails, try Supabase as fallback
        if (supabaseUser) {
          setUser(supabaseUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          navigate("/auth");
        }
      }
    };

    checkAuth();
  }, [location, navigate, supabaseUser]);

  // Show loading while checking
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Only render when authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
