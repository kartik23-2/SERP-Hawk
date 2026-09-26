-- Seed Data for AI-Powered Two-Way Calling Agent

-- 1. Insert Initial Customers
INSERT INTO customers (id, name, phone_number, email, company_name, purpose, product, notes) VALUES
(1, 'Rahul Kumar', '+919876543210', 'rahul.kumar@grandhotel.com', 'Grand Hotel Bangalore', 'Product enquiry', 'Commercial RO System', 'Looking for RO system for hotel project'),
(2, 'Priya Sharma', '+919812345678', 'priya@techparkcanteen.in', 'Tech Park Canteen', 'Price quotation', 'Industrial RO Plant', 'Needs quotation for 1000 LPH system'),
(3, 'Amit Patel', '+919711223344', 'amit@patelfarms.com', 'Patel Dairy & Farms', 'Technical consultation', '500 LPH RO Unit', 'Inquiring about filtration stages'),
(4, 'Sneha Reddy', '+919655443322', 'sneha@reddyhospitals.org', 'Reddy Hospital Group', 'Product enquiry', 'Commercial RO System', 'Hospital drinking water project'),
(5, 'Vikram Singh', '+919544332211', 'vikram@singhmills.co.in', 'Singh Textile Mills', 'Urgent enquiry', 'High Capacity RO Plant', 'Industrial wastewater treatment');

-- Reset auto-increment sequence
ALTER SEQUENCE customers_id_seq RESTART WITH 6;

-- 2. Insert Sample Calls
INSERT INTO calls (id, customer_id, phone_number, direction, status, outcome, start_time, end_time, duration_seconds, failure_reason) VALUES
('call_demo_001', 1, '+919876543210', 'OUTBOUND', 'COMPLETED', 'INTERESTED', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour 55 minutes', 272, NULL),
('call_demo_002', 2, '+919812345678', 'OUTBOUND', 'COMPLETED', 'FOLLOW_UP_REQUIRED', CURRENT_TIMESTAMP - INTERVAL '5 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours 56 minutes', 220, NULL),
('call_demo_003', 3, '+919711223344', 'OUTBOUND', 'FAILED', 'FAILED', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day', 0, 'Customer did not answer (No Answer)'),
('call_demo_004', 4, '+919655443322', 'OUTBOUND', 'COMPLETED', 'INTERESTED', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '4 minutes', 245, NULL),
('call_demo_005', 5, '+919544332211', 'OUTBOUND', 'COMPLETED', 'NOT_INTERESTED', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '1 minute', 65, NULL);

-- 3. Insert Call Transcripts for Call 1 (Rahul Kumar)
INSERT INTO call_transcripts (call_id, speaker, message, timestamp) VALUES
('call_demo_001', 'AI', 'Hello Rahul! This is HawkAI calling regarding your product enquiry for a Commercial RO System. Is now a good time to speak?', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('call_demo_001', 'CUSTOMER', 'Yes, sure. I am looking for a commercial RO system for my hotel in Bangalore.', CURRENT_TIMESTAMP - INTERVAL '1 hour 59 minutes'),
('call_demo_001', 'AI', 'Great! I can certainly assist with that. Approximately how many litres per hour capacity are you looking for?', CURRENT_TIMESTAMP - INTERVAL '1 hour 58 minutes'),
('call_demo_001', 'CUSTOMER', 'Around 500 LPH capacity.', CURRENT_TIMESTAMP - INTERVAL '1 hour 57 minutes'),
('call_demo_001', 'AI', 'Understood, 500 LPH. You mentioned this is for a hotel. Is it primarily for drinking water or general kitchen and boiler usage?', CURRENT_TIMESTAMP - INTERVAL '1 hour 57 minutes'),
('call_demo_001', 'CUSTOMER', 'It is for kitchen, dining area drinking water, and guest room supply.', CURRENT_TIMESTAMP - INTERVAL '1 hour 56 minutes'),
('call_demo_001', 'AI', 'Got it. Do you have a specific budget range or purchase timeline in mind for this installation?', CURRENT_TIMESTAMP - INTERVAL '1 hour 56 minutes'),
('call_demo_001', 'CUSTOMER', 'Our budget is around 1 Lakh rupees, and we need it installed within 1 month.', CURRENT_TIMESTAMP - INTERVAL '1 hour 55 minutes'),
('call_demo_001', 'AI', 'Perfect, Rahul! I have noted all your details: 500 LPH Commercial RO System for your hotel in Bangalore with a budget of ₹1,00,000 and a 1-month timeline. Our sales engineer will send over a detailed technical quote shortly. Thank you!', CURRENT_TIMESTAMP - INTERVAL '1 hour 55 minutes');

-- Transcripts for Call 2 (Priya Sharma)
INSERT INTO call_transcripts (call_id, speaker, message, timestamp) VALUES
('call_demo_002', 'AI', 'Hello Priya! Calling from SERP Hawk regarding your enquiry for an Industrial RO Plant. How can I help you today?', CURRENT_TIMESTAMP - INTERVAL '5 hours'),
('call_demo_002', 'CUSTOMER', 'Hi, we need a quotation for a 1000 LPH RO plant for our canteen in Electronic City, Bangalore.', CURRENT_TIMESTAMP - INTERVAL '4 hours 59 minutes'),
('call_demo_002', 'AI', 'Thank you Priya. What is your estimated timeline for finalizing the supplier?', CURRENT_TIMESTAMP - INTERVAL '4 hours 58 minutes'),
('call_demo_002', 'CUSTOMER', 'We need quotes by next week to present to management.', CURRENT_TIMESTAMP - INTERVAL '4 hours 57 minutes'),
('call_demo_002', 'AI', 'Understood. I will flag this for urgent follow-up with our enterprise sales manager.', CURRENT_TIMESTAMP - INTERVAL '4 hours 56 minutes');

-- 4. Insert Call Summaries
INSERT INTO call_summaries (call_id, customer_name, requirement, capacity, location, application, budget, timeline, lead_status, follow_up_required, follow_up_notes, key_requirements, customer_intent, important_points, call_outcome, summary_text) VALUES
('call_demo_001', 'Rahul Kumar', 'Commercial RO System', '500 LPH', 'Bangalore', 'Hotel (Kitchen & Guest Drinking Water)', '₹1,00,000', 'Within 1 month', 'Hot', TRUE, 'Send formal PDF quote and arrange technical site visit within 2 days.', 'Needs 500 LPH stainless steel skid-mounted Commercial RO with multi-stage filtration.', 'High intent to purchase within 30 days.', 'Customer confirmed location in Bangalore and budget cap at ₹1 Lakh.', 'Customer confirmed interest in 500 LPH unit. Requested quotation.', 'Customer Rahul Kumar is looking for a 500 LPH Commercial RO system for a hotel in Bangalore with a budget of ₹1,00,000 and timeline within 1 month.'),

('call_demo_002', 'Priya Sharma', 'Industrial RO Plant', '1000 LPH', 'Electronic City, Bangalore', 'Tech Park Canteen', '₹2,50,000', 'Within 2 weeks', 'Warm', TRUE, 'Prepare official enterprise quote for management review by Monday.', '1000 LPH high capacity plant for commercial kitchen use.', 'Active evaluation of vendors.', 'Management approval required.', 'Follow-up requested with quote.', 'Customer requires official commercial quotation for 1000 LPH Industrial RO Plant for tech park canteen by next week.');
