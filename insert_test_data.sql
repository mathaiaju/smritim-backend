-- Insert test SQL (simplified)
INSERT INTO users (id, phone, full_name, locale, emergency_contact, created_at) VALUES
(1, '9999000001', 'Aju Mathew', 'ml', '9999111111', NOW()),
(2, '9999000002', 'Diya Joseph', 'ml', '9999222222', NOW()),
(3, '9999000003', 'Rishika Das', 'en', '9999333333', NOW());

-- medications
INSERT INTO medications (id, user_id, drug_name_generic, drug_name_brand, dose, schedule_time, indication, start_date) VALUES
(1,1,'Lithium Carbonate','Lithosun','300 mg','08:00:00','Bipolar Disorder','2025-09-01'),
(2,1,'Olanzapine','Olanex','5 mg','21:00:00','Bipolar Disorder','2025-09-01');