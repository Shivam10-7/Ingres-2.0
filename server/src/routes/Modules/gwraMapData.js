const fs = require('fs');
const path = require('path');

const MAP_DATA_CANDIDATES = [
  process.env.GWRA_MAP_DATA_PATH,
  path.resolve(__dirname, '../../../data/GWRA_MapData.json'),
  path.resolve(__dirname, '../../../../Data/GWRA_MapData.json'),
  path.resolve(process.cwd(), 'Data/GWRA_MapData.json'),
  path.resolve(process.cwd(), 'server/data/GWRA_MapData.json'),
].filter(Boolean);

let cachedMapData = null;
let cachedMapDataPath = null;

function resolveMapDataPath() {
  for (const candidate of MAP_DATA_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`GWRA_MapData.json not found. Tried: ${MAP_DATA_CANDIDATES.join(', ')}`);
}

function getGwraMapData() {
  if (!cachedMapData) {
    const mapDataPath = cachedMapDataPath || resolveMapDataPath();
    cachedMapDataPath = mapDataPath;

    const raw = fs.readFileSync(mapDataPath, 'utf8').replace(/^\uFEFF/, '');
    cachedMapData = JSON.parse(raw);
  }

  return cachedMapData;
}

function initGwraMapData() {
  return getGwraMapData();
}

module.exports = {
  getGwraMapData,
  initGwraMapData,
};
