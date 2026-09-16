import { Router } from 'express';
import { pool } from './db.js';
import { authenticate } from './auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (request, response) => {
  const userId = String(request.user.id);
  try {
    const [events] = await pool.execute(
      `SELECT id, title, message, type, is_read, created_at, 'event' AS source
       FROM notification_events WHERE user_id = ?`,
      [userId]
    );
    const [adminMessages] = await pool.execute(
      `SELECT m.id, m.title, m.message, m.notification_type AS type,
              r.is_read, COALESCE(m.created_at, m.scheduled_at) AS created_at,
              'admin' AS source
       FROM notification_recipients r
       JOIN notification_admin_messages m ON m.id = r.notification_id
       WHERE r.user_id = ? AND m.status = 'sent'`,
      [userId]
    );
    const data = [...events, ...adminMessages].sort(
      (left, right) => new Date(right.created_at) - new Date(left.created_at)
    );
    response.json({ success: true, data, unreadCount: data.filter((item) => !item.is_read).length });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Notification data is unavailable until the MySQL schema is initialized.' });
  }
});

router.patch('/events/:id/read', async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) return response.status(400).json({ success: false, error: 'Notification id must be a positive integer.' });
  try {
    const [result] = await pool.execute(
      'UPDATE notification_events SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, String(request.user.id)]
    );
    if (!result.affectedRows) return response.status(404).json({ success: false, error: 'Notification not found.' });
    response.json({ success: true });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Notification data is unavailable until the MySQL schema is initialized.' });
  }
});

router.patch('/admin/:id/read', async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id < 1) return response.status(400).json({ success: false, error: 'Notification id must be a positive integer.' });
  try {
    const [result] = await pool.execute(
      'UPDATE notification_recipients SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE notification_id = ? AND user_id = ?',
      [id, String(request.user.id)]
    );
    if (!result.affectedRows) return response.status(404).json({ success: false, error: 'Notification not found.' });
    response.json({ success: true });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Notification data is unavailable until the MySQL schema is initialized.' });
  }
});

export default router;