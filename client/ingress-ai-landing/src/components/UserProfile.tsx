import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserInfo {
  userId: string;
  email: string;
}

interface UserProfileProps {
  /** Match chat theme so email / labels have readable contrast */
  isLightMode?: boolean;
}

const UserProfile = ({ isLightMode = true }: UserProfileProps) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        navigate("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div
        className={`text-sm px-4 py-2 ${isLightMode ? "text-slate-500" : "text-white/60"}`}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initial = user.email.charAt(0).toUpperCase();

  return (
    <div
      className={`p-4 overflow-visible border-t ${
        isLightMode
          ? "border-slate-500/25 bg-gradient-to-t from-slate-400/15 to-transparent backdrop-blur-sm"
          : "border-white/10 bg-black/15"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isLightMode
              ? "bg-gradient-to-br from-slate-600 to-slate-800"
              : "bg-gradient-to-br from-slate-500 to-slate-700"
          }`}
        >
          <span className="text-sm font-medium text-white">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              isLightMode ? "text-slate-900" : "text-white"
            }`}
            title={user.email}
          >
            {user.email}
          </p>
          <p
            className={`text-xs mt-0.5 ${
              isLightMode ? "text-slate-600" : "text-slate-300"
            }`}
          >
            Free plan
          </p>
        </div>
        <button
          onClick={handleLogout}
          title="Log out"
          type="button"
          className={`p-2 rounded-lg shrink-0 transition-colors ${
            isLightMode
              ? "hover:bg-slate-200/80 text-slate-600"
              : "hover:bg-white/10 text-white/80"
          }`}
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
