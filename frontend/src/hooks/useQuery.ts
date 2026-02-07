/**
 * useQuery Hook
 * Manages query state and execution
 */

import { useState, useCallback } from "react";
import type{
  QuickQueryRequest,
  QueryResult,
  QueryState,
} from "../types/index.ts";
import { submitQuickQuery } from "../services/query.service";

const initialState: QueryState = {
  loading: false,
  error: null,
  results: [],
  metadata: null,
  lastQuery: null,
};

export function useQuery() {
  const [state, setState] = useState<QueryState>(initialState);

  const executeQuery = useCallback(
    async (query: QuickQueryRequest) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const result = await submitQuickQuery(query);

        setState((prev) => ({
          ...prev,
          loading: false,
          results: result.data,
          metadata: result.metadata,
          lastQuery: query,
          error: null,
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
          results: [],
          metadata: null,
        }));

        throw error;
      }
    },
    []
  );

  const clearResults = useCallback(() => {
    setState(initialState);
  }, []);

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    executeQuery,
    clearResults,
    resetError,
  };
}

export default useQuery;
