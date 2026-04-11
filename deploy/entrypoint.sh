#!/bin/sh
set -e

# Apply schema to runtime SQL backend
cd /app/shared
npx prisma db push --skip-generate --accept-data-loss

# Optional one-time seed (enable by setting RUN_SEED=true)
if [ "${RUN_SEED:-false}" = "true" ]; then
  npx prisma db seed || true
fi

cd /app
APP_ROLE=${APP_ROLE:-both}

if [ "$APP_ROLE" = "site" ]; then
  echo "Starting site on :3000..."
  exec env PORT=3000 node /app/site-standalone/server.js
elif [ "$APP_ROLE" = "admin" ]; then
  echo "Starting admin on :3001..."
  exec env PORT=3001 node /app/admin-standalone/server.js
else
  echo "Starting site on :3000 and admin on :3001..."
  PORT=3000 node /app/site-standalone/server.js &
  PORT=3001 node /app/admin-standalone/server.js &
  wait
fi
