const fs = require('fs');
const path = require('path');

const HIERARCHY_PATH_CANDIDATES = [
  process.env.EXTRACTED_HIERARCHY_PATH,
  path.resolve(__dirname, '../../../../Data/Extracted_Hierarchy.json'),
  path.resolve(__dirname, '../../../Data/Extracted_Hierarchy.json'),
  path.resolve(process.cwd(), 'Data/Extracted_Hierarchy.json'),
  path.resolve(process.cwd(), 'server/../Data/Extracted_Hierarchy.json'),
].filter(Boolean);

let cachedHierarchy = null;

function resolveHierarchyPath() {
  for (const candidate of HIERARCHY_PATH_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `Extracted_Hierarchy.json not found. Tried: ${HIERARCHY_PATH_CANDIDATES.join(', ')}`
  );
}

function getHierarchyPath() {
  if (cachedHierarchy && cachedHierarchy.sourcePath) {
    return cachedHierarchy.sourcePath;
  }
  return resolveHierarchyPath();
}

function normalizeSpaces(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function toTitleCase(value = '') {
  return normalizeSpaces(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDisplayName(value = '') {
  const cleanValue = normalizeSpaces(value);

  if (!cleanValue) {
    return '';
  }

  const lettersOnly = cleanValue.replace(/[^A-Za-z]/g, '');
  const isAllCaps = lettersOnly && lettersOnly === lettersOnly.toUpperCase();

  return isAllCaps ? toTitleCase(cleanValue) : cleanValue;
}

function sortNames(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, 'en', { sensitivity: 'base' })
  );
}

function loadHierarchy() {
  if (cachedHierarchy && cachedHierarchy.loaded) {
    return cachedHierarchy;
  }

  const hierarchyPath = resolveHierarchyPath();
  const raw = fs.readFileSync(hierarchyPath, 'utf8');
  const parsed = JSON.parse(raw);
  const states = [];
  const citiesByState = {};
  const assessmentUnitsByStateAndCity = {};

  for (const stateEntry of parsed.states || []) {
    const stateName = formatDisplayName(stateEntry.name);
    if (!stateName) {
      continue;
    }

    states.push(stateName);
    const cityNames = [];

    for (const districtEntry of stateEntry.districts || []) {
      const cityName = formatDisplayName(districtEntry.name);
      if (!cityName) {
        continue;
      }

      cityNames.push(cityName);

      const key = `${stateName}|||${cityName}`;
      assessmentUnitsByStateAndCity[key] = sortNames(
        (districtEntry.assessmentUnits || []).map((unit) => formatDisplayName(unit.name))
      );
    }

    citiesByState[stateName] = sortNames(cityNames);
  }

  cachedHierarchy = {
    loaded: true,
    sourcePath: hierarchyPath,
    states: sortNames(states),
    citiesByState,
    assessmentUnitsByStateAndCity,
  };

  return cachedHierarchy;
}

function initGwraHierarchy() {
  return loadHierarchy();
}

function getStates() {
  return loadHierarchy().states;
}

function getCitiesByState(state) {
  const cleanState = normalizeSpaces(state);
  if (!cleanState) {
    return [];
  }

  return loadHierarchy().citiesByState[cleanState] || [];
}

function getAssessmentUnits(state, city) {
  const cleanState = normalizeSpaces(state);
  const cleanCity = normalizeSpaces(city);

  if (!cleanState || !cleanCity) {
    return [];
  }

  const key = `${cleanState}|||${cleanCity}`;
  return loadHierarchy().assessmentUnitsByStateAndCity[key] || [];
}

module.exports = {
  getStates,
  getCitiesByState,
  getAssessmentUnits,
  initGwraHierarchy,
};
