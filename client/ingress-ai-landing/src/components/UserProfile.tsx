import { useState, useEffect } from "react";
import { User } from "lucide-react";
import LogoutButton from "./LogoutButton";

interface UserInfo {
  userId: string;
  email: string;
}

const UserProfile = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-secondary" />
        <div>
          <p className="text-xs text-muted-foreground">Logged in as</p>
          <p className="text-sm font-medium text-foreground">{user.email}</p>
        </div>
      </div>
      <LogoutButton />
    </div>
  );
};

export default UserProfile;
