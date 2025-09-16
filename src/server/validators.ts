import { z } from "zod";

// 状态枚举：NORMAL正常，VOID下架
export const statusEnum = z.enum(["NORMAL", "VOID"]);

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  status: statusEnum.optional().default("NORMAL"),
});

export const categoryUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: statusEnum.optional(),
});

export const resourceCreateSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  synopsis: z.string().max(2000).optional().nullable(),
  icon: z.string().url().optional().nullable(),
  status: statusEnum.optional().default("NORMAL"),
});

export const resourceUpdateSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  synopsis: z.string().max(2000).optional().nullable(),
  icon: z.string().url().optional().nullable(),
  status: statusEnum.optional(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type ResourceCreateInput = z.infer<typeof resourceCreateSchema>;
export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>;


