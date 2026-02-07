/**
 * QuickChat Component
 * Form-based interface for structured groundwater data queries
 * Now with reverse lookups and auto-results
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropdownCascade, useQuery } from "../../hooks";
import {
  validateDropdownSelection,
  fetchStatesForDistrict,
  fetchDistrictsForBlock,
  fetchStatesForBlock,
} from "../../services/dropdown.service";
import type{ QuickQueryRequest, DropdownOption } from "../../types/index.ts";
import "./QuickChat.css";

const ALL_OPTION: DropdownOption = {
  value: "__ALL__",
  label: "All",
};

interface QuickChatProps {
  onQuerySubmit?: (results: any) => void;
  onError?: (error: string) => void;
}

export const QuickChat: React.FC<QuickChatProps> = ({
  onQuerySubmit,
  onError,
}) => {
  const { data: dropdownData, loading: dropdownLoading, errors: dropdownErrors, loadDistricts, loadBlocks } = useDropdownCascade();
  const { loading: queryLoading, error: queryError, results, metadata, executeQuery, clearResults } = useQuery();

  // Form state - all dropdowns loaded independently
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedBlock, setSelectedBlock] = useState<string>("");
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Track reverse lookup results
  const [reverseLookupStates, setReverseLookupStates] = useState<DropdownOption[]>([]);
  const [reverseLookupDistricts, setReverseLookupDistricts] = useState<DropdownOption[]>([]);
  const [reverseLookupLoading, setReverseLookupLoading] = useState(false);

  // Ref to prevent excessive auto-query triggers
  const autoQueryPrevention = useRef<number>(0);

  // Load districts when state changes
  useEffect(() => {
    if (selectedState && selectedState !== "__ALL__") {
      loadDistricts(selectedState);
    } else if (selectedState === "__ALL__") {
      setSelectedDistrict("");
    } else {
      setSelectedDistrict("");
    }
  }, [selectedState, loadDistricts]);

  // Load blocks when district changes
  useEffect(() => {
    if (selectedState && selectedDistrict && selectedState !== "__ALL__" && selectedDistrict !== "__ALL__") {
      loadBlocks(selectedState, selectedDistrict);
    } else {
      setSelectedBlock("");
    }
  }, [selectedState, selectedDistrict, loadBlocks]);

  // REVERSE LOOKUP: Load states when district is selected first
  useEffect(() => {
    if (selectedDistrict && !selectedState) {
      setReverseLookupLoading(true);
      fetchStatesForDistrict(selectedDistrict)
        .then((states) => {
          setReverseLookupStates(states);
          // Auto-select state if only one match
          if (states.length === 1) {
            setSelectedState(states[0].value);
          }
        })
        .catch((err) => console.error("Error reverse-looking up states for district:", err))
        .finally(() => setReverseLookupLoading(false));
    } else {
      setReverseLookupStates([]);
    }
  }, [selectedDistrict, selectedState]);

  // REVERSE LOOKUP: Load state and districts when block is selected first
  useEffect(() => {
    if (selectedBlock && !selectedState && !selectedDistrict) {
      setReverseLookupLoading(true);
      Promise.all([
        fetchStatesForBlock(selectedBlock),
        fetchDistrictsForBlock(selectedBlock),
      ])
        .then(([states, districts]) => {
          setReverseLookupStates(states);
          setReverseLookupDistricts(districts);
          // Auto-select if only one match
          if (states.length === 1) {
            setSelectedState(states[0].value);
          }
          if (districts.length === 1) {
            setSelectedDistrict(districts[0].value);
          }
        })
        .catch((err) =>
          console.error("Error reverse-looking up for block:", err)
        )
        .finally(() => setReverseLookupLoading(false));
    } else {
      setReverseLookupDistricts([]);
    }
  }, [selectedBlock, selectedState, selectedDistrict]);

  // AUTO-EXECUTE QUERY when valid conditions are met and years are selected
  useEffect(() => {
    if (selectedYears.length === 0) return;

    // Throttle to prevent excessive queries (debounce)
    const now = Date.now();
    if (now - autoQueryPrevention.current < 500) return; // Prevent within 500ms
    autoQueryPrevention.current = now;

    const query: QuickQueryRequest = {
      state: selectedState === "__ALL__" ? "" : selectedState,
      district: selectedDistrict === "__ALL__" ? "" : selectedDistrict,
      block: selectedBlock === "__ALL__" ? "" : selectedBlock,
      years: selectedYears,
    };

    // Validate
    const validation = validateDropdownSelection(
      query.state,
      query.district,
      query.block,
      query.years
    );

    if (validation.valid) {
      setValidationErrors({});
      executeQuery(query).catch((error) => {
        const errorMsg =
          error instanceof Error ? error.message : "Query execution failed";
        onError?.(errorMsg);
      });
    }
  }, [selectedState, selectedDistrict, selectedBlock, selectedYears, executeQuery, onError]);

  // Handle state change
  const handleStateChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const state = e.target.value;
      setSelectedState(state);
      setSelectedDistrict("");
      setSelectedBlock("");
      setValidationErrors((prev) => ({ ...prev, district: "", block: "" }));
    },
    []
  );

  // Handle district change
  const handleDistrictChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const district = e.target.value;
      setSelectedDistrict(district);
      setSelectedBlock("");
      setValidationErrors((prev) => ({ ...prev, block: "" }));
    },
    []
  );

  // Handle block change
  const handleBlockChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedBlock(e.target.value);
      setValidationErrors((prev) => ({ ...prev, block: "" }));
    },
    []
  );

  // Handle year selection
  const handleYearChange = useCallback(
    (year: number) => {
      setSelectedYears((prev) =>
        prev.includes(year)
          ? prev.filter((y) => y !== year)
          : [...prev, year]
      );
    },
    []
  );

  // Handle form submission
  // Handle clear
  const handleClear = useCallback(() => {
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedBlock("");
    setSelectedYears([]);
    setValidationErrors({});
    setReverseLookupStates([]);
    setReverseLookupDistricts([]);
    clearResults();
  }, [clearResults]);

  const isLoading = queryLoading || dropdownLoading.states || dropdownLoading.districts || dropdownLoading.blocks || reverseLookupLoading;

  return (
    <div className="quick-chat-container">
      <div className="quick-chat-card">
        <h1 className="quick-chat-title">INGRES Quick Query</h1>
        <p className="quick-chat-subtitle">Form-based groundwater data interface</p>

        {queryError && (
          <div className="error-message">
            <span>❌ Error</span>
            <p>{queryError}</p>
          </div>
        )}

        <div className="quick-chat-form">
          {/* State Dropdown */}
          <div className="form-group">
            <label htmlFor="state-select" className="form-label">
              State
              {validationErrors.state && (
                <span className="error-text"> - {validationErrors.state}</span>
              )}
            </label>
            <select
              id="state-select"
              value={selectedState}
              onChange={handleStateChange}
              disabled={dropdownLoading.states || isLoading}
              className={`form-select ${validationErrors.state ? "error" : ""}`}
              aria-label="Select state"
            >
              <option value="">
                {dropdownLoading.states ? "Loading states..." : "Select a state"}
              </option>
              <option value={ALL_OPTION.value}>{ALL_OPTION.label}</option>
              {dropdownData.states.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
            {dropdownErrors.states && (
              <span className="error-text">{dropdownErrors.states}</span>
            )}
          </div>

          {/* District Dropdown */}
          <div className="form-group">
            <label htmlFor="district-select" className="form-label">
              District
              {validationErrors.district && (
                <span className="error-text"> - {validationErrors.district}</span>
              )}
            </label>
            <select
              id="district-select"
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={!selectedState || dropdownLoading.districts || isLoading}
              className={`form-select ${validationErrors.district ? "error" : ""}`}
              aria-label="Select district"
            >
              <option value="">
                {!selectedState
                  ? "Select state first"
                  : dropdownLoading.districts
                    ? "Loading districts..."
                    : "Select a district"}
              </option>
              {selectedState && <option value={ALL_OPTION.value}>{ALL_OPTION.label}</option>}
              {dropdownData.districts.map((district) => (
                <option key={district.value} value={district.value}>
                  {district.label}
                </option>
              ))}
            </select>
            {dropdownErrors.districts && (
              <span className="error-text">{dropdownErrors.districts}</span>
            )}
          </div>

          {/* Block Dropdown */}
          <div className="form-group">
            <label htmlFor="block-select" className="form-label">
              Block
              {validationErrors.block && (
                <span className="error-text"> - {validationErrors.block}</span>
              )}
            </label>
            <select
              id="block-select"
              value={selectedBlock}
              onChange={handleBlockChange}
              disabled={!selectedDistrict || dropdownLoading.blocks || isLoading}
              className={`form-select ${validationErrors.block ? "error" : ""}`}
              aria-label="Select block"
            >
              <option value="">
                {!selectedDistrict
                  ? "Select district first"
                  : dropdownLoading.blocks
                    ? "Loading blocks..."
                    : "Select a block"}
              </option>
              {selectedDistrict && <option value={ALL_OPTION.value}>{ALL_OPTION.label}</option>}
              {dropdownData.blocks.map((block) => (
                <option key={block.value} value={block.value}>
                  {block.label}
                </option>
              ))}
            </select>
            {dropdownErrors.blocks && (
              <span className="error-text">{dropdownErrors.blocks}</span>
            )}
          </div>

          {/* Years Multi-Select */}
          <div className="form-group">
            <label className="form-label">
              Years
              {validationErrors.years && (
                <span className="error-text"> - {validationErrors.years}</span>
              )}
            </label>
            <div className="years-container">
              {dropdownData.years.map((year) => (
                <label key={year} className="year-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(year)}
                    onChange={() => handleYearChange(year)}
                    disabled={isLoading}
                    aria-label={`Select year ${year}`}
                  />
                  <span>{year}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="form-buttons">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="btn btn-secondary"
              aria-label="Clear form"
            >
              Clear Selection
            </button>
          </div>

          {queryLoading && (
            <div className="loading-indicator">
              <span className="spinner"></span> Fetching data...
            </div>
          )}
          {metadata && (
            <div className="metadata-display">
              <p className="metadata-text">
                ⏱️ Execution time: {metadata.execution_time_ms}ms |
                📊 Rows: {metadata.rows_returned} |
                {metadata.cached ? " ✅ Cached" : " 🔄 Fresh"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickChat;
