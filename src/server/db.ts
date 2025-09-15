import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

export type EnvWithHyperdrive = {
  HYPERDRIVE: { connectionString: string };
};

declare global {
  // eslint-disable-next-line no-var
  var __pgPools: Map<string, Pool> | undefined;
  // eslint-disable-next-line no-var
  var __schemaInitializedForDsn: Set<string> | undefined;
}

function getPoolsRegistry(): Map<string, Pool> {
  if (!globalThis.__pgPools) {
    globalThis.__pgPools = new Map<string, Pool>();
  }
  return globalThis.__pgPools;
}

function getSchemaInitRegistry(): Set<string> {
  if (!globalThis.__schemaInitializedForDsn) {
    globalThis.__schemaInitializedForDsn = new Set<string>();
  }
  return globalThis.__schemaInitializedForDsn;
}

export function getPool(env: EnvWithHyperdrive): Pool {
  const dsn = env.HYPERDRIVE.connectionString;
  const registry = getPoolsRegistry();
  let pool = registry.get(dsn);
  if (!pool) {
    pool = new Pool({ connectionString: dsn, max: 5 });
    registry.set(dsn, pool);
  }
  return pool;
}

export async function ensureSchema(env: EnvWithHyperdrive): Promise<void> {
  const dsn = env.HYPERDRIVE.connectionString;
  const initRegistry = getSchemaInitRegistry();
  if (initRegistry.has(dsn)) return;

  const pool = getPool(env);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // 防并发初始化，事务级建议锁
    await client.query("SELECT pg_advisory_xact_lock($1)", [708201002]);

    // categories 表与序列（避免 SERIAL 并发创建序列的冲突）
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await client.query(`CREATE SEQUENCE IF NOT EXISTS categories_id_seq;`);
    await client.query(
      `ALTER TABLE categories ALTER COLUMN id SET DEFAULT nextval('categories_id_seq');`
    );
    await client.query(
      `ALTER SEQUENCE categories_id_seq OWNED BY categories.id;`
    );

    // resources 表与序列
    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await client.query(`CREATE SEQUENCE IF NOT EXISTS resources_id_seq;`);
    await client.query(
      `ALTER TABLE resources ALTER COLUMN id SET DEFAULT nextval('resources_id_seq');`
    );
    await client.query(
      `ALTER SEQUENCE resources_id_seq OWNED BY resources.id;`
    );

    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_resources_category_id ON resources(category_id);`
    );
    await client.query("COMMIT");
    initRegistry.add(dsn);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function runQuery<T extends QueryResultRow = QueryResultRow>(
  env: EnvWithHyperdrive,
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  await ensureSchema(env);
  const pool = getPool(env);
  return pool.query<T>(text, params);
}

export async function withClient<R>(
  env: EnvWithHyperdrive,
  fn: (client: PoolClient) => Promise<R>
): Promise<R> {
  await ensureSchema(env);
  const pool = getPool(env);
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}


