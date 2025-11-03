import db from '../config/db.js';

class Product {
  constructor(data) {
    this.id = data.id;
    this.sku = data.sku;
    this.name = data.name;
    this.description = data.description;
    this.category_id = data.category_id;
    this.category_name = data.category_name;
    this.brand = data.brand;
    this.price = data.price;
    this.image_url = data.image_url;
    this.active = data.active;
    this.is_jirani_recommended = data.is_jirani_recommended || 0;
    this.show_in_new_arrivals = data.show_in_new_arrivals || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Category information for size requirements
    this.category = data.category_id ? {
      requires_size: data.requires_size,
      size_type: data.size_type,
      size_options: data.size_options
    } : null;
  }

  // Get all products with optional filters
  static async getAll(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT p.*, c.name as category_name, c.requires_size, c.size_type, c.size_options
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
        SELECT p.*, c.name as category_name, c.requires_size, c.size_type, c.size_options
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

  // Generate SKU from product name
  static async generateSku(productName) {
    return new Promise((resolve, reject) => {
      // Create base SKU from product name
      let baseSku = productName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '') // Remove non-alphanumeric characters
        .substring(0, 8); // Limit to 8 characters
      
      // Add timestamp suffix to ensure uniqueness
      const timestamp = Date.now().toString().slice(-4);
      let sku = `${baseSku}-${timestamp}`;
      
      // Check if SKU exists and generate new one if needed
      const checkSku = (generatedSku) => {
        const query = 'SELECT COUNT(*) as count FROM products WHERE sku = ?';
        db.query(query, [generatedSku], (err, results) => {
          if (err) {
            reject(err);
          } else if (results[0].count > 0) {
            // SKU exists, generate new one with random suffix
            const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            checkSku(`${baseSku}-${randomSuffix}`);
          } else {
            resolve(generatedSku);
          }
        });
      };
      
      checkSku(sku);
    });
  }

  // Create new product
  static async create(productData) {
    return new Promise((resolve, reject) => {
      const { sku, name, description, category_id, brand, price, image_url = null, active = 1, is_jirani_recommended = 0, show_in_new_arrivals = 0 } = productData;
      
      // Try with new columns first, fallback to old schema if columns don't exist
      const queryWithNewFields = `
        INSERT INTO products (sku, name, description, category_id, brand, price, image_url, active, is_jirani_recommended, show_in_new_arrivals) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const queryWithoutNewFields = `
        INSERT INTO products (sku, name, description, category_id, brand, price, image_url, active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(queryWithNewFields, [sku, name, description, category_id, brand, price, image_url, active, is_jirani_recommended, show_in_new_arrivals], (err, result) => {
        if (err) {
          // If columns don't exist, try without them
          if (err.code === 'ER_BAD_FIELD_ERROR' && (err.message.includes('is_jirani_recommended') || err.message.includes('show_in_new_arrivals'))) {
            db.query(queryWithoutNewFields, [sku, name, description, category_id, brand, price, image_url, active], (retryErr, retryResult) => {
              if (retryErr) reject(retryErr);
              else resolve(retryResult.insertId);
            });
          } else {
            reject(err);
          }
        } else {
          resolve(result.insertId);
        }
      });
    });
  }

  // Update product
  async update(updateData) {
    return new Promise((resolve, reject) => {
      const { sku, name, description, category_id, brand, price, image_url = null, active, is_jirani_recommended, show_in_new_arrivals } = updateData;
      
      // Build dynamic query to handle optional fields
      const fields = [];
      const values = [];
      
      if (sku !== undefined) { fields.push('sku = ?'); values.push(sku); }
      if (name !== undefined) { fields.push('name = ?'); values.push(name); }
      if (description !== undefined) { fields.push('description = ?'); values.push(description); }
      if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id); }
      if (brand !== undefined) { fields.push('brand = ?'); values.push(brand); }
      if (price !== undefined) { fields.push('price = ?'); values.push(price); }
      if (image_url !== undefined) { fields.push('image_url = ?'); values.push(image_url); }
      if (active !== undefined) { fields.push('active = ?'); values.push(active); }
      
      // Only include new fields if they're provided (graceful fallback if columns don't exist)
      if (is_jirani_recommended !== undefined) { 
        fields.push('is_jirani_recommended = ?'); 
        values.push(is_jirani_recommended); 
      } else if (this.is_jirani_recommended !== undefined) {
        fields.push('is_jirani_recommended = ?');
        values.push(this.is_jirani_recommended);
      }
      
      if (show_in_new_arrivals !== undefined) { 
        fields.push('show_in_new_arrivals = ?'); 
        values.push(show_in_new_arrivals); 
      } else if (this.show_in_new_arrivals !== undefined) {
        fields.push('show_in_new_arrivals = ?');
        values.push(this.show_in_new_arrivals);
      }
      
      if (fields.length === 0) {
        resolve(false);
        return;
      }
      
      values.push(this.id);
      
      const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
      
      db.query(query, values, (err, result) => {
        if (err) {
          // If error is about unknown column, silently ignore those fields and retry without them
          if (err.code === 'ER_BAD_FIELD_ERROR' && (err.message.includes('is_jirani_recommended') || err.message.includes('show_in_new_arrivals'))) {
            // Retry without the problematic fields
            const safeFields = fields.filter((f, i) => {
              const fieldName = f.split(' = ')[0];
              return fieldName !== 'is_jirani_recommended' && fieldName !== 'show_in_new_arrivals';
            });
            const safeValues = values.slice(0, -1).filter((v, i) => {
              const fieldName = fields[i].split(' = ')[0];
              return fieldName !== 'is_jirani_recommended' && fieldName !== 'show_in_new_arrivals';
            });
            safeValues.push(this.id);
            
            if (safeFields.length > 0) {
              const safeQuery = `UPDATE products SET ${safeFields.join(', ')} WHERE id = ?`;
              db.query(safeQuery, safeValues, (retryErr, retryResult) => {
                if (retryErr) reject(retryErr);
                else resolve(retryResult.affectedRows > 0);
              });
            } else {
              resolve(false);
            }
          } else {
            reject(err);
          }
        } else {
          resolve(result.affectedRows > 0);
        }
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

