const express = require("express");
const cors = require("cors");
const path = require("path");
const metaRoutes = require("./routes/metaRoutes");
const queryRoutes = require("./routes/queryRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });
  next();
});

// App pages
app.get("/", (req, res) => res.redirect("/quick-mode"));
app.get("/quick-mode", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/quick-mode.html"));
});
app.get("/chat-mode", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/chat-mode.html"));
});

app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/meta", metaRoutes);
app.use("/api/query", queryRoutes);

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Centralized error handler
app.use((err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  console.error(
    `[${new Date().toISOString()}] ERROR ${req.method} ${req.originalUrl}:`,
    err?.message || err
  );
  if (process.env.NODE_ENV !== "production" && err?.stack) {
    console.error(err.stack);
  }
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
