require("dotenv").config();
const {
  getStates,
  getDistricts,
  getBlocks,
  aggregateByYear,
  latestYear,
} = require("../../src/dataService");
const { YEAR_TABLE_MAP } = require("../../src/config");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", ...corsHeaders },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  const url = new URL(event.rawUrl);
  const rawPath = event.path || url.pathname;
  const path = rawPath.replace(/^.*\/api/, "/api");
  const method = event.httpMethod.toUpperCase();

  try {
    if (method === "GET" && path === "/api/meta/states") {
      const states = await getStates();
      return jsonResponse(200, states);
    }

    if (method === "GET" && path === "/api/meta/districts") {
      const state = url.searchParams.get("state")?.trim();
      if (!state) {
        return jsonResponse(400, { error: "Query parameter 'state' is required" });
      }
      const districts = await getDistricts(state);
      return jsonResponse(200, districts);
    }

    if (method === "GET" && path === "/api/meta/blocks") {
      const state = url.searchParams.get("state")?.trim();
      const district = url.searchParams.get("district")?.trim();
      if (!state || !district) {
        return jsonResponse(400, {
          error: "Query parameters 'state' and 'district' are required",
        });
      }
      const blocks = await getBlocks(state, district);
      return jsonResponse(200, blocks);
    }

    if (method === "POST" && path === "/api/query") {
      if (!event.body) {
        return jsonResponse(400, { error: "Request body is required" });
      }

      let payload;
      try {
        payload = JSON.parse(event.body);
      } catch (err) {
        return jsonResponse(400, { error: "Invalid JSON body" });
      }

      const state = payload.state?.trim?.() || null;
      const district = payload.district?.trim?.() || null;
      const block = payload.block?.trim?.() || null;
      let years = payload.years;

      if (!state && !district && !block) {
        return jsonResponse(400, {
          error: "At least one of state, district, or block must be provided",
        });
      }

      if (years !== undefined) {
        if (!Array.isArray(years)) {
          return jsonResponse(400, { error: "years must be an array of numbers" });
        }
        years = years.map((y) => Number(y)).filter((y) => Number.isFinite(y));
        if (!years.length) {
          years = [latestYear];
        }
        const invalidYear = years.find((y) => !YEAR_TABLE_MAP[y]);
        if (invalidYear) {
          const validYears = Object.keys(YEAR_TABLE_MAP).join(", ");
          return jsonResponse(400, {
            error: `Unsupported year ${invalidYear}. Valid years: ${validYears}`,
          });
        }
      }

      const data = await aggregateByYear({ state, district, block, years });
      return jsonResponse(200, {
        locationSummary: { state, district, block },
        years: data,
      });
    }

    return jsonResponse(404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    return jsonResponse(500, { error: "Internal server error" });
  }
};
