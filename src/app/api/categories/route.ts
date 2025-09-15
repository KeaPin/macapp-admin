import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { runQuery, EnvWithHyperdrive } from "@/server/db";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
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

  const whereConditions: string[] = [];
  const params: unknown[] = [];
  
  if (qRaw) {
    whereConditions.push(`(name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`);
    params.push(`%${qRaw}%`);
  }
  
  if (statusFilter && (statusFilter === 'NORMAL' || statusFilter === 'VOID')) {
    whereConditions.push(`status = $${params.length + 1}`);
    params.push(statusFilter);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : "";

  const limitIndex = params.length + 1;
  const offsetIndex = params.length + 2;
  params.push(pageSize, offset);

  const itemsResult = await runQuery<{
    id: number;
    name: string;
    description: string | null;
    status: string;
    total: string | number;
  }>(
    env as unknown as EnvWithHyperdrive,
    `
    SELECT id, name, description, status, total FROM (
      SELECT id, name, description, status, COUNT(*) OVER() AS total
      FROM (
        SELECT id::double precision AS id, name, description, status
        FROM categories
        UNION ALL
        SELECT (id)::double precision AS id, name, description, COALESCE(status, 'NORMAL') as status
        FROM category
        WHERE id ~ '^[0-9]+$'
      ) t
      ${whereClause}
      ORDER BY id DESC
    ) s
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `,
    params
  );

  let total: number;
  if (itemsResult.rows.length > 0) {
    total = Number(itemsResult.rows[0].total);
  } else {
    const countParams: unknown[] = [];
    const countWhereConditions: string[] = [];
    
    if (qRaw) {
      countWhereConditions.push(`(name ILIKE $${countParams.length + 1} OR description ILIKE $${countParams.length + 1})`);
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
      SELECT COUNT(*) AS total FROM (
        SELECT id::double precision AS id, name, description, status FROM categories
        UNION ALL
        SELECT (id)::double precision AS id, name, description, COALESCE(status, 'NORMAL') as status FROM category WHERE id ~ '^[0-9]+$'
      ) t
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
  const parsed = categoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { env } = getCloudflareContext();
  const { name, description, status } = parsed.data;
  try {
    const result = await runQuery<{ id: number }>(
      env as unknown as EnvWithHyperdrive,
      `INSERT INTO categories(name, description, status) VALUES($1, $2, $3) RETURNING id`,
      [name, description ?? null, status]
    );
    return Response.json({ id: result.rows[0].id }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = categoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { id, name, description, status } = parsed.data;
  const { env } = getCloudflareContext();
  try {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (name !== undefined) {
      fields.push(`name = $${fields.length + 1}`);
      values.push(name);
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
    await runQuery(env as unknown as EnvWithHyperdrive, `UPDATE categories SET ${fields.join(", ")}, updated_at = now() WHERE id = $${values.length}`, values);
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
    await runQuery(env as unknown as EnvWithHyperdrive, `DELETE FROM categories WHERE id = $1`, [id]);
    return Response.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return Response.json({ error: message }, { status: 500 });
  }
}


