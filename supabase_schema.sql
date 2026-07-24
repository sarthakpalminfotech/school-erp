-- SQL script for setting up the NexAir Database on Supabase
-- Run this in the Supabase SQL Editor.

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist to avoid conflict (in case of re-run)
DROP TABLE IF EXISTS timeline_logs CASCADE;
DROP TABLE IF EXISTS service_reports CASCADE;
DROP TABLE IF EXISTS service_cycles CASCADE;
DROP TABLE IF EXISTS payment_entries CASCADE;
DROP TABLE IF EXISTS payment_ledgers CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS product_master CASCADE;
DROP TABLE IF EXISTS parts_master CASCADE;
DROP TABLE IF EXISTS supplier_master CASCADE;
DROP TABLE IF EXISTS employee_master CASCADE;
DROP TABLE IF EXISTS cities CASCADE;

-- 1. Cities
CREATE TABLE cities (
    name VARCHAR(100) PRIMARY KEY
);

-- 2. Employee Master
CREATE TABLE employee_master (
    name VARCHAR(150) PRIMARY KEY,
    initials VARCHAR(10),
    role VARCHAR(50),
    contact VARCHAR(50),
    city VARCHAR(100) REFERENCES cities(name) ON DELETE SET NULL,
    tone VARCHAR(100) NOT NULL DEFAULT 'bg-teal-100 text-teal-800',
    permissions JSONB DEFAULT '{}'::jsonb
);

-- 3. Supplier Master
CREATE TABLE supplier_master (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    contact VARCHAR(50),
    city VARCHAR(100) REFERENCES cities(name) ON DELETE SET NULL
);

-- 4. Parts Master
CREATE TABLE parts_master (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- 5. Product Master
CREATE TABLE product_master (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    model VARCHAR(100),
    hp INTEGER,
    price NUMERIC(12, 2) DEFAULT 0.00
);

-- 6. Inventory Spare Parts
CREATE TABLE inventory (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    threshold INTEGER NOT NULL DEFAULT 0
);

-- 7. Customers
CREATE TABLE customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    city VARCHAR(100) REFERENCES cities(name) ON DELETE SET NULL,
    address TEXT,
    gst_number VARCHAR(50)
);

-- 8. Leads
CREATE TABLE leads (
    id VARCHAR(50) PRIMARY KEY,
    company VARCHAR(200) NOT NULL,
    contact VARCHAR(150),
    phone VARCHAR(50),
    salesperson VARCHAR(150),
    address TEXT,
    city VARCHAR(100) REFERENCES cities(name) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('In Process', 'Unavailable', 'Postponed', 'Lost', 'Disqualified', 'Win', 'Converted')),
    status_reason TEXT,
    follow_up_date TIMESTAMPTZ,
    products_selected JSONB DEFAULT '[]'::jsonb,
    gst_number VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8b. Visits
CREATE TABLE visits (
    id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    city VARCHAR(100) REFERENCES cities(name) ON DELETE SET NULL,
    address TEXT,
    branch VARCHAR(150),
    products_selected JSONB DEFAULT '[]'::jsonb,
    salesperson VARCHAR(150),
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

-- 9. Notes (linked to Leads, Orders or Visits)
CREATE TABLE notes (
    id VARCHAR(100) PRIMARY KEY,
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE CASCADE,
    order_id VARCHAR(50), -- Can be linked to order too
    visit_id VARCHAR(50) REFERENCES visits(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    photo TEXT,
    voice_note TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    username VARCHAR(150) NOT NULL
);


-- 10. Orders
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE SET NULL,
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    salesperson VARCHAR(150),
    city VARCHAR(100) REFERENCES cities(name) ON DELETE SET NULL,
    status VARCHAR(100) NOT NULL CHECK (status IN ('Payment Pending', 'Order Placed with Supplier', 'Commissioning Pending', 'Commissioned/Completed')),
    commissioned_date TIMESTAMPTZ,
    delivery_date TIMESTAMPTZ,
    owner_reschedule_alert BOOLEAN DEFAULT FALSE,
    engineer_reschedule_alert BOOLEAN DEFAULT FALSE,
    engineer_assign_alert BOOLEAN DEFAULT FALSE,
    products_selected JSONB DEFAULT '[]'::jsonb,
    order_value NUMERIC(12, 2) DEFAULT 0.00,
    gst_number VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Quotations
CREATE TABLE quotations (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Technical', 'Bank', 'Service')),
    uploaded_by VARCHAR(150) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved BOOLEAN NOT NULL DEFAULT FALSE
);

-- 12. Complaints
CREATE TABLE complaints (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    city VARCHAR(100) REFERENCES cities(name) ON DELETE SET NULL,
    issue TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Open', 'Assigned', 'In Progress', 'Resolved/Closed', 'Reopened')),
    assigned_engineer VARCHAR(150),
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Payment Ledgers (Overall Status)
CREATE TABLE payment_ledgers (
    order_id VARCHAR(50) PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    is_complete BOOLEAN NOT NULL DEFAULT FALSE
);

-- 14. Payment Entries
CREATE TABLE payment_entries (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT
);

-- 15. Service Cycles
CREATE TABLE service_cycles (
    order_id VARCHAR(50) PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    commissioned_date TIMESTAMPTZ NOT NULL,
    last_checkup_date DATE,
    next_checkup_date DATE NOT NULL,
    last_major_service_date DATE,
    next_major_service_date DATE,
    current_hour_meter INTEGER NOT NULL DEFAULT 0,
    last_hour_meter INTEGER NOT NULL DEFAULT 0,
    assigned_checkup_engineer VARCHAR(150),
    assigned_major_engineer VARCHAR(150)
);

-- 16. Service Reports (Checkups & Pre/Post Services)
CREATE TABLE service_reports (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Checkup', 'Pre-Service', 'Post-Service')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by VARCHAR(150) NOT NULL
);

-- 17. Timeline Logs
CREATE TABLE timeline_logs (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    username VARCHAR(150) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==========================================
-- SEED DATA INSERTIONS
-- ==========================================

-- 1. Cities
INSERT INTO cities (name) VALUES
('Ahmedabad'), ('Surat'), ('Vadodara'), ('Rajkot'), ('Gandhinagar'), ('Morbi'), ('Bhavnagar'), ('Jamnagar');

-- 2. Employees
INSERT INTO employee_master (name, initials, role, contact, city, tone) VALUES
('Karan Desai', 'KD', 'Owner', '+91 98980 12345', 'Ahmedabad', 'bg-teal-100 text-teal-800'),
('Aarav Shah', 'AS', 'Sales Person', '+91 98765 11120', 'Ahmedabad', 'bg-orange-100 text-orange-800'),
('Ishita Mehta', 'IM', 'Sales Person', '+91 98980 44563', 'Surat', 'bg-violet-100 text-violet-800'),
('Dhruv Patel', 'DP', 'Service Engineer', '+91 98254 88532', 'Vadodara', 'bg-sky-100 text-sky-800'),
('Nisha Shah', 'NS', 'Receptionist', '+91 99250 77310', 'Ahmedabad', 'bg-emerald-100 text-emerald-800'),
('Rajesh Varma', 'RV', 'Service Engineer', '+91 98760 98760', 'Rajkot', 'bg-pink-100 text-pink-800');

-- 3. Suppliers
INSERT INTO supplier_master (id, name, contact, city) VALUES
('S-201', 'Atlas Supply Co.', '+91 99887 76655', 'Ahmedabad'),
('S-202', 'Western Industrial Spares', '+91 97766 55443', 'Surat'),
('S-203', 'Elite Compressors India', '+91 96655 44332', 'Vadodara');

-- 4. Parts Master
INSERT INTO parts_master (id, name, price) VALUES
('PT-01', 'Air Filter Element', 1200.00),
('PT-02', 'Compressor Oil (20L)', 3500.00),
('PT-03', 'Pressure Switch', 850.00),
('PT-04', 'Oil Filter Element', 1100.00),
('PT-05', 'Separator Kit', 4200.00);

-- 5. Product Master
INSERT INTO product_master (id, name, model, hp, price) VALUES
('P-101', 'Rotary Screw Compressor', 'NexAir-30HP', 30, 345000.00),
('P-102', 'Rotary Screw Compressor', 'NexAir-50HP', 50, 480000.00),
('P-103', 'Air Dryer', 'DryAir-100', 2, 85000.00),
('P-104', 'Piston Compressor', 'Recip-10HP', 10, 120000.00);

-- 6. Inventory
INSERT INTO inventory (id, name, quantity, threshold) VALUES
('PT-01', 'Air Filter Element', 18, 5),
('PT-02', 'Compressor Oil (20L)', 4, 3),
('PT-03', 'Pressure Switch', 2, 4),
('PT-04', 'Oil Filter Element', 12, 5),
('PT-05', 'Separator Kit', 3, 3);

-- 7. Customers
INSERT INTO customers (id, name, contact_person, phone, city, address) VALUES
('C-1001', 'Apex Process Equipments', 'Rohan Patel', '+91 98765 44120', 'Ahmedabad', 'GIDC Vatva, Phase III, Ahmedabad'),
('C-1002', 'Saffron Foods Pvt. Ltd.', 'Meera Joshi', '+91 98254 20911', 'Vadodara', 'Makarpura GIDC, Vadodara'),
('C-1003', 'Orbit Engineering', 'Naman Shah', '+91 97254 81730', 'Rajkot', 'Aji Industrial Area, Rajkot');

-- 8. Leads
INSERT INTO leads (id, company, contact, phone, salesperson, address, city, status, status_reason, follow_up_date, created_at, updated_at) VALUES
('L-1048', 'Apex Process Equipments', 'Rohan Patel', '+91 98765 44120', 'Aarav Shah', 'GIDC Vatva, Phase III, Ahmedabad', 'Ahmedabad', 'Postponed', NULL, NOW() + INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '12 minutes'),
('L-1047', 'Saffron Foods Pvt. Ltd.', 'Meera Joshi', '+91 98254 20911', 'Aarav Shah', 'Makarpura GIDC, Vadodara', 'Vadodara', 'In Process', NULL, NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour'),
('L-1046', 'Nexus Plastics', 'Ketan Patel', '+91 98983 31544', 'Ishita Mehta', 'Sachin GIDC, Surat', 'Surat', 'Postponed', NULL, NOW() + INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
('L-1045', 'Orbit Engineering', 'Naman Shah', '+91 97254 81730', 'Ishita Mehta', 'Aji Industrial Area, Rajkot', 'Rajkot', 'Win', NULL, NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days'),
('L-1044', 'Mitra Ceramics', 'Hemal Vora', '+91 99049 22890', 'Aarav Shah', 'Lakhdhirpur Road, Morbi', 'Morbi', 'Lost', 'Price was too high compared to local assembler.', NULL, NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days');

-- 9. Notes
INSERT INTO notes (id, lead_id, order_id, text, photo, voice_note, timestamp, username) VALUES
('n-1', 'L-1048', NULL, 'Customer interested in 30HP compressor.', NULL, NULL, NOW() - INTERVAL '3 days', 'Aarav Shah');

-- 10. Orders
INSERT INTO orders (id, lead_id, customer_id, company_name, salesperson, city, status, commissioned_date, created_at, updated_at) VALUES
('ORD-5001', 'L-1045', 'C-1003', 'Orbit Engineering', 'Ishita Mehta', 'Rajkot', 'Commissioned/Completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '35 days', NOW() - INTERVAL '30 days'),
('ORD-5002', 'L-1047', 'C-1002', 'Saffron Foods Pvt. Ltd.', 'Aarav Shah', 'Vadodara', 'Payment Pending', NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days');

-- 11. Quotations
INSERT INTO quotations (id, order_id, file_name, file_size, type, uploaded_by, uploaded_at, approved) VALUES
('q-1', 'ORD-5001', 'Technical_Quotation_Orbit.pdf', '1.2 MB', 'Technical', 'Nisha Shah', NOW() - INTERVAL '30 days', TRUE),
('q-2', 'ORD-5001', 'Bank_Quotation_Orbit.pdf', '1.5 MB', 'Bank', 'Nisha Shah', NOW() - INTERVAL '28 days', TRUE),
('q-3', 'ORD-5002', 'Technical_Quotation_Saffron.pdf', '980 KB', 'Technical', 'Nisha Shah', NOW() - INTERVAL '5 days', TRUE);

-- 12. Complaints
INSERT INTO complaints (id, order_id, company_name, city, issue, status, assigned_engineer, assigned_at, resolved_at, resolved_by, created_at, updated_at) VALUES
('COMP-7001', 'ORD-5001', 'Orbit Engineering', 'Rajkot', 'High temperature alarm sounding intermittently.', 'Assigned', 'Rajesh Varma', NOW() - INTERVAL '1 day', NULL, NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('COMP-7002', 'ORD-5001', 'Orbit Engineering', 'Rajkot', 'Oil leakage from secondary valve.', 'Resolved/Closed', 'Rajesh Varma', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', 'Rajesh Varma', NOW() - INTERVAL '16 days', NOW() - INTERVAL '14 days');

-- 13. Payment Ledgers
INSERT INTO payment_ledgers (order_id, is_complete) VALUES
('ORD-5001', TRUE),
('ORD-5002', FALSE);

-- 14. Payment Entries
INSERT INTO payment_entries (id, order_id, amount, date, note) VALUES
('pay-1', 'ORD-5001', 150000.00, (CURRENT_DATE - INTERVAL '32 days')::DATE, 'Advance booking amount'),
('pay-2', 'ORD-5001', 330000.00, (CURRENT_DATE - INTERVAL '30 days')::DATE, 'Delivery balance payment'),
('pay-3', 'ORD-5002', 100000.00, (CURRENT_DATE - INTERVAL '5 days')::DATE, 'Booking advance');

-- 15. Service Cycles
INSERT INTO service_cycles (order_id, company_name, commissioned_date, last_checkup_date, next_checkup_date, last_major_service_date, next_major_service_date, current_hour_meter, last_hour_meter) VALUES
('ORD-5001', 'Orbit Engineering', NOW() - INTERVAL '30 days', NULL, (CURRENT_DATE + INTERVAL '15 days')::DATE, NULL, (CURRENT_DATE + INTERVAL '150 days')::DATE, 240, 0);

-- 16. Timeline Logs
INSERT INTO timeline_logs (id, order_id, action, username, timestamp) VALUES
('log-1', 'ORD-5001', 'Order created from Lead conversion', 'Ishita Mehta', NOW() - INTERVAL '35 days'),
('log-2', 'ORD-5001', 'Technical Quotation Uploaded', 'Nisha Shah', NOW() - INTERVAL '30 days'),
('log-3', 'ORD-5001', 'Technical Quotation Approved', 'Karan Desai', NOW() - INTERVAL '29 days'),
('log-4', 'ORD-5001', 'Bank Quotation Uploaded', 'Nisha Shah', NOW() - INTERVAL '28 days'),
('log-5', 'ORD-5001', 'Bank Quotation Approved', 'Karan Desai', NOW() - INTERVAL '27 days'),
('log-6', 'ORD-5001', 'Order Commissioned - Service Cycle Day 0 Initialized', 'Dhruv Patel', NOW() - INTERVAL '30 days'),
('log-7', 'ORD-5002', 'Order Created', 'Aarav Shah', NOW() - INTERVAL '6 days');
