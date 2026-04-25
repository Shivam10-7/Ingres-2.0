const fs = require('fs');
const path = require('path');

const MAP_DATA_PATH = path.resolve(__dirname, '../../../data/GWRA_MapData.json');

let cachedMapData = null;

function getGwraMapData() {
  if (!cachedMapData) {
    if (!fs.existsSync(MAP_DATA_PATH)) {
      const error = new Error(`GWRA_MapData.json not found at ${MAP_DATA_PATH}`);
      error.code = 'GWRA_MAP_DATA_MISSING';
      throw error;
    }

    const raw = fs.readFileSync(MAP_DATA_PATH, 'utf8').replace(/^\uFEFF/, '');
    cachedMapData = JSON.parse(raw);
  }

  return cachedMapData;
}

module.exports = {
  getGwraMapData,
};
