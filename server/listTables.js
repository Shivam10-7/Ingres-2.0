const { pool } = require('./src/routes/quickchat/db');
(async () => {
  try {
    const res = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' LIMIT 20;`);
    console.log('Tables:', res.rows.map(r=>r.table_name));
  } catch (e) { console.error('Error:', e.message); }
})();