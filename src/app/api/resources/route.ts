import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { EnvWithHyperdrive } from "@/server/db";
import { resourceCreateSchema, resourceUpdateSchema } from "@/server/validators";
import { jsonCreated, jsonError, jsonOk } from "@/server/http";
import { createResource, getResourceById, listResources, modifyResource, removeResource } from "@/server/services/resources.service";

export async function GET(req: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    const searchParams = req.nextUrl.searchParams;
    const id = Number(searchParams.get("id") ?? "");
    if (Number.isInteger(id) && id > 0) {
      const data = await getResourceById(env as unknown as EnvWithHyperdrive, id);
      if (!data) return new Response(null, { status: 404 });
      return jsonOk(data);
    }

    const page = Number(searchParams.get("page") ?? "");
    const pageSize = Number(searchParams.get("pageSize") ?? "");
    const q = searchParams.get("q") ?? undefined;
    const status = (searchParams.get("status") as "NORMAL" | "VOID" | null) ?? null;
    const data = await listResources(env as unknown as EnvWithHyperdrive, { page, pageSize, q: q ?? undefined, status });
    return jsonOk({ ...data, q, status });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = resourceCreateSchema.safeParse(body);
    if (!parsed.success) return jsonError(new Error(JSON.stringify(parsed.error.flatten())), 400);
    const { env } = getCloudflareContext();
    const id = await createResource(env as unknown as EnvWithHyperdrive, parsed.data);
    return jsonCreated({ id });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = resourceUpdateSchema.safeParse(body);
    if (!parsed.success) return jsonError(new Error(JSON.stringify(parsed.error.flatten())), 400);
    const { env } = getCloudflareContext();
    await modifyResource(env as unknown as EnvWithHyperdrive, parsed.data);
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const { env } = getCloudflareContext();
    await removeResource(env as unknown as EnvWithHyperdrive, id);
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}


