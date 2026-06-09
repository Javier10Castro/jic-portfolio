const { initEnv } = require('../lib/bootstrap/env');
initEnv();
const { query } = require('../lib/db');
(async () => {
  const PID = '00000000-0000-0000-0000-000000000003';
  await query("SET SESSION app.current_user_id = '00000000-0000-0000-0000-000000000002'");
  await query(`UPDATE projects SET status = 'draft', version = 1, current_preview_id = NULL, updated_at = NOW() WHERE id = $1`, [PID]);
  await query(`DELETE FROM previews WHERE project_id = $1`, [PID]);
  await query(`DELETE FROM decisions WHERE project_id = $1`, [PID]);
  await query(`DELETE FROM executions WHERE project_id = $1`, [PID]);
  await query(`DELETE FROM project_states WHERE project_id = $1`, [PID]);
  console.log('Project reset to draft');
  process.exit(0);
})();
