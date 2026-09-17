import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { ensureDatabase, pool } from './db.js';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaFiles = [
  'academics/backend/db/schema.sql',
  'notifications/schema.mysql.sql',
  'school_transport/schema.mysql.sql',
];

async function seedApplicationUsers() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      passwordHash VARCHAR(255) NOT NULL,
      role VARCHAR(40) NOT NULL,
      isActive BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query('ALTER TABLE users MODIFY role VARCHAR(40) NOT NULL');

  const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (bootstrapEmail || bootstrapPassword) {
    if (!bootstrapEmail || !bootstrapPassword || bootstrapPassword.length < 12) {
      throw new Error('BOOTSTRAP_ADMIN_EMAIL and a password of at least 12 characters are required together.');
    }
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [bootstrapEmail]);
    if (!existing[0]) {
      const passwordHash = await bcrypt.hash(bootstrapPassword, 12);
      await pool.execute(
        'INSERT INTO users (name, email, passwordHash, role) VALUES (?, ?, ?, ?)',
        [process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'School Administrator', bootstrapEmail, passwordHash, 'ADMIN']
      );
      console.log(`Created bootstrap administrator ${bootstrapEmail}.`);
    }
  }

  if (process.env.SEED_DEMO_DATA !== 'true') return;

  const accounts = [
    ['Admin User', 'admin@test.com', 'admin123', 'ADMIN'],
    ['Teacher 5A', 'teacher5a@test.com', 'teacher123', 'TEACHER'],
    ['Admissions Officer', 'admissions@test.com', 'admissions123', 'ADMISSIONS'],
    ['Transport Manager', 'transport@test.com', 'transport123', 'TRANSPORT'],
    ['Finance Officer', 'finance@test.com', 'finance123', 'FINANCE'],
    ['Parent Account', 'parent@test.com', 'parent123', 'PARENT'],
    ['Student Account', 'student@test.com', 'student123', 'STUDENT'],
  ];

  for (const [name, email, password, role] of accounts) {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (!existing[0]) {
      const passwordHash = await bcrypt.hash(password, 12);
      await pool.execute(
        'INSERT INTO users (name, email, passwordHash, role) VALUES (?, ?, ?, ?)',
        [name, email, passwordHash, role]
      );
    }
  }
}

async function seedModuleData() {
  // Representative records based on the supplied admissions and finance module seed data.
  await pool.query(`CREATE TABLE IF NOT EXISTS admission_enquiries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    enquiry_ref VARCHAR(40) NOT NULL UNIQUE,
    student_name VARCHAR(150) NOT NULL,
    class_applied_for VARCHAR(50) NOT NULL,
    parent_name VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS finance_fee_payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    receipt_no VARCHAR(50) NOT NULL UNIQUE,
    student_name VARCHAR(150) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_status VARCHAR(30) NOT NULL,
    paid_on DATE NOT NULL
  )`);

  await pool.query(`INSERT INTO academic_classes (name, section)
    SELECT 'Grade 5', 'A' WHERE NOT EXISTS (SELECT 1 FROM academic_classes WHERE name = 'Grade 5' AND section = 'A')`);
  await pool.query(`INSERT IGNORE INTO academic_subjects (name, code) VALUES ('Mathematics', 'MATH-5'), ('Science', 'SCI-5')`);
  await pool.query(`INSERT IGNORE INTO academic_teachers (employee_id, name, email, designation, subject_specialization)
    VALUES ('TCH-001', 'Anita Rao', 'anita.rao@edunovae.local', 'Class Teacher', 'Mathematics')`);
  await pool.query(`INSERT INTO academic_students (admission_no, name, class_id, roll_no)
    SELECT 'EDU-2026-001', 'Aarav Sharma', c.id, '01' FROM academic_classes c
    WHERE c.name = 'Grade 5' AND c.section = 'A'
      AND NOT EXISTS (SELECT 1 FROM academic_students WHERE admission_no = 'EDU-2026-001')`);

  await pool.query(`INSERT IGNORE INTO transport_routes (route_id, route_name, stops, pickup_time, dropoff_time)
    VALUES ('R-01', 'Central Route', JSON_ARRAY('Central Park', 'City Library', 'EDUNOVAE Campus'), '07:35:00', '15:30:00')`);
  await pool.query(`INSERT IGNORE INTO transport_drivers (driver_id, name, contact_number, license_info)
    VALUES ('DRV-001', 'Ravi Kumar', '+91 98765 10001', 'KA-01-2026-001')`);
  await pool.query(`INSERT INTO transport_vehicles (vehicle_id, vehicle_number, vehicle_type, capacity, driver_id, route_id, status, gps_enabled)
    SELECT 'BUS-01', 'KA 01 AB 1024', 'School Bus', 42, d.id, r.id, 'active', TRUE
    FROM transport_drivers d CROSS JOIN transport_routes r
    WHERE d.driver_id = 'DRV-001' AND r.route_id = 'R-01'
      AND NOT EXISTS (SELECT 1 FROM transport_vehicles WHERE vehicle_id = 'BUS-01')`);

  await pool.query(`INSERT INTO notification_events (user_id, title, message, type)
    SELECT '1', 'Welcome to EDUNOVAE', 'Your consolidated school dashboard is ready to use.', 'system'
    WHERE NOT EXISTS (SELECT 1 FROM notification_events WHERE user_id = '1' AND title = 'Welcome to EDUNOVAE')`);
  await pool.query(`INSERT INTO admission_enquiries (enquiry_ref, student_name, class_applied_for, parent_name, status)
    VALUES ('ENQ-2026-001', 'Diya Iyer', 'Grade 4', 'Ananya Iyer', 'Assessment'),
           ('ENQ-2026-002', 'Kabir Kapoor', 'Grade 7', 'Vikram Kapoor', 'Contacted')
    ON DUPLICATE KEY UPDATE student_name = VALUES(student_name)`);
  await pool.query(`INSERT INTO finance_fee_payments (receipt_no, student_name, amount, payment_status, paid_on)
    VALUES ('RCP-2026-001', 'Aarav Sharma', 72000.00, 'paid', '2026-04-15'),
           ('RCP-2026-002', 'Priya Sharma', 13600.00, 'paid', '2026-04-15')
    ON DUPLICATE KEY UPDATE amount = VALUES(amount), payment_status = VALUES(payment_status)`);

  const academicStudents = [
    ['EDU-2026-002', 'Priya Sharma', '02'], ['EDU-2026-003', 'Liam Miller', '03'],
    ['EDU-2026-004', 'Diya Iyer', '04'], ['EDU-2026-005', 'Kabir Kapoor', '05'],
    ['EDU-2026-006', 'Riya Mehta', '06'], ['EDU-2026-007', 'Arjun Nair', '07'],
    ['EDU-2026-008', 'Meera Reddy', '08'], ['EDU-2026-009', 'Vihaan Das', '09'],
    ['EDU-2026-010', 'Anaya Gupta', '10'],
  ];
  const [gradeFive] = await pool.execute("SELECT id FROM academic_classes WHERE name = 'Grade 5' AND section = 'A' LIMIT 1");
  for (const [admissionNo, name, rollNo] of academicStudents) {
    await pool.execute(
      `INSERT INTO academic_students (admission_no, name, class_id, roll_no) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), roll_no = VALUES(roll_no)`,
      [admissionNo, name, gradeFive[0].id, rollNo]
    );
  }

  for (let number = 2; number <= 10; number += 1) {
    const routeId = `R-${String(number).padStart(2, '0')}`;
    const driverId = `DRV-${String(number).padStart(3, '0')}`;
    const vehicleId = `BUS-${String(number).padStart(2, '0')}`;
    await pool.execute(
      `INSERT INTO transport_routes (route_id, route_name, stops, pickup_time, dropoff_time) VALUES (?, ?, ?, '07:35:00', '15:30:00')
       ON DUPLICATE KEY UPDATE route_name = VALUES(route_name), stops = VALUES(stops)`,
      [routeId, `Campus Route ${number}`, JSON.stringify([`Stop ${number}A`, `Stop ${number}B`, 'EDUNOVAE Campus'])]
    );
    await pool.execute(
      `INSERT INTO transport_drivers (driver_id, name, contact_number, license_info) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), contact_number = VALUES(contact_number)`,
      [driverId, `Driver ${number}`, `+91 98765 10${String(number).padStart(3, '0')}`, `KA-01-2026-${String(number).padStart(3, '0')}`]
    );
    const [driverRows] = await pool.execute('SELECT id FROM transport_drivers WHERE driver_id = ?', [driverId]);
    const [routeRows] = await pool.execute('SELECT id FROM transport_routes WHERE route_id = ?', [routeId]);
    await pool.execute(
      `INSERT INTO transport_vehicles (vehicle_id, vehicle_number, vehicle_type, capacity, driver_id, route_id, status, gps_enabled)
       VALUES (?, ?, 'School Bus', 42, ?, ?, 'active', TRUE)
       ON DUPLICATE KEY UPDATE driver_id = VALUES(driver_id), route_id = VALUES(route_id), status = VALUES(status)`,
      [vehicleId, `KA 01 AB ${1023 + number}`, driverRows[0].id, routeRows[0].id]
    );
  }

  for (let number = 2; number <= 10; number += 1) {
    const title = `School update ${number}`;
    await pool.execute(
      `INSERT INTO notification_events (user_id, title, message, type)
       SELECT '1', ?, ?, 'announcement'
       WHERE NOT EXISTS (SELECT 1 FROM notification_events WHERE user_id = '1' AND title = ?)`,
      [title, `Sample school notification ${number} is ready for review.`, title]
    );
  }

  const enquiries = [
    ['ENQ-2026-003', 'Riya Mehta', 'Grade 3', 'Sanjay Mehta', 'New'], ['ENQ-2026-004', 'Arjun Nair', 'Grade 6', 'Leela Nair', 'Contacted'],
    ['ENQ-2026-005', 'Meera Reddy', 'Grade 2', 'Rohit Reddy', 'Assessment'], ['ENQ-2026-006', 'Vihaan Das', 'Grade 1', 'Neha Das', 'New'],
    ['ENQ-2026-007', 'Anaya Gupta', 'Grade 5', 'Karan Gupta', 'Contacted'], ['ENQ-2026-008', 'Ishaan Roy', 'Grade 4', 'Pooja Roy', 'Assessment'],
    ['ENQ-2026-009', 'Tara Singh', 'Grade 7', 'Amit Singh', 'New'], ['ENQ-2026-010', 'Dev Patel', 'Grade 8', 'Nisha Patel', 'Contacted'],
  ];
  for (const enquiry of enquiries) {
    await pool.execute(
      `INSERT INTO admission_enquiries (enquiry_ref, student_name, class_applied_for, parent_name, status) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE student_name = VALUES(student_name), status = VALUES(status)`, enquiry
    );
  }

  const payments = [
    ['RCP-2026-003', 'Liam Miller', 18000, 'paid', '2026-04-16'], ['RCP-2026-004', 'Diya Iyer', 14500, 'pending', '2026-04-18'],
    ['RCP-2026-005', 'Kabir Kapoor', 21000, 'paid', '2026-04-19'], ['RCP-2026-006', 'Riya Mehta', 13200, 'partial', '2026-04-20'],
    ['RCP-2026-007', 'Arjun Nair', 19500, 'paid', '2026-04-21'], ['RCP-2026-008', 'Meera Reddy', 12400, 'pending', '2026-04-22'],
    ['RCP-2026-009', 'Vihaan Das', 11800, 'paid', '2026-04-23'], ['RCP-2026-010', 'Anaya Gupta', 17500, 'partial', '2026-04-24'],
  ];
  for (const payment of payments) {
    await pool.execute(
      `INSERT INTO finance_fee_payments (receipt_no, student_name, amount, payment_status, paid_on) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), payment_status = VALUES(payment_status)`, payment
    );
  }
}

async function migrate() {
  await ensureDatabase();
  for (const relativePath of schemaFiles) {
    const schema = await fs.readFile(path.join(rootDirectory, relativePath), 'utf8');
    const statements = schema
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const [index, statement] of statements.entries()) {
      try {
        await pool.query(statement);
      } catch (error) {
        throw new Error(`${relativePath} statement ${index + 1} failed: ${error.message}`);
      }
    }
    console.log(`Applied ${relativePath}`);
  }
  await seedApplicationUsers();
  if (process.env.SEED_DEMO_DATA === 'true') {
    await seedModuleData();
    console.log('Seeded demo application data.');
  }
}

migrate()
  .then(async () => {
    await pool.end();
    console.log('MySQL schema migration complete.');
  })
  .catch(async (error) => {
    console.error('MySQL schema migration failed:', error.message);
    await pool.end();
    process.exitCode = 1;
  });
