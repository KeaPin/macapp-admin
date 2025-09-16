"use client";

import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import Link from "next/link";
import { useAuth } from "@/components/AuthGuard";
import { useState } from "react";

const routeNames: Record<string, string> = {
  "/admin": "概览",
  "/admin/categories": "分类管理",
  "/admin/resources": "资源管理",
  "/admin/users": "用户管理",
};

const routeParents: Record<string, { name: string; href: string }[]> = {
  "/admin/categories": [{ name: "概览", href: "/admin" }],
  "/admin/resources": [{ name: "概览", href: "/admin" }],
  "/admin/users": [{ name: "概览", href: "/admin" }],
};

export default function Header() {
  const pathname = usePathname();
  const { toggleSidebar, isMobile } = useSidebar();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentRouteName = routeNames[pathname] || "未知页面";
  const breadcrumbs = routeParents[pathname] || [];

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  // 生成用户头像
  const getUserAvatar = () => {
    if (user?.avatar) {
      return user.avatar;
    }
    // 生成默认头像
    const initial = user?.userName?.[0]?.toUpperCase() || "U";
    return `data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23374151'/%3e%3ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white'%3e${initial}%3c/text%3e%3c/svg%3e`;
  };

  return (
    <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/75 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      {isMobile && (
        <button
          type="button"
          className="-m-2.5 p-2.5 text-zinc-400 hover:text-white md:hidden"
          onClick={toggleSidebar}
          aria-label="打开侧边栏"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      )}

      {/* Desktop sidebar toggle */}
      {!isMobile && (
        <button
          type="button"
          className="-m-2.5 p-2.5 text-zinc-400 hover:text-white"
          onClick={toggleSidebar}
          aria-label="切换侧边栏"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
      )}

      {/* Breadcrumbs */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="relative flex flex-1 items-center">
          <nav className="flex" aria-label="面包屑">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={breadcrumb.href} className="flex items-center">
                  {index > 0 && (
                    <svg
                      className="mx-2 h-4 w-4 text-zinc-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  <Link
                    href={breadcrumb.href}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    {breadcrumb.name}
                  </Link>
                </li>
              ))}
              {breadcrumbs.length > 0 && (
                <li className="flex items-center">
                  <svg
                    className="mx-2 h-4 w-4 text-zinc-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
              )}
              <li className="flex items-center">
                <span className="text-white font-medium">{currentRouteName}</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Search - hidden on small screens */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                type="search"
                placeholder="快速搜索..."
                className="block w-64 pl-10 pr-3 py-2 border-0 rounded-md bg-zinc-800 text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:bg-zinc-700 text-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <kbd className="inline-flex items-center rounded border border-zinc-600 px-1.5 py-0.5 text-xs font-mono text-zinc-400">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              type="button"
              className="relative -m-2.5 p-2.5 text-zinc-400 hover:text-white transition-colors"
              aria-label="查看通知"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {/* Notification badge */}
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">3</span>
              </span>
            </button>

            {/* Settings */}
            <button
              type="button"
              className="-m-2.5 p-2.5 text-zinc-400 hover:text-white transition-colors"
              aria-label="设置"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative ml-3">
              <div className="flex items-center">
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-full bg-zinc-800 p-1.5 text-sm hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                  aria-label="用户菜单"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <img
                    className="h-8 w-8 rounded-full bg-zinc-700 flex-shrink-0"
                    src={getUserAvatar()}
                    alt="User Avatar"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">
                      {user?.userName || "用户"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {user?.email || user?.role || "管理员"}
                    </p>
                  </div>
                  <svg className="hidden sm:block h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
              
              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-zinc-800 py-1 shadow-lg ring-1 ring-zinc-700 focus:outline-none">
                  <div className="px-4 py-3 border-b border-zinc-700">
                    <p className="text-sm font-medium text-white">{user?.userName}</p>
                    <p className="text-xs text-zinc-400">{user?.email}</p>
                    {user?.role && (
                      <p className="text-xs text-indigo-400 mt-1">角色: {user.role}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  >
                    个人资料
                  </button>
                  <button
                    onClick={() => setShowUserMenu(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  >
                    账户设置
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-700 hover:text-red-300"
                  >
                    退出登录
                  </button>
                </div>
              )}
              
              {/* Overlay to close dropdown when clicking outside */}
              {showUserMenu && (
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setShowUserMenu(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
