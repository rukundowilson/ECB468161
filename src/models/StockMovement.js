import db from '../config/db.js';

class StockMovement {
  constructor(data) {
    this.id = data.id;
    this.stock_id = data.stock_id;
    this.change_qty = data.change_qty;
    this.movement_type = data.movement_type;
    this.reference = data.reference;
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.note = data.note;
  }

  // Get all movements for a stock record
  static async getByStockId(stockId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT sm.*, s.product_id, s.variant_id, s.warehouse_id, p.name as product_name
        FROM stock_movements sm
        JOIN stock s ON sm.stock_id = s.id
        JOIN products p ON s.product_id = p.id
        WHERE sm.stock_id = ?
        ORDER BY sm.created_at DESC
      `;
      db.query(query, [stockId], (err, results) => {
        if (err) reject(err);
        else resolve(results.map(row => new StockMovement(row)));
      });
    });
  }

  // Get movements by type
  static async getByMovementType(movementType, limit = 100) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT sm.*, s.product_id, s.variant_id, s.warehouse_id, p.name as product_name, w.name as warehouse_name
        FROM stock_movements sm
        JOIN stock s ON sm.stock_id = s.id
        JOIN products p ON s.product_id = p.id
        JOIN warehouses w ON s.warehouse_id = w.id
        WHERE sm.movement_type = ?
        ORDER BY sm.created_at DESC
        LIMIT ?
      `;
      db.query(query, [movementType, limit], (err, results) => {
        if (err) reject(err);
        else resolve(results.map(row => new StockMovement(row)));
      });
    });
  }

  // Get recent movements
  static async getRecent(limit = 50) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT sm.*, s.product_id, s.variant_id, s.warehouse_id, p.name as product_name, w.name as warehouse_name
        FROM stock_movements sm
        JOIN stock s ON sm.stock_id = s.id
        JOIN products p ON s.product_id = p.id
        JOIN warehouses w ON s.warehouse_id = w.id
        ORDER BY sm.created_at DESC
        LIMIT ?
      `;
      db.query(query, [limit], (err, results) => {
        if (err) reject(err);
        else resolve(results.map(row => new StockMovement(row)));
      });
    });
  }

  // Create new movement
  static async create(movementData) {
    return new Promise((resolve, reject) => {
      const { stock_id, change_qty, movement_type, reference, created_by, note } = movementData;
      const query = `
        INSERT INTO stock_movements (stock_id, change_qty, movement_type, reference, created_by, note)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.query(query, [stock_id, change_qty, movement_type, reference, created_by, note], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  // Get movement statistics
  static async getMovementStats(warehouseId = null, days = 30) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          sm.movement_type,
          COUNT(*) as movement_count,
          SUM(sm.change_qty) as total_qty_change,
          AVG(sm.change_qty) as avg_qty_change
        FROM stock_movements sm
        JOIN stock s ON sm.stock_id = s.id
        WHERE sm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      const params = [days];
      
      if (warehouseId) {
        query += ' AND s.warehouse_id = ?';
        params.push(warehouseId);
      }
      
      query += ' GROUP BY sm.movement_type ORDER BY movement_count DESC';
      
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }
}

export default StockMovement;

