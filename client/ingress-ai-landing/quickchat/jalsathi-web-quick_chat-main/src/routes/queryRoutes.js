const express = require("express");
const { aggregateByYear, latestYear } = require("../dataService");
const { YEAR_TABLE_MAP } = require("../config");

const router = express.Router();

function normalizeString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

router.post("/", async (req, res, next) => {
  try {
    const state = normalizeString(req.body.state);
    const district = normalizeString(req.body.district);
    const block = normalizeString(req.body.block);

    if (!state && !district && !block) {
      return res
        .status(400)
        .json({ error: "At least one of state, district, or block must be provided" });
    }

    let years = req.body.years;
    if (years !== undefined) {
      if (!Array.isArray(years)) {
        return res.status(400).json({ error: "years must be an array of numbers" });
      }

      years = years.map((year) => Number(year)).filter((y) => Number.isFinite(y));

      if (!years.length) {
        years = [latestYear];
      }

      const invalidYear = years.find((y) => !YEAR_TABLE_MAP[y]);
      if (invalidYear) {
        const validYears = Object.keys(YEAR_TABLE_MAP).join(", ");
        return res
          .status(400)
          .json({ error: `Unsupported year ${invalidYear}. Valid years: ${validYears}` });
      }
    }

    const data = await aggregateByYear({
      state,
      district,
      block,
      years,
    });

    res.json({
      locationSummary: { state, district, block },
      years: data,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
