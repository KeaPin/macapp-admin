import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

export type EnvWithHyperdrive = {
  HYPERDRIVE: { connectionString: string };
  // 可选：R2 存储桶绑定（通过 wrangler r2_buckets 绑定）。
  R2?: unknown;
  // 认证和会话管理
  SECRET_COOKIE_PASSWORD?: string;
  // R2 公共基础 URL
  R2_PUBLIC_BASE?: string;
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
  if (!env.HYPERDRIVE) {
    console.error("[DB] HYPERDRIVE binding not found in environment");
    throw new Error("HYPERDRIVE binding not configured");
  }
  
  const dsn = env.HYPERDRIVE.connectionString;
  if (!dsn) {
    console.error("[DB] HYPERDRIVE connection string is empty");
    throw new Error("HYPERDRIVE connection string not configured");
  }
  
  console.log("[DB] Getting pool for DSN:", dsn.replace(/:[^:]*@/, ':***@')); // 隐藏密码
  
  const registry = getPoolsRegistry();
  let pool = registry.get(dsn);
  if (!pool) {
    console.log("[DB] Creating new pool");
    pool = new Pool({ 
      connectionString: dsn, 
      max: 5,
      // 增加超时设置
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      query_timeout: 10000,
    });
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
        status TEXT NOT NULL DEFAULT 'NORMAL',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    // 兼容旧库：若曾误建为 synopsis 列，确保存在 description 列并在存在 synopsis 列时迁移
    await client.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;`);
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'categories' AND column_name = 'synopsis'
        ) THEN
          UPDATE categories SET description = synopsis
          WHERE description IS NULL AND synopsis IS NOT NULL;
        END IF;
      END
      $$;
    `);
    await client.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'NORMAL';`);
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
        synopsis TEXT,
        icon TEXT,
        status TEXT NOT NULL DEFAULT 'NORMAL',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    // 兼容旧库：若旧表为 description 列，补充 synopsis 并在存在 description 列时迁移数据
    await client.query(`ALTER TABLE resources ADD COLUMN IF NOT EXISTS synopsis TEXT;`);
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'resources' AND column_name = 'description'
        ) THEN
          UPDATE resources SET synopsis = description
          WHERE synopsis IS NULL AND description IS NOT NULL;
        END IF;
      END
      $$;
    `);
    await client.query(`ALTER TABLE resources ADD COLUMN IF NOT EXISTS icon TEXT;`);
    await client.query(`ALTER TABLE resources ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'NORMAL';`);
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

    // user 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id varchar(32) PRIMARY KEY NOT NULL,
        user_name varchar(255),
        password varchar(255) NOT NULL,
        avatar varchar(255),
        email varchar(255),
        role varchar(255),
        status varchar(255) NOT NULL DEFAULT 'NORMAL',
        create_time timestamp(6) NOT NULL DEFAULT now()
      );
    `);

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
  try {
    console.log("[DB] Running query:", text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    await ensureSchema(env);
    const pool = getPool(env);
    
    const startTime = Date.now();
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - startTime;
    
    console.log(`[DB] Query completed in ${duration}ms, returned ${result.rows.length} rows`);
    
    return result;
  } catch (error) {
    console.error("[DB] Query failed:", {
      query: text.substring(0, 200),
      params: params?.length,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
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


