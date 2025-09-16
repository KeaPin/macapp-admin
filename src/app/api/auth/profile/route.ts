import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { EnvWithHyperdrive } from "@/server/db";
import { jsonError, jsonOk } from "@/server/http";
import { getUserById } from "@/server/services/users.service";
import { getSession } from "@/server/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    
    // 添加调试日志
    console.log("Profile check - Session state:", {
      isLoggedIn: session.isLoggedIn,
      hasUser: !!session.user,
      userId: session.user?.id,
      cookies: req.headers.get('cookie')
    });
    
    if (!session.isLoggedIn || !session.user) {
      console.log("Profile check failed - Not logged in");
      return jsonError(new Error("未登录"), 401);
    }

    const { env } = getCloudflareContext();
    
    // 从数据库获取最新的用户信息
    const currentUser = await getUserById(env as unknown as EnvWithHyperdrive, session.user.id);
    
    if (!currentUser) {
      console.log("Profile check failed - User not found in database");
      return jsonError(new Error("用户不存在或已被禁用"), 401);
    }

    console.log("Profile check successful:", {
      userId: currentUser.id,
      userName: currentUser.userName
    });

    return jsonOk({
      user: {
        id: currentUser.id,
        userName: currentUser.userName,
        email: currentUser.email,
        role: currentUser.role,
        avatar: currentUser.avatar,
        status: currentUser.status,
        createTime: currentUser.createTime,
      },
    });
  } catch (e) {
    console.error("Profile error:", e);
    return jsonError(e);
  }
}
