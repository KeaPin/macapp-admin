import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { EnvWithHyperdrive } from "@/server/db";
import { userLoginSchema } from "@/server/validators";
import { jsonError } from "@/server/http";
import { authenticateUser } from "@/server/services/users.service";
import { getSession } from "@/server/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = userLoginSchema.safeParse(body);
    
    if (!parsed.success) {
      return jsonError(new Error("用户名或密码格式错误"), 400);
    }

    const { env } = getCloudflareContext();
    
    // 验证用户凭据
    const user = await authenticateUser(env as unknown as EnvWithHyperdrive, parsed.data);
    
    if (!user) {
      return jsonError(new Error("用户名或密码错误"), 401);
    }

    // 创建会话token
    const session = await getSession(req);
    session.user = user;
    session.isLoggedIn = true;
    const token = session.getTokenForCookie();

    // 创建 NextResponse 并设置cookie
    const response = NextResponse.json({
      message: "登录成功",
      user: {
        id: user.id,
        userName: user.userName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });

    // 设置会话cookie
    response.cookies.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || !!process.env.CF_PAGES,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7天
    });
    
    // 添加调试日志
    console.log("Login successful - Session created:", {
      userId: user.id,
      userName: user.userName,
      isLoggedIn: session.isLoggedIn,
      tokenLength: token.length,
      cookieSet: true
    });

    return response;
  } catch (e) {
    console.error("Login error:", e);
    return jsonError(e);
  }
}
