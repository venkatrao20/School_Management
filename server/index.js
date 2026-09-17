import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pool } from './db.js';
import authRoutes from './auth.js';
import notificationRoutes from './notifications.routes.js';
import transportRoutes from './transport.routes.js';
import moduleRoutes from './modules.routes.js';

const app = express();
const port = Number(process.env.PORT || 5000);
const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const allowedOrigins = new Set(
  [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ]
    .filter(Boolean)
    .flatMap((origins) => origins.split(',').map((origin) => origin.trim()).filter(Boolean))
);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
    },
  },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed.'));
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    response.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

app.get('/api', (_request, response) => {
  response.json({ service: 'School Management API', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api', moduleRoutes);
app.use('/api', (_request, response) => {
  response.status(404).json({ success: false, error: 'API route not found.' });
});

app.use(express.static(path.join(rootDirectory, '../dist'), {
  maxAge: '1h',
  setHeaders(response, filePath) {
    if (filePath.endsWith('index.html')) {
      response.setHeader('Cache-Control', 'no-cache');
    }
  },
}));
app.get(/^(?!\/api).*/, (_request, response) => {
  response.sendFile(path.join(rootDirectory, '../dist/index.html'));
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ success: false, error: 'Unexpected server error.' });
});

app.listen(port, () => {
  console.log(`School Management API listening on port ${port}`);
});
