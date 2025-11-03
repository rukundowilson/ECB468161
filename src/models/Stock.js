import db from '../config/db.js';

class Stock {
  constructor(data) {
    this.id = data.id;
    this.product_id = data.product_id;
    this.variant_id = data.variant_id;
    this.warehouse_id = data.warehouse_id;
    this.quantity_on_hand = data.quantity_on_hand;
    this.quantity_reserved = data.quantity_reserved;
    this.min_reorder_level = data.min_reorder_level;
    this.last_cost = data.last_cost;
    this.updated_at = data.updated_at;
    // joined fields (optional)
    this.product_name = data.product_name;
    this.product_sku = data.product_sku;
    this.variant_sku = data.variant_sku;
    this.warehouse_name = data.warehouse_name;
  }

  // Get stock for a specific product/variant in a warehouse
  static async getStock(productId, variantId, warehouseId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT s.*, p.name as product_name, p.sku as product_sku, w.name as warehouse_name
        FROM stock s
        JOIN products p ON s.product_id = p.id
        JOIN warehouses w ON s.warehouse_id = w.id
        WHERE s.product_id = ? AND s.variant_id ${variantId === null ? 'IS NULL' : '= ?'} AND s.warehouse_id = ?
      `;
      const params = variantId === null ? [productId, warehouseId] : [productId, variantId, warehouseId];
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else if (results.length === 0) resolve(null);
        else resolve(new Stock(results[0]));
      });
    });
  }

  // Get all stock for a product across all warehouses
  static async getStockByProduct(productId, variantId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT s.*, p.name as product_name, p.sku as product_sku, w.name as warehouse_name
        FROM stock s
        JOIN products p ON s.product_id = p.id
        JOIN warehouses w ON s.warehouse_id = w.id
        WHERE s.product_id = ?
      `;
      const params = [productId];
      
      if (variantId) {
        query += ' AND s.variant_id = ?';
        params.push(variantId);
      }
      
      query += ' ORDER BY w.name';
      
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results.map(row => new Stock(row)));
      });
    });
  }

  // Get stock levels for a warehouse
  static async getStockByWarehouse(warehouseId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT s.*, p.name as product_name, p.sku as product_sku, pv.sku as variant_sku
        FROM stock s
        JOIN products p ON s.product_id = p.id
        LEFT JOIN product_variants pv ON s.variant_id = pv.id
        WHERE s.warehouse_id = ?
        ORDER BY p.name
      `;
      db.query(query, [warehouseId], (err, results) => {
        if (err) reject(err);
        else resolve(results.map(row => new Stock(row)));
      });
    });
  }

  // Get all stock levels
  static async getAllStock() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT s.*, p.name as product_name, p.sku as product_sku, w.name as warehouse_name, pv.sku as variant_sku
        FROM stock s
        JOIN products p ON s.product_id = p.id
        JOIN warehouses w ON s.warehouse_id = w.id
        LEFT JOIN product_variants pv ON s.variant_id = pv.id
        ORDER BY w.name, p.name
      `;
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results.map(row => new Stock(row)));
      });
    });
  }

  // Get low stock items (below reorder level)
  static async getLowStock(warehouseId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT s.*, p.name as product_name, p.sku as product_sku, w.name as warehouse_name
        FROM stock s
        JOIN products p ON s.product_id = p.id
        JOIN warehouses w ON s.warehouse_id = w.id
        WHERE s.quantity_on_hand <= s.min_reorder_level
      `;
      const params = [];
      
      if (warehouseId) {
        query += ' AND s.warehouse_id = ?';
        params.push(warehouseId);
      }
      
      query += ' ORDER BY s.quantity_on_hand ASC';
      
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results.map(row => new Stock(row)));
      });
    });
  }

  // Create or update stock record
  static async upsertStock(stockData) {
    return new Promise((resolve, reject) => {
      const { product_id, variant_id, warehouse_id, quantity_on_hand, quantity_reserved, min_reorder_level, last_cost } = stockData;
      
      const query = `
        INSERT INTO stock (product_id, variant_id, warehouse_id, quantity_on_hand, quantity_reserved, min_reorder_level, last_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        quantity_on_hand = VALUES(quantity_on_hand),
        quantity_reserved = VALUES(quantity_reserved),
        min_reorder_level = VALUES(min_reorder_level),
        last_cost = VALUES(last_cost)
      `;
      
      db.query(query, [product_id, variant_id, warehouse_id, quantity_on_hand, quantity_reserved, min_reorder_level, last_cost], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId || result.affectedRows);
      });
    });
  }

  // Update stock quantities
  async updateQuantities(quantity_on_hand, quantity_reserved) {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE stock SET quantity_on_hand = ?, quantity_reserved = ? WHERE id = ?';
      db.query(query, [quantity_on_hand, quantity_reserved, this.id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  // Reserve stock
  async reserveStock(quantity) {
    const newReserved = this.quantity_reserved + quantity;
    const newOnHand = this.quantity_on_hand - quantity;
    
    if (newOnHand < 0) {
      throw new Error('Insufficient stock available');
    }
    
    return this.updateQuantities(newOnHand, newReserved);
  }

  // Release reserved stock
  async releaseReservedStock(quantity) {
    const newReserved = Math.max(0, this.quantity_reserved - quantity);
    const newOnHand = this.quantity_on_hand + quantity;
    
    return this.updateQuantities(newOnHand, newReserved);
  }
}

export default Stock;
