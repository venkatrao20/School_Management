import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
const databaseUser = process.env.MYSQLUSER || process.env.MYSQL_USER;

if (!databaseUrl && !databaseUser) {
  console.warn('MySQL is not configured. Set DATABASE_URL or the MYSQL* variables before deployment.');
}

export const pool = mysql.createPool({
  uri: databaseUrl,
  host: process.env.MYSQLHOST || process.env.MYSQL_HOST,
  port: Number(process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
  user: databaseUser,
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});