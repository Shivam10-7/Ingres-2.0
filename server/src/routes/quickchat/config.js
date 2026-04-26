module.exports = {
  YEAR_TABLE_MAP: {
    // Example mapping – adjust to your actual table names
    2023: 'ingresdata2023',
    2024: 'ingresdata2024',
    2025: 'ingresdata2025',
  },
  CATEGORY_THRESHOLDS: [
    { label: 'Safe', test: v => v < 25 },
    { label: 'Moderate', test: v => v >= 25 && v < 50 },
    { label: 'Risky', test: v => v >= 50 && v < 75 },
    { label: 'Critical', test: v => v >= 75 },
  ],
};
