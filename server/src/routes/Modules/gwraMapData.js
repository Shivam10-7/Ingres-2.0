const fs = require('fs');
const path = require('path');

const MAP_DATA_PATH = path.resolve(__dirname, '../../../../Data/GWRA_MapData.json');

let cachedMapData = null;

function getGwraMapData() {
  if (!cachedMapData) {
    const raw = fs.readFileSync(MAP_DATA_PATH, 'utf8').replace(/^\uFEFF/, '');
    cachedMapData = JSON.parse(raw);
  }

  return cachedMapData;
}

module.exports = {
  getGwraMapData,
};
