const { runPipeline } = require('./lib/runtime');
const fs = require('fs');

const formData = JSON.parse(
  fs.readFileSync('./test-input.json', 'utf-8')
);

runPipeline({
  project_id: "proj_test_001",
  workspace_id: "ws_demo_001",
  execution_id: "exec_test_001",
  user_id: "usr_demo_001",
  input_type: "form_brief",
  formData
})
.then((result) => {
  console.log("\n🚀 PIPELINE RESULT:\n");
  console.log(JSON.stringify(result, null, 2));
})
.catch((err) => {
  console.error("\n❌ ERROR:\n", err);
});