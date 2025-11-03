import dotenv from 'dotenv';
dotenv.config();
import db from '../config/db.js';

const run = async () => {
  // Check for is_jirani_recommended column
  const checkQuery1 = `
    SELECT COUNT(*) AS cnt
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'is_jirani_recommended';
  `;

  db.query(checkQuery1, [process.env.DB_NAME], (err, results) => {
    if (err) {
      console.error('Check failed:', err.message);
      process.exit(1);
    }
    const exists1 = results[0]?.cnt > 0;
    
    if (!exists1) {
      const alterQuery1 = `ALTER TABLE products ADD COLUMN is_jirani_recommended TINYINT(1) DEFAULT 0;`;
      db.query(alterQuery1, (alterErr) => {
        if (alterErr) {
          console.error('Migration failed for is_jirani_recommended:', alterErr.message);
          process.exit(1);
        } else {
          console.log('Migration completed: is_jirani_recommended column added to products table');
        }
      });
    } else {
      console.log('is_jirani_recommended column already exists. No changes made.');
    }

    // Check for show_in_new_arrivals column
    const checkQuery2 = `
      SELECT COUNT(*) AS cnt
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'show_in_new_arrivals';
    `;

    db.query(checkQuery2, [process.env.DB_NAME], (err2, results2) => {
      if (err2) {
        console.error('Check failed:', err2.message);
        process.exit(1);
      }
      const exists2 = results2[0]?.cnt > 0;
      
      if (!exists2) {
        const alterQuery2 = `ALTER TABLE products ADD COLUMN show_in_new_arrivals TINYINT(1) DEFAULT 0;`;
        db.query(alterQuery2, (alterErr2) => {
          if (alterErr2) {
            console.error('Migration failed for show_in_new_arrivals:', alterErr2.message);
            process.exit(1);
          } else {
            console.log('Migration completed: show_in_new_arrivals column added to products table');
            process.exit(0);
          }
        });
      } else {
        console.log('show_in_new_arrivals column already exists. No changes made.');
        process.exit(0);
      }
    });
  });
};

run();



