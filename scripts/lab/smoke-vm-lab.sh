#!/usr/bin/env bash
# Smoke checks for VM-Lab (docsops.local + demo.docsops.local). Run on a machine that resolves both hosts.
set -euo pipefail

LANDING_URL="${LANDING_URL:-http://docsops.local}"
DEMO_URL="${DEMO_URL:-http://demo.docsops.local}"
PASSWORD="${DEMO_PASSWORD:-DocsOps1}"

echo "== Landing =="
curl -fsS -o /dev/null -w "landing %{http_code}\n" "$LANDING_URL/"

echo "== Demo health =="
curl -fsS -o /dev/null -w "health %{http_code}\n" "$DEMO_URL/health"
curl -fsS -o /dev/null -w "ready %{http_code}\n" "$DEMO_URL/ready"

echo "== Demo logins (DocsOps1) =="
for email in \
  admin@demo.docsops.local \
  company.lead@demo.docsops.local \
  department.lead@demo.docsops.local \
  team.lead@demo.docsops.local \
  member@demo.docsops.local
do
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$DEMO_URL/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}")
  echo "$email -> $code"
  [[ "$code" == "204" ]] || { echo "login failed for $email"; exit 1; }
done

echo "OK: landing + five demo roles"
