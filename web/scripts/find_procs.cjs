const { Client } = require('../backend/node_modules/pg');
const c = new Client({ connectionString: 'postgresql://postgres.dzyjchpbrqasblnvzjkk:Nhatvy1707%40@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres', ssl: { rejectUnauthorized: false } });
c.connect().then(async () => {
  const r = await c.query("SELECT proname, pg_get_function_arguments(p.oid) as args, pg_get_function_result(p.oid) as ret FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND (proname ILIKE '%hoa%don%' OR proname ILIKE '%khach%moi%')");
  console.log(r.rows);
  await c.end();
});
