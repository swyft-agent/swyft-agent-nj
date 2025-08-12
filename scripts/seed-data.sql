-- Insert sample admin user (you'll need to sign up first to get the UUID)
-- This is just an example - replace with actual user ID after signup
INSERT INTO public.users (id, email, company_name, contact_name, phone, role) VALUES
('00000000-0000-0000-0000-000000000000', 'admin@swyft.com', 'Swyft Admin', 'Admin User', '+254 700 000 000', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Insert sample listings
INSERT INTO public.listings (user_id, title, location, units, property_type, description, status) VALUES
('00000000-0000-0000-0000-000000000000', 'Skyline Apartments', 'Downtown, Nairobi', 24, 'Apartment', 'Modern apartments in the heart of the city', 'active'),
('00000000-0000-0000-0000-000000000000', 'Parkview Heights', 'Westlands, Nairobi', 16, 'Condo', 'Luxury condos with park views', 'active'),
('00000000-0000-0000-0000-000000000000', 'Riverside Condos', 'Riverside, Nairobi', 12, 'Condo', 'Waterfront living at its finest', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample tenants
INSERT INTO public.tenants (user_id, name, email, phone, building, unit, move_in_date, lease_end_date, status, rent_status) VALUES
('00000000-0000-0000-0000-000000000000', 'John Smith', 'john.smith@email.com', '+254 700 123 456', 'Skyline Apartments', '302', '2023-01-15', '2024-01-15', 'active', 'current'),
('00000000-0000-0000-0000-000000000000', 'Sarah Johnson', 'sarah.j@email.com', '+254 700 234 567', 'Parkview Heights', '105', '2023-03-01', '2024-03-01', 'active', 'current'),
('00000000-0000-0000-0000-000000000000', 'Michael Brown', 'm.brown@email.com', '+254 700 345 678', 'Riverside Condos', '201', '2022-12-01', '2023-12-01', 'active', 'late')
ON CONFLICT DO NOTHING;

-- Insert sample notices
INSERT INTO public.notices (user_id, tenant_name, property, unit, type, date, status) VALUES
('00000000-0000-0000-0000-000000000000', 'John Smith', 'Skyline Apartments', '302', 'move-out', '2025-07-15', 'pending'),
('00000000-0000-0000-0000-000000000000', 'Sarah Johnson', 'Parkview Heights', '105', 'move-in', '2025-06-20', 'approved')
ON CONFLICT DO NOTHING;

-- Insert sample inquiries
INSERT INTO public.inquiries (user_id, tenant_name, property, unit, issue, status, last_message, unread) VALUES
('00000000-0000-0000-0000-000000000000', 'John Smith', 'Skyline Apartments', '302', 'Maintenance', 'open', 'Hi, the kitchen sink is leaking. Can someone come take a look?', true),
('00000000-0000-0000-0000-000000000000', 'Sarah Johnson', 'Parkview Heights', '105', 'Lease', 'open', 'I would like to discuss extending my lease for another 6 months.', false)
ON CONFLICT DO NOTHING;

-- Insert sample transactions
INSERT INTO public.transactions (user_id, description, amount, type, status, commission) VALUES
('00000000-0000-0000-0000-000000000000', 'Move service - Skyline Apartments', 15000.00, 'revenue', 'completed', 1500.00),
('00000000-0000-0000-0000-000000000000', 'Move service - Parkview Heights', 22000.00, 'revenue', 'completed', 2200.00),
('00000000-0000-0000-0000-000000000000', 'Move service - Riverside Condos', 18000.00, 'revenue', 'pending', 1800.00)
ON CONFLICT DO NOTHING;
