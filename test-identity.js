const { normalizeId } = require('./lib/runtime/id-normalizer');

console.log("=== ID NORMALIZER TEST ===\n");

const inputs = [
  "ws_demo_001",
  "proj_test_001",
  "user_123",
  "550e8400-e29b-41d4-a716-446655440000",
];

for (const input of inputs) {
  const out = normalizeId(input, "test");
  console.log(input, "→", out);
}