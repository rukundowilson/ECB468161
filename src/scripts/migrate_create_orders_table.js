import dotenv from 'dotenv';
dotenv.config();
import db from '../config/db.js';

const run = async () => {
  const checkQuery = `
    SELECT COUNT(*) AS cnt
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders';
  `;

  db.query(checkQuery, [process.env.DB_NAME], (err, results) => {
    if (err) {
      console.error('Check failed:', err.message);
      process.exit(1);
    }
    const exists = results[0]?.cnt > 0;
    if (exists) {
      console.log('orders table already exists. No changes made.');
      process.exit(0);
    }
    
    const createQuery = `
      CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INT NULL,
        status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        shipping DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        shipping_address_id INT NULL,
        billing_address_id INT NULL,
        payment_method VARCHAR(50) NULL,
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
        payment_transaction_id VARCHAR(255) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (shipping_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
        FOREIGN KEY (billing_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
        INDEX idx_order_number (order_number),
        INDEX idx_customer_id (customer_id),
        INDEX idx_status (status),
        INDEX idx_payment_status (payment_status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    db.query(createQuery, (createErr) => {
      if (createErr) {
        console.error('Migration failed:', createErr.message);
        process.exit(1);
      } else {
        console.log('Migration completed: orders table created');
        process.exit(0);
      }
    });
  });
};

run();







