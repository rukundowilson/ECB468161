import express from 'express';
import ProductController from '../controllers/ProductController.js';

const router = express.Router();

// Product routes
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', ProductController.createProduct);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);

// Product variants
router.get('/:id/variants', ProductController.getProductVariants);
router.post('/:id/variants', ProductController.createVariant);
router.put('/variants/:variantId', ProductController.updateVariant);
router.delete('/variants/:variantId', ProductController.deleteVariant);

export default router;
