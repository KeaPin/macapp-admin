import { EnvWithHyperdrive, runQuery } from "@/server/db";
import { Category } from "@/server/domain/models";

export type CategoryStatus = "NORMAL" | "VOID";

export async function findPagedCategories(
  env: EnvWithHyperdrive,
  params: { page: number; pageSize: number; q?: string; status?: CategoryStatus | null }
): Promise<{ items: Category[]; total: number }> {
  const page = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
  const pageSize = Number.isFinite(params.pageSize) && params.pageSize > 0 ? Math.min(Math.floor(params.pageSize), 100) : 10;
  const offset = (page - 1) * pageSize;

  const whereConditions: string[] = [];
  const queryParams: unknown[] = [];

  const q = (params.q ?? "").trim();
  if (q) {
    whereConditions.push(`(name ILIKE $${queryParams.length + 1} OR description ILIKE $${queryParams.length + 1})`);
    queryParams.push(`%${q}%`);
  }

  const status = params.status ?? undefined;
  if (status && (status === "NORMAL" || status === "VOID")) {
    whereConditions.push(`status = $${queryParams.length + 1}`);
    queryParams.push(status);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
  const limitIndex = queryParams.length + 1;
  const offsetIndex = queryParams.length + 2;
  queryParams.push(pageSize, offset);

  const itemsResult = await runQuery<{
    id: string;
    name: string;
    description: string | null;
    status: CategoryStatus;
    total: string | number;
  }>(
    env,
    `
    SELECT id, name, description, status, total FROM (
      SELECT id, name, description, status, COUNT(*) OVER() AS total
      FROM (
        SELECT id::text AS id, name, description, status
        FROM categories
        UNION ALL
        SELECT id::text AS id, name, description, COALESCE(status, 'NORMAL') as status
        FROM category
        WHERE id ~ '^[0-9]+$'
      ) t
      ${whereClause}
      ORDER BY id DESC
    ) s
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `,
    queryParams
  );

  let total: number;
  if (itemsResult.rows.length > 0) {
    total = Number(itemsResult.rows[0].total);
  } else {
    const countParams: unknown[] = [];
    const countWhereConditions: string[] = [];

    if (q) {
      countWhereConditions.push(`(name ILIKE $${countParams.length + 1} OR description ILIKE $${countParams.length + 1})`);
      countParams.push(`%${q}%`);
    }
    if (status && (status === "NORMAL" || status === "VOID")) {
      countWhereConditions.push(`status = $${countParams.length + 1}`);
      countParams.push(status);
    }

    const countWhereClause = countWhereConditions.length > 0 ? `WHERE ${countWhereConditions.join(" AND ")}` : "";
    const countResult = await runQuery<{ total: string | number }>(
      env,
      `
      SELECT COUNT(*) AS total FROM (
        SELECT id::text AS id, name, description, status FROM categories
        UNION ALL
        SELECT id::text AS id, name, description, COALESCE(status, 'NORMAL') as status FROM category WHERE id ~ '^[0-9]+$'
      ) t
      ${countWhereClause}
      `,
      countParams
    );
    total = Number(countResult.rows[0]?.total ?? 0);
  }

  const items: Category[] = itemsResult.rows.map((row) => ({
    id: String(row.id),
    name: row.name,
    description: row.description,
    status: row.status,
  }));

  return { items, total };
}

export async function insertCategory(
  env: EnvWithHyperdrive,
  data: { name: string; description: string | null; status: CategoryStatus }
): Promise<string> {
  const result = await runQuery<{ id: string }>(
    env,
    `INSERT INTO categories(name, description, status) VALUES($1, $2, $3) RETURNING id`,
    [data.name, data.description, data.status]
  );
  return String(result.rows[0].id);
}

export async function updateCategory(
  env: EnvWithHyperdrive,
  data: { id: string; name?: string; description?: string | null; status?: CategoryStatus }
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.name !== undefined) {
    fields.push(`name = $${fields.length + 1}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${fields.length + 1}`);
    values.push(data.description);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${fields.length + 1}`);
    values.push(data.status);
  }
  if (fields.length === 0) return;
  values.push(data.id);
  await runQuery(env, `UPDATE categories SET ${fields.join(", ")}, updated_at = now() WHERE id::text = $${values.length}` as string, values);
}

export async function deleteCategory(env: EnvWithHyperdrive, id: string): Promise<void> {
  await runQuery(env, `DELETE FROM categories WHERE id::text = $1`, [id]);
}


