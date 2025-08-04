# Database Standards and Type Guidelines

This document defines standardized data types and validation rules for the Cvety.kz database to ensure consistency across all applications (API, mobile apps, bots).

## Core Principles

1. **Consistency**: Same data type for same business concept everywhere
2. **Precision**: Use appropriate types for data accuracy (especially money)
3. **Validation**: Enforce format at database level when possible
4. **Compatibility**: Types must work in both SQLite and PostgreSQL

## String Types Standards

### Phone Numbers
- **Database Type**: `VARCHAR(20)`
- **Format**: `+7XXXXXXXXXX` (no spaces, brackets, or dashes)
- **Validation**: Regex pattern `^\+7\d{10}$`
- **Example**: `+77011234567`

```python
# Pydantic validation
from pydantic import constr
PhoneNumber = constr(regex=r'^\+7\d{10}$', min_length=12, max_length=12)

# TypeScript validation
type PhoneNumber = `+7${string}`;  // Template literal type
const phoneRegex = /^\+7\d{10}$/;
```

### Names (People, Products)
- **Database Type**: `VARCHAR(255)`
- **Validation**: Min length 1, strip whitespace
- **Note**: Support Cyrillic characters (Russian/Kazakh)

```python
# Pydantic
RequiredName = constr(min_length=1, max_length=255, strip_whitespace=True)
```

### Email Addresses
- **Database Type**: `VARCHAR(255)`
- **Validation**: Standard email format
- **Note**: Nullable for most entities

### Addresses
- **Database Type**: `TEXT`
- **Validation**: Min length 10 characters
- **Format**: Free text (no strict format due to Kazakhstan address variations)

### Descriptions/Notes
- **Database Type**: `TEXT`
- **Validation**: None (free text)
- **Use for**: Product descriptions, customer notes, issue comments

### Status/Enum Fields
- **Database Type**: `VARCHAR(20)`
- **Why not ENUM**: Better cross-database compatibility
- **Examples**: order_status, user_role, payment_method

### Tokens/External IDs
- **Database Type**: `VARCHAR(100)`
- **Use for**: tracking_token, external system IDs
- **Generation**: UUID or secure random string

## Numeric Types Standards

### Primary Keys
- **Database Type**: `INTEGER`
- **Attributes**: AUTO_INCREMENT / SERIAL
- **Note**: Always positive, never reuse deleted IDs

### Money/Prices
- **Database Type**: `DECIMAL(10,2)` or `NUMERIC(10,2)`
- **NEVER USE**: `FLOAT` or `DOUBLE` (precision issues!)
- **Range**: 0.00 to 99,999,999.99
- **Currency**: Always KZT (Kazakhstani Tenge)

```python
# Pydantic
from decimal import Decimal
from pydantic import condecimal

MoneyAmount = condecimal(max_digits=10, decimal_places=2, ge=Decimal('0'))

# TypeScript
type MoneyAmount = number;  // Always round to 2 decimals in code
```

### Quantities
- **Database Type**: `INTEGER`
- **Validation**: >= 0 for stock, >= 1 for order quantities
- **Examples**: product quantity, stock levels

### Percentages
- **Database Type**: `DECIMAL(5,2)`
- **Range**: 0.00 to 999.99
- **Examples**: discount percentage, tax rate

## Date/Time Standards

### Timestamps
- **Database Type**: `TIMESTAMP WITH TIME ZONE`
- **Format**: ISO 8601 with timezone
- **Default timezone**: Asia/Almaty (UTC+6)
- **Examples**: created_at, updated_at, payment_date

```python
# Pydantic
from datetime import datetime
timestamp: datetime  # Automatically handles timezone

# TypeScript
type Timestamp = string;  // ISO 8601 format
// or use Date object and convert
```

### Dates (without time)
- **Database Type**: `DATE`
- **Format**: YYYY-MM-DD
- **Use for**: birthdays, expiry dates

### Time Windows
- **Database Type**: `JSON`
- **Structure**: `{"from": "ISO8601", "to": "ISO8601"}`
- **Example**: 
```json
{
  "from": "2024-01-26T14:00:00+06:00",
  "to": "2024-01-26T16:00:00+06:00"
}
```

## Boolean Standards

### Flags
- **Database Type**: `BOOLEAN`
- **Default values**: Always specify (usually `false`)
- **Naming**: Use `is_` or `has_` prefix
- **Examples**: is_active, has_issue, is_reserved

## JSON Standards

### Structured Data
- **Database Type**: `JSON` or `JSONB` (PostgreSQL)
- **Validation**: Define schema in application code
- **Use cases**: delivery_window, preferences, metadata

## Multi-tenancy Field

### shop_id
- **Database Type**: `INTEGER NOT NULL`
- **Foreign Key**: References shops.id
- **Required**: On ALL tables except shops itself
- **Default**: Set from user context, never hardcode

## Type Mapping Table

| Business Type | PostgreSQL | SQLite | Pydantic | TypeScript | JSON |
|--------------|------------|---------|----------|------------|------|
| Phone | VARCHAR(20) | TEXT | constr(regex) | string | string |
| Money | DECIMAL(10,2) | REAL | Decimal | number | number |
| Timestamp | TIMESTAMPTZ | TEXT | datetime | Date/string | string |
| Date | DATE | TEXT | date | string | string |
| Status | VARCHAR(20) | TEXT | Enum | union type | string |
| Quantity | INTEGER | INTEGER | int (>=0) | number | number |
| Flag | BOOLEAN | INTEGER | bool | boolean | boolean |
| Description | TEXT | TEXT | str | string | string |
| JSON data | JSONB | TEXT | dict/BaseModel | object | object |

## Validation Examples

### Complete Order Model Example

```python
# Pydantic Schema
class OrderCreate(BaseModel):
    # Customer info
    customer_phone: constr(regex=r'^\+7\d{10}$')
    recipient_phone: Optional[constr(regex=r'^\+7\d{10}$')]
    recipient_name: constr(min_length=1, max_length=255, strip_whitespace=True)
    
    # Delivery
    address: constr(min_length=10)
    delivery_method: Literal["delivery", "self_pickup"]
    delivery_window: Dict[str, datetime]
    
    # Money - using Decimal for precision
    flower_sum: condecimal(max_digits=10, decimal_places=2, ge=0)
    delivery_fee: condecimal(max_digits=10, decimal_places=2, ge=0) = Decimal('0')
    
    # Computed field
    @property
    def total(self) -> Decimal:
        return self.flower_sum + self.delivery_fee
```

```typescript
// TypeScript Interface
interface OrderCreate {
  // Customer info
  customer_phone: `+7${string}`;
  recipient_phone?: `+7${string}`;
  recipient_name: string;
  
  // Delivery
  address: string;
  delivery_method: "delivery" | "self_pickup";
  delivery_window: {
    from: string;  // ISO 8601
    to: string;    // ISO 8601
  };
  
  // Money - always 2 decimal places
  flower_sum: number;
  delivery_fee: number;
  total: number;
}
```

## Migration to Correct Types

### SQL Migration Example
```sql
-- Fix money types
ALTER TABLE orders 
  ALTER COLUMN flower_sum TYPE DECIMAL(10,2),
  ALTER COLUMN delivery_fee TYPE DECIMAL(10,2),
  ALTER COLUMN total TYPE DECIMAL(10,2);

ALTER TABLE products
  ALTER COLUMN cost_price TYPE DECIMAL(10,2),
  ALTER COLUMN retail_price TYPE DECIMAL(10,2),
  ALTER COLUMN sale_price TYPE DECIMAL(10,2);

-- Standardize phone columns
ALTER TABLE orders
  ALTER COLUMN customer_phone TYPE VARCHAR(20),
  ALTER COLUMN recipient_phone TYPE VARCHAR(20),
  ALTER COLUMN courier_phone TYPE VARCHAR(20);

-- Add check constraints
ALTER TABLE orders 
  ADD CONSTRAINT check_phone_format 
  CHECK (customer_phone ~ '^\+7\d{10}$');
```

## Best Practices

1. **Always validate at multiple levels**:
   - Database constraints
   - Pydantic schemas
   - Frontend validation

2. **Money handling**:
   - Store as cents/kopecks if needed
   - Always use Decimal in Python
   - Round at display time only

3. **Timezone handling**:
   - Store in UTC internally
   - Convert to Asia/Almaty for display
   - Include timezone in API responses

4. **Phone number formatting**:
   - Store normalized (+7...)
   - Format for display only
   - Validate before storage

5. **Null vs Empty String**:
   - Use NULL for "no value"
   - Empty string only for "explicitly empty"
   - Be consistent per field type

## Common Mistakes to Avoid

1. ❌ Using FLOAT for money
2. ❌ Storing phones with formatting
3. ❌ Timestamps without timezone
4. ❌ Hardcoding shop_id
5. ❌ Enum fields > 20 characters
6. ❌ JSON without schema validation
7. ❌ Mixing NULL and empty strings
8. ❌ Forgetting default values for booleans

## Testing Data Types

```python
# Test data generator
def generate_test_phone():
    return f"+7{random.randint(7000000000, 7999999999)}"

def generate_test_money():
    return Decimal(f"{random.randint(100, 100000)}.{random.randint(0, 99):02d}")

def generate_test_timestamp():
    return datetime.now(timezone.utc).replace(microsecond=0)
```

This standardization ensures data integrity and consistency across all system components.