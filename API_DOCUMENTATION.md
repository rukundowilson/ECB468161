# Stock Management API Documentation

## Overview
This is a comprehensive stock management system for a single vendor e-commerce platform. The API provides full CRUD operations for products, categories, warehouses, and advanced stock management features.

## Base URL
```
http://localhost:8080/api
```

## Authentication
Currently no authentication is implemented. This should be added for production use.

## API Endpoints

### Health Check
- **GET** `/health` - Server health status

### Categories
- **GET** `/api/categories` - Get all categories
- **GET** `/api/categories/:id` - Get category by ID
- **POST** `/api/categories` - Create new category
- **PUT** `/api/categories/:id` - Update category
- **DELETE** `/api/categories/:id` - Delete category

### Products
- **GET** `/api/products` - Get all products (with filters)
- **GET** `/api/products/:id` - Get product by ID
- **POST** `/api/products` - Create new product
- **PUT** `/api/products/:id` - Update product
- **DELETE** `/api/products/:id` - Delete product

#### Product Variants
- **GET** `/api/products/:id/variants` - Get product variants
- **POST** `/api/products/:id/variants` - Create product variant
- **PUT** `/api/products/variants/:variantId` - Update variant
- **DELETE** `/api/products/variants/:variantId` - Delete variant

### Warehouses
- **GET** `/api/warehouses` - Get all warehouses
- **GET** `/api/warehouses/default` - Get default warehouse
- **GET** `/api/warehouses/:id` - Get warehouse by ID
- **POST** `/api/warehouses` - Create warehouse
- **PUT** `/api/warehouses/:id` - Update warehouse
- **DELETE** `/api/warehouses/:id` - Delete warehouse

### Stock Management
- **GET** `/api/stock/levels` - Get stock levels
- **GET** `/api/stock/levels/warehouse/:warehouseId` - Get stock by warehouse
- **GET** `/api/stock/levels/product/:productId` - Get stock by product
- **GET** `/api/stock/low-stock` - Get low stock items
- **GET** `/api/stock/low-stock/warehouse/:warehouseId` - Get low stock by warehouse

#### Stock Operations
- **POST** `/api/stock/adjust` - Manual stock adjustment
- **POST** `/api/stock/reserve` - Reserve stock
- **POST** `/api/stock/release` - Release reserved stock
- **POST** `/api/stock/transfer` - Transfer stock between warehouses

#### Stock Movements
- **GET** `/api/stock/movements` - Get recent movements
- **GET** `/api/stock/movements/stock/:stockId` - Get movements by stock
- **GET** `/api/stock/movements/type/:type` - Get movements by type
- **GET** `/api/stock/movements/stats` - Get movement statistics

## Request/Response Examples

### Create Category
```json
POST /api/categories
{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
}
```

### Create Product
```json
POST /api/products
{
  "sku": "LAPTOP-001",
  "name": "Gaming Laptop",
  "description": "High-performance gaming laptop",
  "category_id": 1,
  "brand": "TechBrand",
  "price": 1299.99,
  "active": 1
}
```

### Create Product Variant
```json
POST /api/products/1/variants
{
  "sku": "LAPTOP-001-RED",
  "attributes": {
    "color": "Red",
    "size": "15.6 inch"
  },
  "additional_price": 50.00,
  "active": 1
}
```

### Create Warehouse
```json
POST /api/warehouses
{
  "name": "Main Warehouse",
  "address": "123 Storage St, City, State 12345",
  "phone": "+1-555-0123",
  "is_default": true
}
```

### Stock Adjustment
```json
POST /api/stock/adjust
{
  "product_id": 1,
  "variant_id": 1,
  "warehouse_id": 1,
  "new_quantity": 100,
  "reason": "Initial stock setup",
  "created_by": "admin"
}
```

### Stock Transfer
```json
POST /api/stock/transfer
{
  "product_id": 1,
  "variant_id": 1,
  "from_warehouse_id": 1,
  "to_warehouse_id": 2,
  "quantity": 10,
  "reference": "TRANSFER-001",
  "created_by": "admin"
}
```

## Query Parameters

### Product Filters
- `category_id` - Filter by category
- `active` - Filter by active status (0 or 1)
- `search` - Search in name, SKU, or brand

### Stock Filters
- `warehouse_id` - Filter by warehouse
- `low_stock_only` - Show only low stock items (true/false)

### Movement Filters
- `limit` - Limit number of results (default: 50)
- `days` - Number of days for statistics (default: 30)

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "count": 10,
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Database Schema

The system uses the following main tables:
- `categories` - Product categories
- `products` - Main product catalog
- `product_variants` - Product variations
- `warehouses` - Storage locations
- `stock` - Current inventory levels
- `stock_movements` - Inventory change history

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with database configuration:
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASS=your_password
DB_NAME=shop_db
PORT=8080
```

3. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:8080/api`

## Features

- ✅ Complete CRUD operations for all entities
- ✅ Multi-warehouse stock management
- ✅ Product variants with flexible attributes
- ✅ Stock movement tracking and audit trail
- ✅ Low stock alerts
- ✅ Stock transfers between warehouses
- ✅ Stock reservation system
- ✅ Comprehensive error handling
- ✅ Input validation
- ✅ CORS support for frontend integration

## Next Steps

For a complete e-commerce platform, consider adding:
- User authentication and authorization
- Order management system
- Payment processing
- Customer management
- Reporting and analytics
- Frontend dashboard
