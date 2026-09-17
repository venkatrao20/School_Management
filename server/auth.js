import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { pool } from './db.js';

const router = Router();
const secret = process.env.JWT_ACCESS_SECRET;

if (!secret || secret.length < 32) {
  throw new Error('JWT_ACCESS_SECRET must be set to a random value of at least 32 characters.');
}

export function requireRoles(...roles) {
  return (request, response, next) => {
    if (!roles.includes(request.user?.role)) {
      return response.status(403).json({ success: false, error: 'You do not have permission to access this resource.' });
    }
    next();
  };
}

router.post('/login', async (request, response) => {
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const password = typeof request.body?.password === 'string' ? request.body.password : '';
  if (!email || !password) return response.status(400).json({ success: false, error: 'email and password are required.' });

  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, passwordHash, role, isActive FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    const user = rows[0];
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      secret,
      { expiresIn: '15m' }
    );
    response.json({ success: true, accessToken: token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    response.status(503).json({ success: false, error: 'Authentication service is unavailable until MySQL is configured.' });
  }
});

export async function authenticate(request, response, next) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return response.status(401).json({ success: false, error: 'Authentication token required.' });

  try {
    const payload = jwt.verify(header.slice(7), secret);
    const [rows] = await pool.execute('SELECT id, name, email, role, isActive FROM users WHERE id = ? LIMIT 1', [payload.userId]);
    if (!rows[0]?.isActive) return response.status(401).json({ success: false, error: 'Account is inactive or does not exist.' });
    request.user = rows[0];
    next();
  } catch (error) {
    response.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
  }
}

export default router;
