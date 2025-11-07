import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config()

// Create a connection pool instead of single connection
// This handles connection lifecycle better and prevents "connection closed" errors
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Maximum number of connections in the pool
  queueLimit: 0, // Unlimited queue
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  reconnect: true,
});

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1); // Stop the server if DB fails
  } else {
    console.log('✅ Connected to MySQL database');
    connection.release(); // Release the connection back to the pool
  }
});

// Handle pool errors
db.on('error', (err) => {
  console.error('❌ Database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Attempting to reconnect to database...');
  } else {
    throw err;
  }
});

export default db;

