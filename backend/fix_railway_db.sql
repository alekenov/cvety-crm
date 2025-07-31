-- Add missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_florist_id INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_id INTEGER;

-- Add foreign key constraints
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_assigned_florist 
FOREIGN KEY (assigned_florist_id) 
REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_courier
FOREIGN KEY (courier_id) 
REFERENCES users(id) ON DELETE SET NULL;

-- Update alembic version to skip problematic migrations
INSERT INTO alembic_version (version_num) VALUES ('c3faca8869d2');
INSERT INTO alembic_version (version_num) VALUES ('50f47e5f4b7b');

-- Now we can safely set to the latest migration
UPDATE alembic_version SET version_num = '1cb156b39497' WHERE version_num = 'ff770d44ed65';
DELETE FROM alembic_version WHERE version_num != '1cb156b39497';