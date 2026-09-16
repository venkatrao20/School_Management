import { Router } from 'express';
import { pool } from './db.js';

const router = Router();

function requiredText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function invalidRequest(response, message) {
  return response.status(400).json({ success: false, error: message });
}

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

router.post('/routes', async (request, response) => {
  const { routeId, routeName, stops, pickupTime, dropoffTime } = request.body || {};
  if (!requiredText(routeId) || !requiredText(routeName) || !Array.isArray(stops) || !requiredText(pickupTime) || !requiredText(dropoffTime)) {
    return invalidRequest(response, 'routeId, routeName, stops, pickupTime, and dropoffTime are required.');
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO transport_routes (route_id, route_name, stops, pickup_time, dropoff_time)
       VALUES (?, ?, ?, ?, ?)`,
      [routeId.trim(), routeName.trim(), JSON.stringify(stops), pickupTime, dropoffTime]
    );
    response.status(201).json({ success: true, data: { id: result.insertId, routeId, routeName, stops, pickupTime, dropoffTime } });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Transport data is unavailable until the MySQL schema is initialized.' });
  }
});

router.post('/vehicles', async (request, response) => {
  const { vehicleId, vehicleNumber, vehicleType, capacity, driverId = null, routeId = null } = request.body || {};
  if (!requiredText(vehicleId) || !requiredText(vehicleNumber) || !requiredText(vehicleType) || !positiveInteger(capacity)) {
    return invalidRequest(response, 'vehicleId, vehicleNumber, vehicleType, and a positive capacity are required.');
  }
  if (driverId !== null && !positiveInteger(driverId)) return invalidRequest(response, 'driverId must be a positive integer or null.');
  if (routeId !== null && !positiveInteger(routeId)) return invalidRequest(response, 'routeId must be a positive integer or null.');

  try {
    const [result] = await pool.execute(
      `INSERT INTO transport_vehicles (vehicle_id, vehicle_number, vehicle_type, capacity, driver_id, route_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [vehicleId.trim(), vehicleNumber.trim(), vehicleType.trim(), capacity, driverId, routeId]
    );
    response.status(201).json({ success: true, data: { id: result.insertId, vehicleId, vehicleNumber, vehicleType, capacity, driverId, routeId } });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Transport data is unavailable until the MySQL schema is initialized.' });
  }
});

export default router;