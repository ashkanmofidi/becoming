#!/usr/bin/env npx tsx
/**
 * KV Backup Script — Step A1
 *
 * Reads all user data from Vercel KV and writes to a timestamped JSON file.
 * READ-ONLY: never writes to KV.
 *
 * Usage: npx tsx scripts/backup-kv.ts
 * Output: backups/kv-backup-YYYY-MM-DDTHH-MM-SS.json
 */

import { kv } from '@vercel/kv';
import * as fs from 'fs';
import * as path from 'path';

interface BackupData {
  timestamp: string;
  keys: Record<string, unknown>;
  lists: Record<string, unknown[]>;
  sets: Record<string, string[]>;
  scalars: Record<string, unknown>;
  meta: {
    totalKeys: number;
    totalRecords: number;
    durationMs: number;
  };
}

async function main() {
  const start = Date.now();
  console.log('Starting KV backup...');

  const backup: BackupData = {
    timestamp: new Date().toISOString(),
    keys: {},
    lists: {},
    sets: {},
    scalars: {},
    meta: { totalKeys: 0, totalRecords: 0, durationMs: 0 },
  };

  // 1. Scan all keys
  let cursor = 0;
  const allKeys: string[] = [];
  do {
    const [nextCursor, keys] = await kv.scan(cursor, { count: 100 });
    cursor = typeof nextCursor === 'string' ? parseInt(nextCursor, 10) : nextCursor;
    allKeys.push(...keys);
  } while (cursor !== 0);

  console.log(`Found ${allKeys.length} keys in KV`);
  backup.meta.totalKeys = allKeys.length;

  // 2. Categorize and fetch each key
  for (const key of allKeys) {
    try {
      // LIST keys
      if (
        key.startsWith('sessions:') ||
        key === 'feedback:all' ||
        key === 'audit:all'
      ) {
        const len = await kv.llen(key);
        const items = await kv.lrange(key, 0, len - 1);
        backup.lists[key] = items;
        backup.meta.totalRecords += items.length;
        console.log(`  LIST ${key}: ${items.length} items`);
        continue;
      }

      // SET keys
      if (
        key === 'beta:allowlist' ||
        key === 'bm:admins'
      ) {
        const members = await kv.smembers(key);
        backup.sets[key] = members;
        backup.meta.totalRecords += members.length;
        console.log(`  SET  ${key}: ${members.length} members`);
        continue;
      }

      // SCALAR keys (counters)
      if (key === 'beta:user_count') {
        const val = await kv.get(key);
        backup.scalars[key] = val;
        backup.meta.totalRecords++;
        console.log(`  NUM  ${key}: ${val}`);
        continue;
      }

      // Everything else: JSON objects
      const val = await kv.get(key);
      backup.keys[key] = val;
      backup.meta.totalRecords++;
      console.log(`  KEY  ${key}`);
    } catch (err) {
      console.error(`  ERROR reading ${key}:`, err);
      backup.keys[`__error__${key}`] = String(err);
    }
  }

  // 3. Write to file
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filename = `kv-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const filepath = path.join(backupDir, filename);

  backup.meta.durationMs = Date.now() - start;

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

  console.log(`\nBackup complete!`);
  console.log(`  File: ${filepath}`);
  console.log(`  Keys: ${backup.meta.totalKeys}`);
  console.log(`  Records: ${backup.meta.totalRecords}`);
  console.log(`  Duration: ${backup.meta.durationMs}ms`);
}

main().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
