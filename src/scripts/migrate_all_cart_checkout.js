import dotenv from 'dotenv';
dotenv.config();
import db from '../config/db.js';

const run = async () => {
  console.log('Starting cart and checkout migrations...\n');

  const migrations = [
    {
      name: 'customers',
      checkQuery: `
        SELECT COUNT(*) AS cnt
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'customers';
      `,
      createQuery: `
        CREATE TABLE customers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NULL,
          password_hash VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `
    },
    {
      name: 'addresses',
      checkQuery: `
        SELECT COUNT(*) AS cnt
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'addresses';
      `,
      createQuery: `
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
      `
    },
    {
      name: 'carts',
      checkQuery: `
        SELECT COUNT(*) AS cnt
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'carts';
      `,
      createQuery: `
        CREATE TABLE carts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          customer_id INT NULL,
          session_id VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
          INDEX idx_customer_id (customer_id),
          INDEX idx_session_id (session_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `
    },
    {
      name: 'cart_items',
      checkQuery: `
        SELECT COUNT(*) AS cnt
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cart_items';
      `,
      createQuery: `
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
      `
    },
    {
      name: 'orders',
      checkQuery: `
        SELECT COUNT(*) AS cnt
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders';
      `,
      createQuery: `
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
      `
    },
    {
      name: 'order_items',
      checkQuery: `
        SELECT COUNT(*) AS cnt
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'order_items';
      `,
      createQuery: `
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
      `
    }
  ];

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    console.log(`Running migration ${i + 1}/${migrations.length}: ${migration.name}`);

    try {
      await new Promise((resolve, reject) => {
        db.query(migration.checkQuery, [process.env.DB_NAME], (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          const exists = results[0]?.cnt > 0;
          if (exists) {
            console.log(`  ✓ ${migration.name} table already exists. Skipping.`);
            resolve();
            return;
          }

          db.query(migration.createQuery, (createErr) => {
            if (createErr) {
              reject(createErr);
              return;
            }
            console.log(`  ✓ ${migration.name} table created successfully.`);
            resolve();
          });
        });
      });
    } catch (error) {
      console.error(`  ✗ Migration failed for ${migration.name}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n✅ All migrations completed successfully!');
  db.end();
  process.exit(0);
};

run();

