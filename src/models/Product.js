import db from '../config/db.js';

class Product {
  constructor(data) {
    this.id = data.id;
    this.sku = data.sku;
    this.name = data.name;
    this.description = data.description;
    this.category_id = data.category_id;
    this.brand = data.brand;
    this.price = data.price;
    this.active = data.active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Get all products with optional filters
  static async getAll(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
      `;
      const conditions = [];
      const params = [];

      if (filters.category_id) {
        conditions.push('p.category_id = ?');
        params.push(filters.category_id);
      }
      if (filters.active !== undefined) {
        conditions.push('p.active = ?');
        params.push(filters.active);
      }
      if (filters.search) {
        conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY p.name';

      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results.map(row => new Product(row)));
      });
    });
  }

  // Get product by ID
  static async getById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = ?
      `;
      db.query(query, [id], (err, results) => {
        if (err) reject(err);
        else if (results.length === 0) resolve(null);
        else resolve(new Product(results[0]));
      });
    });
  }

  // Get product by SKU
  static async getBySku(sku) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM products WHERE sku = ?';
      db.query(query, [sku], (err, results) => {
        if (err) reject(err);
        else if (results.length === 0) resolve(null);
        else resolve(new Product(results[0]));
      });
    });
  }

  // Create new product
  static async create(productData) {
    return new Promise((resolve, reject) => {
      const { sku, name, description, category_id, brand, price, active = 1 } = productData;
      const query = `
        INSERT INTO products (sku, name, description, category_id, brand, price, active) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(query, [sku, name, description, category_id, brand, price, active], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  // Update product
  async update(updateData) {
    return new Promise((resolve, reject) => {
      const { sku, name, description, category_id, brand, price, active } = updateData;
      const query = `
        UPDATE products 
        SET sku = ?, name = ?, description = ?, category_id = ?, brand = ?, price = ?, active = ?
        WHERE id = ?
      `;
      db.query(query, [sku, name, description, category_id, brand, price, active, this.id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  // Delete product
  async delete() {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM products WHERE id = ?';
      db.query(query, [this.id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }
}

export default Product;
