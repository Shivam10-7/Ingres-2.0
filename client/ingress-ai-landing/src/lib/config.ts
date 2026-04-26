const readEnv = (
  key: "VITE_API_BASE_URL" | "VITE_RAG_API_BASE_URL" | "VITE_QUICKCHAT_URL",
  fallback: string
) => {
  const value = import.meta.env[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
};

export const API_BASE_URL = readEnv(
  "VITE_API_BASE_URL",
  "https://ingres-2-0-0xfe.onrender.com"
);

export const RAG_API_BASE_URL = readEnv(
  "VITE_RAG_API_BASE_URL",
  "https://ingres-2-0.onrender.com"
);

export const QUICKCHAT_URL = readEnv(
  "VITE_QUICKCHAT_URL",
  "/quickchat/quick-mode.html"
);
