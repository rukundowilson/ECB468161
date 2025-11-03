import dotenv from 'dotenv';
dotenv.config();
import db from '../config/db.js';

const run = async () => {
  const checkQuery = `
    SELECT COUNT(*) AS cnt
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cart_items';
  `;

  db.query(checkQuery, [process.env.DB_NAME], (err, results) => {
    if (err) {
      console.error('Check failed:', err.message);
      process.exit(1);
    }
    const exists = results[0]?.cnt > 0;
    if (exists) {
      console.log('cart_items table already exists. No changes made.');
      process.exit(0);
    }
    
    const createQuery = `
      CREATE TABLE cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT NOT NULL,
        variant_id INT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
        UNIQUE KEY unique_cart_product_variant (cart_id, product_id, variant_id),
        INDEX idx_cart_id (cart_id),
        INDEX idx_product_id (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    db.query(createQuery, (createErr) => {
      if (createErr) {
        console.error('Migration failed:', createErr.message);
        process.exit(1);
      } else {
        console.log('Migration completed: cart_items table created');
        process.exit(0);
      }
    });
  });
};

run();







