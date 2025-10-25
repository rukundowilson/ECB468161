import express from 'express';
import WarehouseController from '../controllers/WarehouseController.js';

const router = express.Router();

// Warehouse routes
router.get('/', WarehouseController.getAllWarehouses);
router.get('/default', WarehouseController.getDefaultWarehouse);
router.get('/:id', WarehouseController.getWarehouseById);
router.post('/', WarehouseController.createWarehouse);
router.put('/:id', WarehouseController.updateWarehouse);
router.delete('/:id', WarehouseController.deleteWarehouse);

export default router;
