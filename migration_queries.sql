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
