import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';

class ProductController {
  // Get all products
  static async getAllProducts(req, res) {
    try {
      const { category_id, active, search } = req.query;
      const filters = { category_id, active, search };
      
      const products = await Product.getAll(filters);
      
      res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products',
        error: error.message
      });
    }
  }

  // Get product by ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.getById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        error: error.message
      });
    }
  }

  // Create new product
  static async createProduct(req, res) {
    try {
      const productData = req.body;
      
      // Validate required fields
      if (!productData.sku || !productData.name || !productData.price) {
        return res.status(400).json({
          success: false,
          message: 'SKU, name, and price are required'
        });
      }
      
      // Check if SKU already exists
      const existingProduct = await Product.getBySku(productData.sku);
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }
      
      const productId = await Product.create(productData);
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { id: productId }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error.message
      });
    }
  }

  // Update product
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const product = await Product.getById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      // Check if SKU is being changed and if it already exists
      if (updateData.sku && updateData.sku !== product.sku) {
        const existingProduct = await Product.getBySku(updateData.sku);
        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: 'Product with this SKU already exists'
          });
        }
      }
      
      const success = await product.update(updateData);
      
      if (success) {
        res.json({
          success: true,
          message: 'Product updated successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update product'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message
      });
    }
  }

  // Delete product
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      
      const product = await Product.getById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      const success = await product.delete();
      
      if (success) {
        res.json({
          success: true,
          message: 'Product deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete product'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message
      });
    }
  }

  // Get product variants
  static async getProductVariants(req, res) {
    try {
      const { id } = req.params;
      const variants = await ProductVariant.getByProductId(id);
      
      res.json({
        success: true,
        data: variants,
        count: variants.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product variants',
        error: error.message
      });
    }
  }

  // Create product variant
  static async createVariant(req, res) {
    try {
      const { id } = req.params;
      const variantData = { ...req.body, product_id: id };
      
      // Validate required fields
      if (!variantData.sku) {
        return res.status(400).json({
          success: false,
          message: 'SKU is required for variant'
        });
      }
      
      // Check if variant SKU already exists
      const existingVariant = await ProductVariant.getBySku(variantData.sku);
      if (existingVariant) {
        return res.status(400).json({
          success: false,
          message: 'Variant with this SKU already exists'
        });
      }
      
      const variantId = await ProductVariant.create(variantData);
      
      res.status(201).json({
        success: true,
        message: 'Product variant created successfully',
        data: { id: variantId }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create product variant',
        error: error.message
      });
    }
  }

  // Update product variant
  static async updateVariant(req, res) {
    try {
      const { variantId } = req.params;
      const updateData = req.body;
      
      const variant = await ProductVariant.getById(variantId);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Product variant not found'
        });
      }
      
      // Check if SKU is being changed and if it already exists
      if (updateData.sku && updateData.sku !== variant.sku) {
        const existingVariant = await ProductVariant.getBySku(updateData.sku);
        if (existingVariant) {
          return res.status(400).json({
            success: false,
            message: 'Variant with this SKU already exists'
          });
        }
      }
      
      const success = await variant.update(updateData);
      
      if (success) {
        res.json({
          success: true,
          message: 'Product variant updated successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update product variant'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update product variant',
        error: error.message
      });
    }
  }

  // Delete product variant
  static async deleteVariant(req, res) {
    try {
      const { variantId } = req.params;
      
      const variant = await ProductVariant.getById(variantId);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Product variant not found'
        });
      }
      
      const success = await variant.delete();
      
      if (success) {
        res.json({
          success: true,
          message: 'Product variant deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete product variant'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete product variant',
        error: error.message
      });
    }
  }
}

export default ProductController;
