import db from '../config/db.js';

class ProductVariant {
  constructor(data) {
    this.id = data.id;
    this.product_id = data.product_id;
    this.sku = data.sku;
    this.attributes = this.parseAttributes(data.attributes);
    this.additional_price = data.additional_price;
    this.image_url = data.image_url;
    this.active = data.active;
    this.created_at = data.created_at;
  }

  // Helper method to safely parse attributes
  parseAttributes(attributes) {
    if (!attributes) return null;
    
    // If it's already an object, return it
    if (typeof attributes === 'object') {
      return attributes;
    }
    
    // If it's a string, try to parse it
    if (typeof attributes === 'string') {
      try {
        return JSON.parse(attributes);
      } catch (error) {
        console.warn('Failed to parse attributes JSON:', attributes, error.message);
        return null;
      }
    }
    
    return null;
  }

  // Get all variants for a product
  static async getByProductId(productId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM product_variants WHERE product_id = ? ORDER BY sku';
      db.query(query, [productId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          try {
            const variants = results.map(row => new ProductVariant(row));
            resolve(variants);
          } catch (error) {
            console.error('Error creating ProductVariant instances:', error);
            reject(error);
          }
        }
      });
    });
  }

  // Get variant by ID
  static async getById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM product_variants WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) {
          reject(err);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          try {
            resolve(new ProductVariant(results[0]));
          } catch (error) {
            console.error('Error creating ProductVariant instance:', error);
            reject(error);
          }
        }
      });
    });
  }

  // Get variant by SKU
  static async getBySku(sku) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM product_variants WHERE sku = ?';
      db.query(query, [sku], (err, results) => {
        if (err) {
          reject(err);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          try {
            resolve(new ProductVariant(results[0]));
          } catch (error) {
            console.error('Error creating ProductVariant instance:', error);
            reject(error);
          }
        }
      });
    });
  }

  // Create new variant
  static async create(variantData) {
    return new Promise((resolve, reject) => {
      const { product_id, sku, attributes, additional_price = 0, image_url = null, active = 1 } = variantData;
      const query = `
        INSERT INTO product_variants (product_id, sku, attributes, additional_price, image_url, active) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const attributesJson = attributes ? JSON.stringify(attributes) : null;
      db.query(query, [product_id, sku, attributesJson, additional_price, image_url, active], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  // Update variant
  async update(updateData) {
    return new Promise((resolve, reject) => {
      const { sku, attributes, additional_price, image_url = null, active } = updateData;
      const query = `
        UPDATE product_variants 
        SET sku = ?, attributes = ?, additional_price = ?, image_url = ?, active = ?
        WHERE id = ?
      `;
      const attributesJson = attributes ? JSON.stringify(attributes) : null;
      db.query(query, [sku, attributesJson, additional_price, image_url, active, this.id], (err, result) => {
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

