"use client";
import { useEffect, useState } from "react";
import LoadingSpinner from "../LoadingSpinner";

interface User {
  id: string;
  userName: string | null;
  email: string | null;
  role: string | null;
  avatar: string | null;
  status: "NORMAL" | "VOID";
  createTime: string;
}

interface UsersResponse {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
      }

      const response = await fetch(`/api/users?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data: UsersResponse = await response.json();
      setUsers(data.items);
      setPagination(prev => ({
        ...prev,
        total: data.total,
      }));
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("加载用户失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [pagination.page, pagination.pageSize]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadUsers();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === "NORMAL") {
      return (
        <span className="inline-flex items-center rounded-md bg-green-900/50 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">
          正常
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md bg-red-900/50 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
        禁用
      </span>
    );
  };

  return (
    <div>
      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-900/50 p-4 ring-1 ring-red-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-400">{error}</p>
            </div>
            <div className="ml-3 flex-shrink-0">
              <button
                type="button"
                className="inline-flex rounded-md bg-red-900/50 p-1.5 text-red-400 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-red-900"
                onClick={() => setError(null)}
              >
                <span className="sr-only">关闭错误提示</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">用户管理</h1>
            <p className="mt-2 text-sm text-zinc-400">
              管理系统用户和权限
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <button 
              onClick={loadUsers}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              )}
              {loading ? "刷新中..." : "刷新数据"}
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="search"
              placeholder="搜索用户名或邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-0 bg-zinc-900 py-2 px-3 text-white placeholder:text-zinc-400 ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-indigo-500 focus:ring-inset sm:text-sm sm:leading-6"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            搜索
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900 shadow rounded-lg ring-1 ring-zinc-800">
        {/* Desktop table view */}
        <div className="hidden sm:block">
          <div className="px-4 py-5 sm:p-6">
            <div className="flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-zinc-700">
                  <thead className="bg-zinc-900/40">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-300 sm:pl-0">
                        用户
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        邮箱
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        角色
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        状态
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        创建时间
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center">
                          <LoadingSpinner size="md" />
                          <p className="mt-2 text-sm text-zinc-400">加载中...</p>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-sm text-zinc-400 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="h-12 w-12 text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                            暂无用户数据
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="whitespace-nowrap py-3 pl-4 pr-3 sm:pl-0">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <img
                                  className="h-10 w-10 rounded-full bg-zinc-700"
                                  src={user.avatar || `data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23374151'/%3e%3ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white'%3e${(user.userName?.[0] || 'U').toUpperCase()}%3c/text%3e%3c/svg%3e`}
                                  alt={user.userName || "User"}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">
                                  {user.userName || "未知用户"}
                                </div>
                                <div className="text-sm text-zinc-400">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-zinc-300">
                            {user.email || "未设置"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-zinc-300">
                            {user.role || "用户"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm">
                            {getStatusBadge(user.status)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-zinc-300">
                            {formatDate(user.createTime)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Desktop Pagination */}
          {pagination.total > 0 && (
            <div className="border-t border-zinc-700 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Mobile pagination info */}
                <div className="text-sm text-zinc-400 sm:hidden">
                  第 {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)} 页，共 {pagination.total} 条记录
                </div>

                {/* Desktop pagination controls */}
                <div className="hidden sm:flex sm:items-center sm:space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page <= 1 || loading}
                    className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-700 transition-colors"
                  >
                    上一页
                  </button>
                  {(() => {
                    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
                    const pages: Array<number | string> = [];
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      const start = Math.max(2, pagination.page - 1);
                      const end = Math.min(totalPages - 1, pagination.page + 1);
                      if (start > 2) pages.push("...");
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (end < totalPages - 1) pages.push("...");
                      pages.push(totalPages);
                    }
                    return (
                      <span className="inline-flex items-center gap-1">
                        {pages.map((p, idx) =>
                          typeof p === "number" ? (
                            <button
                              key={`${p}-${idx}`}
                              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                                p === pagination.page 
                                  ? "bg-indigo-600 text-white" 
                                  : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                              }`}
                              disabled={loading || p === pagination.page}
                              onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                            >
                              {p}
                            </button>
                          ) : (
                            <span key={`dots-${idx}`} className="px-2 text-zinc-500 text-sm">…</span>
                          )
                        )}
                      </span>
                    );
                  })()}
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize) || loading}
                    className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-700 transition-colors"
                  >
                    下一页
                  </button>
                </div>

                {/* Mobile pagination controls */}
                <div className="flex items-center justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page <= 1 || loading}
                    className="flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50 hover:bg-zinc-700 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    上一页
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize) || loading}
                    className="flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50 hover:bg-zinc-700 transition-colors"
                  >
                    下一页
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>

                {/* Page size and info */}
                <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                  <span className="hidden sm:block text-sm text-zinc-400">
                    第 {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)} 页
                  </span>
                  <div className="flex items-center gap-2">
                    <label htmlFor="user-page-size" className="text-sm text-zinc-400">每页:</label>
                    <select
                      id="user-page-size"
                      className="rounded-md bg-zinc-800 px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-indigo-500"
                      value={pagination.pageSize}
                      onChange={(e) => {
                        const newPageSize = Number(e.target.value);
                        setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden">
          <div className="divide-y divide-zinc-800">
            {loading ? (
              <div className="px-4 py-8 text-center text-zinc-400">
                <div className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  加载中...
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="px-4 py-8 text-center text-zinc-400">
                <div className="flex flex-col items-center">
                  <svg className="h-12 w-12 text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  暂无用户数据
                </div>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="px-4 py-4 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full bg-zinc-700"
                          src={user.avatar || `data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23374151'/%3e%3ctext x='50' y='50' font-size='40' text-anchor='middle' dy='.35em' fill='white'%3e${(user.userName?.[0] || 'U').toUpperCase()}%3c/text%3e%3c/svg%3e`}
                          alt={user.userName || "User"}
                        />
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white truncate">
                            {user.userName || "未知用户"}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.status === "NORMAL" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
                          }`}>
                            {user.status === "NORMAL" ? "正常" : "禁用"}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 truncate mb-1">
                          {user.email || "未设置邮箱"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span>角色: {user.role || "用户"}</span>
                          <span>ID: {user.id}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          创建于 {formatDate(user.createTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Pagination */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center rounded-md bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-300 ring-1 ring-inset ring-zinc-600 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-sm text-zinc-400">
                第 {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)} 页
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                className="relative inline-flex items-center rounded-md bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-300 ring-1 ring-inset ring-zinc-600 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
