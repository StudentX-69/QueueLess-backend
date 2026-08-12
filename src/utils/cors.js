function parseAllowedOrigins() {
  return (process.env.CLIENT_URL || 'https://studentx-69.github.io','http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function corsOrigin(origin, callback) {
  if (!origin || parseAllowedOrigins().includes(origin)) return callback(null, true);
  return callback(new Error(`Origin ${origin} not allowed by CORS`));
}

export function getCorsOptions() {
  return {
    origin: corsOrigin,
    credentials: true,
  };
}
