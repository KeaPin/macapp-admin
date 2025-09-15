/*
  临时脚本：读取 wrangler.jsonc 中的 Hyperdrive 连接串，检查数据库表结构并输出样例数据。
  用法：
    npx ts-node --transpile-only scripts/inspect-db.ts
*/

import fs from "fs";
import path from "path";
import { Client } from "pg";

type WranglerConfig = {
  hyperdrive?: Array<{
    binding: string;
    id: string;
    localConnectionString?: string;
  }>;
};

function readWranglerConfig(projectRoot: string): WranglerConfig {
  const wranglerPath = path.join(projectRoot, "wrangler.jsonc");
  const content = fs.readFileSync(wranglerPath, "utf8");
  // 粗略去注释（简单处理 // 与 /** */），再做 JSON.parse
  const withoutBlockComments = content.replace(/\/\*[\s\S]*?\*\//g, "");
  const withoutLineComments = withoutBlockComments.replace(/(^|\s)\/\/.*$/gm, "");
  return JSON.parse(withoutLineComments) as WranglerConfig;
}

async function main() {
  const projectRoot = process.cwd();
  const cfg = readWranglerConfig(projectRoot);
  const dsn = cfg.hyperdrive?.[0]?.localConnectionString;
  if (!dsn) {
    console.error("未在 wrangler.jsonc 中找到 hyperdrive.localConnectionString");
    process.exit(1);
  }

  const client = new Client({ connectionString: dsn });
  await client.connect();
  try {
    // 列出 public 下的表
    const tables = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name` 
    );
    console.log("Tables:", tables.rows.map((r) => r.table_name));

    for (const { table_name } of tables.rows) {
      console.log("\n===> Table:", table_name);
      const cols = await client.query<{ column_name: string; data_type: string; is_nullable: string }>(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
        [table_name]
      );
      console.table(cols.rows);

      const sample = await client.query(`SELECT * FROM ${table_name} ORDER BY 1 DESC LIMIT 3`);
      console.dir(sample.rows, { depth: null });
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


