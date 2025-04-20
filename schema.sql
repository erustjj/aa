-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL, -- In a real application, this would be hashed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Insert sample users (Passwords should be hashed in a real app)
INSERT INTO users (username, password) VALUES
    ('AKARAL', 'AKARAL01*'),
    ('BUNYAMIN', 'BUNYAMIN123*'),
    ('IYILDIZHAN', 'IYILDIZHAN123*');

-- Product groups table
CREATE TABLE product_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Insert sample product groups
INSERT INTO product_groups (name) VALUES
    ('CLUB CARCARRY ALL'),
    ('ILACLAR'),
    ('GUBRELER'),
    ('HORTUMLAR');

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id INTEGER REFERENCES product_groups(id),
    stock_code VARCHAR(50) UNIQUE NOT NULL,
    material_name_1 VARCHAR(200) NOT NULL,
    unit_of_measure VARCHAR(20) NOT NULL,
    serial_number VARCHAR(50),
    material_name_2 VARCHAR(200),
    current_stock DECIMAL(12, 3) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Create index for faster product searches
CREATE INDEX idx_products_stock_code ON products(stock_code);
CREATE INDEX idx_products_material_name_1 ON products(material_name_1);
CREATE INDEX idx_products_serial_number ON products(serial_number);

-- Insert sample products
INSERT INTO products (group_id, stock_code, material_name_1, unit_of_measure, serial_number, material_name_2, current_stock) VALUES
    ((SELECT id FROM product_groups WHERE name = 'CLUB CARCARRY ALL'), '500200010', '103974802 PEDAL KİTİ', 'ADET', '103974802', 'PEDAL KİTİ', 1),
    ((SELECT id FROM product_groups WHERE name = 'CLUB CARCARRY ALL'), '500200011', '1016341 TRANSMISSION SHIFT LEV', 'ADET', '1016341', 'VİTES KOLU ŞANZIMAN TARAFI', 2),
    ((SELECT id FROM product_groups WHERE name = 'ILACLAR'), '500200012', 'BAHÇE İLACI', 'LT', '102515401', 'BAHCE İLAC', 1.736),
    ((SELECT id FROM product_groups WHERE name = 'GUBRELER'), '500200013', 'GUBRE', 'KG', '103833601', 'GUBRE', 2.70),
    ((SELECT id FROM product_groups WHERE name = 'HORTUMLAR'), '500200014', 'BUYUK HORTUM', 'MT', '4747546', 'HORTUM', 1.86);

-- Departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Insert sample departments
INSERT INTO departments (name) VALUES
    ('BAHÇE'),
    ('BAKIM'),
    ('SULAMA'),
    ('YÖNETİM'),
    ('MUHASEBE');

-- Transfers table (header)
CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id INTEGER REFERENCES departments(id) NOT NULL,
    transfer_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Transfer details table
CREATE TABLE transfer_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID REFERENCES transfers(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity DECIMAL(12, 3) NOT NULL,
    stock_before_transfer DECIMAL(12, 3) NOT NULL
);

-- Purchases table (header)
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Purchase details table
CREATE TABLE purchase_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    quantity DECIMAL(12, 3) NOT NULL,
    stock_before_purchase DECIMAL(12, 3) NOT NULL
);

-- Inventory counts table (header)
CREATE TABLE inventory_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    count_name VARCHAR(200) NOT NULL,
    count_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Inventory count details table
CREATE TABLE inventory_count_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_count_id UUID REFERENCES inventory_counts(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    previous_quantity DECIMAL(12, 3) NOT NULL,
    counted_quantity DECIMAL(12, 3) NOT NULL
);

-- Create a view for easier reporting on transfers
CREATE VIEW transfer_view AS
SELECT
    t.id as transfer_id,
    t.transfer_date,
    t.description,
    d.name as department_name,
    u.username as created_by_user,
    t.created_at,
    p.stock_code,
    pg.name as product_group,
    p.material_name_1,
    p.material_name_2,
    p.unit_of_measure,
    p.serial_number,
    td.quantity as transferred_quantity,
    td.stock_before_transfer
FROM transfers t
JOIN departments d ON t.department_id = d.id
JOIN users u ON t.created_by = u.id
JOIN transfer_details td ON t.id = td.transfer_id
JOIN products p ON td.product_id = p.id
JOIN product_groups pg ON p.group_id = pg.id;

-- Create a view for easier reporting on purchases
CREATE VIEW purchase_view AS
SELECT
    pu.id as purchase_id,
    pu.purchase_date,
    pu.description,
    u.username as created_by_user,
    pu.created_at,
    p.stock_code,
    pg.name as product_group,
    p.material_name_1,
    p.material_name_2,
    p.unit_of_measure,
    p.serial_number,
    pd.quantity as purchased_quantity,
    pd.stock_before_purchase
FROM purchases pu
JOIN users u ON pu.created_by = u.id
JOIN purchase_details pd ON pu.id = pd.purchase_id
JOIN products p ON pd.product_id = p.id
JOIN product_groups pg ON p.group_id = pg.id;

-- Create a view for easier reporting on inventory counts
CREATE VIEW inventory_count_view AS
SELECT
    ic.id as count_id,
    ic.count_name,
    ic.count_date,
    ic.description,
    u.username as created_by_user,
    ic.created_at,
    p.stock_code,
    pg.name as product_group,
    p.material_name_1,
    p.material_name_2,
    p.unit_of_measure,
    p.serial_number,
    icd.previous_quantity,
    icd.counted_quantity,
    (icd.counted_quantity - icd.previous_quantity) as quantity_difference
FROM inventory_counts ic
JOIN users u ON ic.created_by = u.id
JOIN inventory_count_details icd ON ic.id = icd.inventory_count_id
JOIN products p ON icd.product_id = p.id
JOIN product_groups pg ON p.group_id = pg.id;

-- Function to update product stock after a transfer
CREATE OR REPLACE FUNCTION update_stock_after_transfer()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET
        current_stock = current_stock - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
        -- Consider adding updated_by = current_user or similar if needed
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock after transfer
CREATE TRIGGER trigger_update_stock_after_transfer
AFTER INSERT ON transfer_details
FOR EACH ROW
EXECUTE FUNCTION update_stock_after_transfer();

-- Function to update product stock after a purchase
CREATE OR REPLACE FUNCTION update_stock_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET
        current_stock = current_stock + NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
        -- Consider adding updated_by
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock after purchase
CREATE TRIGGER trigger_update_stock_after_purchase
AFTER INSERT ON purchase_details
FOR EACH ROW
EXECUTE FUNCTION update_stock_after_purchase();

-- Function to update product stock after inventory count
CREATE OR REPLACE FUNCTION update_stock_after_inventory_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET
        current_stock = NEW.counted_quantity,
        updated_at = CURRENT_TIMESTAMP
        -- Consider adding updated_by
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock after inventory count
CREATE TRIGGER trigger_update_stock_after_inventory_count
AFTER INSERT ON inventory_count_details
FOR EACH ROW
EXECUTE FUNCTION update_stock_after_inventory_count();

-- Create function to record stock history
CREATE TABLE stock_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) NOT NULL,
    operation_type VARCHAR(50) NOT NULL, -- 'TRANSFER', 'PURCHASE', 'INVENTORY_COUNT', 'MANUAL_ADJUSTMENT'
    reference_id UUID, -- ID of the transfer, purchase, or inventory count (can be NULL for manual adjustments)
    previous_stock DECIMAL(12, 3) NOT NULL,
    new_stock DECIMAL(12, 3) NOT NULL,
    change_amount DECIMAL(12, 3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) -- User performing the action
);

-- Create indexes for stock history
CREATE INDEX idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX idx_stock_history_operation_type ON stock_history(operation_type);
CREATE INDEX idx_stock_history_created_at ON stock_history(created_at);

-- Note: You might want functions/triggers to automatically populate stock_history
-- upon inserts into transfer_details, purchase_details, inventory_count_details.
-- This requires capturing the 'before' stock value accurately within the transaction.
