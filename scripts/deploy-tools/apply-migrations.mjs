/**
 * Apply feature migrations to Supabase via pooler (transaction mode 6543).
 * Usage: DATABASE_URL="postgresql://postgres.oucvzigtxfsdquzhrpwf:<PASS>@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres" node apply-migrations.mjs
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const REPO = 'C:/Users/Administrator/ai-learning-community';

const FILES = [
  'src/features/mentor/migrations/20260829_mentor_hub.sql',
  'src/features/realtime/migrations/20260830_realtime_notifications.sql',
  'src/features/ai-tutor/migrations/20260831_ai_tutor_production.sql',
];

const connStr = process.env.DATABASE_URL;
const hasPgEnv = process.env.PGHOST && process.env.PGUSER;
if (!connStr && !hasPgEnv) {
  console.error('ERROR: set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD env vars first');
  process.exit(1);
}

(async () => {
  const client = new Client({
    ...(connStr ? { connectionString: connStr } : {}),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  try {
    console.log('Connecting to Supabase pooler...');
    await client.connect();
    console.log('Connected.\n');

    for (const f of FILES) {
      const full = path.join(REPO, f);
      const sql = fs.readFileSync(full, 'utf8');
      console.log(`== Applying ${f} (${sql.length} bytes)...`);
      try {
        // single simple-query call = implicit transaction, all-or-nothing per file
        await client.query(sql);
        console.log('   OK\n');
      } catch (e) {
        console.error(`   FAILED: ${e.message}`);
        if (e.position) {
          const lines = sql.slice(0, parseInt(e.position, 10)).split('\n');
          console.error(`   near line ${lines.length}: ${lines[lines.length - 1].trim()}`);
        }
        process.exit(2);
      }
    }

    // verify objects exist
    const verify = await client.query(`
      select 'table' as kind, tablename as name from pg_tables
        where schemaname='public' and tablename in ('mentoring_sessions','mentor_reviews','mentor_availability','chat_history','chat_quota','notifications')
      union all
      select 'function', proname from pg_proc
        where proname in ('create_mentoring_session','update_booking_status','submit_mentor_review','get_available_slots','create_notification','update_chat_quota','check_chat_quota')
      order by kind, name;
    `);
    console.log('== Verification:');
    for (const row of verify.rows) console.log(`   [${row.kind}] ${row.name}`);
  } catch (e) {
    console.error('FATAL:', e.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
