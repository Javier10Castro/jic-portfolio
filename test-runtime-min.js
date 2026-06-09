const { createProject } = require('./lib/runtime');

const WS_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';

(async () => {
  console.log("=== CREATE PROJECT TEST ===\n");

  const suffix = Date.now().toString(36);
  const project = await createProject({
    name: `Salmos Café Test ${suffix}`,
    workspace_id: WS_ID,
    user_id: USER_ID
  });

  console.log("PROJECT CREATED:");
  console.log(project);

})();