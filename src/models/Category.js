import db from '../config/db.js';

class Category {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
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
      const { name, description } = categoryData;
      const query = 'INSERT INTO categories (name, description) VALUES (?, ?)';
      db.query(query, [name, description], (err, result) => {
        if (err) reject(err);
        else resolve(result.insertId);
      });
    });
  }

  // Update category
  async update(updateData) {
    return new Promise((resolve, reject) => {
      const { name, description } = updateData;
      const query = 'UPDATE categories SET name = ?, description = ? WHERE id = ?';
      db.query(query, [name, description, this.id], (err, result) => {
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
}

export default Category;
