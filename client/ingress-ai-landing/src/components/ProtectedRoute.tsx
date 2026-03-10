import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated by verifying JWT token
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:8081/auth/verify", { credentials: "include" });
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          navigate("/"); // Redirect to landing page if not authenticated
        }
      } catch (error) {
        setIsAuthenticated(false);
        navigate("/"); // Redirect to landing page on error
      }
    };

    checkAuth();
  }, [navigate]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
