'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Load .env from the backend root regardless of where the process is started.
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  databaseUrl: process.env.DATABASE_URL || '',
  pg: {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  },

  jwtSecret: process.env.JWT_SECRET || 'insecure-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',

  // Google OAuth client id — used to verify Google sign-in tokens.
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',

  // Email (SMTP) settings for nodemailer.
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  mailFrom: process.env.MAIL_FROM || '',
  mailFromName: process.env.MAIL_FROM_NAME || 'StayMate',

  storageDriver: (process.env.STORAGE_DRIVER || 'local').toLowerCase(),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || 'http://localhost:4000').replace(/\/$/, ''),

  contabo: {
    endpoint: process.env.CONTABO_ENDPOINT || '',
    region: process.env.CONTABO_REGION || '',
    bucket: process.env.CONTABO_BUCKET || '',
    accessKey: process.env.CONTABO_ACCESS_KEY || '',
    secretKey: process.env.CONTABO_SECRET_KEY || '',
    publicUrl: (process.env.CONTABO_PUBLIC_URL || '').replace(/\/$/, ''),
  },

  // Secret that gates the error-log viewer (GET /api/log-error?key=...).
  // In production this MUST be set or the endpoint stays locked. In development
  // the viewer is open (no key needed).
  logAccessKey: process.env.LOG_ACCESS_KEY || '',

  isProd: process.env.NODE_ENV === 'production',
  bool,
};

module.exports = env;
