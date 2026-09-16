import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
const databaseUser = process.env.MYSQLUSER || process.env.MYSQL_USER;
const databaseHost = process.env.MYSQLHOST || process.env.MYSQL_HOST;
const databaseName = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE;

if (!databaseUrl && (!databaseHost || !databaseUser || !databaseName)) {
  throw new Error(
    'MySQL is not configured. Set DATABASE_URL/MYSQL_URL or MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, and MYSQLDATABASE.'
  );
}

export const pool = mysql.createPool({
  uri: databaseUrl,
  host: databaseHost,
  port: Number(process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
  user: databaseUser,
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD,
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
});