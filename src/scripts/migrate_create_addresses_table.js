import dotenv from 'dotenv';
dotenv.config();
import db from '../config/db.js';

const run = async () => {
  const checkQuery = `
    SELECT COUNT(*) AS cnt
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'addresses';
  `;

  db.query(checkQuery, [process.env.DB_NAME], (err, results) => {
    if (err) {
      console.error('Check failed:', err.message);
      process.exit(1);
    }
    const exists = results[0]?.cnt > 0;
    if (exists) {
      console.log('addresses table already exists. No changes made.');
      process.exit(0);
    }
    
    const createQuery = `
      CREATE TABLE addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NULL,
        type ENUM('shipping', 'billing') NOT NULL DEFAULT 'shipping',
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        company VARCHAR(100) NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255) NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL DEFAULT 'US',
        phone VARCHAR(20) NULL,
        is_default TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        INDEX idx_customer_id (customer_id),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    db.query(createQuery, (createErr) => {
      if (createErr) {
        console.error('Migration failed:', createErr.message);
        process.exit(1);
      } else {
        console.log('Migration completed: addresses table created');
        process.exit(0);
      }
    });
  });
};

run();













