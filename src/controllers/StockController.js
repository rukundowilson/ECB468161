import Stock from '../models/Stock.js';
import StockMovement from '../models/StockMovement.js';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import Warehouse from '../models/Warehouse.js';

class StockController {
  // Get all stock levels
  static async getStockLevels(req, res) {
    try {
      const { warehouse_id, product_id, low_stock_only } = req.query;
      
      let stockData;
      if (warehouse_id) {
        stockData = await Stock.getStockByWarehouse(warehouse_id);
      } else if (product_id) {
        stockData = await Stock.getStockByProduct(product_id);
      } else if (low_stock_only === 'true') {
        stockData = await Stock.getLowStock(warehouse_id);
      } else {
        // Get all stock levels (you might want to implement this method)
        stockData = await Stock.getAllStock();
      }
      
      res.json({
        success: true,
        data: stockData,
        count: stockData.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock levels',
        error: error.message
      });
    }
  }

  // Get stock by warehouse
  static async getStockByWarehouse(req, res) {
    try {
      const { warehouseId } = req.params;
      const stockData = await Stock.getStockByWarehouse(warehouseId);
      
      res.json({
        success: true,
        data: stockData,
        count: stockData.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch warehouse stock',
        error: error.message
      });
    }
  }

  // Get stock by product
  static async getStockByProduct(req, res) {
    try {
      const { productId } = req.params;
      const { variant_id } = req.query;
      const stockData = await Stock.getStockByProduct(productId, variant_id);
      
      res.json({
        success: true,
        data: stockData,
        count: stockData.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product stock',
        error: error.message
      });
    }
  }

  // Get low stock items
  static async getLowStock(req, res) {
    try {
      const { warehouse_id } = req.query;
      const stockData = await Stock.getLowStock(warehouse_id);
      
      res.json({
        success: true,
        data: stockData,
        count: stockData.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch low stock items',
        error: error.message
      });
    }
  }

  // Get low stock by warehouse
  static async getLowStockByWarehouse(req, res) {
    try {
      const { warehouseId } = req.params;
      const stockData = await Stock.getLowStock(warehouseId);
      
      res.json({
        success: true,
        data: stockData,
        count: stockData.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch low stock items for warehouse',
        error: error.message
      });
    }
  }

  // Adjust stock (manual adjustment)
  static async adjustStock(req, res) {
    try {
      const { product_id, variant_id, warehouse_id, new_quantity, reason, created_by } = req.body;
      
      // Get current stock
      const currentStock = await Stock.getStock(product_id, variant_id, warehouse_id);
      if (!currentStock) {
        return res.status(404).json({
          success: false,
          message: 'Stock record not found'
        });
      }
      
      const change_qty = new_quantity - currentStock.quantity_on_hand;
      
      // Update stock quantities
      await currentStock.updateQuantities(new_quantity, currentStock.quantity_reserved);
      
      // Record movement
      await StockMovement.create({
        stock_id: currentStock.id,
        change_qty,
        movement_type: 'adjustment',
        reference: `Manual adjustment - ${reason}`,
        created_by,
        note: `Stock adjusted from ${currentStock.quantity_on_hand} to ${new_quantity}. Reason: ${reason}`
      });
      
      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: {
          product_id,
          variant_id,
          warehouse_id,
          old_quantity: currentStock.quantity_on_hand,
          new_quantity,
          change_qty
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to adjust stock',
        error: error.message
      });
    }
  }

  // Reserve stock
  static async reserveStock(req, res) {
    try {
      const { product_id, variant_id, warehouse_id, quantity, reference, created_by } = req.body;
      
      const stock = await Stock.getStock(product_id, variant_id, warehouse_id);
      if (!stock) {
        return res.status(404).json({
          success: false,
          message: 'Stock record not found'
        });
      }
      
      // Reserve stock
      await stock.reserveStock(quantity);
      
      // Record movement
      await StockMovement.create({
        stock_id: stock.id,
        change_qty: -quantity,
        movement_type: 'sale',
        reference,
        created_by,
        note: `Stock reserved for ${reference}`
      });
      
      res.json({
        success: true,
        message: 'Stock reserved successfully',
        data: {
          product_id,
          variant_id,
          warehouse_id,
          reserved_quantity: quantity,
          remaining_stock: stock.quantity_on_hand
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to reserve stock',
        error: error.message
      });
    }
  }

  // Release reserved stock
  static async releaseStock(req, res) {
    try {
      const { product_id, variant_id, warehouse_id, quantity, reference, created_by } = req.body;
      
      const stock = await Stock.getStock(product_id, variant_id, warehouse_id);
      if (!stock) {
        return res.status(404).json({
          success: false,
          message: 'Stock record not found'
        });
      }
      
      // Release reserved stock
      await stock.releaseReservedStock(quantity);
      
      // Record movement
      await StockMovement.create({
        stock_id: stock.id,
        change_qty: quantity,
        movement_type: 'return',
        reference,
        created_by,
        note: `Reserved stock released for ${reference}`
      });
      
      res.json({
        success: true,
        message: 'Stock released successfully',
        data: {
          product_id,
          variant_id,
          warehouse_id,
          released_quantity: quantity,
          current_stock: stock.quantity_on_hand
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to release stock',
        error: error.message
      });
    }
  }

  // Transfer stock between warehouses
  static async transferStock(req, res) {
    try {
      const { 
        product_id, 
        variant_id, 
        from_warehouse_id, 
        to_warehouse_id, 
        quantity, 
        reference, 
        created_by 
      } = req.body;
      
      // Get source stock
      const sourceStock = await Stock.getStock(product_id, variant_id, from_warehouse_id);
      if (!sourceStock) {
        return res.status(404).json({
          success: false,
          message: 'Source stock record not found'
        });
      }
      
      if (sourceStock.quantity_on_hand < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock for transfer'
        });
      }
      
      // Reduce source stock
      await sourceStock.updateQuantities(
        sourceStock.quantity_on_hand - quantity,
        sourceStock.quantity_reserved
      );
      
      // Get or create destination stock
      let destStock = await Stock.getStock(product_id, variant_id, to_warehouse_id);
      if (!destStock) {
        // Create new stock record for destination
        await Stock.upsertStock({
          product_id,
          variant_id,
          warehouse_id: to_warehouse_id,
          quantity_on_hand: quantity,
          quantity_reserved: 0,
          min_reorder_level: sourceStock.min_reorder_level,
          last_cost: sourceStock.last_cost
        });
        destStock = await Stock.getStock(product_id, variant_id, to_warehouse_id);
      } else {
        // Update existing destination stock
        await destStock.updateQuantities(
          destStock.quantity_on_hand + quantity,
          destStock.quantity_reserved
        );
      }
      
      // Record movements
      await StockMovement.create({
        stock_id: sourceStock.id,
        change_qty: -quantity,
        movement_type: 'transfer_out',
        reference,
        created_by,
        note: `Transferred to warehouse ${to_warehouse_id}`
      });
      
      await StockMovement.create({
        stock_id: destStock.id,
        change_qty: quantity,
        movement_type: 'transfer_in',
        reference,
        created_by,
        note: `Transferred from warehouse ${from_warehouse_id}`
      });
      
      res.json({
        success: true,
        message: 'Stock transferred successfully',
        data: {
          product_id,
          variant_id,
          from_warehouse_id,
          to_warehouse_id,
          quantity,
          reference
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to transfer stock',
        error: error.message
      });
    }
  }

  // Get stock movements
  static async getMovements(req, res) {
    try {
      const { limit = 50 } = req.query;
      const movements = await StockMovement.getRecent(parseInt(limit));
      
      res.json({
        success: true,
        data: movements,
        count: movements.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock movements',
        error: error.message
      });
    }
  }

  // Get movements by stock ID
  static async getMovementsByStock(req, res) {
    try {
      const { stockId } = req.params;
      const movements = await StockMovement.getByStockId(stockId);
      
      res.json({
        success: true,
        data: movements,
        count: movements.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock movements',
        error: error.message
      });
    }
  }

  // Get movements by type
  static async getMovementsByType(req, res) {
    try {
      const { type } = req.params;
      const { limit = 100 } = req.query;
      const movements = await StockMovement.getByMovementType(type, parseInt(limit));
      
      res.json({
        success: true,
        data: movements,
        count: movements.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch movements by type',
        error: error.message
      });
    }
  }

  // Get movement statistics
  static async getMovementStats(req, res) {
    try {
      const { warehouse_id, days = 30 } = req.query;
      const stats = await StockMovement.getMovementStats(warehouse_id, parseInt(days));
      
      res.json({
        success: true,
        data: stats,
        period_days: parseInt(days)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch movement statistics',
        error: error.message
      });
    }
  }
}

export default StockController;
