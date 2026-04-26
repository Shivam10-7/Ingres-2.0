const stateSelect = document.getElementById("state-select");
const districtSelect = document.getElementById("district-select");
const blockSelect = document.getElementById("block-select");
const form = document.getElementById("quick-form");
const resultsEl = document.getElementById("results");
const formError = document.getElementById("form-error");
const getDataButton = document.getElementById("get-data");

// Mode switching elements
const singleModeBtn = document.getElementById("single-mode");
const compareModeBtn = document.getElementById("compare-mode");
const singleQuerySection = document.getElementById("single-query");
const compareQuerySection = document.getElementById("compare-query");

// Compare mode elements
const addLocationBtn = document.getElementById("add-location");
const locationsContainer = document.getElementById("locations-container");

let currentMode = "single";
let locationCounter = 1;
let statesCache = [];

const API_BASE = "/api";

/**
 * Helpers
 */
function setLoading(isLoading) {
  getDataButton.disabled = isLoading;
  getDataButton.textContent = isLoading ? window.i18n.getTranslation("messages.loading") : window.i18n.getTranslation("buttons.getData");
}

function clearSelect(selectEl, placeholder) {
  selectEl.innerHTML = "";
  const option = document.createElement("option");
  option.value = "";
  option.textContent = placeholder;
  selectEl.appendChild(option);
}

function showError(message) {
  formError.textContent = message || "";
}

function renderLoading() {
  resultsEl.innerHTML = `
    <div class="loading">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      <span>${window.i18n.getTranslation("messages.loading")}</span>
    </div>
  `;
}

function renderMessage(message) {
  const defaultMessage = window.i18n.getTranslation("messages.results");
  resultsEl.innerHTML = `<p class="muted">${message || defaultMessage}</p>`;
}

/**
 * Mode switching functions
 */
function switchMode(mode) {
  currentMode = mode;

  // Update button states
  singleModeBtn.classList.toggle("active", mode === "single");
  compareModeBtn.classList.toggle("active", mode === "compare");

  // Update section visibility
  singleQuerySection.classList.toggle("active", mode === "single");
  compareQuerySection.classList.toggle("active", mode === "compare");

  // Clear results when switching modes
  renderMessage("Results will appear here.");
  showError("");
}

/**
 * Location card management
 */
function createLocationCard(locationId) {
  const card = document.createElement("div");
  card.className = "location-card";
  card.setAttribute("data-location-id", locationId);

  card.innerHTML = `
    <div class="location-header">
      <h4>Location ${locationId}</h4>
      <button class="remove-location" data-location-id="${locationId}">×</button>
    </div>
    <div class="location-fields">
      <div class="field">
        <label>State</label>
        <select class="compare-state" data-location-id="${locationId}">
          <option value="">Select a state</option>
        </select>
      </div>
      <div class="field">
        <label>District</label>
        <select class="compare-district" data-location-id="${locationId}" disabled>
          <option value="">Select a district</option>
        </select>
      </div>
      <div class="field">
        <label>Block</label>
        <select class="compare-block" data-location-id="${locationId}" disabled>
          <option value="">Select a block</option>
        </select>
      </div>
    </div>
  `;

  // Populate state options
  const stateSelect = card.querySelector(".compare-state");
  statesCache.forEach((state) => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  });

  return card;
}

function addLocationCard() {
  locationCounter++;
  const newCard = createLocationCard(locationCounter);
  locationsContainer.appendChild(newCard);

  // Add event listeners for the new card
  attachLocationCardEvents(newCard);
}

function removeLocationCard(locationId) {
  const card = locationsContainer.querySelector(`[data-location-id="${locationId}"]`);
  if (card) {
    card.remove();
  }

  // Ensure at least one location card remains
  const remainingCards = locationsContainer.querySelectorAll(".location-card");
  if (remainingCards.length === 0) {
    locationCounter = 1;
    const newCard = createLocationCard(1);
    locationsContainer.appendChild(newCard);
    attachLocationCardEvents(newCard);
  }
}

function attachLocationCardEvents(card) {
  const locationId = card.getAttribute("data-location-id");
  const stateSelect = card.querySelector(".compare-state");
  const districtSelect = card.querySelector(".compare-district");
  const blockSelect = card.querySelector(".compare-block");
  const removeBtn = card.querySelector(".remove-location");

  stateSelect.addEventListener("change", (e) => {
    const state = e.target.value;
    loadDistrictsForCompare(locationId, state);
  });

  districtSelect.addEventListener("change", (e) => {
    const district = e.target.value;
    const state = stateSelect.value;
    loadBlocksForCompare(locationId, state, district);
  });

  removeBtn.addEventListener("click", () => {
    removeLocationCard(locationId);
  });
}

function renderResult(data) {
  const { locationSummary, years } = data;

  if (!years || !years.length) {
    renderMessage(window.i18n.getTranslation("messages.noData"));
    return;
  }

  const locationText = [
    locationSummary.state || "All states",
    locationSummary.district || null,
    locationSummary.block || null,
  ]
    .filter(Boolean)
    .join(" › ");

  const rows = years
    .map(
      (item) => `
      <tr>
        <td>${item.year}</td>
        <td>${item.annual_extractable ?? "—"}</td>
        <td>${item.total_extraction ?? "—"}</td>
        <td>${item.stage_percent ?? "—"}</td>
        <td>${item.categorization ?? "Unknown"}</td>
      </tr>
    `
    )
    .join("");

  resultsEl.innerHTML = `
    <div class="result-card">
      <h3>${locationText}</h3>
      <table>
        <thead>
          <tr>
            <th>Year</th>
            <th>Annual Extractable (BCM)</th>
            <th>Total Extraction (BCM)</th>
            <th>Stage (%)</th>
            <th>Categorization</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderComparisonResults(results) {
  if (!results || !results.length) {
    renderMessage("No data found for the selected locations. Try changing the filters.");
    return;
  }

  const comparisonHTML = results.map((result, index) => {
    const { locationSummary, years } = result;

    const locationText = [
      locationSummary.state || "All states",
      locationSummary.district || null,
      locationSummary.block || null,
    ]
      .filter(Boolean)
      .join(" › ");

    const rows = years
      .map(
        (item) => `
        <tr>
          <td>${item.year}</td>
          <td>${item.annual_extractable ?? "—"}</td>
          <td>${item.total_extraction ?? "—"}</td>
          <td>${item.stage_percent ?? "—"}</td>
          <td>${item.categorization ?? "Unknown"}</td>
        </tr>
      `
      )
      .join("");

    return `
      <div class="result-card comparison-card">
        <h3>${locationText}</h3>
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Annual Extractable (BCM)</th>
              <th>Total Extraction (BCM)</th>
              <th>Stage (%)</th>
              <th>Categorization</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }).join("");

  resultsEl.innerHTML = `
    <div class="comparison-results">
      <h3>Comparison Results</h3>
      <div class="results-grid">
        ${comparisonHTML}
      </div>
    </div>
  `;
}

/**
 * API calls
 */
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }

  return response.json();
}

async function loadStates() {
  clearSelect(stateSelect, "Select a state");
  stateSelect.disabled = true;
  try {
    const states = await fetchJSON(`${API_BASE}/meta/states`);
    statesCache = states;
    states.forEach((state) => {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = state;
      stateSelect.appendChild(option);
    });

    // Also populate compare mode states
    const compareStates = document.querySelectorAll(".compare-state");
    compareStates.forEach((select) => {
      states.forEach((state) => {
        const option = document.createElement("option");
        option.value = state;
        option.textContent = state;
        select.appendChild(option);
      });
    });
  } catch (error) {
    renderMessage("Unable to load states. Please try again later.");
    console.error(error);
  } finally {
    stateSelect.disabled = false;
  }
}

async function loadDistricts(state) {
  clearSelect(districtSelect, "Select a district");
  clearSelect(blockSelect, "Select a block");
  districtSelect.disabled = true;
  blockSelect.disabled = true;

  if (!state) return;

  try {
    const districts = await fetchJSON(
      `${API_BASE}/meta/districts?state=${encodeURIComponent(state)}`
    );
    districts.forEach((district) => {
      const option = document.createElement("option");
      option.value = district;
      option.textContent = district;
      districtSelect.appendChild(option);
    });
    districtSelect.disabled = false;
  } catch (error) {
    console.error(error);
    renderMessage("Unable to load districts. Please try again later.");
  }
}

async function loadBlocks(state, district) {
  clearSelect(blockSelect, "Select a block");
  blockSelect.disabled = true;

  if (!state || !district) return;

  try {
    const blocks = await fetchJSON(
      `${API_BASE}/meta/blocks?state=${encodeURIComponent(
        state
      )}&district=${encodeURIComponent(district)}`
    );
    blocks.forEach((block) => {
      const option = document.createElement("option");
      option.value = block;
      option.textContent = block;
      blockSelect.appendChild(option);
    });
    blockSelect.disabled = false;
  } catch (error) {
    console.error(error);
    renderMessage("Unable to load blocks. Please try again later.");
  }
}

async function loadDistrictsForCompare(locationId, state) {
  const districtSelect = document.querySelector(`.compare-district[data-location-id="${locationId}"]`);
  const blockSelect = document.querySelector(`.compare-block[data-location-id="${locationId}"]`);

  clearSelect(districtSelect, "Select a district");
  clearSelect(blockSelect, "Select a block");
  districtSelect.disabled = true;
  blockSelect.disabled = true;

  if (!state) return;

  try {
    const districts = await fetchJSON(
      `${API_BASE}/meta/districts?state=${encodeURIComponent(state)}`
    );
    districts.forEach((district) => {
      const option = document.createElement("option");
      option.value = district;
      option.textContent = district;
      districtSelect.appendChild(option);
    });
    districtSelect.disabled = false;
  } catch (error) {
    console.error(error);
    renderMessage("Unable to load districts. Please try again later.");
  }
}

async function loadBlocksForCompare(locationId, state, district) {
  const blockSelect = document.querySelector(`.compare-block[data-location-id="${locationId}"]`);

  clearSelect(blockSelect, "Select a block");
  blockSelect.disabled = true;

  if (!state || !district) return;

  try {
    const blocks = await fetchJSON(
      `${API_BASE}/meta/blocks?state=${encodeURIComponent(
        state
      )}&district=${encodeURIComponent(district)}`
    );
    blocks.forEach((block) => {
      const option = document.createElement("option");
      option.value = block;
      option.textContent = block;
      blockSelect.appendChild(option);
    });
    blockSelect.disabled = false;
  } catch (error) {
    console.error(error);
    renderMessage("Unable to load blocks. Please try again later.");
  }
}

/**
 * Event handlers
 */
stateSelect.addEventListener("change", (e) => {
  const state = e.target.value || null;
  loadDistricts(state);
});

districtSelect.addEventListener("change", (e) => {
  const district = e.target.value || null;
  const state = stateSelect.value || null;
  loadBlocks(state, district);
});

async function handleGetData() {
  showError("");

  if (currentMode === "single") {
    await handleSingleQuery();
  } else {
    await handleComparisonQuery();
  }
}

async function handleSingleQuery() {
  const state = stateSelect.value || null;
  const district = districtSelect.value || null;
  const block = blockSelect.value || null;
  const years = Array.from(form.querySelectorAll('input[name="years"]:checked')).map((el) =>
    Number(el.value)
  );

  if (!state && !district && !block) {
    showError(window.i18n.getTranslation("errors.selectLocation"));
    return;
  }

  setLoading(true);
  renderLoading();

  try {
    const payload = { state, district, block, years };
    const data = await fetchJSON(`${API_BASE}/query`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    renderResult(data);
  } catch (error) {
    console.error(error);
    renderMessage(window.i18n.getTranslation("messages.connectionFailed"));
  } finally {
    setLoading(false);
  }
}

async function handleComparisonQuery() {
  const locationCards = document.querySelectorAll(".location-card");
  const years = Array.from(document.querySelectorAll('input[name="compare-years"]:checked')).map((el) =>
    Number(el.value)
  );

  if (locationCards.length === 0) {
    showError(window.i18n.getTranslation("errors.selectLocation"));
    return;
  }

  const queries = [];
  let hasValidLocation = false;

  for (const card of locationCards) {
    const locationId = card.getAttribute("data-location-id");
    const state = card.querySelector(".compare-state").value;
    const district = card.querySelector(".compare-district").value;
    const block = card.querySelector(".compare-block").value;

    if (state || district || block) {
      hasValidLocation = true;
      queries.push({ state, district, block, years });
    }
  }

  if (!hasValidLocation) {
    showError("Please select at least one location to compare.");
    return;
  }

  setLoading(true);
  renderLoading();

  try {
    const results = await Promise.all(
      queries.map(async (payload) => {
        try {
          return await fetchJSON(`${API_BASE}/query`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } catch (error) {
          console.error("Query failed:", error);
          return null;
        }
      })
    );

    const validResults = results.filter(result => result !== null);
    renderComparisonResults(validResults);
  } catch (error) {
    console.error(error);
    renderMessage(window.i18n.getTranslation("messages.connectionFailed"));
  } finally {
    setLoading(false);
  }
}

/**
 * Event handlers
 */
stateSelect.addEventListener("change", (e) => {
  const state = e.target.value || null;
  loadDistricts(state);
});

districtSelect.addEventListener("change", (e) => {
  const district = e.target.value || null;
  const state = stateSelect.value || null;
  loadBlocks(state, district);
});

// Mode switching event listeners
singleModeBtn.addEventListener("click", () => switchMode("single"));
compareModeBtn.addEventListener("click", () => switchMode("compare"));

// Compare mode event listeners
addLocationBtn.addEventListener("click", addLocationCard);

// Get data button event listener
getDataButton.addEventListener("click", handleGetData);

// Initialize the first location card in compare mode
const initialCard = locationsContainer.querySelector(".location-card");
if (initialCard) {
  attachLocationCardEvents(initialCard);
}

// Kick off initial load
loadStates();
