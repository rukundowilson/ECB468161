import dotenv from 'dotenv';
dotenv.config();
import db from '../config/db.js';

const run = async () => {
  const checkQuery = `
    SELECT COUNT(*) AS cnt
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'image_url';
  `;

  db.query(checkQuery, [process.env.DB_NAME], (err, results) => {
    if (err) {
      console.error('Check failed:', err.message);
      process.exit(1);
    }
    const exists = results[0]?.cnt > 0;
    if (exists) {
      console.log('image_url column already exists. No changes made.');
      process.exit(0);
    }
    const alterQuery = `ALTER TABLE products ADD COLUMN image_url VARCHAR(512) NULL;`;
    db.query(alterQuery, (alterErr) => {
      if (alterErr) {
        console.error('Migration failed:', alterErr.message);
        process.exit(1);
      } else {
        console.log('Migration completed: image_url column added to products table');
        process.exit(0);
      }
    });
  });
};

run();


