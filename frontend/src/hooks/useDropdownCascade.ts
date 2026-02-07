/**
 * useDropdownCascade Hook
 * Manages dropdown cascade state and logic
 */

import { useState, useCallback, useEffect } from "react";
import type {
  DropdownOption,
} from "../types/index.ts";
import {
  fetchStates,
  fetchDistricts,
  fetchBlocks,
  fetchYears,
} from "../services/dropdown.service";

interface CascadeState {
  states: DropdownOption[];
  districts: DropdownOption[];
  blocks: DropdownOption[];
  years: number[];
}

interface CascadeLoading {
  states: boolean;
  districts: boolean;
  blocks: boolean;
  years: boolean;
}

interface CascadeErrors {
  states?: string;
  districts?: string;
  blocks?: string;
  years?: string;
}

export function useDropdownCascade() {
  const [data, setData] = useState<CascadeState>({
    states: [],
    districts: [],
    blocks: [],
    years: [],
  });

  const [loading, setLoading] = useState<CascadeLoading>({
    states: true,
    districts: false,
    blocks: false,
    years: true,
  });

  const [errors, setErrors] = useState<CascadeErrors>({});

  // Load states on mount
  useEffect(() => {
    loadStates();
    loadYears();
  }, []);

  const loadStates = useCallback(async () => {
    setLoading((prev) => ({ ...prev, states: true }));
    setErrors((prev) => ({ ...prev, states: undefined }));

    try {
      const states = await fetchStates();
      setData((prev) => ({ ...prev, states }));
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to load states";
      setErrors((prev) => ({ ...prev, states: errorMsg }));
    } finally {
      setLoading((prev) => ({ ...prev, states: false }));
    }
  }, []);

  const loadDistricts = useCallback(async (state: string) => {
    if (!state) {
      setData((prev) => ({ ...prev, districts: [], blocks: [] }));
      return;
    }

    setLoading((prev) => ({ ...prev, districts: true }));
    setErrors((prev) => ({ ...prev, districts: undefined }));

    try {
      const districts = await fetchDistricts(state);
      setData((prev) => ({ ...prev, districts, blocks: [] }));
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to load districts";
      setErrors((prev) => ({ ...prev, districts: errorMsg }));
    } finally {
      setLoading((prev) => ({ ...prev, districts: false }));
    }
  }, []);

  const loadBlocks = useCallback(async (state: string, district: string) => {
    if (!state || !district) {
      setData((prev) => ({ ...prev, blocks: [] }));
      return;
    }

    setLoading((prev) => ({ ...prev, blocks: true }));
    setErrors((prev) => ({ ...prev, blocks: undefined }));

    try {
      const blocks = await fetchBlocks(state, district);
      setData((prev) => ({ ...prev, blocks }));
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to load blocks";
      setErrors((prev) => ({ ...prev, blocks: errorMsg }));
    } finally {
      setLoading((prev) => ({ ...prev, blocks: false }));
    }
  }, []);

  const loadYears = useCallback(async () => {
    setLoading((prev) => ({ ...prev, years: true }));
    setErrors((prev) => ({ ...prev, years: undefined }));

    try {
      const years = await fetchYears();
      setData((prev) => ({ ...prev, years }));
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to load years";
      setErrors((prev) => ({ ...prev, years: errorMsg }));
    } finally {
      setLoading((prev) => ({ ...prev, years: false }));
    }
  }, []);

  return {
    data,
    loading,
    errors,
    loadStates,
    loadDistricts,
    loadBlocks,
    loadYears,
  };
}

export default useDropdownCascade;
