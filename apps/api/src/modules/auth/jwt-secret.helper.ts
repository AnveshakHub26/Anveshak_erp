export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is not configured in .env');
  }
  return secret;
}
