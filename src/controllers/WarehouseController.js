import Warehouse from '../models/Warehouse.js';

class WarehouseController {
  // Get all warehouses
  static async getAllWarehouses(req, res) {
    try {
      const warehouses = await Warehouse.getAll();
      
      res.json({
        success: true,
        data: warehouses,
        count: warehouses.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch warehouses',
        error: error.message
      });
    }
  }

  // Get default warehouse
  static async getDefaultWarehouse(req, res) {
    try {
      const warehouse = await Warehouse.getDefault();
      
      if (!warehouse) {
        return res.status(404).json({
          success: false,
          message: 'No default warehouse found'
        });
      }
      
      res.json({
        success: true,
        data: warehouse
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch default warehouse',
        error: error.message
      });
    }
  }

  // Get warehouse by ID
  static async getWarehouseById(req, res) {
    try {
      const { id } = req.params;
      const warehouse = await Warehouse.getById(id);
      
      if (!warehouse) {
        return res.status(404).json({
          success: false,
          message: 'Warehouse not found'
        });
      }
      
      res.json({
        success: true,
        data: warehouse
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch warehouse',
        error: error.message
      });
    }
  }

  // Create new warehouse
  static async createWarehouse(req, res) {
    try {
      const { name, address, phone, is_default = false } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Warehouse name is required'
        });
      }
      
      // If setting as default, unset other defaults first
      if (is_default) {
        const existingWarehouses = await Warehouse.getAll();
        for (const warehouse of existingWarehouses) {
          if (warehouse.is_default) {
            await warehouse.update({ is_default: false });
          }
        }
      }
      
      const warehouseId = await Warehouse.create({ name, address, phone, is_default });
      
      res.status(201).json({
        success: true,
        message: 'Warehouse created successfully',
        data: { id: warehouseId }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create warehouse',
        error: error.message
      });
    }
  }

  // Update warehouse
  static async updateWarehouse(req, res) {
    try {
      const { id } = req.params;
      const { name, address, phone, is_default } = req.body;
      
      const warehouse = await Warehouse.getById(id);
      if (!warehouse) {
        return res.status(404).json({
          success: false,
          message: 'Warehouse not found'
        });
      }
      
      // If setting as default, unset other defaults first
      if (is_default && !warehouse.is_default) {
        const existingWarehouses = await Warehouse.getAll();
        for (const existingWarehouse of existingWarehouses) {
          if (existingWarehouse.id !== parseInt(id) && existingWarehouse.is_default) {
            await existingWarehouse.update({ is_default: false });
          }
        }
      }
      
      const success = await warehouse.update({ name, address, phone, is_default });
      
      if (success) {
        res.json({
          success: true,
          message: 'Warehouse updated successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update warehouse'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update warehouse',
        error: error.message
      });
    }
  }

  // Delete warehouse
  static async deleteWarehouse(req, res) {
    try {
      const { id } = req.params;
      
      const warehouse = await Warehouse.getById(id);
      if (!warehouse) {
        return res.status(404).json({
          success: false,
          message: 'Warehouse not found'
        });
      }
      
      // Check if it's the default warehouse
      if (warehouse.is_default) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the default warehouse'
        });
      }
      
      const success = await warehouse.delete();
      
      if (success) {
        res.json({
          success: true,
          message: 'Warehouse deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete warehouse'
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete warehouse',
        error: error.message
      });
    }
  }
}

export default WarehouseController;




