const YEAR_TABLE_MAP = {
  2024: "ingres_data2024final2",
  2023: "ingres_data2023final2",
};

const CATEGORY_THRESHOLDS = [
  { label: "Over-extracted", test: (value) => value > 100 },
  { label: "Critical", test: (value) => value > 90 && value <= 100 },
  { label: "Semi-critical", test: (value) => value > 70 && value <= 90 },
  { label: "Safe", test: (value) => value >= 0 && value <= 70 },
];

module.exports = { YEAR_TABLE_MAP, CATEGORY_THRESHOLDS };
