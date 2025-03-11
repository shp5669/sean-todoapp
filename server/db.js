const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Now using Railway's connection string
  ssl: {
    rejectUnauthorized: false, // Required for Railway PostgreSQL
  },
});

module.exports = pool;
