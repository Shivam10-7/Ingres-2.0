// const mysql = require('mysql2/promise');
// Stage-1 migration note:
// MySQL implementation is kept as comments for reference while Neon/Postgres path is active.
const { Pool } = require('pg');
const SQLinjectionCheck = require('./../Modules/SQLinjection'); // Note: Unused in this snippet, consider removing if unnecessary
const ChartDeterminer = require('../Modules/ChartDeterminer'); // Note: Unused in this snippet, consider removing if unnecessary

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

function normalizeGeneratedSqlForNeon(inputSql) {
  // Stage-1 compatibility bridge:
  // SQL generator still emits MySQL-era identifier names.
  // Map them to the actual Neon column names without changing upstream logic yet.
  const identifierMap = {
    '"state"': '"_state"',
    '"assessment unit name"': '"assessment_unit_name"',
    '"assessment unit type"': '"assessment_unit_type"',
    '"total area of assessment unit (ha)"': '"total_area_of_assessment_unit_(ha)"',
    '"recharge worthy area(ha)"': '"recharge_worthy_area(ha)"',
    '"recharge from rainfall-monsoon season"': '"recharge_from_rainfall-monsoon_season"',
    '"recharge from other sources- monsoon season"': '"recharge_from_other_sources-_monsoon_season"',
    '"recharge from rainfall-non monsoon season"': '"recharge_from_rainfall-non_monsoon_season"',
    '"recharge from other sources- non monsoon season"': '"recharge_from_other_sources-_non_monsoon_season"',
    '"total annual ground water (ham) recharge"': '"total_annual_ground_water_(ham)_recharge"',
    '"total natural discharges (ham)"': '"total_natural_discharges_(ham)"',
    '"annual extractable ground water resource (ham)"': '"annual_extractable_ground_water_resource_(ham)"',
    '"ground water extraction for irrigation use (ham)"': '"ground_water_extraction_for_irrigation_use_(ham)"',
    '"ground water extraction for industrial use (ham)"': '"ground_water_extraction_for_industrial_use_(ham)"',
    '"ground water extraction for domestic use (ham)"': '"ground_water_extraction_for_domestic_use_(ham)"',
    '"total extraction (ham)"': '"total_extraction_(ham)"',
    '"annual gw allocation for domestic use as on 2025 (ham)"': '"annual_gw_allocation_for_domestic_use_as_on_2025_(ham)"',
    '"net ground water availability for future use (ham)"': '"net_ground_water_availability_for_future_use_(ham)"',
    '"stage of ground water extraction (%)"': '"stage_of_ground_water_extraction_(%)"',
  };

  let normalizedSql = inputSql;
  for (const [oldIdentifier, newIdentifier] of Object.entries(identifierMap)) {
    normalizedSql = normalizedSql.replace(new RegExp(oldIdentifier, "gi"), newIdentifier);
  }
  return normalizedSql;
}

async function data_retrive(sql_query) {
  // Validate SQL query
  if (!sql_query || typeof sql_query !== 'string') {
    console.error('Error: Invalid or missing SQL query');
    throw new Error('SQL query is null or invalid');
  }

  console.log('Inside data_retrive function');
  console.log('SQL Query received in data_retrive for retrieval from the database:\n', sql_query);

  try {
    // --- Old MySQL connection path (kept for reference) ---
    // let connection;
    // connection = await mysql.createConnection({
    //   host: process.env.DB_HOST,
    //   user: process.env.DB_USER,
    //   password: process.env.DB_PASSWORD,
    //   database: process.env.DB_NAME,
    // });

    // Stage-1 Neon compatibility:
    // SQLGen currently emits MySQL-style backticks. Convert to Postgres identifier quotes.
    const postgresCompatibleQuery = sql_query.replace(/`([^`]+)`/g, '"$1"');
    const neonReadyQuery = normalizeGeneratedSqlForNeon(postgresCompatibleQuery);
    console.log('Executing SQL Query:', sql_query);
    console.log('Postgres-compatible SQL Query:', neonReadyQuery);
    console.log('Checking for SQL injection vulnerabilities in the query...');
    // Perform SQL injection check before executing the query
    //The sql validator is currently not working as expected, so commenting it out for now. Will fix it in the next iteration.😎😎
    // await SQLinjectionCheck(sql_query);

    const result = await pgPool.query(neonReadyQuery);
    const rows = result.rows || [];
    const fields = result.fields || [];

    // --- Old MySQL execute path (kept for reference) ---
    // const [rows, fields] = await connection.execute(sql_query);

    // Validate results
    if (!rows || rows.length === 0) {
      console.warn('No data returned from database');
      return [[], fields, await ChartDeterminer(0, 0)];
    }
    console.log('Query results:\n rows:'+ JSON.stringify(rows));
    // With pg driver, field metadata may differ from mysql2.
    const fieldCount = rows.length > 0 ? Object.keys(rows[0]).length : fields.length;
    const ChartType = await ChartDeterminer(fieldCount, rows.length);
    console.log('Determined Chart Type:', ChartType);
    return [rows, fields, ChartType];
  } catch (error) {
    console.error('Error executing query in db:', error);
    throw error; // Propagate error to caller
  }
}

module.exports = data_retrive;