import { NextRequest } from "next/server";
import { SafeUser } from "@/server/services/users.service";

// 会话数据类型
export interface SessionData {
  user?: SafeUser;
  isLoggedIn: boolean;
  exp?: number; // 过期时间
}

// JWT 密钥
const JWT_SECRET = process.env.SECRET_COOKIE_PASSWORD || "default-secret-password-must-be-at-least-32-characters";

// 简单的 base64url 编码/解码函数
function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlDecode(str: string): string {
  str += '='.repeat((4 - str.length % 4) % 4);
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
}

// 创建简单的 JWT token
function createToken(payload: SessionData): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = base64urlEncode(JSON.stringify(header));
  const payloadEncoded = base64urlEncode(JSON.stringify(payload));
  
  // 简单的 HMAC 签名（生产环境应使用 crypto.subtle）
  const signature = base64urlEncode(JWT_SECRET + headerEncoded + payloadEncoded);
  
  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

// 验证 JWT token
function verifyToken(token: string): SessionData | null {
  try {
    const [headerEncoded, payloadEncoded, signature] = token.split('.');
    
    // 验证签名
    const expectedSignature = base64urlEncode(JWT_SECRET + headerEncoded + payloadEncoded);
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload = JSON.parse(base64urlDecode(payloadEncoded));
    
    // 检查过期时间
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

// 简单的会话管理
const COOKIE_NAME = "admin-session";

// 从请求中获取会话数据
export function getSessionData(request: NextRequest): SessionData {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return { isLoggedIn: false };
  }
  
  const payload = verifyToken(token);
  return payload || { isLoggedIn: false };
}

// 创建会话token
export function createSessionToken(user: SafeUser): string {
  const sessionData: SessionData = {
    user,
    isLoggedIn: true,
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7天过期
  };
  
  return createToken(sessionData);
}

// 会话管理类
export class SimpleSession {
  private data: SessionData;

  constructor(request: NextRequest) {
    this.data = getSessionData(request);
  }

  get user() {
    return this.data.user;
  }

  set user(user: SafeUser | undefined) {
    this.data.user = user;
  }

  get isLoggedIn() {
    return this.data.isLoggedIn;
  }

  set isLoggedIn(value: boolean) {
    this.data.isLoggedIn = value;
  }

  // 返回要设置的cookie值
  getTokenForCookie(): string {
    this.data.exp = Date.now() + (7 * 24 * 60 * 60 * 1000);
    return createToken(this.data);
  }
}

// 获取会话
export async function getSession(request: NextRequest): Promise<SimpleSession> {
  return new SimpleSession(request);
}

// 获取当前用户
export async function getCurrentUser(request: NextRequest): Promise<SafeUser | null> {
  const session = await getSession(request);
  return session.user ?? null;
}

// 检查是否已登录
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const session = await getSession(request);
  return session.isLoggedIn === true && !!session.user;
}
