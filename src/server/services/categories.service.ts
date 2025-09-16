import { EnvWithHyperdrive } from "@/server/db";
import { Page, Category } from "@/server/domain/models";
import { CategoryCreateInput, CategoryUpdateInput } from "@/server/validators";
import { assert } from "@/server/http";
import { deleteCategory, findPagedCategories, insertCategory, updateCategory } from "@/server/repositories/categories.repository";

export async function listCategories(
  env: EnvWithHyperdrive,
  params: { page?: number; pageSize?: number; q?: string; status?: "NORMAL" | "VOID" | null }
): Promise<Page<Category>> {
  const page = Number.isFinite(params.page) && params.page! > 0 ? Math.floor(params.page as number) : 1;
  const pageSize = Number.isFinite(params.pageSize) && params.pageSize! > 0 ? Math.min(Math.floor(params.pageSize as number), 100) : 10;
  const { items, total } = await findPagedCategories(env, { page, pageSize, q: params.q, status: params.status ?? undefined });
  return { items, total, page, pageSize };
}

export async function createCategory(env: EnvWithHyperdrive, input: CategoryCreateInput): Promise<string> {
  const name = input.name.trim();
  assert(name.length > 0, 400, "name is required");
  const description = input.description ?? null;
  const status = input.status ?? "NORMAL";
  return insertCategory(env, { name, description, status });
}

export async function modifyCategory(env: EnvWithHyperdrive, input: CategoryUpdateInput): Promise<void> {
  assert(typeof input.id === 'string' && input.id.length > 0, 400, "invalid id");
  await updateCategory(env, { id: input.id, name: input.name, description: input.description ?? undefined, status: input.status });
}

export async function removeCategory(env: EnvWithHyperdrive, id: string): Promise<void> {
  assert(typeof id === 'string' && id.length > 0, 400, "invalid id");
  await deleteCategory(env, id);
}


