function validateSQL(sql) {
  // Define a list of forbidden keywords
  // i flag makes it case-insensitive
  const forbiddenPattern = /\b(DROP|TRUNCATE|DELETE|ALTER|GRANT|REVOKE|INSERT|UPDATE|COMMIT|ROLLBACK)\b/i;

  if (forbiddenPattern.test(sql)) {
    // In a real web environment, you'd send a response object.
    // Here we return a specific error message/status.
    return {
      status: 426,
      message: "Unsafe SQL query detected."
    };
  }

  // If clean, return the original SQL
  return sql;
}
module.exports = validateSQL;