require("dotenv").config();
const { Pool } = require("pg");

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add it to server/.env first.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const queryFromCli = process.argv[2];
    const sql = queryFromCli || "SELECT COUNT(*)::int AS total_rows FROM ingresdata2025;";

    // Compatibility helper during migration:
    // if input SQL contains MySQL-style backticks, convert to Postgres quotes.
    const postgresSQL = sql.replace(/`([^`]+)`/g, '"$1"');

    console.log("[NEON TEST] Running SQL:", postgresSQL);
    const result = await pool.query(postgresSQL);
    console.log("[NEON TEST] Row count:", result.rowCount);
    console.log("[NEON TEST] Sample rows:", JSON.stringify(result.rows.slice(0, 5), null, 2));
    console.log("[NEON TEST] Success");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("[NEON TEST] Failed:", error.message);
  process.exit(1);
});
