import express from 'express';
import ProductController from '../controllers/ProductController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Multer in-memory storage, we'll stream to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
    }
    cb(null, true);
  }
});

const router = express.Router();

// Product routes
router.get('/', ProductController.getAllProducts);
router.post('/', ProductController.createProduct);

// Product quantity route (must come before /:id to avoid route conflicts)
router.get('/:id/quantity', ProductController.getProductTotalQuantity);

// Product variants (must come before /:id to avoid route conflicts)
router.get('/:id/variants', ProductController.getProductVariants);
router.post('/:id/variants', ProductController.createVariant);

// Product CRUD routes
router.get('/:id', ProductController.getProductById);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

// Variant update/delete routes
router.put('/variants/:variantId', ProductController.updateVariant);
router.delete('/variants/:variantId', ProductController.deleteVariant);

// Image upload for products with error handling
router.post('/upload', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB',
            error: err.message
          });
        }
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      }
      // Handle other errors (like fileFilter errors)
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed',
        error: err.message
      });
    }
    next();
  });
}, ProductController.uploadImage);

export default router;




