import { EnvWithHyperdrive, runQuery } from "@/server/db";
import { User } from "@/server/domain/models";
import * as bcrypt from "bcryptjs";

export type UserStatus = "NORMAL" | "VOID";

export interface UserCreateData {
  userName: string;
  password: string;
  email?: string | null;
  role?: string | null;
  avatar?: string | null;
  status: UserStatus;
}

export interface UserUpdateData {
  id: string;
  userName?: string;
  password?: string;
  email?: string | null;
  role?: string | null;
  avatar?: string | null;
  status?: UserStatus;
}

// 生成用户ID（32位字符串）
function generateUserId(): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// 验证密码
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 根据用户名查找用户
export async function findUserByUserName(
  env: EnvWithHyperdrive,
  userName: string
): Promise<User | null> {
  const result = await runQuery<{
    id: string;
    user_name: string | null;
    password: string;
    avatar: string | null;
    email: string | null;
    role: string | null;
    status: string;
    create_time: string;
  }>(
    env,
    `SELECT id, user_name, password, avatar, email, role, status, create_time 
     FROM "user" 
     WHERE user_name = $1 AND status = 'NORMAL'`,
    [userName]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userName: row.user_name,
    password: row.password,
    avatar: row.avatar,
    email: row.email,
    role: row.role,
    status: (row.status as UserStatus) ?? "NORMAL",
    createTime: new Date(row.create_time),
  };
}

// 根据ID查找用户
export async function findUserById(
  env: EnvWithHyperdrive,
  id: string
): Promise<User | null> {
  const result = await runQuery<{
    id: string;
    user_name: string | null;
    password: string;
    avatar: string | null;
    email: string | null;
    role: string | null;
    status: string;
    create_time: string;
  }>(
    env,
    `SELECT id, user_name, password, avatar, email, role, status, create_time 
     FROM "user" 
     WHERE id = $1`,
    [id]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userName: row.user_name,
    password: row.password,
    avatar: row.avatar,
    email: row.email,
    role: row.role,
    status: (row.status as UserStatus) ?? "NORMAL",
    createTime: new Date(row.create_time),
  };
}

// 创建用户
export async function insertUser(
  env: EnvWithHyperdrive,
  data: UserCreateData
): Promise<string> {
  const id = generateUserId();
  const hashedPassword = await hashPassword(data.password);
  
  await runQuery(
    env,
    `INSERT INTO "user" (id, user_name, password, email, role, avatar, status, create_time) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
    [id, data.userName, hashedPassword, data.email ?? null, data.role ?? null, data.avatar ?? null, data.status]
  );
  
  return id;
}

// 更新用户
export async function updateUser(
  env: EnvWithHyperdrive,
  data: UserUpdateData
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  
  if (data.userName !== undefined) {
    fields.push(`user_name = $${fields.length + 1}`);
    values.push(data.userName);
  }
  if (data.password !== undefined) {
    const hashedPassword = await hashPassword(data.password);
    fields.push(`password = $${fields.length + 1}`);
    values.push(hashedPassword);
  }
  if (data.email !== undefined) {
    fields.push(`email = $${fields.length + 1}`);
    values.push(data.email);
  }
  if (data.role !== undefined) {
    fields.push(`role = $${fields.length + 1}`);
    values.push(data.role);
  }
  if (data.avatar !== undefined) {
    fields.push(`avatar = $${fields.length + 1}`);
    values.push(data.avatar);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${fields.length + 1}`);
    values.push(data.status);
  }
  
  if (fields.length === 0) return;
  
  values.push(data.id);
  await runQuery(
    env,
    `UPDATE "user" SET ${fields.join(", ")} WHERE id = $${values.length}`,
    values
  );
}

// 删除用户（软删除，设置状态为VOID）
export async function deleteUser(env: EnvWithHyperdrive, id: string): Promise<void> {
  await runQuery(env, `UPDATE "user" SET status = 'VOID' WHERE id = $1`, [id]);
}

// 分页查询用户
export async function findPagedUsers(
  env: EnvWithHyperdrive,
  params: { page: number; pageSize: number; q?: string; status?: UserStatus | null }
): Promise<{ items: Array<Omit<User, 'password'>>; total: number }> {
  const page = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
  const pageSize = Number.isFinite(params.pageSize) && params.pageSize > 0 ? Math.min(Math.floor(params.pageSize), 100) : 10;
  const offset = (page - 1) * pageSize;

  const qRaw = (params.q ?? "").trim();
  const qParam = qRaw ? `%${qRaw}%` : null;
  const statusParam: UserStatus | null = params.status ?? null;

  // 构建查询条件
  const conditions: string[] = [];
  const queryParams: unknown[] = [];

  if (qParam) {
    conditions.push(`(user_name ILIKE $${queryParams.length + 1} OR email ILIKE $${queryParams.length + 1})`);
    queryParams.push(qParam);
  }

  if (statusParam) {
    conditions.push(`status = $${queryParams.length + 1}`);
    queryParams.push(statusParam);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // 统计总数
  const countResult = await runQuery<{ total: string | number }>(
    env,
    `SELECT COUNT(*)::bigint AS total FROM "user" ${whereClause}`,
    queryParams
  );
  const total = Number(countResult.rows[0]?.total ?? 0);

  // 查询数据
  const itemsResult = await runQuery<{
    id: string;
    user_name: string | null;
    avatar: string | null;
    email: string | null;
    role: string | null;
    status: string;
    create_time: string;
  }>(
    env,
    `SELECT id, user_name, avatar, email, role, status, create_time 
     FROM "user" 
     ${whereClause} 
     ORDER BY create_time DESC 
     LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
    [...queryParams, pageSize, offset]
  );

  const items = itemsResult.rows.map((row) => ({
    id: row.id,
    userName: row.user_name,
    password: "", // 不返回密码
    avatar: row.avatar,
    email: row.email,
    role: row.role,
    status: (row.status as UserStatus) ?? "NORMAL",
    createTime: new Date(row.create_time),
  }));

  return { items, total };
}
