import { EnvWithHyperdrive } from "@/server/db";
import { Page, Resource } from "@/server/domain/models";
import { ResourceCreateInput, ResourceUpdateInput } from "@/server/validators";
import { assert } from "@/server/http";
import { deleteResource, findPagedResources, findResourceById, insertResource, updateResource } from "@/server/repositories/resources.repository";

export async function getResourceById(env: EnvWithHyperdrive, id: string): Promise<Resource | null> {
  assert(typeof id === 'string' && id.length > 0, 400, "invalid id");
  return findResourceById(env, id);
}

export async function listResources(
  env: EnvWithHyperdrive,
  params: { page?: number; pageSize?: number; q?: string; status?: "NORMAL" | "VOID" | null }
): Promise<Page<{ id: string; title: string; category_names: string[]; icon: string | null; status: "NORMAL" | "VOID" }>> {
  const page = Number.isFinite(params.page) && params.page! > 0 ? Math.floor(params.page as number) : 1;
  const pageSize = Number.isFinite(params.pageSize) && params.pageSize! > 0 ? Math.min(Math.floor(params.pageSize as number), 100) : 10;
  const { items, total } = await findPagedResources(env, { page, pageSize, q: params.q, status: params.status ?? undefined });
  return { items, total, page, pageSize };
}

export async function createResource(env: EnvWithHyperdrive, input: ResourceCreateInput): Promise<string> {
  const title = input.title.trim();
  assert(title.length > 0, 400, "title is required");
  const url = input.url.trim();
  assert(url.length > 0, 400, "url is required");
  const categoryId = input.categoryId ?? null;
  const synopsis = input.synopsis ?? null;
  const status = input.status ?? "NORMAL";
  const icon = input.icon ?? null;
  return insertResource(env, { title, url, categoryId, synopsis, icon, status });
}

export async function modifyResource(env: EnvWithHyperdrive, input: ResourceUpdateInput): Promise<void> {
  assert(typeof input.id === 'string' && input.id.length > 0, 400, "invalid id");
  await updateResource(env, { id: input.id, title: input.title, url: input.url, categoryId: input.categoryId, synopsis: input.synopsis ?? undefined, icon: input.icon, status: input.status });
}

export async function removeResource(env: EnvWithHyperdrive, id: string): Promise<void> {
  assert(typeof id === 'string' && id.length > 0, 400, "invalid id");
  await deleteResource(env, id);
}


