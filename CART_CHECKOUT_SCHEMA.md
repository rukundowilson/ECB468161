# Cart & Checkout Database Schema

This document describes the database tables for shopping cart and checkout functionality.

## Tables Overview

1. **customers** - Customer/user accounts
2. **addresses** - Shipping and billing addresses
3. **carts** - Shopping carts (supports both authenticated users and guests via session_id)
4. **cart_items** - Items in shopping carts
5. **orders** - Customer orders
6. **order_items** - Items in each order

## Table Details

### customers
Stores customer account information.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| email | VARCHAR(255) | Unique email address |
| first_name | VARCHAR(100) | Customer's first name |
| last_name | VARCHAR(100) | Customer's last name |
| phone | VARCHAR(20) | Optional phone number |
| password_hash | VARCHAR(255) | Optional password hash for authentication |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:** `email`

### addresses
Stores shipping and billing addresses for customers.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| customer_id | INT | Foreign key to customers (nullable for guest orders) |
| type | ENUM | 'shipping' or 'billing' |
| first_name | VARCHAR(100) | First name |
| last_name | VARCHAR(100) | Last name |
| company | VARCHAR(100) | Optional company name |
| address_line1 | VARCHAR(255) | Street address |
| address_line2 | VARCHAR(255) | Apartment, suite, etc. |
| city | VARCHAR(100) | City |
| state | VARCHAR(100) | State/Province |
| postal_code | VARCHAR(20) | ZIP/Postal code |
| country | VARCHAR(100) | Country (default: 'US') |
| phone | VARCHAR(20) | Phone number |
| is_default | TINYINT(1) | Whether this is the default address |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Foreign Keys:** `customer_id` → `customers.id` (CASCADE)

**Indexes:** `customer_id`, `type`

### carts
Shopping carts that can belong to either a logged-in customer or a guest session.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| customer_id | INT | Foreign key to customers (nullable for guest carts) |
| session_id | VARCHAR(255) | Session identifier for guest carts |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Foreign Keys:** `customer_id` → `customers.id` (CASCADE)

**Indexes:** `customer_id`, `session_id`

### cart_items
Individual items in shopping carts.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| cart_id | INT | Foreign key to carts |
| product_id | INT | Foreign key to products |
| variant_id | INT | Foreign key to product_variants (nullable) |
| quantity | INT | Quantity of items |
| price | DECIMAL(10,2) | Price at time of adding to cart |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Foreign Keys:**
- `cart_id` → `carts.id` (CASCADE)
- `product_id` → `products.id` (CASCADE)
- `variant_id` → `product_variants.id` (CASCADE)

**Unique Constraint:** `(cart_id, product_id, variant_id)` - Prevents duplicate items

**Indexes:** `cart_id`, `product_id`

### orders
Customer orders (created from cart checkout).

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| order_number | VARCHAR(50) | Unique order identifier |
| customer_id | INT | Foreign key to customers (nullable for guest orders) |
| status | ENUM | Order status: 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled' |
| subtotal | DECIMAL(10,2) | Subtotal before tax and shipping |
| tax | DECIMAL(10,2) | Tax amount |
| shipping | DECIMAL(10,2) | Shipping cost |
| total | DECIMAL(10,2) | Total amount |
| shipping_address_id | INT | Foreign key to addresses |
| billing_address_id | INT | Foreign key to addresses |
| payment_method | VARCHAR(50) | Payment method used |
| payment_status | ENUM | 'pending', 'paid', 'failed', 'refunded' |
| payment_transaction_id | VARCHAR(255) | Payment processor transaction ID |
| notes | TEXT | Optional order notes |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Foreign Keys:**
- `customer_id` → `customers.id` (SET NULL)
- `shipping_address_id` → `addresses.id` (SET NULL)
- `billing_address_id` → `addresses.id` (SET NULL)

**Indexes:** `order_number`, `customer_id`, `status`, `payment_status`, `created_at`

### order_items
Individual items in orders (snapshot at time of order).

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| order_id | INT | Foreign key to orders |
| product_id | INT | Foreign key to products |
| variant_id | INT | Foreign key to product_variants (nullable) |
| product_name | VARCHAR(255) | Snapshot of product name |
| product_sku | VARCHAR(100) | Snapshot of product SKU |
| variant_sku | VARCHAR(100) | Snapshot of variant SKU |
| quantity | INT | Quantity ordered |
| unit_price | DECIMAL(10,2) | Price per unit at time of order |
| total_price | DECIMAL(10,2) | Total price (quantity × unit_price) |
| created_at | TIMESTAMP | Creation timestamp |

**Foreign Keys:**
- `order_id` → `orders.id` (CASCADE)
- `product_id` → `products.id` (RESTRICT - prevents deletion if ordered)
- `variant_id` → `product_variants.id` (SET NULL)

**Indexes:** `order_id`, `product_id`

## Running Migrations

### Run All Migrations
```bash
npm run migrate:cart-checkout
```

### Run Individual Migrations
```bash
npm run migrate:customers
npm run migrate:addresses
npm run migrate:carts
npm run migrate:cart-items
npm run migrate:orders
npm run migrate:order-items
```

## Notes

- **Guest Checkout**: The system supports both authenticated customers and guest checkout via `session_id` in the `carts` table.
- **Order Snapshots**: `order_items` stores a snapshot of product information (name, SKU) at the time of order, so historical orders remain accurate even if products are later modified or deleted.
- **Cascading Deletes**: Cart and cart items are deleted when a customer account is deleted. Orders are preserved but customer_id is set to NULL.
- **Stock Deduction**: When an order is created, you'll need to deduct stock from the `stock` table. This should be handled in the order creation logic (not in the database schema).







