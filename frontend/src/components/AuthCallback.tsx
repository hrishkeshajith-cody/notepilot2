import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get("session_id");

        if (!sessionId) {
          toast({
            title: "Authentication failed",
            description: "No session ID found",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        // Exchange session_id for user data and set cookie
        const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || "";
        const response = await fetch(`${backendUrl}/api/auth/session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important for cookies
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!response.ok) {
          throw new Error("Session exchange failed");
        }

        const userData = await response.json();

        // Clear the hash from URL
        window.history.replaceState(null, "", window.location.pathname);

        // Navigate to dashboard with user data
        navigate("/app", { state: { user: userData }, replace: true });

        toast({
          title: "Welcome!",
          description: `Signed in as ${userData.name || userData.email}`,
        });
      } catch (error) {
        console.error("Auth callback error:", error);
        toast({
          title: "Authentication failed",
          description: "Unable to complete sign in. Please try again.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    processSession();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
