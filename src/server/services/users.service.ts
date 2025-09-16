import { EnvWithHyperdrive } from "@/server/db";
import { Page } from "@/server/domain/models";
import { UserCreateInput, UserUpdateInput, UserLoginInput } from "@/server/validators";
import { assert } from "@/server/http";
import {
  findUserByUserName,
  findUserById,
  insertUser,
  updateUser,
  deleteUser,
  findPagedUsers,
  verifyPassword,
  UserStatus,
} from "@/server/repositories/users.repository";

// 用于返回的用户信息（不包含密码）
export interface SafeUser {
  id: string;
  userName: string | null;
  avatar: string | null;
  email: string | null;
  role: string | null;
  status: UserStatus;
  createTime: Date;
}

// 登录认证
export async function authenticateUser(
  env: EnvWithHyperdrive,
  input: UserLoginInput
): Promise<SafeUser | null> {
  const { userName, password } = input;
  
  // 查找用户
  const user = await findUserByUserName(env, userName);
  if (!user) {
    return null;
  }

  // 验证密码
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  // 检查用户状态
  if (user.status !== "NORMAL") {
    return null;
  }

  // 返回安全的用户信息（不包含密码）
  return {
    id: user.id,
    userName: user.userName,
    avatar: user.avatar,
    email: user.email,
    role: user.role,
    status: user.status,
    createTime: user.createTime,
  };
}

// 根据ID获取用户信息（用于会话验证）
export async function getUserById(
  env: EnvWithHyperdrive,
  id: string
): Promise<SafeUser | null> {
  const user = await findUserById(env, id);
  if (!user || user.status !== "NORMAL") {
    return null;
  }

  return {
    id: user.id,
    userName: user.userName,
    avatar: user.avatar,
    email: user.email,
    role: user.role,
    status: user.status,
    createTime: user.createTime,
  };
}

// 分页查询用户
export async function listUsers(
  env: EnvWithHyperdrive,
  params: { page?: number; pageSize?: number; q?: string; status?: UserStatus | null }
): Promise<Page<SafeUser>> {
  const page = Number.isFinite(params.page) && params.page! > 0 ? Math.floor(params.page as number) : 1;
  const pageSize = Number.isFinite(params.pageSize) && params.pageSize! > 0 ? Math.min(Math.floor(params.pageSize as number), 100) : 10;
  
  const { items, total } = await findPagedUsers(env, { 
    page, 
    pageSize, 
    q: params.q, 
    status: params.status ?? undefined 
  });
  
  // 转换为SafeUser类型（已经不包含密码）
  const safeItems: SafeUser[] = items.map(item => ({
    id: item.id,
    userName: item.userName,
    avatar: item.avatar,
    email: item.email,
    role: item.role,
    status: item.status,
    createTime: item.createTime,
  }));
  
  return { items: safeItems, total, page, pageSize };
}

// 创建用户
export async function createUser(env: EnvWithHyperdrive, input: UserCreateInput): Promise<string> {
  const userName = input.userName.trim();
  assert(userName.length > 0, 400, "用户名不能为空");
  
  // 检查用户名是否已存在
  const existingUser = await findUserByUserName(env, userName);
  assert(!existingUser, 400, "用户名已存在");
  
  const password = input.password;
  assert(password.length >= 6, 400, "密码长度至少6位");
  
  const email = input.email ?? null;
  const role = input.role ?? null;
  const avatar = input.avatar ?? null;
  const status = input.status ?? "NORMAL";
  
  return insertUser(env, { userName, password, email, role, avatar, status });
}

// 修改用户
export async function modifyUser(env: EnvWithHyperdrive, input: UserUpdateInput): Promise<void> {
  assert(typeof input.id === 'string' && input.id.length > 0, 400, "无效的用户ID");
  
  // 检查用户是否存在
  const existingUser = await findUserById(env, input.id);
  assert(existingUser, 404, "用户不存在");
  
  // 如果修改用户名，检查是否重复
  if (input.userName !== undefined) {
    const userName = input.userName.trim();
    assert(userName.length > 0, 400, "用户名不能为空");
    
    // 检查用户名是否已被其他用户使用
    const userWithSameName = await findUserByUserName(env, userName);
    assert(!userWithSameName || userWithSameName.id === input.id, 400, "用户名已存在");
  }
  
  // 如果修改密码，检查长度
  if (input.password !== undefined) {
    assert(input.password.length >= 6, 400, "密码长度至少6位");
  }
  
  await updateUser(env, {
    id: input.id,
    userName: input.userName,
    password: input.password,
    email: input.email ?? undefined,
    role: input.role ?? undefined,
    avatar: input.avatar ?? undefined,
    status: input.status,
  });
}

// 删除用户（软删除）
export async function removeUser(env: EnvWithHyperdrive, id: string): Promise<void> {
  assert(typeof id === 'string' && id.length > 0, 400, "无效的用户ID");
  
  // 检查用户是否存在
  const existingUser = await findUserById(env, id);
  assert(existingUser, 404, "用户不存在");
  
  await deleteUser(env, id);
}
