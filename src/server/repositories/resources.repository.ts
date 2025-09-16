import { EnvWithHyperdrive, runQuery } from "@/server/db";
import { Resource } from "@/server/domain/models";

export type ResourceStatus = "NORMAL" | "VOID";

export async function findResourceById(
  env: EnvWithHyperdrive,
  id: string
): Promise<Resource | null> {
  const detail = await runQuery<{
    id: string;
    title: string;
    url: string;
    category_id: number | null;
    synopsis: string | null;
    status: string;
    icon: string | null;
  }>(
    env,
    `
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
      SELECT 
        re.id                                                                AS id,
        re.name                                                              AS title,
        COALESCE(rl.link, '#')                                               AS url,
        CASE WHEN rc.cid ~ '^[0-9]+$' THEN 
          CASE WHEN rc.cid::bigint <= 2147483647 THEN rc.cid::integer ELSE NULL END 
          ELSE NULL END    AS category_id,
        NULL::text                                                           AS synopsis,
        COALESCE(re.status, 'NORMAL')                                         AS status,
        re.icon                                                               AS icon
      FROM resource re
      LEFT JOIN rl ON rl.resource_id = re.id
      LEFT JOIN rc ON rc.rid = re.id
      WHERE re.id = $1
      LIMIT 1
    `,
    [id]
  );

  const row = detail.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    title: row.title,
    url: row.url,
    categoryId: row.category_id ?? null,
    synopsis: row.synopsis,
    status: (row.status as ResourceStatus) ?? "NORMAL",
    icon: row.icon ?? null,
  };
}

export async function findPagedResources(
  env: EnvWithHyperdrive,
  params: { page: number; pageSize: number; q?: string; status?: ResourceStatus | null }
): Promise<{ items: Array<{ id: string; title: string; category_names: string[]; icon: string | null; status: ResourceStatus }>; total: number }> {
  const page = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
  const pageSize = Number.isFinite(params.pageSize) && params.pageSize > 0 ? Math.min(Math.floor(params.pageSize), 100) : 10;
  const offset = (page - 1) * pageSize;

  const qRaw = (params.q ?? "").trim();
  const qParam = qRaw ? `%${qRaw}%` : null;
  const statusParam: ResourceStatus | null = params.status ?? null;

  // 1) 先筛选候选ID（按标题或分类名匹配），并应用状态过滤
  const baseCte = `
    WITH rl AS (
      SELECT DISTINCT ON (resource_id)
        resource_id,
        link
      FROM resource_link
      ORDER BY resource_id, update_time DESC NULLS LAST
    ),
    rc AS (
      SELECT trim(resource_id) AS rid_text, trim(category_id) AS cid_text
      FROM resource_category
    ),
    cats AS (
      SELECT trim(id::text) AS id_text, name FROM categories
      UNION ALL
      SELECT trim(id::text) AS id_text, name FROM category
    ),
    u AS (
      SELECT 
        r.id::text                        AS id,
        trim(r.id::text)                  AS id_text,
        r.title                           AS title,
        r.url                             AS url,
        r.synopsis                        AS synopsis,
        r.status                          AS status,
        r.icon                            AS icon,
        CASE WHEN r.category_id IS NOT NULL THEN trim(r.category_id::text) ELSE NULL END AS cid_text
      FROM resources r
      UNION ALL
      SELECT 
        re.id::text                                                          AS id,
        trim(re.id::text)                                                    AS id_text,
        re.name                                                              AS title,
        COALESCE(rl.link, '#')                                               AS url,
        NULL::text                                                           AS synopsis,
        COALESCE(re.status, 'NORMAL')                                         AS status,
        re.icon                                                               AS icon,
        NULL::text                                                            AS cid_text
      FROM resource re
      LEFT JOIN rl ON rl.resource_id = re.id
    ),
    candidates AS (
      SELECT DISTINCT u.id
      FROM u
      WHERE ($2::text IS NULL OR u.status = $2)
        AND (
          $1::text IS NULL
          OR u.title ILIKE $1
          OR u.url ILIKE $1
          OR u.synopsis ILIKE $1
          OR EXISTS (
            SELECT 1
            FROM (
              SELECT c.name
              FROM cats c
              WHERE c.id_text = u.cid_text
              UNION ALL
              SELECT c2.name
              FROM rc
              JOIN cats c2 ON (c2.id_text = rc.cid_text OR lower(c2.name) = lower(rc.cid_text))
              WHERE rc.rid_text = u.id_text
            ) catn
            WHERE catn.name ILIKE $1
          )
        )
    ),
    paged AS (
      SELECT u.id, u.title, u.status, u.icon
      FROM u
      JOIN candidates c ON c.id = u.id
      ORDER BY u.id DESC
      LIMIT $3 OFFSET $4
    )
  `;

  // 2) 统计总数
  const countSql = `${baseCte}
    SELECT COUNT(*)::bigint AS total
    FROM candidates
  `;
  const countResult = await runQuery<{ total: string | number }>(env, countSql, [qParam, statusParam, pageSize, offset]);
  const total = Number(countResult.rows[0]?.total ?? 0);

  // 3) 仅对当前页做分类名聚合
  const itemsSql = `${baseCte}
    , cat_names AS (
      SELECT 
        u.id AS rid,
        array_remove(array_agg(DISTINCT COALESCE(c.name, c2.name)), NULL) AS category_names
      FROM paged p
      JOIN u ON u.id = p.id
      LEFT JOIN cats c ON c.id_text = u.cid_text
      LEFT JOIN rc ON rc.rid_text = u.id_text
      LEFT JOIN cats c2 ON (c2.id_text = rc.cid_text OR lower(c2.name) = lower(rc.cid_text))
      GROUP BY u.id
    )
    SELECT 
      p.id,
      p.title,
      p.status,
      p.icon,
      COALESCE(cn.category_names, ARRAY[]::text[]) AS category_names
    FROM paged p
    LEFT JOIN cat_names cn ON cn.rid = p.id
  `;

  const itemsResult = await runQuery<{
    id: string;
    title: string;
    category_names: string[] | null;
    icon: string | null;
    status: string;
  }>(env, itemsSql, [qParam, statusParam, pageSize, offset]);

  const items = itemsResult.rows.map((row) => ({
    id: String(row.id),
    title: row.title,
    category_names: Array.isArray(row.category_names) ? (row.category_names.filter((x) => typeof x === "string") as string[]) : [],
    icon: row.icon,
    status: (row.status as ResourceStatus) ?? "NORMAL",
  }));

  return { items, total };
}

export async function insertResource(
  env: EnvWithHyperdrive,
  data: { title: string; url: string; categoryId: number | null; synopsis: string | null; icon?: string | null; status: ResourceStatus }
): Promise<string> {
  const result = await runQuery<{ id: string }>(
    env,
    `INSERT INTO resources(title, url, category_id, synopsis, icon, status) VALUES($1, $2, $3, $4, $5, $6) RETURNING id`,
    [data.title, data.url, data.categoryId, data.synopsis, data.icon ?? null, data.status]
  );
  return String(result.rows[0].id);
}

export async function updateResource(
  env: EnvWithHyperdrive,
  data: { id: string; title?: string; url?: string; categoryId?: number | null; synopsis?: string | null; icon?: string | null; status?: ResourceStatus }
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  
  // 字段映射：前端字段 -> 数据库字段
  if (data.title !== undefined) {
    fields.push(`name = $${fields.length + 1}`);  // title -> name
    values.push(data.title);
  }
  if (data.url !== undefined) {
    fields.push(`app_url = $${fields.length + 1}`);  // url -> app_url
    values.push(data.url);
  }
  if (data.synopsis !== undefined) {
    fields.push(`synopsis = $${fields.length + 1}`);
    values.push(data.synopsis);
  }
  if (data.icon !== undefined) {
    fields.push(`icon = $${fields.length + 1}`);
    values.push(data.icon);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${fields.length + 1}`);
    values.push(data.status);
  }
  
  if (fields.length === 0) return;
  values.push(data.id);
  await runQuery(env, `UPDATE resource SET ${fields.join(", ")} WHERE id = $${values.length}` as string, values);
  
  // categoryId需要单独处理，因为它存储在关联表中
  if (data.categoryId !== undefined) {
    // 先删除现有的分类关联
    await runQuery(env, `DELETE FROM resource_category WHERE resource_id = $1`, [data.id]);
    
    // 如果有新的分类ID，添加关联
    if (data.categoryId !== null) {
      await runQuery(env, 
        `INSERT INTO resource_category (resource_id, category_id, create_time) VALUES ($1, $2, now())`, 
        [data.id, data.categoryId.toString()]
      );
    }
  }
}

export async function deleteResource(env: EnvWithHyperdrive, id: string): Promise<void> {
  await runQuery(env, `DELETE FROM resource WHERE id = $1`, [id]);
}


