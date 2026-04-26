import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

const LoginCard = () => {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="glass-card p-8 md:p-10 w-full max-w-md"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <h2 className="font-display text-2xl font-bold text-foreground mb-1">
        {isSignUp ? "Create account" : "Welcome back"}
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        {isSignUp ? "Sign up for Jal Sathi AI" : "Sign in to Jal Sathi AI"}
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          
          // Validate signup password match
          if (isSignUp && password !== confirmPassword) {
            setError("Passwords do not match");
            return;
          }

          // Validate required fields
          if (isSignUp && !name) {
            setError("Name is required");
            return;
          }

          if (!email || !password) {
            setError("Email and password are required");
            return;
          }

          setLoading(true);
          const endpoint = isSignUp
            ? `${API_BASE_URL}/auth/signup-email`
            : `${API_BASE_URL}/auth/login-email`;
          try {
            const res = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ email, password, name }),
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "Authentication failed");
            }
            const data = await res.json();
            if (data?.token && typeof window !== "undefined") {
              window.localStorage.setItem("authToken", data.token);
            }
            // on success the JWT cookie will be set automatically and user data stored in MongoDB
            navigate('/chat');
          } catch (err) {
            console.error("auth error", err);
            setError(err instanceof Error ? err.message : "Authentication failed");
          } finally {
            setLoading(false);
          }
        }}
        className="space-y-5"
      >
        {/* Name (signup only) */}
        {isSignUp && (
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/60 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        {/* Email */}
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/60 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Password */}
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-background/60 py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Confirm Password (signup only) */}
        {isSignUp && (
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type={showPw ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/60 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-100/10 border border-red-500/30 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="btn-glow w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : isSignUp ? "Sign Up" : "Login"}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account? " : "Don't have an account? "}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setPassword("");
            setConfirmPassword("");
            setError("");
            setName("");
          }}
          className="font-medium text-secondary hover:underline"
        >
          {isSignUp ? "Login" : "Sign Up"}
        </button>
      </p>
    </motion.div>
  );
};

export default LoginCard;
