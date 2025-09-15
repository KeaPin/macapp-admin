import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { runQuery, EnvWithHyperdrive } from "@/server/db";
import {
  resourceCreateSchema,
  resourceUpdateSchema,
} from "@/server/validators";

export async function GET(req: NextRequest) {
  const { env } = getCloudflareContext();

  const searchParams = req.nextUrl.searchParams;
  const pageParam = Number(searchParams.get("page") ?? "");
  const pageSizeParam = Number(searchParams.get("pageSize") ?? "");
  const qRaw = (searchParams.get("q") ?? "").trim();
  const statusFilter = searchParams.get("status"); // NORMAL, VOID 或 null(查看全部)
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? Math.min(Math.floor(pageSizeParam), 100) : 10;
  const offset = (page - 1) * pageSize;
  const idParam = Number(searchParams.get("id") ?? "");

  // Detail by id
  if (Number.isInteger(idParam) && idParam > 0) {
    const detail = await runQuery<{
      id: number;
      title: string;
      url: string;
      category_id: number | null;
      description: string | null;
      status: string;
    }>(
      env as unknown as EnvWithHyperdrive,
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
      ),
      u AS (
        SELECT 
          r.id::double precision            AS id,
          r.title                           AS title,
          r.url                             AS url,
          r.category_id::double precision   AS category_id,
          r.description                     AS description,
          r.status                          AS status
        FROM resources r
        UNION ALL
        SELECT 
          (re.id)::double precision                                            AS id,
          re.name                                                              AS title,
          COALESCE(rl.link, re.official_site, re.detail_url, '#')              AS url,
          CASE WHEN rc.cid ~ '^[0-9]+$' THEN (rc.cid)::double precision ELSE NULL END AS category_id,
          COALESCE(re.synopsis, re.description)                                 AS description,
          COALESCE(re.status, 'NORMAL')                                         AS status
        FROM resource re
        LEFT JOIN rl ON rl.resource_id = re.id
        LEFT JOIN rc ON rc.rid = re.id
      )
      SELECT id, title, url, category_id, description, status
      FROM u
      WHERE id = $1
      LIMIT 1
      `,
      [idParam]
    );
    const row = detail.rows[0];
    if (!row) return new Response(null, { status: 404 });
    return Response.json(row);
  }

  // 构建查询条件
  const whereConditions: string[] = [];
  const queryParams: unknown[] = [];
  
  if (qRaw) {
    whereConditions.push(`(title ILIKE $${queryParams.length + 1} OR category_name ILIKE $${queryParams.length + 1})`);
    queryParams.push(`%${qRaw}%`);
  }
  
  if (statusFilter && (statusFilter === 'NORMAL' || statusFilter === 'VOID')) {
    whereConditions.push(`status = $${queryParams.length + 1}`);
    queryParams.push(statusFilter);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : "";
  const limitParam = queryParams.length + 1;
  const offsetParam = queryParams.length + 2;
  queryParams.push(pageSize, offset);

  const itemsResult = await runQuery<{
    id: number;
    title: string;
    category_name: string | null;
    icon: string | null;
    status: string;
    total: string | number;
  }>(
    env as unknown as EnvWithHyperdrive,
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
    ),
    u AS (
      SELECT 
        r.id::double precision            AS id,
        r.title                           AS title,
        r.url                             AS url,
        r.category_id::double precision   AS category_id,
        r.status                          AS status
      FROM resources r
      UNION ALL
      SELECT 
        (re.id)::double precision                                            AS id,
        re.name                                                              AS title,
        COALESCE(rl.link, re.official_site, re.detail_url, '#')              AS url,
        CASE WHEN rc.cid ~ '^[0-9]+$' THEN (rc.cid)::double precision ELSE NULL END AS category_id,
        COALESCE(re.status, 'NORMAL')                                         AS status
      FROM resource re
      LEFT JOIN rl ON rl.resource_id = re.id
      LEFT JOIN rc ON rc.rid = re.id
    ),
    u2 AS (
      SELECT u.*, c.name AS category_name
      FROM u
      LEFT JOIN categories c ON c.id = u.category_id
    ),
    s AS (
      SELECT id, title, category_name, url, status, COUNT(*) OVER() AS total
      FROM u2
      ${whereClause}
      ORDER BY id DESC
    )
    SELECT 
      id,
      title,
      category_name,
      status,
      CASE 
        WHEN url ~* '^https?://' THEN 'https://www.google.com/s2/favicons?domain=' || regexp_replace(url, '^(?:https?:\\/\\/)?([^\\/\\?#]+).*$', '\\1') || '&sz=64'
        ELSE NULL
      END AS icon,
      total
    FROM s
    LIMIT $${limitParam} OFFSET $${offsetParam}
    `,
    queryParams
  );

  let total: number;
  if (itemsResult.rows.length > 0) {
    total = Number(itemsResult.rows[0].total);
  } else {
    // 构建统计查询条件
    const countWhereConditions: string[] = [];
    const countParams: unknown[] = [];
    
    if (qRaw) {
      countWhereConditions.push(`(title ILIKE $${countParams.length + 1} OR category_name ILIKE $${countParams.length + 1})`);
      countParams.push(`%${qRaw}%`);
    }
    
    if (statusFilter && (statusFilter === 'NORMAL' || statusFilter === 'VOID')) {
      countWhereConditions.push(`status = $${countParams.length + 1}`);
      countParams.push(statusFilter);
    }
    
    const countWhereClause = countWhereConditions.length > 0 ? `WHERE ${countWhereConditions.join(' AND ')}` : "";
    
    const countResult = await runQuery<{ total: string | number }>(
      env as unknown as EnvWithHyperdrive,
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
      ),
      u AS (
        SELECT 
          r.id::double precision            AS id,
          r.title                           AS title,
          r.url                             AS url,
          r.category_id::double precision   AS category_id,
          r.status                          AS status
        FROM resources r
        UNION ALL
        SELECT 
          (re.id)::double precision                                            AS id,
          re.name                                                              AS title,
          COALESCE(rl.link, re.official_site, re.detail_url, '#')              AS url,
          CASE WHEN rc.cid ~ '^[0-9]+$' THEN (rc.cid)::double precision ELSE NULL END AS category_id,
          COALESCE(re.status, 'NORMAL')                                         AS status
        FROM resource re
        LEFT JOIN rl ON rl.resource_id = re.id
        LEFT JOIN rc ON rc.rid = re.id
      ),
      u2 AS (
        SELECT u.*, c.name AS category_name
        FROM u
        LEFT JOIN categories c ON c.id = u.category_id
      )
      SELECT COUNT(*) AS total FROM u2
      ${countWhereClause}
      `,
      countParams
    );
    total = Number(countResult.rows[0]?.total ?? 0);
  }

  const items = itemsResult.rows.map(({ total: _t, ...row }) => row);
  return Response.json({ items, total, page, pageSize, q: qRaw, status: statusFilter });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = resourceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { env } = getCloudflareContext();
  const { title, url, categoryId, description, status } = parsed.data;
  try {
    const result = await runQuery<{ id: number }>(
      env as unknown as EnvWithHyperdrive,
      `INSERT INTO resources(title, url, category_id, description, status) VALUES($1, $2, $3, $4, $5) RETURNING id`,
      [title, url, categoryId ?? null, description ?? null, status]
    );
    return Response.json({ id: result.rows[0].id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = resourceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id, title, url, categoryId, description, status } = parsed.data;
  const { env } = getCloudflareContext();
  try {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (title !== undefined) {
      fields.push(`title = $${fields.length + 1}`);
      values.push(title);
    }
    if (url !== undefined) {
      fields.push(`url = $${fields.length + 1}`);
      values.push(url);
    }
    if (categoryId !== undefined) {
      fields.push(`category_id = $${fields.length + 1}`);
      values.push(categoryId);
    }
    if (description !== undefined) {
      fields.push(`description = $${fields.length + 1}`);
      values.push(description);
    }
    if (status !== undefined) {
      fields.push(`status = $${fields.length + 1}`);
      values.push(status);
    }
    if (fields.length === 0) return Response.json({ ok: true });
    values.push(id);
    await runQuery(
      env as unknown as EnvWithHyperdrive,
      `UPDATE resources SET ${fields.join(", ")}, updated_at = now() WHERE id = $${values.length}`,
      values
    );
    return Response.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }
  const { env } = getCloudflareContext();
  try {
    await runQuery(env as unknown as EnvWithHyperdrive, `DELETE FROM resources WHERE id = $1`, [id]);
    return Response.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return Response.json({ error: message }, { status: 500 });
  }
}


