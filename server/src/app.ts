/**
 * Express Server Application
 * Main entry point for the INGRES backend
 */

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException] ', err && (err.stack || err));
});
process.on('unhandledRejection', (reason) => {
  // reason can be any type; stringify safely
  try {
    if (reason && (reason as any).stack) {
      console.error('[unhandledRejection] ', (reason as any).stack);
    } else {
      console.error('[unhandledRejection] ', reason);
    }
  } catch (e) {
    console.error('[unhandledRejection] (unable to serialize reason)', reason);
  }
});

console.log('[app] start importing');
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.routes.js";
import * as csvLoader from "./services/csv-loader.service.js";
import { fileURLToPath } from "url";
import path from "path";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = "/api/v1";

/**
 * Middleware: Logging
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * Middleware: CORS
 */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

/**
 * Middleware: JSON Parser
 */
app.use(express.json({ limit: "10mb" }));

/**
 * Health Check Endpoint
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Initialize Data
 */
app.get("/init", (req: Request, res: Response) => {
  try {
    const stats = csvLoader.getCacheStats();
    if (!stats.cached) {
      console.log("Initializing data...");
      csvLoader.loadAllData();
    }

    res.status(200).json({
      success: true,
      message: "Server initialized successfully",
      stats: csvLoader.getCacheStats(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Initialization failed",
    });
  }
});

/**
 * API Routes
 */
app.use(API_PREFIX, apiRoutes);

/**
 * 404 Handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
});

/**
 * Error Handler
 */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

/**
 * Initialize server
 */
export async function initializeServer(): Promise<Express> {
  try {
    // Clear any stale cache and load fresh data
    console.log("Clearing stale cache...");
    csvLoader.clearCache();
    
    // Load CSV data on startup
    console.log("Loading groundwater data...");
    csvLoader.loadAllData();
    console.log("Data loaded successfully");

    return app;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    throw error;
  }
}

/**
 * Start server
 */
export async function startServer(): Promise<void> {
  try {
    const server = await initializeServer();

    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════╗
║   INGRES Backend Server Started       ║
╠═══════════════════════════════════════╣
║ API URL:   http://localhost:${PORT}   
║ API Prefix: ${API_PREFIX}
║ Status:    Ready
╚═══════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start if run directly (ESM-compatible)
console.log("[startup-check] import.meta.url ->", fileURLToPath(import.meta.url));
console.log("[startup-check] process.argv[1] ->", process.argv[1]);
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  console.log("[startup-check] entry match: starting server");
  startServer();
} else {
  console.log("[startup-check] not entry; skipping automatic start (use startServer() manually or set SKIP_START=false)");
}

export default app;
