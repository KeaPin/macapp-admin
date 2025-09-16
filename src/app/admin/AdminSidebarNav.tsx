"use client";

import { usePathname } from "next/navigation";

export default function AdminSidebarNav() {
  const pathname = usePathname();
  const isOverview = pathname === "/admin";
  const isCategories = pathname.startsWith("/admin/categories");
  const isResources = pathname.startsWith("/admin/resources");

  function itemClass(active: boolean): string {
    return active
      ? "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold bg-zinc-800 text-white"
      : "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800";
  }

  return (
    <nav className="flex flex-1 flex-col px-6 pb-4">
      <ul role="list" className="flex flex-1 flex-col gap-y-1">
        <li>
          <a
            href="/admin"
            className={itemClass(isOverview)}
            aria-current={isOverview ? "page" : undefined}
          >
            <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            概览
          </a>
        </li>
        <li>
          <a
            href="/admin/categories"
            className={itemClass(isCategories)}
            aria-current={isCategories ? "page" : undefined}
          >
            <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            分类管理
          </a>
        </li>
        <li>
          <a
            href="/admin/resources"
            className={itemClass(isResources)}
            aria-current={isResources ? "page" : undefined}
          >
            <svg className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            资源管理
          </a>
        </li>
      </ul>

      {/* User info */}
      <div className="mt-auto">
        <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="h-8 w-8 rounded-full bg-zinc-800"
            src="data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23374151'/%3e%3ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white'%3eA%3c/text%3e%3c/svg%3e"
            alt=""
          />
          <span className="sr-only">Your profile</span>
          <span aria-hidden="true">admin@example.com</span>
        </div>
      </div>
    </nav>
  );
}


