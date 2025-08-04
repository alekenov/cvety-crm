# Database Architecture Guide

This guide provides comprehensive documentation of the Cvety.kz database schema, covering all tables, relationships, and implementation details for both local development and Railway production environments.

## Database Environments

### Local Development
- **Engine**: SQLite
- **File**: `backend/flower_shop.db`
- **Connection**: Automatic via SQLAlchemy

### Railway Production
- **Engine**: PostgreSQL
- **Connection**: Via `DATABASE_URL` environment variable
- **Auto-conversion**: `postgres://` → `postgresql://`
- **Current state**: 7 orders, 18 customers, 8 products, 3 shops

### Accessing Databases

```bash
# Local SQLite
sqlite3 backend/flower_shop.db

# Railway PostgreSQL
railway run python3 check_railway_db.py
railway run python3 -c "import psycopg2; ..."
```

## Core Tables Schema

### 1. shops
Multi-tenancy foundation - each phone number creates a separate shop.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| created_at | TIMESTAMP | WITH TIME ZONE | Creation timestamp |
| updated_at | TIMESTAMP | WITH TIME ZONE | Last update timestamp |
| owner_phone | VARCHAR | UNIQUE, NOT NULL | Shop owner's phone |
| name | VARCHAR | NOT NULL | Shop name |
| is_active | BOOLEAN | DEFAULT true | Active status |

### 2. orders
Central business entity containing all order information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| created_at | TIMESTAMP | WITH TIME ZONE | Order creation time |
| updated_at | TIMESTAMP | WITH TIME ZONE | Last modification |
| status | ENUM | NOT NULL | Order status (see OrderStatus) |
| customer_id | INTEGER | FOREIGN KEY | Link to customers table |
| customer_phone | VARCHAR | NOT NULL, INDEX | Customer phone (denormalized) |
| recipient_phone | VARCHAR | | Delivery recipient phone |
| recipient_name | VARCHAR | | Delivery recipient name |
| address | VARCHAR | | Delivery address |
| address_needs_clarification | BOOLEAN | DEFAULT false | Address validation flag |
| delivery_method | ENUM | NOT NULL | delivery/self_pickup |
| delivery_window | JSON | | {"from": "ISO8601", "to": "ISO8601"} |
| flower_sum | FLOAT | NOT NULL | Subtotal for flowers |
| delivery_fee | FLOAT | DEFAULT 0 | Delivery charge |
| total | FLOAT | NOT NULL | Total amount |
| has_pre_delivery_photos | BOOLEAN | DEFAULT false | Photo flag |
| has_issue | BOOLEAN | DEFAULT false | Issue flag |
| issue_type | ENUM | | Type of issue if any |
| issue_comment | VARCHAR | | Issue description |
| tracking_token | VARCHAR | UNIQUE, INDEX | Public tracking token |
| assigned_florist_id | INTEGER | FOREIGN KEY | Assigned florist |
| courier_id | INTEGER | FOREIGN KEY | Assigned courier |
| courier_phone | VARCHAR | | External courier phone |
| shop_id | INTEGER | NOT NULL, FK | Shop association |
| payment_method | VARCHAR(20) | | Payment method used |
| payment_date | TIMESTAMP | | When payment received |

**OrderStatus Enum Values**:
- `new` - Just created
- `paid` - Payment confirmed
- `assembled` - Bouquet ready
- `delivery` - Out for delivery
- `self_pickup` - Ready for pickup
- `delivered` - Successfully delivered
- `completed` - Order finished
- `issue` - Problem occurred

### 3. order_items
Line items for each order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| order_id | INTEGER | NOT NULL, FK | Parent order |
| product_id | INTEGER | FK | Product reference |
| product_name | VARCHAR(255) | | Product name (denormalized) |
| product_category | VARCHAR(50) | | Category (denormalized) |
| quantity | INTEGER | NOT NULL | Amount ordered |
| price | FLOAT | NOT NULL | Unit price |
| total | FLOAT | NOT NULL | Line total |
| warehouse_item_id | INTEGER | FK | Warehouse link |
| is_reserved | BOOLEAN | DEFAULT false | Reservation status |
| is_written_off | BOOLEAN | DEFAULT false | Write-off status |
| reserved_at | TIMESTAMP | | Reservation time |
| written_off_at | TIMESTAMP | | Write-off time |

### 4. customers
Customer information and statistics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| phone | VARCHAR | NOT NULL, UNIQUE | Primary identifier |
| name | VARCHAR | | Customer name |
| email | VARCHAR | | Email address |
| orders_count | INTEGER | DEFAULT 0 | Total orders |
| total_spent | FLOAT | DEFAULT 0 | Lifetime value |
| last_order_date | TIMESTAMP | | Last order timestamp |
| notes | TEXT | | Internal notes |
| preferences | TEXT | | Customer preferences |
| source | VARCHAR | | Acquisition source |
| created_at | TIMESTAMP | WITH TIME ZONE | Registration date |
| updated_at | TIMESTAMP | WITH TIME ZONE | Last update |
| shop_id | INTEGER | NOT NULL, FK | Shop association |

### 5. products
Product catalog with pricing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| name | VARCHAR | NOT NULL | Product name |
| category | ENUM | NOT NULL | Product category |
| description | TEXT | | Full description |
| image_url | VARCHAR | | Main image URL |
| cost_price | FLOAT | NOT NULL | Cost price |
| retail_price | FLOAT | NOT NULL | Regular price |
| sale_price | FLOAT | | Discounted price |
| is_active | BOOLEAN | DEFAULT true | Available for sale |
| is_popular | BOOLEAN | DEFAULT false | Popular flag |
| is_new | BOOLEAN | DEFAULT false | New product flag |
| created_at | TIMESTAMP | WITH TIME ZONE | Creation date |
| updated_at | TIMESTAMP | WITH TIME ZONE | Last update |
| shop_id | INTEGER | NOT NULL, FK | Shop association |

### 6. users
System users (staff members).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| phone | VARCHAR | NOT NULL, UNIQUE | Login identifier |
| name | VARCHAR | NOT NULL | Display name |
| email | VARCHAR | | Email address |
| role | ENUM | NOT NULL | User role |
| is_active | BOOLEAN | DEFAULT true | Active status |
| created_at | TIMESTAMP | WITH TIME ZONE | Registration date |
| updated_at | TIMESTAMP | WITH TIME ZONE | Last update |
| shop_id | INTEGER | NOT NULL, FK | Shop association |

**UserRole Enum Values**:
- `admin` - Full system access
- `manager` - Shop management
- `florist` - Production tasks
- `courier` - Delivery tasks

### 7. warehouse_items
Inventory tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| name | VARCHAR | NOT NULL | Item name |
| category | VARCHAR | | Item category |
| quantity | INTEGER | NOT NULL | Current stock |
| unit | VARCHAR | | Unit of measure |
| cost_price | FLOAT | | Cost per unit |
| supplier | VARCHAR | | Supplier name |
| last_purchase_date | TIMESTAMP | | Last restock date |
| expiry_date | DATE | | For perishables |
| location | VARCHAR | | Storage location |
| min_stock_level | INTEGER | DEFAULT 0 | Reorder point |
| shop_id | INTEGER | NOT NULL, FK | Shop association |

### 8. order_history
Audit trail for order changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| order_id | INTEGER | NOT NULL, FK | Related order |
| user_id | INTEGER | FK | User who made change |
| event_type | VARCHAR(50) | NOT NULL | Type of event |
| old_status | VARCHAR(20) | | Previous status |
| new_status | VARCHAR(20) | | New status |
| comment | TEXT | | Event description |
| created_at | TIMESTAMP | NOT NULL | Event timestamp |

## Supporting Tables

### florist_tasks
Production task management.

### customer_addresses
Multiple addresses per customer.

### customer_important_dates
Birthdays, anniversaries tracking.

### warehouse_movements
Stock movement history.

### deliveries & delivery_positions
Batch delivery management.

### supplies & supply_items
Purchase orders from suppliers.

### product_ingredients
Recipe management for bouquets.

### product_images
Multiple images per product.

### comments
Order comments and notes.

### company_settings
Shop-specific configuration.

### flower_categories
Category management.

## Key Relationships

```
shops (1) ← (N) orders
shops (1) ← (N) customers  
shops (1) ← (N) products
shops (1) ← (N) users

customers (1) ← (N) orders
orders (1) ← (N) order_items
orders (1) ← (N) order_history

products (1) ← (N) order_items
users (1) ← (N) assigned_orders (as florist)
users (1) ← (N) courier_orders (as courier)
```

## Common Queries

### Get order with full details
```sql
SELECT o.*, c.name as customer_name, 
       u1.name as florist_name,
       u2.name as courier_name
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN users u1 ON o.assigned_florist_id = u1.id
LEFT JOIN users u2 ON o.courier_id = u2.id
WHERE o.id = ?;
```

### Shop statistics
```sql
SELECT 
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT o.customer_id) as unique_customers,
    SUM(o.total) as revenue
FROM orders o
WHERE o.shop_id = ? 
  AND o.status != 'issue'
  AND o.created_at >= ?;
```

### Active tasks for florist
```sql
SELECT o.*, 
       STRING_AGG(oi.product_name, ', ') as products
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.assigned_florist_id = ?
  AND o.status IN ('paid', 'assembled')
GROUP BY o.id
ORDER BY o.delivery_window->>'from';
```

## Migration Procedures

### Creating migrations
```bash
cd backend
alembic revision -m "description of changes"
# Edit the generated file
alembic upgrade head
```

### Railway deployment
Migrations run automatically via `docker-entrypoint.sh` on deployment.

### Rollback
```bash
alembic downgrade -1  # Rollback one migration
alembic history       # View migration history
```

## Data Integrity Rules

1. **Phone numbers**: Must be in format `+7XXXXXXXXXX`
2. **Shop isolation**: All queries must filter by shop_id
3. **Status transitions**: Must follow defined workflow
4. **Soft deletes**: Use is_active flags instead of DELETE
5. **Audit trail**: All order changes recorded in order_history
6. **Money precision**: Use DECIMAL(10,2) for all amounts

## Performance Indexes

- `orders.customer_phone` - Customer lookup
- `orders.tracking_token` - Public tracking
- `orders.shop_id` - Multi-tenancy
- `products.shop_id` + `products.is_active` - Product catalog
- `users.phone` - Authentication