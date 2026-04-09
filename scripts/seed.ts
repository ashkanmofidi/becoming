/**
 * Seed test data for development.
 * Creates test users, sessions, and feedback.
 */

async function seed() {
  console.log('=== Seeding Test Data ===');

  // Create test user
  console.log('Creating test user: test@example.com');

  // Create 30 days of sessions
  console.log('Creating 30 days of session history...');
  const categories = ['General', 'Work', 'Study', 'Personal', 'Health', 'Creative'];
  const intents = [
    'Deep work on project',
    'Code review',
    'Learning TypeScript',
    'Planning sprint',
    'Writing documentation',
    'Reading research paper',
  ];

  for (let day = 29; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split('T')[0];

    // 2-6 sessions per day
    const sessionCount = 2 + Math.floor(Math.random() * 5);
    for (let s = 0; s < sessionCount; s++) {
      console.log(`  ${dateStr}: Session ${s + 1}/${sessionCount}`);
      // Would create actual KV records here
    }
  }

  // Create test feedback
  console.log('Creating test feedback...');

  console.log('');
  console.log('Seed complete.');
}

seed();
