import express from 'express';
import StockController from '../controllers/StockController.js';

const router = express.Router();

// Stock management routes
router.get('/levels', StockController.getStockLevels);
router.get('/levels/warehouse/:warehouseId', StockController.getStockByWarehouse);
router.get('/levels/product/:productId', StockController.getStockByProduct);
router.get('/low-stock', StockController.getLowStock);
router.get('/low-stock/warehouse/:warehouseId', StockController.getLowStockByWarehouse);

// Stock operations
router.post('/adjust', StockController.adjustStock);
router.post('/reserve', StockController.reserveStock);
router.post('/release', StockController.releaseStock);
router.post('/transfer', StockController.transferStock);

// Stock movements
router.get('/movements', StockController.getMovements);
router.get('/movements/stock/:stockId', StockController.getMovementsByStock);
router.get('/movements/type/:type', StockController.getMovementsByType);
router.get('/movements/stats', StockController.getMovementStats);

export default router;
