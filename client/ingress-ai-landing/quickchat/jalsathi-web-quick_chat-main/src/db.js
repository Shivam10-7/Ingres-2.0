const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  // Fail fast if the connection string is missing.
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (error) => {
  console.error(`[${new Date().toISOString()}] Unexpected PostgreSQL pool error:`, error?.message || error);
});

module.exports = { pool };
