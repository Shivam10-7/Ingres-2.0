import { useState, useEffect } from "react";
import { User, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserInfo {
  userId: string;
  email: string;
}

const UserProfile = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:8081/auth/verify", {
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
      const res = await fetch("http://localhost:8081/auth/logout", {
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
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const initial = user.email.charAt(0).toUpperCase();

  return (
    <div className="p-4 border-t border-white/5 overflow-visible">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
          <span className="text-sm font-medium text-white">{initial}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{user.email}</p>
          <p className="text-xs text-white/50">Free plan</p>
        </div>
        <button
          onClick={handleLogout}
          title="Log out"
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <User className="w-5 h-5 text-white/50" />
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
