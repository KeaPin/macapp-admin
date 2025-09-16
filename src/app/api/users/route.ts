import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { EnvWithHyperdrive } from "@/server/db";
import { userCreateSchema, userUpdateSchema } from "@/server/validators";
import { jsonCreated, jsonError, jsonOk } from "@/server/http";
import { createUser, listUsers, modifyUser, removeUser } from "@/server/services/users.service";
import { isAuthenticated } from "@/server/auth";

export async function GET(req: NextRequest) {
  try {
    // 检查认证
    if (!(await isAuthenticated(req))) {
      return jsonError(new Error("未登录"), 401);
    }

    const { env } = getCloudflareContext();
    const searchParams = req.nextUrl.searchParams;
    const page = Number(searchParams.get("page") ?? "");
    const pageSize = Number(searchParams.get("pageSize") ?? "");
    const q = searchParams.get("q") ?? undefined;
    const status = (searchParams.get("status") as "NORMAL" | "VOID" | null) ?? null;
    
    const data = await listUsers(env as unknown as EnvWithHyperdrive, { 
      page, 
      pageSize, 
      q: q ?? undefined, 
      status 
    });
    
    return jsonOk({ ...data, q, status });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 检查认证
    if (!(await isAuthenticated(req))) {
      return jsonError(new Error("未登录"), 401);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = userCreateSchema.safeParse(body);
    
    if (!parsed.success) {
      return jsonError(new Error(JSON.stringify(parsed.error.flatten())), 400);
    }
    
    const { env } = getCloudflareContext();
    const id = await createUser(env as unknown as EnvWithHyperdrive, parsed.data);
    
    return jsonCreated({ id });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    // 检查认证
    if (!(await isAuthenticated(req))) {
      return jsonError(new Error("未登录"), 401);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = userUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      return jsonError(new Error(JSON.stringify(parsed.error.flatten())), 400);
    }
    
    const { env } = getCloudflareContext();
    await modifyUser(env as unknown as EnvWithHyperdrive, parsed.data);
    
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // 检查认证
    if (!(await isAuthenticated(req))) {
      return jsonError(new Error("未登录"), 401);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id || id.trim().length === 0) {
      return jsonError(new Error("用户ID是必需的"), 400);
    }
    
    const { env } = getCloudflareContext();
    await removeUser(env as unknown as EnvWithHyperdrive, id);
    
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
