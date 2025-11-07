import dotenv from 'dotenv';
dotenv.config();
import db from '../config/db.js';

const run = async () => {
  const checkQuery = `
    SELECT COUNT(*) AS cnt
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'order_items';
  `;

  db.query(checkQuery, [process.env.DB_NAME], (err, results) => {
    if (err) {
      console.error('Check failed:', err.message);
      process.exit(1);
    }
    const exists = results[0]?.cnt > 0;
    if (exists) {
      console.log('order_items table already exists. No changes made.');
      process.exit(0);
    }
    
    const createQuery = `
      CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        variant_id INT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_sku VARCHAR(100) NOT NULL,
        variant_sku VARCHAR(100) NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
        INDEX idx_order_id (order_id),
        INDEX idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    db.query(createQuery, (createErr) => {
      if (createErr) {
        console.error('Migration failed:', createErr.message);
        process.exit(1);
      } else {
        console.log('Migration completed: order_items table created');
        process.exit(0);
      }
    });
  });
};

run();













