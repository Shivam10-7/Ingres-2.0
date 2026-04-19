const { pool } = require("./db");
const { YEAR_TABLE_MAP, CATEGORY_THRESHOLDS } = require("./config");

const latestYear = Math.max(...Object.keys(YEAR_TABLE_MAP).map((y) => Number(y)));

function categorize(stagePercent) {
  if (stagePercent === null || Number.isNaN(stagePercent) || !Number.isFinite(stagePercent)) {
    return "Unknown";
  }

  const match = CATEGORY_THRESHOLDS.find(({ test }) => test(stagePercent));
  return match ? match.label : "Unknown";
}

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function buildNormalizedEquals(column, paramIndex) {
  return `UPPER(TRIM("${column}")) = UPPER(TRIM($${paramIndex}))`;
}

function toSqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (Array.isArray(value)) {
    return `ARRAY[${value.map((item) => toSqlLiteral(item)).join(", ")}]`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function renderDebugSql(sql, params = []) {
  return params.reduce((queryText, value, index) => {
    const placeholder = new RegExp(`\\$${index + 1}\\b`, "g");
    return queryText.replace(placeholder, toSqlLiteral(value));
  }, sql).trim();
}

function logQuery(label, sql, params = []) {
  console.log(`[SQL] ${label}`);
  console.log(renderDebugSql(sql, params));
  if (params.length) {
    console.log(`[SQL PARAMS] ${JSON.stringify(params)}`);
  }
}

function logQueryResult(label, rows = []) {
  console.log(`[SQL RESULT] ${label} (${rows.length} row(s))`);
  console.dir(rows, { depth: null });
}

function buildDistinctQuery(column, tables, whereClause = "", params = []) {
  const baseQueries = tables.map(
    (table) => `SELECT DISTINCT "${column}" AS value FROM ${table} ${whereClause}`.trim()
  );

  const sql = `
    SELECT DISTINCT value
    FROM (${baseQueries.join(" UNION ")}) AS combined
    WHERE value IS NOT NULL
    ORDER BY value ASC
  `;
  logQuery(`buildDistinctQuery:${column}`, sql, params);
  return pool.query(sql, params).then((result) => {
    logQueryResult(`buildDistinctQuery:${column}`, result.rows);
    return result.rows.map((row) => row.value);
  });
}

async function getStates() {
  const tables = Object.values(YEAR_TABLE_MAP);
  try {
    return await buildDistinctQuery("State", tables);
  } catch (error) {
    error.message = `getStates failed: ${error.message}`;
    throw error;
  }
}

async function getDistricts(state) {
  const tables = Object.values(YEAR_TABLE_MAP);
  const whereClause = `WHERE ${buildNormalizedEquals("State", 1)}`;
  try {
    return await buildDistinctQuery("district", tables, whereClause, [state]);
  } catch (error) {
    error.message = `getDistricts failed for state="${state}": ${error.message}`;
    throw error;
  }
}

async function getBlocks(state, district) {
  const tables = Object.values(YEAR_TABLE_MAP);
  const whereClause = `WHERE ${buildNormalizedEquals("State", 1)} AND ${buildNormalizedEquals("district", 2)}`;
  try {
    return await buildDistinctQuery("assessment_unit_name", tables, whereClause, [state, district]);
  } catch (error) {
    error.message = `getBlocks failed for state="${state}", district="${district}": ${error.message}`;
    throw error;
  }
}

async function aggregateByYear({ state, district, block, years }) {
  const selectedYears =
    Array.isArray(years) && years.length ? years : [latestYear];

  const results = [];

  for (const year of selectedYears) {
    const tableName = YEAR_TABLE_MAP[year];
    if (!tableName) {
      const validYears = Object.keys(YEAR_TABLE_MAP).join(", ");
      throw new Error(`Unsupported year ${year}. Valid years: ${validYears}`);
    }

    const conditions = [];
    const params = [];

    if (state) {
      params.push(state);
      conditions.push(buildNormalizedEquals("State", params.length));
    }

    if (district) {
      params.push(district);
      conditions.push(buildNormalizedEquals("district", params.length));
    }

    if (block) {
      params.push(block);
      conditions.push(buildNormalizedEquals("assessment_unit_name", params.length));
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT
        SUM("annual_extractable_ground_water_resource_(ham)") AS annual_extractable,
        SUM("total_ground_water_extraction_(ham)") AS total_extraction
      FROM ${tableName}
      ${whereClause}
    `;

    let rows;
    try {
      logQuery(`aggregateByYear:${tableName}`, sql, params);
      ({ rows } = await pool.query(sql, params));
      logQueryResult(`aggregateByYear:${tableName}`, rows);
    } catch (error) {
      error.message = `aggregateByYear failed for table="${tableName}" with filters state="${state}", district="${district}", block="${block}": ${error.message}`;
      throw error;
    }
    const annualExtractable = parseNumber(rows[0]?.annual_extractable);
    const totalExtraction = parseNumber(rows[0]?.total_extraction);

    let stagePercent = null;
    if (annualExtractable && annualExtractable !== 0 && totalExtraction !== null) {
      stagePercent = (totalExtraction / annualExtractable) * 100;
    }

    results.push({
      year: Number(year),
      annual_extractable: annualExtractable,
      total_extraction: totalExtraction,
      stage_percent: stagePercent !== null ? Number(stagePercent.toFixed(2)) : null,
      categorization: categorize(stagePercent),
    });
  }

  return results;
}

module.exports = {
  getStates,
  getDistricts,
  getBlocks,
  aggregateByYear,
  latestYear,
};
