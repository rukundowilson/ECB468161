import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import Category from '../models/Category.js';
import { productRequiresSize, validateSizeFormat } from '../utils/categoryUtils.js';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

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
      if (!productData.name || !productData.price) {
        return res.status(400).json({
          success: false,
          message: 'Name and price are required'
        });
      }
      
      // Validate category_id if provided
      if (productData.category_id) {
        const category = await Category.getById(productData.category_id);
        if (!category) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category ID provided'
          });
        }
      }
      
      // Generate SKU if not provided
      if (!productData.sku) {
        productData.sku = await Product.generateSku(productData.name);
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
      
      // Get the created product to return full data
      const createdProduct = await Product.getById(productId);
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: createdProduct
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
      
      // Validate category_id if being updated
      if (updateData.category_id) {
        const category = await Category.getById(updateData.category_id);
        if (!category) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category ID provided'
          });
        }
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
        // Get the updated product to return full data
        const updatedProduct = await Product.getById(id);
        res.json({
          success: true,
          message: 'Product updated successfully',
          data: updatedProduct
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
      
      // Get the product to check its category
      const product = await Product.getById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      // Validate required fields
      if (!variantData.sku) {
        return res.status(400).json({
          success: false,
          message: 'SKU is required for variant'
        });
      }
      
      // Check if this product category requires size
      const requiresSize = productRequiresSize(product);
      if (requiresSize && (!variantData.attributes || !variantData.attributes.size || !variantData.attributes.size.trim())) {
        return res.status(400).json({
          success: false,
          message: `Size is required for variants in the '${product.category_name}' category`
        });
      }
      
      // Validate size format if size is provided
      if (requiresSize && variantData.attributes && variantData.attributes.size && !validateSizeFormat(variantData.attributes.size, product.category_name, product.category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid size format for ${product.category_name} category. Please use appropriate size format.`
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
      
      // Get the created variant to return complete data
      const createdVariant = await ProductVariant.getById(variantId);
      
      res.status(201).json({
        success: true,
        message: 'Product variant created successfully',
        data: createdVariant
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
      
      // Get the product to check its category
      const product = await Product.getById(variant.product_id);
      const requiresSize = product ? productRequiresSize(product) : false;
      
      // Validate that size attribute is present and not empty if attributes are being updated and category requires size
      if (updateData.attributes && requiresSize && (!updateData.attributes.size || !updateData.attributes.size.trim())) {
        return res.status(400).json({
          success: false,
          message: `Size is required for variants in the '${product?.category_name}' category`
        });
      }
      
      // Validate size format if size is provided
      if (updateData.attributes && requiresSize && updateData.attributes.size && !validateSizeFormat(updateData.attributes.size, product?.category_name, product?.category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid size format for ${product?.category_name} category. Please use appropriate size format.`
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
        // Get the updated variant to return complete data
        const updatedVariant = await ProductVariant.getById(variantId);
        res.json({
          success: true,
          message: 'Product variant updated successfully',
          data: updatedVariant
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

  // Upload product image
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file uploaded'
        });
      }

      // Check Cloudinary configuration
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('Cloudinary configuration missing:', {
          cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
          api_key: !!process.env.CLOUDINARY_API_KEY,
          api_secret: !!process.env.CLOUDINARY_API_SECRET
        });
        return res.status(500).json({
          success: false,
          message: 'Image upload service not configured. Please set Cloudinary environment variables.',
          error: 'Missing Cloudinary configuration'
        });
      }

      // Upload buffer to Cloudinary using upload_stream
      const folder = process.env.CLOUDINARY_FOLDER || 'products';
      const timeout = 60000; // 60 seconds

      const uploadStreamPromise = () => new Promise((resolve, reject) => {
        let timeoutId;
        let isResolved = false;

        // Set timeout
        timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            reject(new Error('Upload timeout: Image upload took too long. Please try again with a smaller image.'));
          }
        }, timeout);

        try {
          const stream = cloudinary.uploader.upload_stream(
            { 
              folder, 
              resource_type: 'image',
              timeout: timeout,
              chunk_size: 6000000,
            },
            (error, result) => {
              clearTimeout(timeoutId);
              if (isResolved) return; // Already handled by timeout
              isResolved = true;

              if (error) {
                console.error('Cloudinary upload error:', error);
                return reject(error);
              }
              resolve(result);
            }
          );
          
          stream.on('error', (streamError) => {
            clearTimeout(timeoutId);
            if (!isResolved) {
              isResolved = true;
              console.error('Stream error:', streamError);
              reject(streamError);
            }
          });

          streamifier.createReadStream(req.file.buffer).pipe(stream);
        } catch (streamError) {
          clearTimeout(timeoutId);
          if (!isResolved) {
            isResolved = true;
            console.error('Stream creation error:', streamError);
            reject(streamError);
          }
        }
      });

      // Retry logic (up to 2 retries)
      let lastError;
      let result;
      const maxRetries = 2;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`Retrying upload (attempt ${attempt + 1}/${maxRetries + 1})...`);
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
          result = await uploadStreamPromise();
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          if (attempt === maxRetries) {
            // Last attempt failed
            throw error;
          }
          // Continue to next retry
        }
      }

      if (!result || !result.secure_url) {
        throw new Error('Cloudinary returned invalid response');
      }

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('Upload image error:', error);
      
      // Handle specific error types
      let message = 'Failed to upload image';
      let statusCode = 500;
      
      if (error.message?.includes('timeout') || error.name === 'TimeoutError' || error.http_code === 499) {
        message = 'Upload timeout: The image upload took too long. Please try:\n- Using a smaller image file\n- Checking your internet connection\n- Trying again in a moment';
        statusCode = 408; // Request Timeout
      } else if (error.message) {
        message = error.message;
      }
      
      res.status(statusCode).json({
        success: false,
        message: message,
        error: error.message || 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

export default ProductController;




