const chatWindow = document.getElementById("chat-window");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");
const chatReset = document.getElementById("chat-reset");
const chatStateInput = document.getElementById("chat-state-input");
const chatDistrictInput = document.getElementById("chat-district-input");
const chatBlockInput = document.getElementById("chat-block-input");
const chatApply = document.getElementById("chat-apply");
const chatAssistError = document.getElementById("chat-assist-error");
const chatStatesList = document.getElementById("chat-states-list");
const chatDistrictsList = document.getElementById("chat-districts-list");
const chatBlocksList = document.getElementById("chat-blocks-list");

const API_BASE = "/api";
const STATES = {
  ASK_STATE: "ASK_STATE",
  ASK_DISTRICT_OR_LEVEL: "ASK_DISTRICT_OR_LEVEL",
  ASK_YEAR: "ASK_YEAR",
  CONFIRM_AND_QUERY: "CONFIRM_AND_QUERY",
  DONE: "DONE",
};

let currentState = STATES.ASK_STATE;
let conversation = {
  state: null,
  district: null,
  block: null,
  years: undefined, // undefined means not chosen, [] means use latest
};

const caches = {
  states: [],
  districts: new Map(), // state -> districts array
  blocks: new Map(), // `${state}|${district}` -> blocks array
};

function fillDatalist(listEl, values = []) {
  if (!listEl) return;
  listEl.innerHTML = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    listEl.appendChild(option);
  });
}

function normalizeValue(value) {
  return value?.trim().toLowerCase() || "";
}

function findExact(value, options = []) {
  const target = normalizeValue(value);
  return options.find((opt) => normalizeValue(opt) === target) || null;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function fuzzyMatch(query, options = [], threshold = 0.6) {
  if (!query || !options.length) return null;

  const normalizedQuery = normalizeValue(query);
  let bestMatch = null;
  let bestScore = 0;

  for (const option of options) {
    const normalizedOption = normalizeValue(option);
    const score = calculateSimilarity(normalizedQuery, normalizedOption);

    if (score > bestScore && score >= threshold) {
      bestMatch = option;
      bestScore = score;
    }
  }

  return bestMatch;
}

function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1;

  // Simple similarity based on common characters and position
  let score = 0;
  const longerLen = longer.length;
  const shorterLen = shorter.length;

  // Check if shorter string is contained in longer
  if (longer.includes(shorter)) {
    score += 0.8;
  }

  // Check character overlap
  const chars1 = new Set(str1.split(''));
  const chars2 = new Set(str2.split(''));
  const intersection = new Set([...chars1].filter(x => chars2.has(x)));
  const union = new Set([...chars1, ...chars2]);
  score += (intersection.size / union.size) * 0.2;

  return Math.min(score, 1);
}

/**
 * Rendering helpers
 */
function addMessage(text, sender = "bot") {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${sender}`;
  bubble.innerText = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

function showTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "bubble bot typing";
  indicator.innerHTML = `
    <div class="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  indicator.id = "typing-indicator";
  chatWindow.appendChild(indicator);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return indicator;
}

function hideTypingIndicator() {
  const indicator = document.getElementById("typing-indicator");
  if (indicator) {
    indicator.remove();
  }
}

function showLoadingButton(button) {
  if (!button) return;
  button.disabled = true;
  button.dataset.originalText = button.textContent;
  button.innerHTML = '<span class="loading-spinner"></span> Loading...';
}

function hideLoadingButton(button) {
  if (!button) return;
  button.disabled = false;
  button.innerHTML = button.dataset.originalText || 'Apply';
}

function setAssistError(message = "") {
  if (chatAssistError) {
    chatAssistError.textContent = message;
  }
}

function resetConversation(clearHistory = true) {
  conversation = { state: null, district: null, block: null, years: undefined };
  currentState = STATES.ASK_STATE;
  if (clearHistory) {
    chatWindow.innerHTML = "";
  }
  addMessage(window.i18n.getTranslation("messages.startMessage"));
}

/**
 * Data helpers
 */
async function fetchJSON(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = "Request failed";

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      } catch {
        // If we can't parse error response, use status text
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Network connection failed. Please check your internet connection and try again.");
    }
    if (error.message.includes('HTTP 404')) {
      throw new Error("The requested data could not be found. Please try a different location or contact support.");
    }
    if (error.message.includes('HTTP 500')) {
      throw new Error("Server error occurred. Please try again later or contact support.");
    }
    throw error;
  }
}

async function loadStates() {
  if (caches.states.length) return caches.states;
  caches.states = await fetchJSON(`${API_BASE}/meta/states`);
  fillDatalist(chatStatesList, caches.states);
  return caches.states;
}

async function loadDistricts(state) {
  if (caches.districts.has(state)) return caches.districts.get(state);
  const districts = await fetchJSON(
    `${API_BASE}/meta/districts?state=${encodeURIComponent(state)}`
  );
  caches.districts.set(state, districts);
  if (normalizeValue(state) === normalizeValue(chatStateInput?.value)) {
    fillDatalist(chatDistrictsList, districts);
  }
  return districts;
}

async function loadBlocks(state, district) {
  const key = `${state}|${district}`;
  if (caches.blocks.has(key)) return caches.blocks.get(key);
  const blocks = await fetchJSON(
    `${API_BASE}/meta/blocks?state=${encodeURIComponent(state)}&district=${encodeURIComponent(
      district
    )}`
  );
  caches.blocks.set(key, blocks);
  if (
    normalizeValue(state) === normalizeValue(chatStateInput?.value) &&
    normalizeValue(district) === normalizeValue(chatDistrictInput?.value)
  ) {
    fillDatalist(chatBlocksList, blocks);
  }
  return blocks;
}

/**
 * Parsing helpers
 */
function detectMatch(text, options = []) {
  // First try exact match
  const exactMatch = findExact(text, options);
  if (exactMatch) return exactMatch;

  // Then try fuzzy match
  return fuzzyMatch(text, options, 0.6);
}

function parseYears(text) {
  const lower = text.toLowerCase();
  if (lower.includes("latest")) return [];
  if (lower.includes("both") || lower.includes("all")) return [2023, 2024];

  const matches = [];
  if (lower.match(/2023/)) matches.push(2023);
  if (lower.match(/2024/)) matches.push(2024);

  if (matches.length) return Array.from(new Set(matches));
  return null; // no signal detected
}

function wantsStateLevel(text) {
  const lower = text.toLowerCase();
  return lower.includes("state level") || lower.includes("no district") || lower.includes("skip");
}

function formatSuggestions(list, limit = 3) {
  return list.slice(0, limit).join(", ");
}

function formatResults(years, locationText) {
  let result = `📊 Groundwater Data for ${locationText}\n\n`;

  years.forEach((year) => {
    const extractable = formatNumber(year.annual_extractable);
    const extraction = formatNumber(year.total_extraction);
    const stage = year.stage_percent !== null ? `${year.stage_percent}%` : "—";
    const category = year.categorization || "Unknown";

    result += ` **${year.year}**\n`;
    result += `   💧 Annual Extractable: ${extractable} BCM\n`;
    result += `   🚰 Total Extraction: ${extraction} BCM\n`;
    result += `   📈 Groundwater Stage: ${stage}\n`;
    result += `   🏷️  Category: ${category}\n\n`;
  });

  // Add interpretation help
  if (years.length > 0) {
    const latestYear = years[years.length - 1];
    if (latestYear.stage_percent !== null) {
      const stage = latestYear.stage_percent;
      let interpretation = "";
      if (stage < 70) {
        interpretation = "🟢 Safe zone - Good groundwater availability";
      } else if (stage < 90) {
        interpretation = "🟡 Semi-critical - Moderate groundwater stress";
      } else if (stage < 100) {
        interpretation = "🟠 Critical - High groundwater stress";
      } else {
        interpretation = "🔴 Over-exploited - Severe groundwater depletion";
      }
      result += `💡 **Interpretation**: ${interpretation}\n`;
    }
  }

  // Add export options
  result += `\n📥 **Export Options**: Type "export csv" or "export json" to download this data.`;

  return result.trim();
}

function formatNumber(num) {
  if (num === null || num === undefined) return "—";
  if (typeof num === "number") {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toFixed(2);
  }
  return num.toString();
}

function exportToCSV(data, locationText) {
  const headers = ["Year", "Annual Extractable (BCM)", "Total Extraction (BCM)", "Groundwater Stage (%)", "Category"];
  const rows = data.map(year => [
    year.year,
    year.annual_extractable || "",
    year.total_extraction || "",
    year.stage_percent || "",
    year.categorization || ""
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `groundwater_data_${locationText.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToJSON(data, locationText) {
  const exportData = {
    location: locationText,
    query_timestamp: new Date().toISOString(),
    data: data
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `groundwater_data_${locationText.replace(/[^a-zA-Z0-9]/g, "_")}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Store last query results for export
let lastQueryResults = null;
let lastLocationText = "";

/**
 * Assisted selectors (searchable dropdowns)
 */
async function handleStateAssistChange() {
  setAssistError("");
  const value = chatStateInput?.value?.trim();
  if (!value) {
    chatDistrictInput.value = "";
    chatBlockInput.value = "";
    chatDistrictInput.disabled = true;
    chatBlockInput.disabled = true;
    fillDatalist(chatDistrictsList, []);
    fillDatalist(chatBlocksList, []);
    return;
  }

  try {
    const states = await loadStates();
    const match = findExact(value, states);
    if (!match) {
      const suggestions = formatSuggestions(states.filter(s =>
        normalizeValue(s).includes(normalizeValue(value))
      ), 3);
      setAssistError(`State not found. ${suggestions ? `Try: ${suggestions}` : "Please select from the dropdown."}`);
      chatDistrictInput.disabled = true;
      chatBlockInput.disabled = true;
      fillDatalist(chatDistrictsList, []);
      fillDatalist(chatBlocksList, []);
      return;
    }

    conversation.state = match;
    conversation.district = null;
    conversation.block = null;
    chatDistrictInput.value = "";
    chatBlockInput.value = "";
    chatDistrictInput.disabled = false;
    await loadDistricts(match);
  } catch (error) {
    console.error("State selection error:", error);
    setAssistError("Failed to load districts. Please try again.");
    chatDistrictInput.disabled = true;
    chatBlockInput.disabled = true;
  }
}

async function handleDistrictAssistChange() {
  setAssistError("");
  const state = conversation.state;
  const value = chatDistrictInput?.value?.trim();
  if (!state) {
    setAssistError("Choose a state first.");
    chatDistrictInput.value = "";
    chatDistrictInput.disabled = true;
    return;
  }

  if (!value) {
    conversation.district = null;
    chatBlockInput.value = "";
    chatBlockInput.disabled = true;
    fillDatalist(chatBlocksList, []);
    return;
  }

  try {
    const districts = await loadDistricts(state);
    const match = findExact(value, districts);
    if (!match) {
      const suggestions = formatSuggestions(districts.filter(d =>
        normalizeValue(d).includes(normalizeValue(value))
      ), 3);
      setAssistError(`District not found. ${suggestions ? `Try: ${suggestions}` : "Please select from the dropdown."}`);
      chatBlockInput.disabled = true;
      fillDatalist(chatBlocksList, []);
      return;
    }

    conversation.district = match;
    conversation.block = null;
    chatBlockInput.value = "";
    chatBlockInput.disabled = false;
    await loadBlocks(state, match);
  } catch (error) {
    console.error("District selection error:", error);
    setAssistError("Failed to load blocks. Please try again.");
    chatBlockInput.disabled = true;
  }
}

async function handleBlockAssistChange() {
  setAssistError("");
  const state = conversation.state;
  const district = conversation.district;
  const value = chatBlockInput?.value?.trim();

  if (!state || !district) {
    setAssistError("Select a state and district first.");
    chatBlockInput.value = "";
    chatBlockInput.disabled = true;
    return;
  }

  if (!value) {
    conversation.block = null;
    return;
  }

  const blocks = await loadBlocks(state, district);
  const match = findExact(value, blocks);
  if (!match) {
    setAssistError("Select a valid block from the list.");
    return;
  }

  conversation.block = match;
}

async function applyAssistSelection() {
  setAssistError("");
  const stateValue = chatStateInput?.value?.trim();
  if (!stateValue) {
    setAssistError("Please choose a state.");
    return;
  }

  showLoadingButton(chatApply);

  try {
    const states = await loadStates();
    const state = findExact(stateValue, states);
    if (!state) {
      setAssistError("Please pick a state from the list.");
      return;
    }

    let district = null;
    let block = null;

    const districtValue = chatDistrictInput?.value?.trim();
    if (districtValue) {
      const districts = await loadDistricts(state);
      district = findExact(districtValue, districts);
      if (!district) {
        setAssistError("Pick a district from the list.");
        return;
      }
    }

    const blockValue = chatBlockInput?.value?.trim();
    if (blockValue) {
      if (!district) {
        setAssistError("Select a district before choosing a block.");
        return;
      }
      const blocks = await loadBlocks(state, district);
      block = findExact(blockValue, blocks);
      if (!block) {
        setAssistError("Pick a block from the list.");
        return;
      }
    }

    conversation = { state, district: district || null, block: block || null, years: undefined };
    addMessage(
      `Using selection: ${state}${district ? `, ${district}` : ""}${block ? `, ${block}` : ""}`,
      "user"
    );
    currentState = STATES.CONFIRM_AND_QUERY;
    await runQuery();
  } finally {
    hideLoadingButton(chatApply);
  }
}

/**
 * FSM handlers
 */
async function handleAskState(message) {
  const states = await loadStates();
  const state = detectMatch(message, states);

  if (!state) {
    const errorMsg = window.i18n.getTranslation("errors.invalidState");
    addMessage(
      `${errorMsg} ${formatSuggestions(states, 4)}.`,
      "bot"
    );
    return;
  }

  conversation.state = state;

  // Pre-fetch districts and see if the user also provided one.
  const districts = await loadDistricts(state);
  const district = detectMatch(message, districts);
  const years = parseYears(message);

  if (district) {
    conversation.district = district;
  }
  if (years !== null) {
    conversation.years = years;
  }

  if (conversation.district || wantsStateLevel(message)) {
    currentState = STATES.ASK_YEAR;
    askYear();
  } else {
    currentState = STATES.ASK_DISTRICT_OR_LEVEL;
    addMessage(
      `${window.i18n.getTranslation("chat.confirmation")}: ${state}. ${window.i18n.getTranslation("chat.askDistrict")}`
    );
  }

  // If we already have years, we can move straight to querying.
  if (currentState === STATES.ASK_YEAR && conversation.years !== undefined) {
    await handleAskYear(message, true);
  }
}

async function handleAskDistrict(message) {
  const state = conversation.state;
  const districts = await loadDistricts(state);
  if (wantsStateLevel(message)) {
    conversation.district = null;
    currentState = STATES.ASK_YEAR;
    askYear();
    return;
  }

  const district = detectMatch(message, districts);
  if (!district) {
    addMessage(
      `${window.i18n.getTranslation("errors.invalidDistrict")} ${formatSuggestions(
        districts,
        4
      )}.`
    );
    return;
  }

  conversation.district = district;
  currentState = STATES.ASK_YEAR;
  askYear();
}

function askYear() {
  addMessage(window.i18n.getTranslation("chat.askYear"));
}

async function handleAskYear(message, skipPrompt = false) {
  const years = skipPrompt ? conversation.years : parseYears(message);
  if (years === null || years === undefined) {
    addMessage(window.i18n.getTranslation("chat.askYear"));
    return;
  }
  conversation.years = years;
  currentState = STATES.CONFIRM_AND_QUERY;
  await runQuery();
}

async function runQuery() {
  const loadingMessage = addMessage("Fetching data...");
  const payload = {
    state: conversation.state,
    district: conversation.district,
    block: conversation.block,
    years: conversation.years,
  };

  try {
    const data = await fetchJSON(`${API_BASE}/query`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Remove loading message
    if (loadingMessage && loadingMessage.parentNode) {
      loadingMessage.remove();
    }

    const { locationSummary, years } = data;
    if (!years || !years.length) {
      addMessage(
        window.i18n.getTranslation("messages.noData"),
        "bot"
      );
    } else {
      const locationText = [
        locationSummary.state || "All states",
        locationSummary.district || null,
        locationSummary.block || null,
      ]
        .filter(Boolean)
        .join(" › ");

      // Store results for export
      lastQueryResults = years;
      lastLocationText = locationText;

      const results = formatResults(years, locationText);
      addMessage(results, "bot");
    }
  } catch (error) {
    console.error("Query error:", error);
    // Remove loading message
    if (loadingMessage && loadingMessage.parentNode) {
      loadingMessage.remove();
    }

    let errorMessage = "An unexpected error occurred. Please try again.";

    if (error.message.includes("Network connection failed")) {
      errorMessage = "🔌 Connection failed. Please check your internet and try again.";
    } else if (error.message.includes("could not be found")) {
      errorMessage = "📍 The requested location data could not be found. Please verify the state/district names and try again.";
    } else if (error.message.includes("Server error")) {
      errorMessage = "🛠️ Server temporarily unavailable. Please try again in a few minutes.";
    } else if (error.message.includes("No data")) {
      errorMessage = "📊 No groundwater data available for this location. Try a different state or district.";
    } else if (error.message) {
      errorMessage = `❌ ${error.message}`;
    }

    addMessage(errorMessage, "bot");
  } finally {
    currentState = STATES.DONE;
    addMessage(window.i18n.getTranslation("chat.done"), "bot");
    conversation = { state: null, district: null, block: null, years: undefined };
    currentState = STATES.ASK_STATE;
  }
}

/**
 * Input handling
 */
async function handleUserInput() {
  const message = chatInput.value.trim();
  if (!message) return;

  chatInput.value = "";
  addMessage(message, "user");

  if (message.toLowerCase() === "start over" || message.toLowerCase() === "reset") {
    resetConversation(false);
    return;
  }

  // Handle export commands
  const lowerMessage = message.toLowerCase();
  if (lowerMessage === "export csv" || lowerMessage === "export json") {
    if (!lastQueryResults || !lastLocationText) {
      addMessage("No data available to export. Please run a query first.", "bot");
      return;
    }

    try {
      if (lowerMessage === "export csv") {
        exportToCSV(lastQueryResults, lastLocationText);
        addMessage("📊 CSV file downloaded successfully!", "bot");
      } else {
        exportToJSON(lastQueryResults, lastLocationText);
        addMessage("📊 JSON file downloaded successfully!", "bot");
      }
    } catch (error) {
      console.error("Export error:", error);
      addMessage("Failed to export data. Please try again.", "bot");
    }
    return;
  }

  // Show typing indicator
  const typingIndicator = showTypingIndicator();

  try {
    switch (currentState) {
      case STATES.ASK_STATE:
        await handleAskState(message);
        break;
      case STATES.ASK_DISTRICT_OR_LEVEL:
        await handleAskDistrict(message);
        break;
      case STATES.ASK_YEAR:
        await handleAskYear(message);
        break;
      default:
        await handleAskState(message);
        break;
    }
  } catch (error) {
    console.error(error);
    addMessage(window.i18n.getTranslation("messages.connectionFailed"), "bot");
  } finally {
    // Hide typing indicator
    hideTypingIndicator();
  }
}

// Events
chatSend?.addEventListener("click", handleUserInput);
chatInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleUserInput();
  }
});

chatReset.addEventListener("click", () => resetConversation());

// Debounced versions for input handling
const debouncedStateChange = debounce(handleStateAssistChange, 300);
const debouncedDistrictChange = debounce(handleDistrictAssistChange, 300);
const debouncedBlockChange = debounce(handleBlockAssistChange, 300);

chatStateInput?.addEventListener("focus", loadStates);
chatStateInput?.addEventListener("input", debouncedStateChange);
chatDistrictInput?.addEventListener("focus", handleDistrictAssistChange);
chatDistrictInput?.addEventListener("input", debouncedDistrictChange);
chatBlockInput?.addEventListener("focus", handleBlockAssistChange);
chatBlockInput?.addEventListener("input", debouncedBlockChange);
chatApply?.addEventListener("click", applyAssistSelection);

// Initialize
resetConversation();
loadStates().catch((err) => {
  console.error(err);
  addMessage("Unable to load states right now. Please try again later.", "bot");
});
