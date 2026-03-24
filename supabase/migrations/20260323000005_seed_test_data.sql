-- ============================================================
-- Migration: Seed test data
-- Description: Sample devotees with Hindu Telugu names and
--              donation records ($51–$3500). Truncate after testing.
-- ============================================================

-- Seed 25 devotee records
INSERT INTO devotees (first_name, last_name, name_to_acknowledge, email, phone, address_line1, city, state, zip_code) VALUES
('Srinivas',    'Reddy',        'Srinivas & Lakshmi Reddy',   'srinivas.reddy@example.com',   '972-555-0101', '1234 Oak Valley Dr',     'Plano',       'TX', '75024'),
('Lakshmi',     'Devi',         'Lakshmi Devi',                'lakshmi.devi@example.com',     '469-555-0102', '5678 Elm Creek Blvd',    'Frisco',      'TX', '75034'),
('Venkata',     'Subramaniam',  'Venkata Subramaniam Family',  'venkata.subra@example.com',    '214-555-0103', '910 Maple Ridge Ln',     'Dallas',      'TX', '75201'),
('Padmavathi',  'Naidu',        'Padmavathi Naidu',            'padma.naidu@example.com',      '972-555-0104', '2345 Willow Bend Dr',    'Plano',       'TX', '75093'),
('Ramakrishna', 'Prasad',       'Ramakrishna & Sarada Prasad', 'rk.prasad@example.com',        '469-555-0105', '6789 Pine Valley Ct',    'McKinney',    'TX', '75070'),
('Sarada',      'Prasad',       'Sarada Prasad',               'sarada.prasad@example.com',    '469-555-0106', '6789 Pine Valley Ct',    'McKinney',    'TX', '75070'),
('Raghunath',   'Sharma',       'Raghunath Sharma',            'raghu.sharma@example.com',     '972-555-0107', '111 Birch Hill Rd',      'Allen',       'TX', '75002'),
('Annapurna',   'Rao',          'Annapurna & Mohan Rao',       'annapurna.rao@example.com',    '214-555-0108', '3456 Cedar Springs Rd',  'Dallas',      'TX', '75219'),
('Mohan',       'Rao',          'Mohan Rao',                   'mohan.rao@example.com',        '214-555-0109', '3456 Cedar Springs Rd',  'Dallas',      'TX', '75219'),
('Gayathri',    'Krishna',      'Gayathri Krishna',            'gayathri.k@example.com',       '469-555-0110', '7890 Magnolia Way',      'Frisco',      'TX', '75035'),
('Venkateswara','Murthy',       'Venkateswara Murthy Family',  'venky.murthy@example.com',     '972-555-0111', '4567 Pecan Hollow Dr',   'Plano',       'TX', '75025'),
('Sarojini',    'Chowdary',     'Sarojini Chowdary',           'sarojini.ch@example.com',      '469-555-0112', '1357 Cottonwood Ln',     'Prosper',     'TX', '75078'),
('Tirumala',    'Reddy',        'Tirumala & Anjali Reddy',     'tirumala.r@example.com',       '972-555-0113', '2468 Hickory Creek Dr',  'Flower Mound','TX', '75028'),
('Anjali',      'Reddy',        'Anjali Reddy',                'anjali.reddy@example.com',     '972-555-0114', '2468 Hickory Creek Dr',  'Flower Mound','TX', '75028'),
('Narasimha',   'Varma',        'Narasimha Varma',             'narasimha.v@example.com',      '214-555-0115', '9876 Walnut Hill Ln',    'Dallas',      'TX', '75231'),
('Bhavani',     'Shankar',      'Bhavani & Shankar Family',    'bhavani.s@example.com',        '469-555-0116', '6543 Poplar Creek Rd',   'Little Elm',  'TX', '75068'),
('Shankar',     'Rao',          'Shankar Rao',                 'shankar.rao@example.com',      '469-555-0117', '6543 Poplar Creek Rd',   'Little Elm',  'TX', '75068'),
('Kamala',      'Devi',         'Kamala Devi',                 'kamala.devi@example.com',       '972-555-0118', '3210 Cypress Point Dr',  'Carrollton',  'TX', '75010'),
('Jagadish',    'Naidu',        'Jagadish Naidu',              'jagadish.n@example.com',       '214-555-0119', '7654 Sycamore Dr',       'Richardson',  'TX', '75080'),
('Tulasi',      'Goud',         'Tulasi & Ravi Goud',          'tulasi.goud@example.com',      '469-555-0120', '8765 Aspen Grove Ln',    'Murphy',      'TX', '75094'),
('Ravi',        'Goud',         'Ravi Goud',                   'ravi.goud@example.com',        '469-555-0121', '8765 Aspen Grove Ln',    'Murphy',      'TX', '75094'),
('Sumathi',     'Pillai',       'Sumathi Pillai',              'sumathi.p@example.com',        '972-555-0122', '4321 Juniper Trail',     'Wylie',       'TX', '75098'),
('Hanumantha',  'Reddy',        'Hanumantha Reddy',            'hanu.reddy@example.com',       '214-555-0123', '5432 Laurel Park Dr',    'Garland',     'TX', '75040'),
('Kalyani',     'Prasad',       'Kalyani Prasad',              'kalyani.p@example.com',        '469-555-0124', '6547 Dogwood Creek Pl',  'Sachse',      'TX', '75048'),
('Suryanarayana','Chowdary',    'Suryanarayana Chowdary',      'surya.ch@example.com',         '972-555-0125', '7658 Mimosa Ct',         'Lewisville',  'TX', '75067');

-- Seed 40 donation records spread across the 25 devotees
-- Uses a CTE to reference devotees by name for clarity
WITH d AS (
    SELECT id, first_name, last_name FROM devotees
)
INSERT INTO donations (devotee_id, amount, payment_method, instrument_number, donation_date, notes) VALUES
-- Srinivas Reddy
((SELECT id FROM d WHERE first_name='Srinivas' AND last_name='Reddy'),    501.00, 'Check',       'CHK-10234',  '2026-01-15', 'Sankranti special donation'),
((SELECT id FROM d WHERE first_name='Srinivas' AND last_name='Reddy'),    116.00, 'Zelle',       'ZEL-88421',  '2026-02-14', 'Monthly contribution'),
-- Lakshmi Devi
((SELECT id FROM d WHERE first_name='Lakshmi' AND last_name='Devi'),      251.00, 'Venmo',       'VNM-44521',  '2026-01-20', 'Pongal donation'),
-- Venkata Subramaniam
((SELECT id FROM d WHERE first_name='Venkata' AND last_name='Subramaniam'), 1001.00, 'Credit Card','TXN-99871',  '2026-01-05', 'Annual pledge - Q1'),
((SELECT id FROM d WHERE first_name='Venkata' AND last_name='Subramaniam'), 1001.00, 'Credit Card','TXN-99945',  '2026-03-05', 'Annual pledge - Q1 remainder'),
-- Padmavathi Naidu
((SELECT id FROM d WHERE first_name='Padmavathi' AND last_name='Naidu'),   151.00, 'Cash',        NULL,         '2026-02-02', 'Walk-in donation'),
-- Ramakrishna Prasad
((SELECT id FROM d WHERE first_name='Ramakrishna' AND last_name='Prasad'), 3500.00, 'Check',      'CHK-10301',  '2026-01-26', 'Republic Day special - building fund'),
((SELECT id FROM d WHERE first_name='Ramakrishna' AND last_name='Prasad'),  251.00, 'Zelle',      'ZEL-88590',  '2026-03-10', 'Holi celebration fund'),
-- Sarada Prasad
((SELECT id FROM d WHERE first_name='Sarada' AND last_name='Prasad'),       101.00, 'PayPal',     'PP-55123',   '2026-02-20', 'Monthly seva'),
-- Raghunath Sharma
((SELECT id FROM d WHERE first_name='Raghunath' AND last_name='Sharma'),    501.00, 'Zelle',      'ZEL-88632',  '2026-03-01', 'Maha Shivaratri donation'),
-- Annapurna Rao
((SELECT id FROM d WHERE first_name='Annapurna' AND last_name='Rao'),       751.00, 'Check',      'CHK-10350',  '2026-01-10', 'Annadanam sponsorship'),
((SELECT id FROM d WHERE first_name='Annapurna' AND last_name='Rao'),       116.00, 'Venmo',      'VNM-44600',  '2026-02-28', 'Monthly contribution'),
-- Mohan Rao
((SELECT id FROM d WHERE first_name='Mohan' AND last_name='Rao'),            51.00, 'Cash',       NULL,          '2026-03-15', 'Prasadam contribution'),
-- Gayathri Krishna
((SELECT id FROM d WHERE first_name='Gayathri' AND last_name='Krishna'),    501.00, 'Credit Card','TXN-99990',  '2026-02-10', 'Saraswati Puja donation'),
-- Venkateswara Murthy
((SELECT id FROM d WHERE first_name='Venkateswara' AND last_name='Murthy'), 2501.00, 'Check',     'CHK-10400',  '2026-01-01', 'New Year pledge'),
((SELECT id FROM d WHERE first_name='Venkateswara' AND last_name='Murthy'),  501.00, 'Zelle',     'ZEL-88700',  '2026-03-20', 'Ugadi advance donation'),
-- Sarojini Chowdary
((SELECT id FROM d WHERE first_name='Sarojini' AND last_name='Chowdary'),   201.00, 'PayPal',    'PP-55200',   '2026-02-05', 'General fund'),
-- Tirumala Reddy
((SELECT id FROM d WHERE first_name='Tirumala' AND last_name='Reddy'),      1501.00, 'Check',    'CHK-10450',  '2026-01-26', 'Republic Day event sponsorship'),
-- Anjali Reddy
((SELECT id FROM d WHERE first_name='Anjali' AND last_name='Reddy'),         301.00, 'Venmo',    'VNM-44700',  '2026-03-08', 'Womens Day special'),
-- Narasimha Varma
((SELECT id FROM d WHERE first_name='Narasimha' AND last_name='Varma'),      751.00, 'Zelle',    'ZEL-88780',  '2026-01-14', 'Sankranti celebration'),
((SELECT id FROM d WHERE first_name='Narasimha' AND last_name='Varma'),      116.00, 'Cash',     NULL,          '2026-03-02', 'Walk-in donation'),
-- Bhavani Shankar
((SELECT id FROM d WHERE first_name='Bhavani' AND last_name='Shankar'),      501.00, 'Credit Card','TXN-10010', '2026-02-14', 'Valentine charity drive'),
-- Shankar Rao
((SELECT id FROM d WHERE first_name='Shankar' AND last_name='Rao'),          201.00, 'Zelle',    'ZEL-88800',  '2026-01-25', 'Monthly contribution'),
-- Kamala Devi
((SELECT id FROM d WHERE first_name='Kamala' AND last_name='Devi'),          101.00, 'Cash',     NULL,          '2026-02-12', 'Prasadam fund'),
((SELECT id FROM d WHERE first_name='Kamala' AND last_name='Devi'),          251.00, 'Check',    'CHK-10500',  '2026-03-18', 'Holi celebration'),
-- Jagadish Naidu
((SELECT id FROM d WHERE first_name='Jagadish' AND last_name='Naidu'),       501.00, 'PayPal',   'PP-55300',   '2026-01-30', 'Temple maintenance fund'),
((SELECT id FROM d WHERE first_name='Jagadish' AND last_name='Naidu'),      1001.00, 'Check',    'CHK-10550',  '2026-03-15', 'Ugadi celebration sponsor'),
-- Tulasi Goud
((SELECT id FROM d WHERE first_name='Tulasi' AND last_name='Goud'),          301.00, 'Venmo',    'VNM-44800',  '2026-02-22', 'Annadanam contribution'),
-- Ravi Goud
((SELECT id FROM d WHERE first_name='Ravi' AND last_name='Goud'),            151.00, 'Zelle',    'ZEL-88850',  '2026-01-18', 'Monthly seva'),
((SELECT id FROM d WHERE first_name='Ravi' AND last_name='Goud'),            251.00, 'Credit Card','TXN-10050', '2026-03-12', 'Cultural event fund'),
-- Sumathi Pillai
((SELECT id FROM d WHERE first_name='Sumathi' AND last_name='Pillai'),        51.00, 'Cash',     NULL,          '2026-02-08', 'Flowers & prasadam'),
((SELECT id FROM d WHERE first_name='Sumathi' AND last_name='Pillai'),       501.00, 'Check',    'CHK-10600',  '2026-03-01', 'Maha Shivaratri special'),
-- Hanumantha Reddy
((SELECT id FROM d WHERE first_name='Hanumantha' AND last_name='Reddy'),     751.00, 'Zelle',    'ZEL-88900',  '2026-01-10', 'Building fund contribution'),
((SELECT id FROM d WHERE first_name='Hanumantha' AND last_name='Reddy'),     201.00, 'Cash',     NULL,          '2026-03-20', 'Ugadi celebration'),
-- Kalyani Prasad
((SELECT id FROM d WHERE first_name='Kalyani' AND last_name='Prasad'),       116.00, 'Venmo',    'VNM-44900',  '2026-02-15', 'Monthly contribution'),
((SELECT id FROM d WHERE first_name='Kalyani' AND last_name='Prasad'),       501.00, 'PayPal',   'PP-55400',   '2026-03-10', 'Holi special donation'),
-- Suryanarayana Chowdary
((SELECT id FROM d WHERE first_name='Suryanarayana' AND last_name='Chowdary'), 2001.00, 'Check', 'CHK-10700',  '2026-01-05', 'Annual patron contribution'),
((SELECT id FROM d WHERE first_name='Suryanarayana' AND last_name='Chowdary'),  501.00, 'Zelle', 'ZEL-88950',  '2026-02-25', 'Cultural program fund'),
((SELECT id FROM d WHERE first_name='Suryanarayana' AND last_name='Chowdary'),  301.00, 'Credit Card','TXN-10100','2026-03-18','Ugadi sponsorship'),
-- Extra donations for volume
((SELECT id FROM d WHERE first_name='Srinivas' AND last_name='Reddy'),       1001.00, 'Check',  'CHK-10800',  '2026-03-22', 'Ugadi main event sponsor');
