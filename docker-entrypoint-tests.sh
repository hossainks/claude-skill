#!/bin/bash
set -e

echo "Creating test user..."
STATUS=$(curl -s -o /tmp/reg.json -w "%{http_code}" \
  -X POST http://backend:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"TestXacfub123%"}')
echo "Registration HTTP $STATUS: $(cat /tmp/reg.json)"
# 201 = created, 409 = already exists — both are acceptable
[ "$STATUS" = "201" ] || [ "$STATUS" = "409" ] || \
  (echo "ERROR: unexpected registration status $STATUS" && exit 1)

echo "Running Playwright tests..."
exec npx playwright test
