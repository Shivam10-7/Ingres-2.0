/**
 * AI Provider — THE SINGLE FILE to swap when replacing mock with real AI.
 *
 * Current: Mock provider using CGWB 2024 CSV data.
 * Future:  Import and export a real AI provider instead.
 *
 * No other file needs to change when switching providers.
 */

import { mockProvider } from "./mockProvider";
import type { AIProvider } from "./types";

// ── Swap this line to switch providers ──
const activeProvider: AIProvider = mockProvider;

// ── Public API (consumed by UI) ──
export const queryAI = activeProvider.query.bind(activeProvider);
export const getSampleQueries = activeProvider.getSampleQueries.bind(activeProvider);
