import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
const databaseUser = process.env.MYSQLUSER || process.env.MYSQL_USER;
const databaseHost = process.env.MYSQLHOST || process.env.MYSQL_HOST;
const databaseName = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE;
const databasePort = Number(process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306);
const databasePassword = process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD;

if (!databaseUrl && (!databaseHost || !databaseUser || !databaseName)) {
  throw new Error(
    'MySQL is not configured. Set DATABASE_URL/MYSQL_URL or MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, and MYSQLDATABASE.'
  );
}

export const pool = mysql.createPool({
  uri: databaseUrl,
  host: databaseHost,
  port: databasePort,
  user: databaseUser,
  password: databasePassword,
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
});

export async function ensureDatabase() {
  if (databaseUrl) return;
  if (!/^[A-Za-z0-9_]+$/.test(databaseName || '')) {
    throw new Error('MYSQLDATABASE may contain only letters, numbers, and underscores.');
  }

  const bootstrap = await mysql.createConnection({
    host: databaseHost,
    port: databasePort,
    user: databaseUser,
    password: databasePassword,
  });
  try {
    await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await bootstrap.end();
  }
}
