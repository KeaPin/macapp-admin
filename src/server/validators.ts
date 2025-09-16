import { z } from "zod";

// 状态枚举：NORMAL正常，VOID下架
export const statusEnum = z.enum(["NORMAL", "VOID"]);

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  status: statusEnum.optional().default("NORMAL"),
});

export const categoryUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: statusEnum.optional(),
});

export const resourceCreateSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  categoryId: z.coerce.number().int().min(1).max(2147483647).optional().nullable(),
  synopsis: z.string().max(2000).optional().nullable(),
  icon: z.string().url().optional().nullable(),
  status: statusEnum.optional().default("NORMAL"),
});

export const resourceUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  categoryId: z.coerce.number().int().min(1).max(2147483647).optional().nullable(),
  synopsis: z.string().max(2000).optional().nullable(),
  icon: z.string().url().optional().nullable(),
  status: statusEnum.optional(),
});

export const userLoginSchema = z.object({
  userName: z.string().min(1, "用户名不能为空"),
  password: z.string().min(1, "密码不能为空"),
});

export const userCreateSchema = z.object({
  userName: z.string().min(1).max(255),
  password: z.string().min(6).max(255),
  email: z.string().email().optional().nullable(),
  role: z.string().max(255).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  status: statusEnum.optional().default("NORMAL"),
});

export const userUpdateSchema = z.object({
  id: z.string().min(1),
  userName: z.string().min(1).max(255).optional(),
  password: z.string().min(6).max(255).optional(),
  email: z.string().email().optional().nullable(),
  role: z.string().max(255).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  status: statusEnum.optional(),
});

export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type ResourceCreateInput = z.infer<typeof resourceCreateSchema>;
export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>;


