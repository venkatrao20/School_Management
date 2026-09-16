import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

router.get('/vehicles', async (_request, response) => {
  try {
    const [rows] = await pool.query(`
      SELECT v.*, d.name AS driver_name, r.route_name
      FROM transport_vehicles v
      LEFT JOIN transport_drivers d ON d.id = v.driver_id
      LEFT JOIN transport_routes r ON r.id = v.route_id
      ORDER BY v.vehicle_number
    `);
    response.json({ success: true, data: rows });
  } catch (error) {
    response.status(503).json({
      success: false,
      error: 'Transport data is unavailable until the MySQL schema is initialized.',
    });
  }
});

router.get('/routes', async (_request, response) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, route_id, route_name, stops, pickup_time, dropoff_time
      FROM transport_routes
      ORDER BY route_name
    `);
    response.json({ success: true, data: rows });
  } catch (error) {
    response.status(503).json({
      success: false,
      error: 'Transport data is unavailable until the MySQL schema is initialized.',
    });
  }
});

export default router;