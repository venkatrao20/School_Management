import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mysql from 'mysql2/promise';

const app = express();
const port = Number(process.env.PORT || 5000);
const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT ? Number(process.env.MYSQLPORT) : 3306,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || true }));
app.use(express.json());

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

app.use(express.static(path.join(rootDirectory, '../dist')));
app.get(/^(?!\/api).*/, (_request, response) => {
  response.sendFile(path.join(rootDirectory, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`School Management API listening on port ${port}`);
});