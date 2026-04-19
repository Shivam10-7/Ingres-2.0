const express = require("express");
const { getStates, getDistricts, getBlocks } = require("../dataService");

const router = express.Router();

router.get("/states", async (req, res, next) => {
  try {
    const states = await getStates();
    res.json(states);
  } catch (error) {
    next(error);
  }
});

router.get("/districts", async (req, res, next) => {
  try {
    const state = req.query.state?.trim();
    if (!state) {
      return res.status(400).json({ error: "Query parameter 'state' is required" });
    }

    const districts = await getDistricts(state);
    res.json(districts);
  } catch (error) {
    next(error);
  }
});

router.get("/blocks", async (req, res, next) => {
  try {
    const state = req.query.state?.trim();
    const district = req.query.district?.trim();

    if (!state || !district) {
      return res
        .status(400)
        .json({ error: "Query parameters 'state' and 'district' are required" });
    }

    const blocks = await getBlocks(state, district);
    res.json(blocks);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
