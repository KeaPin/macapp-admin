/*
  临时脚本（JS 版）：读取 wrangler.jsonc 的 Hyperdrive 连接串，检查数据库表结构并输出样例数据。
  用法：
    node scripts/inspect-db.mjs
*/

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const { Client } = pg;

function readWranglerConfig(projectRoot) {
  const wranglerPath = path.join(projectRoot, "wrangler.jsonc");
  const content = fs.readFileSync(wranglerPath, "utf8");
  const withoutBlockComments = content.replace(/\/\*[\s\S]*?\*\//g, "");
  const withoutLineComments = withoutBlockComments.replace(/(^|\s)\/\/.*$/gm, "");
  return JSON.parse(withoutLineComments);
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const projectRoot = path.dirname(path.dirname(__filename));
  const cfg = readWranglerConfig(projectRoot);
  const dsn = cfg?.hyperdrive?.[0]?.localConnectionString;
  if (!dsn) {
    console.error("未在 wrangler.jsonc 中找到 hyperdrive.localConnectionString");
    process.exit(1);
  }

  const client = new Client({ connectionString: dsn });
  await client.connect();
  try {
    const tables = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log("Tables:", tables.rows.map((r) => r.table_name));

    for (const { table_name } of tables.rows) {
      console.log("\n===> Table:", table_name);
      const cols = await client.query(
        "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
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


