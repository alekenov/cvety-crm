# Backend Endpoints Report

## Summary

Backend server is running successfully on `http://localhost:8000`. All major endpoint groups are functional with the following status:

## Endpoints Status

### ✅ Working Endpoints

#### Orders API (`/api/orders/`)
- **GET /orders/** - ✅ Working (200)
- **GET /orders/{order_id}** - ✅ Working (200)
- **PATCH /orders/{order_id}/status** - ✅ Working (200)
- **PATCH /orders/{order_id}/issue** - ✅ Working (200)
- **POST /orders/** - ❌ Validation error (missing fields)

#### Products API (`/api/products/`)
- **GET /products/** - ✅ Working (200)
- **GET /products/{id}** - ✅ Working (200) 
- **POST /products/** - ❌ Validation error (schema mismatch)
- **PUT /products/{id}** - ❌ Validation error
- **DELETE /products/{id}** - ✅ Working (200)
- **POST /products/{id}/toggle-active** - ✅ Working (200)

#### Customers API (`/api/customers/`)
- **GET /customers/** - ✅ Working (200)
- **GET /customers/{id}** - ✅ Working (200)
- **GET /customers/{id}/orders** - ✅ Working (200)
- **POST /customers/** - ❌ Business logic error (duplicate phone)
- **PUT /customers/{id}** - ✅ Working (200)
- **POST /customers/{id}/addresses** - ✅ Working (200)
- **POST /customers/{id}/important-dates** - ✅ Working (200)

#### Warehouse API (`/api/warehouse/`)
- **GET /warehouse/** - ✅ Working (200)
- **GET /warehouse/stats** - ✅ Working (200)
- **GET /warehouse/{id}** - ✅ Working (200)
- **POST /warehouse/** - ❌ Validation error (schema mismatch)
- **PATCH /warehouse/{id}** - ✅ Working (200)
- **POST /warehouse/deliveries** - ❌ Validation error
- **GET /warehouse/deliveries** - ❌ Routing error (404)

#### Production API (`/api/production/`)
- **GET /production/tasks/** - ✅ Working (200)
- **GET /production/tasks/pending** - ✅ Working (200)
- **GET /production/tasks/overdue** - ✅ Working (200)
- **GET /production/queue/stats** - ✅ Working (200)
- **GET /production/queue/workload** - ✅ Working (200)
- **POST /production/tasks/** - ❌ Validation error (schema mismatch)

#### Tracking API (`/api/tracking/`)
- **GET /tracking/{token}** - ✅ Working (200/404)

#### Settings API (`/api/settings/`)
- **GET /settings/** - ✅ Working (200)
- **PATCH /settings/** - ❌ Validation error (schema mismatch)

#### Init Data API (`/api/init/`)
- **POST /init/initialize** - ✅ Working (200)
- **GET /init/status** - ✅ Working (200)

## Issues Found

### 1. Schema Validation Errors
Many POST/PUT endpoints have schema mismatches between the test data and expected schema:
- Orders: Missing `total` field
- Products: Expects `cost_price` and `retail_price` instead of `base_price`
- Warehouse: Expects different field names (sku, batch_code, etc.)
- Settings: Expects `from/to` instead of `start/end` for working hours

### 2. Business Logic Issues
- Customer creation fails for duplicate phone numbers (expected behavior)

### 3. Routing Issues
- `/api/warehouse/deliveries` GET endpoint seems to have routing conflict

## Recommendations

1. **Update test scripts** to match actual schema requirements
2. **Add API documentation** for correct field names and types
3. **Fix routing conflicts** for warehouse deliveries endpoint
4. **Consider adding** OpenAPI/Swagger documentation access

## Database Status
- Using SQLite database: `flower_shop.db`
- Database connection: ✅ OK
- Tables created: ✅ Successfully

## Test Data Available
- Orders: 9 records
- Products: 4 records
- Customers: 12 records
- Warehouse Items: 5 records
- Production Tasks: 3 records
- Settings: 1 record (configured)