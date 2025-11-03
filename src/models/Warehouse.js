import db from '../config/db.js';

class Warehouse {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.address = data.address;
    this.phone = data.phone;
    this.is_default = data.is_default;
    this.created_at = data.created_at;
  }

  // Get all warehouses
  static async getAll() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM warehouses ORDER BY name';
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results.map(row => new Warehouse(row)));
      });
    });
  }

  // Get warehouse by ID
  static async getById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM warehouses WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) reject(err);
        else if (results.length === 0) resolve(null);
        else resolve(new Warehouse(results[0]));
      });
    });
  }

  // Get default warehouse
  static async getDefault() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM warehouses WHERE is_default = 1 LIMIT 1';
      db.query(query, (err, results) => {
        if (err) reject(err);
        else if (results.length === 0) resolve(null);
        else resolve(new Warehouse(results[0]));
      });
    });
  }

  // Create new warehouse
  static async create(warehouseData) {
    return new Promise((resolve, reject) => {
      const { name, address, phone, is_default = 0 } = warehouseData;
      const query = 'INSERT INTO warehouses (name, address, phone, is_default) VALUES (?, ?, ?, ?)';
      db.query(query, [name, address, phone, is_default], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  // Update warehouse
  async update(updateData) {
    return new Promise((resolve, reject) => {
      const { name, address, phone, is_default } = updateData;
      const query = 'UPDATE warehouses SET name = ?, address = ?, phone = ?, is_default = ? WHERE id = ?';
      db.query(query, [name, address, phone, is_default, this.id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  // Delete warehouse
  async delete() {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM warehouses WHERE id = ?';
      db.query(query, [this.id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }
}

export default Warehouse;

