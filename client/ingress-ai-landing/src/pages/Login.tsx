{/* Reusable input row style — use this wrapper for every field */}

import { useEffect } from "react";
import Navbar from "@/components/Navbar";

import WaveBackground from "@/components/WaveBackground";
import { useForceLightMode } from "@/hooks/useForceLightMode";

const Login = () => {
  useForceLightMode();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Full-screen cave/water background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}cave-water-bg.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          filter: "brightness(0.62) saturate(1.3)",
        }}
      />
      {/* Deep teal overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(160deg, rgba(2,12,30,0.55) 0%, rgba(0,60,80,0.28) 50%, rgba(2,12,30,0.72) 100%)",
        }}
      />

      {/* Wave stays as ambient motion on top of the bg */}
      <WaveBackground />

      <Navbar />

      <section className="relative z-10 flex min-h-screen items-center justify-center pt-24 px-6">
        <LoginCard />
      </section>
    </div>
  );
};



import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";

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

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setError("");
    setName("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="w-full max-w-md"
      style={{
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.17)",
        borderRadius: "20px",
        padding: "40px 36px",
        boxShadow: "0 8px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.14)",
      }}
    >

      <h2
        style={{
          fontFamily: "'Noto Sans', sans-serif",
          fontSize: "30px",
          fontWeight: 300,
          color: "#fff",
          lineHeight: 1.2,
          marginBottom: "6px",
          letterSpacing: "-0.02em",
        }}
      >
        {isSignUp ? "Create account" : "Welcome back"}
      </h2>
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.48)", marginBottom: "28px" }}>
        {isSignUp ? "Create your account" : "Sign in to continue"}
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          if (isSignUp && !name) { setError("Full name is required"); return; }
          if (!email || !password) { setError("Email and password are required"); return; }
          if (isSignUp && password !== confirmPassword) { setError("Passwords do not match"); return; }

          setLoading(true);
          const endpoint = isSignUp
            ? "http://localhost:8081/auth/signup-email"
            : "http://localhost:8081/auth/login-email";
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
            navigate("/chat");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Authentication failed");
          } finally {
            setLoading(false);
          }
        }}
        className="space-y-3"
      >
        {/* Name (signup only) */}
        {isSignUp && (
          <div style={inputRowStyle}>
            <User style={iconStyle} />
            <input
              style={fieldStyle}
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        {/* Email */}
        <div style={inputRowStyle}>
          <Mail style={iconStyle} />
          <input
            style={fieldStyle}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password field */}
        <div style={inputRowStyle}>
          <Lock style={iconStyle} />
          <input
            style={fieldStyle}
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.4)",
              paddingRight: "14px",
              display: "flex",
            }}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Confirm password (signup only) */}
        {isSignUp && (
          <div style={inputRowStyle}>
            <Lock style={iconStyle} />
            <input
              style={fieldStyle}
              type={showPw ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        )}

        {/* Forgot password */}
        {!isSignUp && (
          <div className="text-right">
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.38)", cursor: "pointer" }}>
              Forgot password?
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(220,50,50,0.14)",
            border: "1px solid rgba(220,50,50,0.32)",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "12.5px",
            color: "#ff8080",
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.01, opacity: 0.93 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #00c8b4 0%, #0088cc 100%)",
            border: "none",
            borderRadius: "12px",
            padding: "14px",
            fontFamily: "inherit",
            fontSize: "14px",
            fontWeight: 500,
            color: "#fff",
            cursor: "pointer",
            marginTop: "4px",
            letterSpacing: "0.03em",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
        </motion.button>
      </form>

      <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.42)" }}>
        {isSignUp ? "Already have an account? " : "Don't have an account? "}
        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); resetForm(); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#00c8b4", fontSize: "13px", fontWeight: 500, textDecoration: "underline" }}
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>
    </motion.div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "12px",
  padding: "13px 14px 13px 42px",
  fontSize: "13.5px",
  fontFamily: "inherit",
  color: "#fff",
  outline: "none",
};

export default Login;

const inputRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "12px",
};

const iconStyle: React.CSSProperties = {
  flexShrink: 0,
  width: "16px",
  height: "16px",
  marginLeft: "14px",
  opacity: 0.42,
  color: "white",
};

const fieldStyle: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  padding: "13px 12px",
  fontSize: "13.5px",
  fontFamily: "inherit",
  color: "#fff",
  minWidth: 0,
};