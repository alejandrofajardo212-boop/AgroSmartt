import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (isProduction && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET must contain at least 32 characters in production.');
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:9000',
  jwtSecret: jwtSecret || 'development-only-secret-change-before-deploy-123456',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  dataFile: process.env.DATA_FILE || './data/agrosmart.json'
};
