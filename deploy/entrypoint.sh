#!/bin/sh
set -e

# Run Prisma migrations / create DB if it doesn't exist
cd /app/shared
npx prisma db push --skip-generate 2>/dev/null || true

# Seed if database is empty (first deploy)
if [ ! -f /data/.seeded ]; then
  npx prisma db seed 2>/dev/null && touch /data/.seeded || true
fi

cd /app

# Start both apps
# Site on port 3000, Admin on port 3001
echo "Starting site on :3000 and admin on :3001..."
PORT=3000 node /app/site-standalone/server.js &
PORT=3001 node /app/admin-standalone/server.js &

wait -n
