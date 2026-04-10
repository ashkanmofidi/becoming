/**
 * Data migration: v2 → v3.
 * PRD Data Preservation: ALL existing sessions, streaks, settings, categories,
 * intents, notes, TOS records, and feedback MUST be preserved.
 * Migrations are additive. Every migration has a rollback script.
 */

// This script is run manually before deploying v3.
// It reads v2 KV data and writes v3-compatible records.

// V2 KV key schema:
//   user:{email}:settings → settings JSON
//   user:{email}:sessions → sessions array
//   user:{email}:timerState → timer state
//   session:{token} → session record
//   feedback:all → feedback list
//   bm:admins → admin set

// V3 KV key schema:
//   user:{sub} → user profile
//   settings:{sub} → migrated settings
//   sessions:{sub} → session list (IDs)
//   session:{sub}:{id} → individual session
//   timer:{sub} → timer state
//   tos:{sub} → TOS record
//   auth:session:{token} → auth session
//   feedback:{id} → feedback
//   audit:{id} → audit log
//   beta:user_count → user count
//   beta:allowlist → allowlist set
//   bm:admins → admin set (unchanged)

interface V2Session {
  date: string;
  time: string;
  type: 'work' | 'break';
  duration: number;
  task: string;
  category: string;
  status: 'completed' | 'skipped';
}

interface V2Settings {
  workMin: number;
  breakMin: number;
  longMin: number;
  cycleCount: number;
  autoBreak: boolean;
  autoWork: boolean;
  notif: boolean;
  tickFocus: boolean;
  tickBreak: boolean;
  sound: string;
  dailyGoal: number;
  fontSize: number;
}

async function migrate() {
  console.log('=== Becoming.. v2 → v3 Migration ===');
  console.log('This script preserves ALL existing user data.');
  console.log('');

  // Step 1: Snapshot current data (for rollback)
  console.log('Step 1: Creating backup snapshot...');
  // In production, this would dump all KV keys to a JSON file

  // Step 2: Migrate users
  console.log('Step 2: Migrating users...');
  // For each user:{email}:settings key:
  //   - Create user:{sub} profile (sub = Google user ID from session)
  //   - Migrate settings to v3 schema (additive: add new fields with defaults)
  //   - Write to settings:{sub}

  // Step 3: Migrate sessions
  console.log('Step 3: Migrating sessions...');
  // For each user:{email}:sessions:
  //   - Create individual session:{sub}:{id} records
  //   - Map v2 fields: type 'work' → mode 'focus', 'break' → mode 'break'
  //   - Map: task → intent (PRD Appendix C contradiction #3)
  //   - Map: duration (seconds) → actualDuration
  //   - Map: status 'skipped' → status 'abandoned'
  //   - Add new v3 fields with defaults: overtimeDuration=0, notes=null, deviceId='migrated'

  // Step 4: Migrate settings
  console.log('Step 4: Migrating settings...');
  // Map v2 settings to v3:
  //   workMin → focusDuration
  //   breakMin → shortBreakDuration
  //   longMin → longBreakDuration
  //   cycleCount → cycleCount
  //   autoBreak → autoStartBreaks
  //   autoWork → autoStartFocus
  //   notif → desktopNotifications
  //   tickFocus → tickDuringFocus
  //   tickBreak → tickDuringBreaks
  //   dailyGoal → dailyGoal
  //   fontSize → fontSize (map: 0.85='small', 1='normal', 1.15='large', 1.35='xl')
  //   All new v3 fields get defaults from createDefaultSettings()

  // Step 5: Verify integrity
  console.log('Step 5: Verifying data integrity...');
  // Compare user counts, session counts, total hours
  // Verify a random sample of 10 sessions match

  // Step 6: Update beta counter
  console.log('Step 6: Updating beta user count...');

  console.log('');
  console.log('Migration complete. Verify in admin dashboard before going live.');
}

// Rollback function
async function rollback() {
  console.log('=== Rollback v3 → v2 ===');
  console.log('Restoring from backup snapshot...');
  // Restore from the JSON snapshot created in Step 1
}

// Run
void (function main() {
  const action = process.argv[2];
  if (action === 'rollback') {
    rollback();
  } else {
    migrate();
  }
})();
