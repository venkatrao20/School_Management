import { Router } from 'express';
import { pool } from './db.js';
import { authenticate, requireRoles } from './auth.js';

const router = Router();

function requiredText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function asAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

router.use(authenticate);

router.get('/academics/summary', requireRoles('ADMIN', 'TEACHER'), async (_request, response) => {
  try {
    const [[classCount], [studentCount], [teacherCount], [homeworkCount]] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM academic_classes'),
      pool.query('SELECT COUNT(*) AS total FROM academic_students'),
      pool.query("SELECT COUNT(*) AS total FROM academic_teachers WHERE status = 'Active' OR status IS NULL"),
      pool.query('SELECT COUNT(*) AS total FROM academic_homework WHERE assigned_date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)'),
    ]);
    response.json({
      success: true,
      data: {
        classes: Number(classCount.total || 0),
        students: Number(studentCount.total || 0),
        teachers: Number(teacherCount.total || 0),
        homeworkThisWeek: Number(homeworkCount.total || 0),
      },
    });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Academic data is unavailable until the MySQL schema is initialized.' });
  }
});

router.get('/academics/calendar', requireRoles('ADMIN', 'TEACHER'), async (_request, response) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, title, event_type, start_date, end_date, description
      FROM academic_calendar
      ORDER BY start_date ASC, id ASC
    `);
    response.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        title: row.title,
        type: row.event_type || 'Event',
        date: String(row.start_date).slice(0, 10),
        endDate: row.end_date ? String(row.end_date).slice(0, 10) : null,
        description: row.description || '',
      })),
    });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Academic calendar is unavailable until the MySQL schema is initialized.' });
  }
});

router.post('/academics/calendar', requireRoles('ADMIN'), async (request, response) => {
  const { title, type = 'Event', date, endDate = null, description = '' } = request.body || {};
  if (!requiredText(title) || !requiredText(date)) {
    return response.status(400).json({ success: false, error: 'title and date are required.' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate))) {
    return response.status(400).json({ success: false, error: 'date and endDate must use YYYY-MM-DD.' });
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO academic_calendar (title, event_type, start_date, end_date, description)
       VALUES (?, ?, ?, ?, ?)`,
      [title.trim(), type.trim() || 'Event', date, endDate || date, typeof description === 'string' ? description.trim() : '']
    );
    response.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Academic calendar is unavailable until the MySQL schema is initialized.' });
  }
});

router.get('/admissions/summary', requireRoles('ADMIN', 'ADMISSIONS'), async (_request, response) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS enquiries,
        SUM(status = 'New') AS new_enquiries,
        SUM(status = 'Assessment') AS assessments,
        SUM(status = 'Contacted') AS contacted
      FROM admission_enquiries
    `);
    const summary = rows[0];
    response.json({
      success: true,
      data: {
        enquiries: Number(summary.enquiries || 0),
        newEnquiries: Number(summary.new_enquiries || 0),
        assessments: Number(summary.assessments || 0),
        contacted: Number(summary.contacted || 0),
      },
    });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Admissions data is unavailable until the MySQL schema is initialized.' });
  }
});

router.get('/admissions/enquiries', requireRoles('ADMIN', 'ADMISSIONS'), async (_request, response) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, enquiry_ref, student_name, class_applied_for, parent_name, status, created_at
      FROM admission_enquiries
      ORDER BY created_at DESC, id DESC
    `);
    response.json({ success: true, data: rows });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Admissions data is unavailable until the MySQL schema is initialized.' });
  }
});

router.post('/admissions/enquiries', requireRoles('ADMIN', 'ADMISSIONS'), async (request, response) => {
  const { enquiryRef, studentName, classAppliedFor, parentName, status = 'New' } = request.body || {};
  if (![enquiryRef, studentName, classAppliedFor, parentName].every(requiredText)) {
    return response.status(400).json({ success: false, error: 'enquiryRef, studentName, classAppliedFor, and parentName are required.' });
  }
  if (!['New', 'Contacted', 'Assessment', 'Admitted', 'Closed'].includes(status)) {
    return response.status(400).json({ success: false, error: 'status is invalid.' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO admission_enquiries (enquiry_ref, student_name, class_applied_for, parent_name, status)
       VALUES (?, ?, ?, ?, ?)`,
      [enquiryRef.trim(), studentName.trim(), classAppliedFor.trim(), parentName.trim(), status]
    );
    response.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    response.status(409).json({ success: false, error: 'The enquiry reference already exists or admissions data is unavailable.' });
  }
});

router.get('/finance/summary', requireRoles('ADMIN', 'FINANCE'), async (_request, response) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS payments,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) AS collected_amount,
        SUM(payment_status = 'pending') AS pending_payments,
        SUM(payment_status = 'partial') AS partial_payments
      FROM finance_fee_payments
    `);
    const summary = rows[0];
    response.json({
      success: true,
      data: {
        payments: Number(summary.payments || 0),
        collectedAmount: Number(summary.collected_amount || 0),
        pendingPayments: Number(summary.pending_payments || 0),
        partialPayments: Number(summary.partial_payments || 0),
      },
    });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Fee finance data is unavailable until the MySQL schema is initialized.' });
  }
});

router.get('/finance/payments', requireRoles('ADMIN', 'FINANCE'), async (_request, response) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, receipt_no, student_name, amount, payment_status, paid_on
      FROM finance_fee_payments
      ORDER BY paid_on DESC, id DESC
    `);
    response.json({ success: true, data: rows });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Fee finance data is unavailable until the MySQL schema is initialized.' });
  }
});

router.post('/finance/payments', requireRoles('ADMIN', 'FINANCE'), async (request, response) => {
  const { receiptNo, studentName, amount, paymentStatus = 'pending', paidOn } = request.body || {};
  const parsedAmount = asAmount(amount);
  if (!requiredText(receiptNo) || !requiredText(studentName) || !parsedAmount || !requiredText(paidOn)) {
    return response.status(400).json({ success: false, error: 'receiptNo, studentName, a positive amount, and paidOn are required.' });
  }
  if (!['paid', 'pending', 'partial', 'failed', 'refunded'].includes(paymentStatus)) {
    return response.status(400).json({ success: false, error: 'paymentStatus is invalid.' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO finance_fee_payments (receipt_no, student_name, amount, payment_status, paid_on)
       VALUES (?, ?, ?, ?, ?)`,
      [receiptNo.trim(), studentName.trim(), parsedAmount, paymentStatus, paidOn]
    );
    response.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    response.status(409).json({ success: false, error: 'The receipt number already exists or fee finance data is unavailable.' });
  }
});

export default router;
