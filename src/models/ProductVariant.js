import db from '../config/db.js';

class ProductVariant {
  constructor(data) {
    this.id = data.id;
    this.product_id = data.product_id;
    this.sku = data.sku;
    this.attributes = data.attributes ? JSON.parse(data.attributes) : null;
    this.additional_price = data.additional_price;
    this.active = data.active;
    this.created_at = data.created_at;
  }

  // Get all variants for a product
  static async getByProductId(productId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM product_variants WHERE product_id = ? ORDER BY sku';
      db.query(query, [productId], (err, results) => {
        if (err) reject(err);
        else resolve(results.map(row => new ProductVariant(row)));
      });
    });
  }

  // Get variant by ID
  static async getById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM product_variants WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) reject(err);
        else if (results.length === 0) resolve(null);
        else resolve(new ProductVariant(results[0]));
      });
    });
  }

  // Get variant by SKU
  static async getBySku(sku) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM product_variants WHERE sku = ?';
      db.query(query, [sku], (err, results) => {
        if (err) reject(err);
        else if (results.length === 0) resolve(null);
        else resolve(new ProductVariant(results[0]));
      });
    });
  }

  // Create new variant
  static async create(variantData) {
    return new Promise((resolve, reject) => {
      const { product_id, sku, attributes, additional_price = 0, active = 1 } = variantData;
      const query = `
        INSERT INTO product_variants (product_id, sku, attributes, additional_price, active) 
        VALUES (?, ?, ?, ?, ?)
      `;
      const attributesJson = attributes ? JSON.stringify(attributes) : null;
      db.query(query, [product_id, sku, attributesJson, additional_price, active], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  // Update variant
  async update(updateData) {
    return new Promise((resolve, reject) => {
      const { sku, attributes, additional_price, active } = updateData;
      const query = `
        UPDATE product_variants 
        SET sku = ?, attributes = ?, additional_price = ?, active = ?
        WHERE id = ?
      `;
      const attributesJson = attributes ? JSON.stringify(attributes) : null;
      db.query(query, [sku, attributesJson, additional_price, active, this.id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  // Delete variant
  async delete() {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM product_variants WHERE id = ?';
      db.query(query, [this.id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }
}

export default ProductVariant;
