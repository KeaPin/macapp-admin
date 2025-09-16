/* 直接用与 API 一致的 SQL 连库验证是否返回数据 */
import fs from "fs";
import path from "path";
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
  const projectRoot = process.cwd();
  const cfg = readWranglerConfig(projectRoot);
  const dsn = cfg?.hyperdrive?.[0]?.localConnectionString;
  if (!dsn) throw new Error("未找到 hyperdrive.localConnectionString");

  const client = new Client({ connectionString: dsn });
  await client.connect();
  try {
    const categoriesSql = `
      SELECT * FROM (
        SELECT id::double precision AS id, name, description AS description
        FROM categories
        UNION ALL
        SELECT (id)::double precision AS id, name, description AS description
        FROM category
        WHERE id ~ '^[0-9]+$'
      ) t
      ORDER BY id DESC
      LIMIT 5
    `;
    const categories = await client.query(categoriesSql);
    console.log("categories count:", categories.rowCount);
    console.dir(categories.rows, { depth: null });

    const resourcesSql = `
      WITH rl AS (
        SELECT DISTINCT ON (resource_id)
          resource_id,
          link
        FROM resource_link
        ORDER BY resource_id, update_time DESC NULLS LAST
      ),
      rc AS (
        SELECT DISTINCT ON (trim(resource_id))
          trim(resource_id) AS rid,
          trim(category_id) AS cid
        FROM resource_category
        ORDER BY trim(resource_id), create_time DESC NULLS LAST
      )
      SELECT * FROM (
        SELECT 
          r.id::double precision            AS id,
          r.title                           AS title,
          r.url                             AS url,
          r.category_id::double precision   AS category_id,
          r.synopsis                        AS synopsis
        FROM resources r
        UNION ALL
        SELECT 
          (re.id)::double precision                                            AS id,
          re.name                                                              AS title,
          COALESCE(rl.link, '#')                                               AS url,
          CASE WHEN rc.cid ~ '^[0-9]+$' THEN (rc.cid)::double precision ELSE NULL END AS category_id,
          NULL::text                                                           AS synopsis
        FROM resource re
        LEFT JOIN rl ON rl.resource_id = re.id
        LEFT JOIN rc ON rc.rid = re.id
      ) t
      ORDER BY id DESC
      LIMIT 5
    `;
    const resources = await client.query(resourcesSql);
    console.log("resources count:", resources.rowCount);
    console.dir(resources.rows, { depth: null });
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


