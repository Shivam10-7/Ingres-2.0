import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

const LogoutButton = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8081/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        // JWT cookie is cleared by server
        navigate("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-500 text-sm font-medium transition-colors disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
};

export default LogoutButton;
