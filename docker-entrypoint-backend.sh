#!/bin/sh
set -e

cd /app/backend

echo "Running Prisma db push..."
npx prisma db push --schema=./prisma/schema.prisma

echo "Seeding database..."
node prisma/seed.js

echo "Starting backend..."
exec node server.js
