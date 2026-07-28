-- SQL script to apply migrations for making fields optional (nullable)
-- Run this in your Supabase SQL Editor to update your active database tables.

-- 1. Make employee_master fields optional (nullable)
ALTER TABLE employee_master ALTER COLUMN initials DROP NOT NULL;
ALTER TABLE employee_master ALTER COLUMN role DROP NOT NULL;
ALTER TABLE employee_master ALTER COLUMN contact DROP NOT NULL;

-- 2. Make supplier_master fields optional (nullable)
ALTER TABLE supplier_master ALTER COLUMN contact DROP NOT NULL;

-- 3. Make product_master fields optional (nullable)
ALTER TABLE product_master ALTER COLUMN model DROP NOT NULL;
ALTER TABLE product_master ALTER COLUMN hp DROP NOT NULL;
ALTER TABLE product_master ALTER COLUMN price DROP NOT NULL;

-- 4. Make customers fields optional (nullable)
ALTER TABLE customers ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE customers ALTER COLUMN address DROP NOT NULL;

-- 5. Make leads fields optional (nullable)
ALTER TABLE leads ALTER COLUMN address DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN phone DROP NOT NULL;

-- 6. Drop restrictive foreign keys on employee_master to allow flexible name entry
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_salesperson_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_salesperson_fkey;
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_assigned_engineer_fkey;

-- 7. Add product selection and order value columns
ALTER TABLE leads ADD COLUMN IF NOT EXISTS products_selected JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS products_selected JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_value NUMERIC(12, 2) DEFAULT 0.00;

-- 8. Add lead_id to quotations to allow attaching documents to leads
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE CASCADE;
ALTER TABLE quotations ALTER COLUMN order_id DROP NOT NULL;

-- 9. Add assigned_engineer to orders for commissioning flow
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_engineer VARCHAR(150);

-- 10. Add supplier_id and delivery_partner to orders table for order status flows
ALTER TABLE orders ADD COLUMN IF NOT EXISTS supplier_id VARCHAR(50) REFERENCES supplier_master(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_partner VARCHAR(150);

-- 11. Add gst_number to customers, leads, and orders
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);

-- 12. Add checkup and major service assignments to service_cycles
ALTER TABLE service_cycles ADD COLUMN IF NOT EXISTS assigned_checkup_engineer VARCHAR(150);
ALTER TABLE service_cycles ADD COLUMN IF NOT EXISTS assigned_major_engineer VARCHAR(150);

-- 13. Create visits table and update notes table
CREATE TABLE IF NOT EXISTS visits (
    id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    city VARCHAR(100) REFERENCES cities(name) ON DELETE SET NULL,
    address TEXT,
    branch VARCHAR(150),
    products_selected JSONB DEFAULT '[]'::jsonb,
    salesperson VARCHAR(150), -- Not foreign key, as salesperson names might be flexible
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'Pending', 
        'Started', 
        'In communication', 
        'Unavailable', 
        'Postponed', 
        'Disqualified', 
        'Convert to lead', 
        'Lost'
    )),
    scheduled_at TIMESTAMPTZ,
    start_time TIMESTAMPTZ,
    start_location JSONB,
    follow_up_date TIMESTAMPTZ,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notes ADD COLUMN IF NOT EXISTS visit_id VARCHAR(50) REFERENCES visits(id) ON DELETE CASCADE;

-- 14. Drop constraints and add new check constraints for Lead Statuses
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Update existing rows to conform to the new status constraint
UPDATE leads SET status = 'In Discussion' WHERE status = 'In Process';
UPDATE leads SET status = 'New' WHERE status = 'Postponed';
UPDATE leads SET status = 'Disqualified' WHERE status = 'Unavailable';
UPDATE leads SET status = 'New' WHERE status NOT IN ('New', 'In Quotation', 'In Discussion', 'Win', 'Lost', 'Disqualified', 'Converted');

ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (
  status IN ('New', 'In Quotation', 'In Discussion', 'Win', 'Lost', 'Disqualified', 'Converted')
);

-- 15. Add substatus and converted_at columns to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS substatus VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- 16. Create quotation_requests table to track quotation ask events and alerts
CREATE TABLE IF NOT EXISTS quotation_requests (
    id VARCHAR(100) PRIMARY KEY,
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE CASCADE,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    requested_types JSONB NOT NULL, -- e.g. ['Technical', 'Bank']
    notes TEXT,
    photo TEXT,
    voice_note TEXT,
    requested_by VARCHAR(150) NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved BOOLEAN NOT NULL DEFAULT FALSE
);


-- 17. Drop and recreate orders status check constraint to exclude 'In Process'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
UPDATE orders SET status = 'Payment Pending' WHERE status = 'In Process';
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN ('Payment Pending', 'Order Placed with Supplier', 'Commissioning Pending', 'Commissioned/Completed')
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS owner_reschedule_alert BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS engineer_reschedule_alert BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS engineer_assign_alert BOOLEAN DEFAULT FALSE;

-- 18. Ensure visits table has visit_type, order_id and service_type columns
ALTER TABLE visits ADD COLUMN IF NOT EXISTS visit_type VARCHAR(50) DEFAULT 'Sales';
ALTER TABLE visits ADD COLUMN IF NOT EXISTS order_id VARCHAR(50) REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS service_type VARCHAR(50); -- 'Checkup' or 'Major'

-- 19. Drop existing check constraint on visits table status to support 'Completed'
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_status_check;

-- 20. Re-add check constraint to allow 'Completed' status
ALTER TABLE visits ADD CONSTRAINT visits_status_check CHECK (
  status IN ('Pending', 'Started', 'In communication', 'Unavailable', 'Postponed', 'Disqualified', 'Convert to lead', 'Lost', 'Completed')
);

-- 21. Add supplier_id and started_by columns to visits table
ALTER TABLE visits ADD COLUMN IF NOT EXISTS supplier_id VARCHAR(50) REFERENCES supplier_master(id) ON DELETE SET NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS started_by VARCHAR(150);

