import { Router } from 'express';
import { pool } from './db.js';
import { authenticate } from './auth.js';

const router = Router();

function requiredText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function pathId(value) {
  const id = Number(value);
  return positiveInteger(id) ? id : null;
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

router.post('/routes', authenticate, async (request, response) => {
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

router.post('/vehicles', authenticate, async (request, response) => {
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

router.patch('/routes/:id', authenticate, async (request, response) => {
  const id = pathId(request.params.id);
  const { routeId, routeName, stops, pickupTime, dropoffTime } = request.body || {};
  if (!id) return invalidRequest(response, 'route id must be a positive integer.');
  if (!requiredText(routeId) || !requiredText(routeName) || !Array.isArray(stops) || !requiredText(pickupTime) || !requiredText(dropoffTime)) {
    return invalidRequest(response, 'routeId, routeName, stops, pickupTime, and dropoffTime are required.');
  }

  try {
    const [result] = await pool.execute(
      `UPDATE transport_routes
       SET route_id = ?, route_name = ?, stops = ?, pickup_time = ?, dropoff_time = ?
       WHERE id = ?`,
      [routeId.trim(), routeName.trim(), JSON.stringify(stops), pickupTime, dropoffTime, id]
    );
    if (!result.affectedRows) return response.status(404).json({ success: false, error: 'Route not found.' });
    response.json({ success: true, data: { id, routeId, routeName, stops, pickupTime, dropoffTime } });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Transport data is unavailable until the MySQL schema is initialized.' });
  }
});

router.patch('/vehicles/:id', authenticate, async (request, response) => {
  const id = pathId(request.params.id);
  const { vehicleId, vehicleNumber, vehicleType, capacity, driverId = null, routeId = null, status = 'active' } = request.body || {};
  if (!id) return invalidRequest(response, 'vehicle id must be a positive integer.');
  if (!requiredText(vehicleId) || !requiredText(vehicleNumber) || !requiredText(vehicleType) || !positiveInteger(capacity) || !requiredText(status)) {
    return invalidRequest(response, 'vehicleId, vehicleNumber, vehicleType, capacity, and status are required.');
  }
  if (driverId !== null && !positiveInteger(driverId)) return invalidRequest(response, 'driverId must be a positive integer or null.');
  if (routeId !== null && !positiveInteger(routeId)) return invalidRequest(response, 'routeId must be a positive integer or null.');

  try {
    const [result] = await pool.execute(
      `UPDATE transport_vehicles
       SET vehicle_id = ?, vehicle_number = ?, vehicle_type = ?, capacity = ?, driver_id = ?, route_id = ?, status = ?
       WHERE id = ?`,
      [vehicleId.trim(), vehicleNumber.trim(), vehicleType.trim(), capacity, driverId, routeId, status.trim(), id]
    );
    if (!result.affectedRows) return response.status(404).json({ success: false, error: 'Vehicle not found.' });
    response.json({ success: true, data: { id, vehicleId, vehicleNumber, vehicleType, capacity, driverId, routeId, status } });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Transport data is unavailable until the MySQL schema is initialized.' });
  }
});

router.delete('/routes/:id', authenticate, async (request, response) => {
  const id = pathId(request.params.id);
  if (!id) return invalidRequest(response, 'route id must be a positive integer.');
  try {
    const [result] = await pool.execute('DELETE FROM transport_routes WHERE id = ?', [id]);
    if (!result.affectedRows) return response.status(404).json({ success: false, error: 'Route not found.' });
    response.status(204).end();
  } catch (error) {
    response.status(503).json({ success: false, error: 'Transport data is unavailable until the MySQL schema is initialized.' });
  }
});

router.delete('/vehicles/:id', authenticate, async (request, response) => {
  const id = pathId(request.params.id);
  if (!id) return invalidRequest(response, 'vehicle id must be a positive integer.');
  try {
    const [result] = await pool.execute('DELETE FROM transport_vehicles WHERE id = ?', [id]);
    if (!result.affectedRows) return response.status(404).json({ success: false, error: 'Vehicle not found.' });
    response.status(204).end();
  } catch (error) {
    response.status(503).json({ success: false, error: 'Transport data is unavailable until the MySQL schema is initialized.' });
  }
});

router.post('/movements', authenticate, async (request, response) => {
  const { studentId, movementType, movementDate = null, movementTime = null, vehicleId = null, routeId = null, notes = null } = request.body || {};
  if (!requiredText(studentId) || !['boarding', 'drop_off', 'school_entry', 'school_exit'].includes(movementType)) {
    return invalidRequest(response, 'studentId and a valid movementType are required.');
  }
  if (vehicleId !== null && !positiveInteger(vehicleId)) return invalidRequest(response, 'vehicleId must be a positive integer or null.');
  if (routeId !== null && !positiveInteger(routeId)) return invalidRequest(response, 'routeId must be a positive integer or null.');

  try {
    const [result] = await pool.execute(
      `INSERT INTO transport_movements (student_id, movement_type, movement_date, movement_time, vehicle_id, route_id, recorded_by, notes)
       VALUES (?, ?, COALESCE(?, CURRENT_DATE), COALESCE(?, CURRENT_TIME), ?, ?, ?, ?)`,
      [studentId.trim(), movementType, movementDate, movementTime, vehicleId, routeId, String(request.user.id), notes]
    );
    response.status(201).json({ success: true, data: { id: result.insertId, studentId, movementType, vehicleId, routeId, recordedBy: request.user.id, notes } });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Transport data is unavailable until the MySQL schema is initialized.' });
  }
});

export default router;