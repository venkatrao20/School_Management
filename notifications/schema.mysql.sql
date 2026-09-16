-- MySQL migration contract for notification-owned data.
-- Core users and students must come from the shared school_management schema.
-- Flask handlers still use SQLite until they are ported to these namespaced tables.

CREATE TABLE IF NOT EXISTS notification_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(80) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notification_events_user_read (user_id, is_read),
    INDEX idx_notification_events_created (created_at)
);

CREATE TABLE IF NOT EXISTS notification_admin_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(80) NOT NULL,
    priority VARCHAR(30) NOT NULL DEFAULT 'normal',
    recipient_scope VARCHAR(255) NOT NULL,
    created_by VARCHAR(191) NOT NULL,
    scheduled_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'sent',
    INDEX idx_notification_admin_status (status, scheduled_at)
);

CREATE TABLE IF NOT EXISTS notification_recipients (
    notification_id BIGINT UNSIGNED NOT NULL,
    user_id VARCHAR(191) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME NULL,
    PRIMARY KEY (notification_id, user_id),
    CONSTRAINT fk_notification_recipient_message
        FOREIGN KEY (notification_id) REFERENCES notification_admin_messages(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_rules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rule_type VARCHAR(80) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    days_before INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_notification_rule_type (rule_type)
);

CREATE TABLE IF NOT EXISTS notification_push_subscriptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    origin VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_notification_push_user_endpoint (user_id, endpoint(191))
);

CREATE TABLE IF NOT EXISTS notification_reminder_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reminder_type VARCHAR(80) NOT NULL,
    reference_id VARCHAR(191) NOT NULL,
    reminder_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_notification_reminder (reminder_type, reference_id, reminder_date)
);
