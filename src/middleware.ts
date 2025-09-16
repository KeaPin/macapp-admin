import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    console.log('[MIDDLEWARE] Handling CORS preflight for:', request.url);
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 为API路由添加CORS头部
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log('[MIDDLEWARE] Processing API request:', request.nextUrl.pathname);
    
    const response = NextResponse.next();
    
    // 添加CORS头部
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // 添加调试信息头部
    response.headers.set('X-Debug-Path', request.nextUrl.pathname);
    response.headers.set('X-Debug-Method', request.method);
    response.headers.set('X-Debug-Timestamp', new Date().toISOString());
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 匹配所有API路由
    '/api/:path*',
    // 匹配所有管理页面（需要身份验证）
    '/admin/:path*'
  ],
};
