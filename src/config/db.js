import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config()

// Create a connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS ,
  database: process.env.DB_NAME,
});

console.log(process.env.DB_NAME)
// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1); // Stop the server if DB fails
  } else {
    console.log('✅ Connected to MySQL database');
  }
});

export default db;

