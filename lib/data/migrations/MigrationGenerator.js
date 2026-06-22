class MigrationGenerator {
  generate(name, fields) {
    const up = `CREATE TABLE ${name} (id SERIAL PRIMARY KEY${fields ? ',' + fields.map(f => ` ${f.name} ${f.type}`) : ''});`;
    const down = `DROP TABLE IF EXISTS ${name};`;
    return { success: true, migration: { name, up: () => ({ sql: up }), down: () => ({ sql: down }), generatedAt: Date.now() } };
  }
}
module.exports = { MigrationGenerator };
