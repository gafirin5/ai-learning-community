/**
 * Apply Learning Lab migrations to Supabase via pooler (transaction mode 6543).
 * Usage: DATABASE_URL="postgresql://postgres.<ref>:<PASS>@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres" node apply-lab.mjs
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const REPO = 'C:/Users/Administrator/ai-learning-community';

const FILES = [
  'supabase/migrations/20260902000001_learning_paths.sql',
  'supabase/migrations/20260902000002_flashcards.sql',
];

const connStr = process.env.DATABASE_URL;
if (!connStr) {
  console.error('ERROR: set DATABASE_URL env var first');
  process.exit(1);
}

(async () => {
  const client = new Client({
    connectionString: connStr,
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
        where schemaname='public' and tablename in ('path_enrollments','flashcard_progress')
      union all
      select 'function', proname from pg_proc
        where proname in ('enroll_path','unenroll_path','mark_path_course_done','claim_path_bonus')
      order by kind, name;
    `);
    console.log('== Verification:');
    for (const row of verify.rows) console.log(`   [${row.kind}] ${row.name}`);

    // verify RPC grants to authenticated
    const grants = await client.query(`
      select p.proname, count(g.grantee) as grants
      from pg_proc p
      left join information_schema.role_routine_grants g
        on g.specific_name = p.proname and g.grantee = 'authenticated'
      where p.proname in ('enroll_path','unenroll_path','mark_path_course_done','claim_path_bonus')
      group by p.proname order by p.proname;
    `);
    console.log('== Grants (authenticated):');
    for (const row of grants.rows) console.log(`   ${row.proname}: ${row.grants}`);
  } catch (e) {
    console.error('FATAL:', e.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
})();
