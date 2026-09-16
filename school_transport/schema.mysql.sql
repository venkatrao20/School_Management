-- MySQL migration contract for the transport module.
-- The Flask runtime still uses SQLite until its route/data layer is ported.
-- Identity and students are represented by shared application IDs.

CREATE TABLE IF NOT EXISTS transport_drivers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    driver_id VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(40),
    license_info VARCHAR(255),
    license_expiry DATE,
    assigned_vehicle_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transport_routes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    route_id VARCHAR(80) NOT NULL UNIQUE,
    route_name VARCHAR(150) NOT NULL,
    stops JSON NOT NULL,
    pickup_time TIME NOT NULL,
    dropoff_time TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS transport_vehicles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vehicle_id VARCHAR(80) NOT NULL UNIQUE,
    vehicle_number VARCHAR(80) NOT NULL UNIQUE,
    vehicle_type VARCHAR(80) NOT NULL,
    capacity INT NOT NULL,
    driver_id BIGINT UNSIGNED NULL,
    route_id BIGINT UNSIGNED NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    gps_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    gps_tracking_status VARCHAR(30) NOT NULL DEFAULT 'offline',
    gps_last_lat DECIMAL(10,7),
    gps_last_lng DECIMAL(10,7),
    gps_last_updated DATETIME,
    insurance_expiry DATE,
    fitness_expiry DATE,
    permit_expiry DATE,
    pollution_expiry DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transport_vehicle_driver FOREIGN KEY (driver_id) REFERENCES transport_drivers(id),
    CONSTRAINT fk_transport_vehicle_route FOREIGN KEY (route_id) REFERENCES transport_routes(id)
);

CREATE TABLE IF NOT EXISTS transport_assignments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(191) NOT NULL UNIQUE,
    vehicle_id BIGINT UNSIGNED NOT NULL,
    route_id BIGINT UNSIGNED NOT NULL,
    assigned_date DATE NOT NULL,
    CONSTRAINT fk_transport_assignment_vehicle FOREIGN KEY (vehicle_id) REFERENCES transport_vehicles(id),
    CONSTRAINT fk_transport_assignment_route FOREIGN KEY (route_id) REFERENCES transport_routes(id)
);

CREATE TABLE IF NOT EXISTS transport_movements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(191) NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    movement_date DATE NOT NULL,
    movement_time TIME NOT NULL,
    vehicle_id BIGINT UNSIGNED NULL,
    route_id BIGINT UNSIGNED NULL,
    recorded_by VARCHAR(191) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transport_movement_student_date (student_id, movement_date),
    CONSTRAINT fk_transport_movement_vehicle FOREIGN KEY (vehicle_id) REFERENCES transport_vehicles(id),
    CONSTRAINT fk_transport_movement_route FOREIGN KEY (route_id) REFERENCES transport_routes(id)
);

CREATE TABLE IF NOT EXISTS transport_not_travelling_today (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(191) NOT NULL,
    parent_id VARCHAR(191) NOT NULL,
    reason TEXT,
    recorded_date DATE NOT NULL,
    recorded_time TIME NOT NULL,
    is_notified_driver BOOLEAN NOT NULL DEFAULT FALSE,
    is_notified_school BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transport_activity_audit_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    user_role VARCHAR(40) NOT NULL,
    action VARCHAR(100) NOT NULL,
    student_id VARCHAR(191),
    vehicle_id BIGINT UNSIGNED,
    route_id BIGINT UNSIGNED,
    movement_type VARCHAR(30),
    action_date DATE NOT NULL,
    action_time TIME NOT NULL,
    details JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transport_fees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(191) NOT NULL,
    fee_month CHAR(7) NOT NULL,
    amount_due DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status ENUM('pending', 'partial', 'paid') NOT NULL DEFAULT 'pending',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_transport_fee_month (student_id, fee_month)
);

CREATE TABLE IF NOT EXISTS transport_fee_payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fee_id BIGINT UNSIGNED NOT NULL,
    student_id VARCHAR(191) NOT NULL,
    paid_by VARCHAR(191) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(40) NOT NULL,
    reference_number VARCHAR(120) NOT NULL UNIQUE,
    paid_at DATETIME NOT NULL,
    CONSTRAINT fk_transport_payment_fee FOREIGN KEY (fee_id) REFERENCES transport_fees(id)
);
