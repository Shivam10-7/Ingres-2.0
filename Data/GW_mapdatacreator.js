const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function normalizeSpaces(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function toTitleCase(value = '') {
  return normalizeSpaces(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDisplayName(value = '') {
  const clean = normalizeSpaces(value);
  if (!clean) return '';

  const lettersOnly = clean.replace(/[^A-Za-z]/g, '');
  const isAllCaps = lettersOnly && lettersOnly === lettersOnly.toUpperCase();

  return isAllCaps ? toTitleCase(clean) : clean;
}

function getCategoryRank(category = '') {
  const normalized = normalizeSpaces(category).toLowerCase();

  switch (normalized) {
    case 'safe':
      return 1;
    case 'semi critical':
    case 'semi-critical':
    case 'saline':
      return 2;
    case 'critical':
      return 3;
    case 'over exploited':
    case 'over-exploited':
      return 4;
    default:
      return 0;
  }
}

function toMapStatus(category = '') {
  const normalized = normalizeSpaces(category).toLowerCase();

  switch (normalized) {
    case 'safe':
      return 'safe';
    case 'semi critical':
    case 'semi-critical':
    case 'saline':
      return 'caution';
    case 'critical':
    case 'over exploited':
    case 'over-exploited':
      return 'critical';
    default:
      return 'unknown';
  }
}

function createSummary(name, state = '') {
  return {
    name,
    state,
    recharge: 0,
    extractable: 0,
    extraction: 0,
    unitCount: 0,
    worstCategory: 'Unknown',
    categoryRank: 0,
    stage: 0,
    status: 'unknown',
  };
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function preprocessGwraWorkbook(inputPath, outputPath) {
  const workbook = XLSX.readFile(inputPath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: null,
    raw: true,
  });

  const stateMap = {};
  const districtMap = {};

  for (const row of rows) {
    const stateName = formatDisplayName(row['State']);
    const districtName = formatDisplayName(row['District']);
    const category = normalizeSpaces(
      row['Categorization (Over-Exploited/Critical/Semi-Critical/Safe/Saline)']
    );

    const recharge = Number(row['Total Annual Ground Water (Ham) Recharge'] || 0);
    const extractable = Number(row['Annual Extractable Ground Water Resource (Ham)'] || 0);
    const extraction = Number(row['Total Ground Water Extraction (Ham)'] || 0);

    if (!stateName || !districtName) continue;

    if (!stateMap[stateName]) {
      stateMap[stateName] = createSummary(stateName);
    }

    const stateSummary = stateMap[stateName];
    stateSummary.recharge += recharge;
    stateSummary.extractable += extractable;
    stateSummary.extraction += extraction;
    stateSummary.unitCount += 1;

    const stateRank = getCategoryRank(category);
    if (stateRank > stateSummary.categoryRank) {
      stateSummary.categoryRank = stateRank;
      stateSummary.worstCategory = category;
    }

    const districtKey = `${districtName}|${stateName}`;
    if (!districtMap[districtKey]) {
      districtMap[districtKey] = createSummary(districtName, stateName);
    }

    const districtSummary = districtMap[districtKey];
    districtSummary.recharge += recharge;
    districtSummary.extractable += extractable;
    districtSummary.extraction += extraction;
    districtSummary.unitCount += 1;

    const districtRank = getCategoryRank(category);
    if (districtRank > districtSummary.categoryRank) {
      districtSummary.categoryRank = districtRank;
      districtSummary.worstCategory = category;
    }
  }

  for (const summary of [...Object.values(stateMap), ...Object.values(districtMap)]) {
    summary.recharge = round2(summary.recharge);
    summary.extractable = round2(summary.extractable);
    summary.extraction = round2(summary.extraction);
    summary.stage = summary.extractable > 0
      ? round2((summary.extraction / summary.extractable) * 100)
      : 0;
    summary.status = toMapStatus(summary.worstCategory);
  }

  const finalJson = {
    source: path.basename(inputPath),
    generatedAt: new Date().toISOString(),
    states: Object.fromEntries(
      Object.entries(stateMap).sort(([a], [b]) => a.localeCompare(b))
    ),
    districts: Object.fromEntries(
      Object.entries(districtMap).sort(([a], [b]) => a.localeCompare(b))
    ),
  };

  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(finalJson, null, 2), 'utf8');
  }

  return finalJson;
}

// Example usage:
const inputPath = 'D:\\Projects\\Final Year Project\\Ingres-2.0\\Data\\GWRA--2024(1).xlsx';
const outputPath = 'D:\\Projects\\Final Year Project\\Ingres-2.0\\Data\\GWRA_MapData.json';

const result = preprocessGwraWorkbook(inputPath, outputPath);
console.log(`Generated JSON with ${Object.keys(result.states).length} states and ${Object.keys(result.districts).length} districts`);
