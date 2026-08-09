import { MIGRATIONS, LATEST_VERSION } from '../src/db/schema';

describe('schema migrations', () => {
  it('has ordered, non-duplicate versions', () => {
    const versions = MIGRATIONS.map((m) => m.version);
    expect(versions).toEqual([...new Set(versions)].sort((a, b) => a - b));
  });

  it('exports latest version as the last migration version', () => {
    expect(LATEST_VERSION).toBe(MIGRATIONS[MIGRATIONS.length - 1].version);
  });

  it('includes the tasks table with actual_min and completed_at columns in migration 1', () => {
    const tasksSql = MIGRATIONS[0].statements.find((s) => /CREATE TABLE IF NOT EXISTS tasks/i.test(s));
    expect(tasksSql).toBeDefined();
    expect(tasksSql).toMatch(/actual_min/i);
    expect(tasksSql).toMatch(/completed_at/i);
  });

  it('adds the model_state cache table in migration 2', () => {
    const modelSql = MIGRATIONS[1].statements.find((s) => /CREATE TABLE IF NOT EXISTS model_state/i.test(s));
    expect(modelSql).toBeDefined();
  });
});
