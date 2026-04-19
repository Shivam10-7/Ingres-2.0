const fs = require('fs');
const path = require('path');

const MAP_DATA_CANDIDATES = [
  path.resolve(__dirname, '../../../../Data/GWRA_MapData.json'),
  path.resolve(__dirname, '../../../data/GWRA_MapData.json'),
];

let cachedMapData = null;
let resolvedMapDataPath = null;

function resolveMapDataPath() {
  if (resolvedMapDataPath) {
    return resolvedMapDataPath;
  }

  const existingPath = MAP_DATA_CANDIDATES.find((candidate) =>
    fs.existsSync(candidate)
  );

  if (!existingPath) {
    const error = new Error(
      `GWRA_MapData.json not found. Checked: ${MAP_DATA_CANDIDATES.join(', ')}`
    );
    error.code = 'GWRA_MAP_DATA_MISSING';
    throw error;
  }

  resolvedMapDataPath = existingPath;
  return resolvedMapDataPath;
}

function getGwraMapData() {
  if (!cachedMapData) {
    const mapDataPath = resolveMapDataPath();
    const raw = fs.readFileSync(mapDataPath, 'utf8').replace(/^\uFEFF/, '');
    cachedMapData = JSON.parse(raw);
  }

  return cachedMapData;
}

module.exports = {
  getGwraMapData,
};
