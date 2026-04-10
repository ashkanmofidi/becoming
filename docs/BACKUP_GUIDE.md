# Backup Guide — Vercel KV Data

How to back up, automate, and restore all KV data for the Becoming app.

---

## 1. Manual Backup via Vercel CLI

### Prerequisites

```bash
npm i -g vercel
vercel login
vercel link   # link to your project
```

### Export All KV Data

```bash
# Install redis-cli (macOS)
brew install redis

# Get your KV credentials from Vercel dashboard:
# Project > Storage > KV > Settings > REST API credentials

# Set credentials
export KV_REST_URL="https://your-kv-url.upstash.io"
export KV_REST_TOKEN="your-rest-token"

# Dump all keys and values to a JSON file
npx @upstash/cli export --url "$KV_REST_URL" --token "$KV_REST_TOKEN" > backup-$(date +%Y%m%d).json
```

### Alternative: Script-Based Export

If the Upstash CLI is not available, use this Node.js script:

```js
// scripts/backup-kv.mjs
import { createClient } from "@vercel/kv";

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

async function backup() {
  const keys = [];
  let cursor = 0;

  // Scan all keys
  do {
    const [nextCursor, batch] = await kv.scan(cursor, { count: 100 });
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== 0);

  console.error(`Found ${keys.length} keys`);

  // Fetch all values
  const data = {};
  for (const key of keys) {
    const type = await kv.type(key);
    if (type === "string") {
      data[key] = { type: "string", value: await kv.get(key) };
    } else if (type === "hash") {
      data[key] = { type: "hash", value: await kv.hgetall(key) };
    } else if (type === "list") {
      data[key] = { type: "list", value: await kv.lrange(key, 0, -1) };
    } else if (type === "set") {
      data[key] = { type: "set", value: await kv.smembers(key) };
    } else if (type === "zset") {
      data[key] = { type: "zset", value: await kv.zrange(key, 0, -1, { withScores: true }) };
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.json`;

  // Write to stdout for piping, or save to file
  console.log(JSON.stringify(data, null, 2));
  console.error(`Backup complete: ${keys.length} keys exported`);
}

backup().catch(console.error);
```

Run it:

```bash
KV_REST_API_URL="..." KV_REST_API_TOKEN="..." node scripts/backup-kv.mjs > backups/backup-$(date +%Y%m%d).json
```

---

## 2. Automated Daily Backup (Vercel Cron)

### Option A: Vercel Cron Job

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Create the cron endpoint:

```ts
// apps/web/src/app/api/cron/backup/route.ts
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(req: Request) {
  // Verify cron secret (Vercel sets this header automatically)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys: string[] = [];
  let cursor = 0;

  do {
    const [nextCursor, batch] = await kv.scan(cursor, { count: 100 });
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== 0);

  const data: Record<string, unknown> = {};
  for (const key of keys) {
    data[key] = await kv.get(key);
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const backupKey = `backup:${timestamp}`;

  // Store backup in KV itself (simple approach)
  await kv.set(backupKey, JSON.stringify(data), { ex: 30 * 86400 }); // 30-day TTL

  // Clean up backups older than 30 days (handled by TTL above)

  return NextResponse.json({
    status: "ok",
    keys: keys.length,
    backupKey,
  });
}
```

Add the env var in Vercel dashboard:

```
CRON_SECRET=<generate a random string>
```

### Option B: GitHub Actions (External)

```yaml
# .github/workflows/backup.yml
name: KV Backup
on:
  schedule:
    - cron: "0 3 * * *" # Daily at 3am UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Run backup
        env:
          KV_REST_API_URL: ${{ secrets.KV_REST_API_URL }}
          KV_REST_API_TOKEN: ${{ secrets.KV_REST_API_TOKEN }}
        run: node scripts/backup-kv.mjs > backup.json
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: kv-backup-${{ github.run_id }}
          path: backup.json
          retention-days: 90
```

---

## 3. Recovery Procedure

### Restore from a Backup File

```js
// scripts/restore-kv.mjs
import { createClient } from "@vercel/kv";
import { readFileSync } from "fs";

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

async function restore(filePath) {
  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  const keys = Object.keys(data);

  console.log(`Restoring ${keys.length} keys...`);

  for (const key of keys) {
    const entry = data[key];
    if (entry.type === "string") {
      await kv.set(key, entry.value);
    } else if (entry.type === "hash") {
      await kv.hset(key, entry.value);
    }
    // Add other types as needed
  }

  console.log(`Restore complete: ${keys.length} keys written`);
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/restore-kv.mjs <backup-file.json>");
  process.exit(1);
}

restore(file).catch(console.error);
```

Run it:

```bash
KV_REST_API_URL="..." KV_REST_API_TOKEN="..." node scripts/restore-kv.mjs backups/backup-20260407.json
```

### Restore from KV-Stored Backup (if using cron approach)

```bash
# List available backups
npx @upstash/cli keys "backup:*" --url "$KV_REST_URL" --token "$KV_REST_TOKEN"

# Retrieve a specific backup
npx @upstash/cli get "backup:2026-04-07" --url "$KV_REST_URL" --token "$KV_REST_TOKEN" > restore.json
```

---

## 4. Recommendations

- **Start with Option A** (Vercel Cron) for simplicity. It requires no external infrastructure.
- **30-day retention** is sufficient for most recovery scenarios. Adjust the TTL as needed.
- **Test the restore process** at least once after setting up backups to confirm it works end-to-end.
- **Monitor backup size**: If KV data grows large, consider compressing backups or using external storage (S3, R2).
- **Critical data**: User settings, session history, and feedback are the highest-priority keys to back up.
