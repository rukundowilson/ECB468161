import db from '../config/db.js';

class Category {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.requires_size = data.requires_size || 0;
    this.size_type = data.size_type || null; // 'numeric', 'letter', or null
    this.size_options = data.size_options || null; // JSON string of size options
    this.created_at = data.created_at;
  }

  // Get all categories
  static async getAll() {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM categories ORDER BY name';
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results.map(row => new Category(row)));
      });
    });
  }

  // Get category by ID
  static async getById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM categories WHERE id = ?';
      db.query(query, [id], (err, results) => {
        if (err) reject(err);
        else if (results.length === 0) resolve(null);
        else resolve(new Category(results[0]));
      });
    });
  }

  // Create new category
  static async create(categoryData) {
    return new Promise((resolve, reject) => {
      const { name, description, requires_size = 0, size_type = null, size_options = null } = categoryData;
      const query = 'INSERT INTO categories (name, description, requires_size, size_type, size_options) VALUES (?, ?, ?, ?, ?)';
      const sizeOptionsJson = size_options ? JSON.stringify(size_options) : null;
      db.query(query, [name, description, requires_size, size_type, sizeOptionsJson], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  // Update category
  async update(updateData) {
    return new Promise((resolve, reject) => {
      const { name, description, requires_size, size_type, size_options } = updateData;
      const query = 'UPDATE categories SET name = ?, description = ?, requires_size = ?, size_type = ?, size_options = ? WHERE id = ?';
      const sizeOptionsJson = size_options ? JSON.stringify(size_options) : null;
      db.query(query, [name, description, requires_size, size_type, sizeOptionsJson, this.id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  // Delete category
  async delete() {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM categories WHERE id = ?';
      db.query(query, [this.id], (err, result) => {
        if (err) reject(err);
        else resolve(result.affectedRows > 0);
      });
    });
  }

  // Get size options as array
  getSizeOptionsArray() {
    if (!this.size_options) return [];
    try {
      return JSON.parse(this.size_options);
    } catch (error) {
      return [];
    }
  }

  // Set size options from array
  setSizeOptionsArray(options) {
    this.size_options = options ? JSON.stringify(options) : null;
  }
}

export default Category;

