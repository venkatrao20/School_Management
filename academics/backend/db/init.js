const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    dateStrings: true
});

function normalizeQuery(sql, values) {
    const params = Array.isArray(values) ? [...values] : values && typeof values === 'object' ? [] : [values];
    const named = !Array.isArray(values) && values && typeof values === 'object' ? values : null;
    let index = 0;
    let normalized = sql
        .replace(/date\('now','-7 day'\)/g, 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)')
        .replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP')
        .replace(/date\('now'\)/g, 'CURDATE()')
        .replace(/"Active"/g, "'Active'");
    normalized = normalized.replace(/ON CONFLICT\(([^)]+)\) DO UPDATE SET([\s\S]*?)(?=\s*;?$)/i, (_, keys, updates) => {
        const mysqlUpdates = updates.replace(/excluded\.([A-Za-z_][A-Za-z0-9_]*)/g, 'VALUES($1)');
        return `ON DUPLICATE KEY UPDATE${mysqlUpdates}`;
    });
    for (const table of ['classes', 'subjects', 'students', 'teachers', 'teacher_class_allocation', 'timetable', 'homework', 'syllabus', 'student_attendance', 'staff_attendance', 'leave_requests', 'exams', 'marks', 'grade_scale']) {
        normalized = normalized.replace(new RegExp(`\\b${table}\\b`, 'g'), `academic_${table}`);
    }
    if (named) {
        normalized = normalized.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (_, key) => {
            params[index++] = named[key];
            return '?';
        });
    }
    return { sql: normalized, params };
}

function statement(connection, sql) {
    return {
        all: async (...values) => {
            const [rows] = await connection.execute(normalizeQuery(sql, values.length === 1 ? values[0] : values));
            return rows;
        },
        get: async (...values) => {
            const [rows] = await connection.execute(normalizeQuery(sql, values.length === 1 ? values[0] : values));
            return rows[0];
        },
        run: async (...values) => {
            const [result] = await connection.execute(normalizeQuery(sql, values.length === 1 ? values[0] : values));
            return { ...result, lastInsertRowid: result.insertId };
        }
    };
}

const db = {
    prepare: (sql) => statement(pool, sql),
    async transaction(callback) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback({ prepare: (sql) => statement(connection, sql) });
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

async function initialize() {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    for (const statementText of schema.split(';').map((part) => part.trim()).filter(Boolean)) {
        await pool.query(statementText);
    }
    const [{ c }] = await pool.query('SELECT COUNT(*) AS c FROM academic_classes');
    if (Number(c) > 0) return;
    console.log('Seeding initial demo data...');

    const insert = async (sql, values) => (await db.prepare(sql).run(...values)).lastInsertRowid;
    const c1 = await insert('INSERT INTO academic_classes (name, section) VALUES (?, ?)', ['Grade 5', 'A']);
    const c2 = await insert('INSERT INTO academic_classes (name, section) VALUES (?, ?)', ['Grade 6', 'B']);
    const c3 = await insert('INSERT INTO academic_classes (name, section) VALUES (?, ?)', ['Grade 7', 'A']);
    const subMath = await insert('INSERT INTO academic_subjects (name, code) VALUES (?, ?)', ['Mathematics', 'MATH']);
    const subSci = await insert('INSERT INTO academic_subjects (name, code) VALUES (?, ?)', ['Science', 'SCI']);
    const subEng = await insert('INSERT INTO academic_subjects (name, code) VALUES (?, ?)', ['English', 'ENG']);
    await insert('INSERT INTO academic_subjects (name, code) VALUES (?, ?)', ['Social Studies', 'SOC']);
    const addTeacher = (id, name, email, phone, qualification, designation, subject, joining) => insert(
        'INSERT INTO academic_teachers (employee_id, name, email, phone, qualification, designation, subject_specialization, joining_date, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, name, email, phone, qualification, designation, subject, joining, 'Bengaluru', 'Active']);
    const t1 = await addTeacher('EMP001', 'Anita Sharma', 'anita.sharma@school.edu', '9876500001', 'M.Sc, B.Ed', 'TGT', 'Mathematics', '2019-06-01');
    const t2 = await addTeacher('EMP002', 'Rahul Verma', 'rahul.verma@school.edu', '9876500002', 'M.Sc, B.Ed', 'TGT', 'Science', '2020-07-15');
    const t3 = await addTeacher('EMP003', 'Priya Nair', 'priya.nair@school.edu', '9876500003', 'M.A, B.Ed', 'PGT', 'English', '2018-04-10');
    const s1 = await insert('INSERT INTO academic_students (admission_no, name, class_id, roll_no) VALUES (?, ?, ?, ?)', ['ADM2026001', 'Aarav Kumar', c1, '1']);
    const s2 = await insert('INSERT INTO academic_students (admission_no, name, class_id, roll_no) VALUES (?, ?, ?, ?)', ['ADM2026002', 'Diya Patel', c1, '2']);
    const s3 = await insert('INSERT INTO academic_students (admission_no, name, class_id, roll_no) VALUES (?, ?, ?, ?)', ['ADM2026003', 'Kabir Singh', c1, '3']);
    const s4 = await insert('INSERT INTO academic_students (admission_no, name, class_id, roll_no) VALUES (?, ?, ?, ?)', ['ADM2026004', 'Meera Iyer', c2, '1']);
    const add = (sql, values) => insert(sql, values);
    await add('INSERT INTO academic_teacher_class_allocation (teacher_id, class_id, subject_id, is_class_teacher) VALUES (?, ?, ?, ?)', [t1, c1, subMath, 1]);
    await add('INSERT INTO academic_teacher_class_allocation (teacher_id, class_id, subject_id, is_class_teacher) VALUES (?, ?, ?, ?)', [t2, c1, subSci, 0]);
    await add('INSERT INTO academic_teacher_class_allocation (teacher_id, class_id, subject_id, is_class_teacher) VALUES (?, ?, ?, ?)', [t3, c2, subEng, 1]);
    await add('INSERT INTO academic_timetable (class_id, subject_id, teacher_id, day_of_week, period_no, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [c1, subMath, t1, 'Monday', 1, '09:00', '09:45', 'Room 101']);
    await add('INSERT INTO academic_timetable (class_id, subject_id, teacher_id, day_of_week, period_no, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [c1, subSci, t2, 'Monday', 2, '09:45', '10:30', 'Lab 1']);
    await add('INSERT INTO academic_timetable (class_id, subject_id, teacher_id, day_of_week, period_no, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [c2, subEng, t3, 'Tuesday', 1, '09:00', '09:45', 'Room 205']);
    await add('INSERT INTO academic_homework (class_id, subject_id, teacher_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [c1, subMath, t1, 'Fractions Worksheet', 'Complete exercises 1-10 from Chapter 4', '2026-09-05', 'Published']);
    await add('INSERT INTO academic_homework (class_id, subject_id, teacher_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [c1, subSci, t2, 'Plant Cell Diagram', 'Draw and label a plant cell', '2026-09-06', 'Published']);
    await add('INSERT INTO academic_syllabus (class_id, subject_id, teacher_id, unit_title, topics, planned_start_date, planned_end_date, completion_status, completion_percent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [c1, subMath, t1, 'Chapter 4: Fractions', 'Introduction, Addition, Subtraction of fractions', '2026-08-01', '2026-08-20', 'Completed', 100]);
    await add('INSERT INTO academic_syllabus (class_id, subject_id, teacher_id, unit_title, topics, planned_start_date, planned_end_date, completion_status, completion_percent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [c1, subSci, t2, 'Chapter 3: Cell Structure', 'Plant cell, Animal cell, Cell organelles', '2026-08-15', '2026-09-10', 'In Progress', 60]);
    for (const values of [['Independence Day', 'Holiday', '2026-08-15', '2026-08-15', 'National Holiday'], ['Mid-Term Exams', 'Exam', '2026-09-15', '2026-09-22', 'Mid-term examinations for all classes'], ['Parent-Teacher Meeting', 'PTM', '2026-09-25', '2026-09-25', 'Quarterly PTM']]) await add('INSERT INTO academic_calendar (title, event_type, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)', values);
    for (const values of [[s1, c1, '2026-08-28', 'Present', t1], [s2, c1, '2026-08-28', 'Absent', t1], [s3, c1, '2026-08-28', 'Late', t1], [s4, c2, '2026-08-28', 'Present', t3]]) await add('INSERT INTO academic_student_attendance (student_id, class_id, attendance_date, status, marked_by) VALUES (?, ?, ?, ?, ?)', values);
    for (const values of [[t1, '2026-08-28', 'Present', '08:45', '15:30'], [t2, '2026-08-28', 'Present', '08:50', '15:30']]) await add('INSERT INTO academic_staff_attendance (teacher_id, attendance_date, status, check_in, check_out) VALUES (?, ?, ?, ?, ?)', values);
    await add('INSERT INTO academic_staff_attendance (teacher_id, attendance_date, status) VALUES (?, ?, ?)', [t3, '2026-08-28', 'On Leave']);
    await add('INSERT INTO academic_leave_requests (applicant_type, teacher_id, leave_type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)', ['Teacher', t3, 'Sick', '2026-08-28', '2026-08-29', 'Fever', 'Approved']);
    const e1 = await add('INSERT INTO academic_exams (name, exam_type, class_id, subject_id, exam_date, start_time, end_time, max_marks, pass_marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['Mid-Term Mathematics', 'Mid-Term', c1, subMath, '2026-09-16', '09:00', '11:00', 100, 33]);
    const e2 = await add('INSERT INTO academic_exams (name, exam_type, class_id, subject_id, exam_date, start_time, end_time, max_marks, pass_marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', ['Mid-Term Science', 'Mid-Term', c1, subSci, '2026-09-18', '09:00', '11:00', 100, 33]);
    for (const values of [[e1, s1, 88, 'A', t1], [e1, s2, 45, 'C', t1], [e1, s3, 72, 'B', t1], [e2, s1, 91, 'A+', t2], [e2, s2, 55, 'C', t2]]) await add('INSERT INTO academic_marks (exam_id, student_id, marks_obtained, grade, entered_by) VALUES (?, ?, ?, ?, ?)', values);
    for (const values of [['A+', 90, 100, 'Outstanding'], ['A', 80, 89.99, 'Excellent'], ['B', 70, 79.99, 'Very Good'], ['C', 50, 69.99, 'Good'], ['D', 33, 49.99, 'Satisfactory'], ['F', 0, 32.99, 'Needs Improvement']]) await add('INSERT INTO academic_grade_scale (grade, min_percent, max_percent, remarks) VALUES (?, ?, ?, ?)', values);
    console.log('Seeding complete.');
}

db.ready = initialize();
module.exports = db;
