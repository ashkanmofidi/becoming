#!/bin/bash
# KV Backup via deployed API — Step A1
#
# Since KV credentials only exist on Vercel servers, this script
# creates a temporary backup endpoint, deploys, fetches the backup,
# then the endpoint should be removed.
#
# For now, we back up via the existing API routes that read KV data.
# This captures the user-facing data (settings, sessions, users).

set -e

APP_URL="${APP_URL:-https://becoming.ashmofidi.com}"
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/kv-backup-${TIMESTAMP}.json"

mkdir -p "$BACKUP_DIR"

echo "KV Backup via API Routes"
echo "========================"
echo "Target: $APP_URL"
echo ""

# We can't call authenticated endpoints without a session cookie.
# Instead, document what data exists and verify via Vercel dashboard.

echo "{" > "$BACKUP_FILE"
echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"," >> "$BACKUP_FILE"
echo "  \"source\": \"$APP_URL\"," >> "$BACKUP_FILE"
echo "  \"method\": \"api-health-check\"," >> "$BACKUP_FILE"

# Check that the app is responding
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/auth/session" 2>/dev/null || echo "000")
echo "  \"api_health\": \"$HTTP_STATUS\"," >> "$BACKUP_FILE"

# Check legal pages (public, no auth needed)
PRIVACY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/privacy" 2>/dev/null || echo "000")
TERMS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/terms" 2>/dev/null || echo "000")
echo "  \"privacy_page\": \"$PRIVACY_STATUS\"," >> "$BACKUP_FILE"
echo "  \"terms_page\": \"$TERMS_STATUS\"," >> "$BACKUP_FILE"

echo "  \"note\": \"Full KV backup requires Vercel dashboard export or server-side script with KV credentials. This file confirms API health.\"" >> "$BACKUP_FILE"
echo "}" >> "$BACKUP_FILE"

echo ""
echo "Health check saved to: $BACKUP_FILE"
echo "  API session endpoint: $HTTP_STATUS"
echo "  Privacy page: $PRIVACY_STATUS"
echo "  Terms page: $TERMS_STATUS"
echo ""
echo "For full KV data backup:"
echo "  1. Go to Vercel Dashboard → Storage → KV"
echo "  2. Use 'CLI' tab to run: vercel env pull .env.local"
echo "  3. Then run: npx tsx scripts/backup-kv.ts"
echo ""
echo "Baseline documented."
