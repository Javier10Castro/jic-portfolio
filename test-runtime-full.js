const { runPipeline, createProject } = require('./lib/runtime');
const { randomUUID } = require('crypto');
const { readFileSync } = require('fs');

const WS_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';

const formData = JSON.parse(readFileSync('./test-ecowash.json', 'utf-8'));

async function test() {
  console.log("=== FULL RUNTIME TEST ===\n");

  try {
    const suffix = Date.now().toString(36);
    // 1. Create project
    const project = await createProject({
      name: `EcoWash Express ${suffix}`,
      workspace_id: WS_ID,
      user_id: USER_ID,
      formData
    });

    console.log("✔ Project created:", project.id);

    // 2. Run pipeline
    const result = await runPipeline({
      project_id: project.id,
      workspace_id: WS_ID,
      execution_id: randomUUID(),
      user_id: USER_ID,
      input_type: "json_brief",
      formData
    });

    console.log("\n🚀 PIPELINE RESULT:\n");
    console.log(JSON.stringify({
      project_id: project.id,
      status: result.status,
      score: result.score,
      passed: result.passed,
      execution_id: result.execution_id
    }, null, 2));

    // 3. Read prompt_maestro from DB and verify it's compiled
    const { query } = require('./lib/db');
    const { rows } = await query(`SELECT prompt_maestro FROM projects WHERE id = $1`, [project.id]);
    const pm = rows[0].prompt_maestro;
    console.log("\n=== PROMPT MAESTRO (first 300 chars) ===\n");
    console.log(pm.slice(0, 300));
    console.log("\n---\n");
    if (pm.includes('**Empresa:** No especificado')) {
      console.log("❌ FAIL: prompt_maestro still contains 'No especificado' for Empresa");
    } else if (pm.includes('**Empresa:** EcoWash Express')) {
      console.log("✅ OK: prompt_maestro contains 'EcoWash Express' as business name");
    } else {
      console.log("⚠️  Unexpected: " + pm.match(/\*\*Empresa:\*\* (.+)/)?.[1]);
    }

    console.log("\n✔ FULL PIPELINE SUCCESS");

  } catch (err) {
    console.error("\n❌ TEST FAILED:\n", err);
  }
}

test();