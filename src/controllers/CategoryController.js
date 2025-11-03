import Category from '../models/Category.js';

class CategoryController {
  // Get all categories
  static async getAllCategories(req, res) {
    try {
      const categories = await Category.getAll();
      
      res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: error.message
      });
    }
  }

  // Get category by ID
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const category = await Category.getById(id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category',
        error: error.message
      });
    }
  }

  // Create new category
  static async createCategory(req, res) {
    try {
      const { name, description, requires_size, size_type, size_options } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
      }
      
      // Check if category name already exists
      const existingCategories = await Category.getAll();
      const nameExists = existingCategories.some(cat => 
        cat.name.toLowerCase() === name.toLowerCase()
      );
      
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
      
      const categoryId = await Category.create({ name, description, requires_size, size_type, size_options });
      
      // Get the created category to return full data
      const createdCategory = await Category.getById(categoryId);
      
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: createdCategory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create category',
        error: error.message
      });
    }
  }

  // Update category
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, requires_size, size_type, size_options } = req.body;
      
      const category = await Category.getById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      // Check if name is being changed and if it already exists
      if (name && name !== category.name) {
        const existingCategories = await Category.getAll();
        const nameExists = existingCategories.some(cat => 
          cat.id !== parseInt(id) && cat.name.toLowerCase() === name.toLowerCase()
        );
        
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Category with this name already exists'
          });
        }
      }
      
      const success = await category.update({ name, description, requires_size, size_type, size_options });
      
      if (success) {
        // Get the updated category to return full data
        const updatedCategory = await Category.getById(id);
        res.json({
          success: true,
          message: 'Category updated successfully',
          data: updatedCategory
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update category'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update category',
        error: error.message
      });
    }
  }

  // Delete category
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      
      const category = await Category.getById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      const success = await category.delete();
      
      if (success) {
        res.json({
          success: true,
          message: 'Category deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete category'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        error: error.message
      });
    }
  }
}

export default CategoryController;




