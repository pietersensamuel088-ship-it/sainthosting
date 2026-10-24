import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root or server dir
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const FORBIDDEN_PORTS = [8080, 8081, 8082, 8083, 8084];

const rawPort = parseInt(process.env.PORT || '5000', 10);
const rawClientPort = parseInt(process.env.CLIENT_PORT || '3000', 10);

if (FORBIDDEN_PORTS.includes(rawPort)) {
  console.error(`\x1b[41m\x1b[37m[CRITICAL SECURITY VIOLATION]\x1b[0m Port ${rawPort} is strictly reserved for active infrastructure nodes (8080-8084 forbidden). Exiting.`);
  process.exit(1);
}

if (FORBIDDEN_PORTS.includes(rawClientPort)) {
  console.error(`\x1b[41m\x1b[37m[CRITICAL SECURITY VIOLATION]\x1b[0m Client Port ${rawClientPort} is within forbidden range 8080-8084. Exiting.`);
  process.exit(1);
}

export const config = {
  port: rawPort,
  clientPort: rawClientPort,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'saint-cold-steel-super-secure-jwt-secret-99901234',
  adminPassword: process.env.ADMIN_PASSWORD || 'saint-admin-coldsteel-2026',
  adminEmail: process.env.ADMIN_EMAIL || 'sysadmin@sa1nt.xyz',
  baseUrl: process.env.BASE_URL || 'https://sa1nt.xyz',
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.sa1nt.xyz',
  corsOrigins: [
    `http://localhost:${rawClientPort}`,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://sa1nt.xyz',
    'https://*.sa1nt.xyz',
  ],
  maxBotsPerContainer: 5,
};
