import { NextResponse } from "next/server";

export async function POST() {
  try {
    // 创建 NextResponse
    const response = NextResponse.json({ message: "退出登录成功" });
    
    // 删除会话cookie
    response.cookies.delete("admin-session");

    console.log("Logout successful - Cookie cleared");
    
    return response;
  } catch (e) {
    console.error("Logout error:", e);
    const response = NextResponse.json({ message: "退出登录成功" }); // 即使出错也返回成功，因为客户端应该清除本地状态
    response.cookies.delete("admin-session");
    return response;
  }
}
