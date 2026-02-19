const mysql = require('mysql2/promise');

async function data_retrive(sql_query) {
  // Validate SQL query
  if (!sql_query || typeof sql_query !== 'string') {
    console.error('Error: Invalid or missing SQL query');
    throw new Error('SQL query is null or invalid');
  }

  console.log('Inside data_retrive function');
  console.log('SQL Query received in data_retrive for retrieval from the database:\n', sql_query);

  let connection;
  try {
    // Create a connection to the database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Execute the query
    console.log('Executing SQL Query:', sql_query);
    const [rows, fields] = await connection.execute(sql_query); 
    // Validate results
    if (!rows || rows.length === 0) {
      console.warn('No data returned from database');
      return [];
    }
    console.log('Query results:', rows);
    return [rows, fields];
  } catch (error) {
    console.error('Error executing query in db:', error);
    throw error; // Propagate error to caller
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

module.exports = data_retrive;