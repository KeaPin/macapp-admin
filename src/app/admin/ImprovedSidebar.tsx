"use client";

import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import Link from "next/link";

const navigation = [
  {
    name: "概览",
    href: "/admin",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    name: "分类管理",
    href: "/admin/categories",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
  },
  {
    name: "资源管理",
    href: "/admin/resources",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    name: "用户管理",
    href: "/admin/users",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
];

export default function ImprovedSidebar() {
  const pathname = usePathname();
  const { isExpanded, isMobile, isOpen, closeSidebar } = useSidebar();

  const isActiveRoute = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const navItemClass = (active: boolean) => {
    const baseStyles = "group text-sm font-medium rounded-md transition-all duration-200";
    const colorStyles = active
      ? "bg-indigo-800 text-white"
      : "text-zinc-300 hover:bg-zinc-800 hover:text-white";
    
    if (isExpanded || isMobile) {
      return `${baseStyles} ${colorStyles} flex items-center px-2 py-2`;
    } else {
      return `${baseStyles} ${colorStyles} flex items-center justify-center mx-auto w-10 h-10`;
    }
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-zinc-900/80 backdrop-blur-sm md:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Mobile sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-52 bg-zinc-900 transform transition-transform duration-300 ease-in-out md:hidden ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent 
            isExpanded={true} 
            navigation={navigation}
            navItemClass={navItemClass}
            isActiveRoute={isActiveRoute}
            closeSidebar={closeSidebar}
            isMobile={true}
          />
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div
      className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ease-in-out ${
        isExpanded ? "md:w-52" : "md:w-12"
      }`}
    >
      <div className="flex flex-col w-full h-full bg-zinc-900">
        <SidebarContent 
          isExpanded={isExpanded} 
          navigation={navigation}
          navItemClass={navItemClass}
          isActiveRoute={isActiveRoute}
          isMobile={false}
        />
      </div>
    </div>
  );
}

interface SidebarContentProps {
  isExpanded: boolean;
  navigation: typeof navigation;
  navItemClass: (active: boolean) => string;
  isActiveRoute: (href: string) => boolean;
  closeSidebar?: () => void;
  isMobile: boolean;
}

function SidebarContent({ 
  isExpanded, 
  navigation, 
  navItemClass, 
  isActiveRoute, 
  closeSidebar,
  isMobile 
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center flex-shrink-0 py-5 ${!isExpanded && !isMobile ? "justify-center px-0" : "px-4"}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-500">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          {(isExpanded || isMobile) && (
            <span className="text-lg font-semibold text-white">MacApp Admin</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 space-y-1 ${isExpanded || isMobile ? "px-4" : "px-0"} pb-4`}>
        {navigation.map((item) => {
          const active = isActiveRoute(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={navItemClass(active)}
              onClick={isMobile ? closeSidebar : undefined}
              title={!isExpanded && !isMobile ? item.name : undefined}
            >
              {(isExpanded || isMobile) ? (
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.name}</span>
                </div>
              ) : (
                <span className="flex-shrink-0">{item.icon}</span>
              )}
              {active && !isExpanded && !isMobile && (
                <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500 rounded-r" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile User info - only show on mobile */}
      {isMobile && (
        <div className="flex-shrink-0 p-4 border-t border-zinc-700">
          <div className="flex items-center gap-3">
            <img
              className="h-8 w-8 rounded-full bg-zinc-800 flex-shrink-0"
              src="data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23374151'/%3e%3ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white'%3eA%3c/text%3e%3c/svg%3e"
              alt="Admin Avatar"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">管理员</p>
              <p className="text-xs text-zinc-400 truncate">admin@example.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
