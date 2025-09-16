"use client";
import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

type Stats = {
  totalCategories: number;
  totalResources: number;
  recentResources: Array<{
    id: string;
    title: string;
    url: string;
    category_id: number | null;
    description: string | null;
  }>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCategories: 0,
    totalResources: 0,
    recentResources: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStats() {
    setLoading(true);
    setError(null);
    try {
      const [categoriesRes, resourcesRes] = await Promise.all([
        fetch("/api/categories?page=1&pageSize=1"),
        fetch("/api/resources?page=1&pageSize=10"),
      ]);

      if (!categoriesRes.ok || !resourcesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      type CategoriesResponse = { total: number };
      type ResourceListItem = {
        id: string;
        title: string;
        url?: string;
        category_id?: number | null;
        description?: string | null;
      };
      type ResourcesResponse = { items: ResourceListItem[]; total: number };

      const categoriesJson = (await categoriesRes.json()) as CategoriesResponse;
      const resourcesJson = (await resourcesRes.json()) as ResourcesResponse;

      const totalCategories = typeof categoriesJson?.total === "number" ? categoriesJson.total : 0;
      const totalResources = typeof resourcesJson?.total === "number" ? resourcesJson.total : 0;
      const recentResources: Stats["recentResources"] = Array.isArray(resourcesJson?.items)
        ? resourcesJson.items.map((r) => ({
            id: r.id,
            title: r.title,
            url: r.url ?? "#",
            category_id: r.category_id ?? null,
            description: r.description ?? null,
          }))
        : [];

      setStats({
        totalCategories,
        totalResources,
        recentResources,
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
      setError("加载数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

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
            <h1 className="text-2xl sm:text-3xl font-bold text-white">管理面板</h1>
            <p className="mt-2 text-sm text-zinc-400">
              {new Date().toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              导出报告
            </button>
            <button 
              onClick={loadStats}
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

      {/* Stats */}
      <div className="mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-lg ring-1 ring-zinc-700/50 transition-all duration-200 hover:ring-indigo-500/50 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">总分类数</p>
                <p className="mt-2 text-3xl font-bold text-white">{loading ? "--" : stats.totalCategories}</p>
                <div className="mt-2 flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-400 font-medium">+4.5%</span>
                  <span className="text-zinc-500 ml-1">vs上月</span>
                </div>
              </div>
              <div className="rounded-lg bg-indigo-500/20 p-3 ring-1 ring-indigo-500/30">
                <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <a href="/admin/categories" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center group-hover:text-indigo-300 transition-colors">
                查看全部
                <svg className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-lg ring-1 ring-zinc-700/50 transition-all duration-200 hover:ring-emerald-500/50 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">总资源数</p>
                <p className="mt-2 text-3xl font-bold text-white">{loading ? "--" : stats.totalResources}</p>
                <div className="mt-2 flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-400 font-medium">+21.2%</span>
                  <span className="text-zinc-500 ml-1">vs上月</span>
                </div>
              </div>
              <div className="rounded-lg bg-emerald-500/20 p-3 ring-1 ring-emerald-500/30">
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <a href="/admin/resources" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center group-hover:text-emerald-300 transition-colors">
                查看全部
                <svg className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-lg ring-1 ring-zinc-700/50 transition-all duration-200 hover:ring-cyan-500/50 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">页面访问</p>
                <p className="mt-2 text-3xl font-bold text-white">{loading ? "--" : "823,067"}</p>
                <div className="mt-2 flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-400 font-medium">+4.5%</span>
                  <span className="text-zinc-500 ml-1">vs上月</span>
                </div>
              </div>
              <div className="rounded-lg bg-cyan-500/20 p-3 ring-1 ring-cyan-500/30">
                <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <a href="#" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 flex items-center group-hover:text-cyan-300 transition-colors">
                查看详情
                <svg className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 shadow-lg ring-1 ring-zinc-700/50 transition-all duration-200 hover:ring-amber-500/50 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">平均评分</p>
                <p className="mt-2 text-3xl font-bold text-white">{loading ? "--" : "4.8"}</p>
                <div className="mt-2 flex items-center text-sm">
                  <svg className="h-4 w-4 text-red-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04L9.25 14.388V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-400 font-medium">-0.5%</span>
                  <span className="text-zinc-500 ml-1">vs上月</span>
                </div>
              </div>
              <div className="rounded-lg bg-amber-500/20 p-3 ring-1 ring-amber-500/30">
                <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <a href="#" className="text-sm font-medium text-amber-400 hover:text-amber-300 flex items-center group-hover:text-amber-300 transition-colors">
                查看详情
                <svg className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Resources Table */}
      <div className="bg-zinc-900 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-white">最近资源</h3>
          <div className="mt-6 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-zinc-700">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-300 sm:pl-0">
                        资源名称
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        链接
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        分类
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        描述
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Edit</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-sm text-zinc-400 text-center">
                          加载中...
                        </td>
                      </tr>
                    ) : stats.recentResources.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-sm text-zinc-400 text-center">
                          暂无数据
                        </td>
                      </tr>
                    ) : (
                      stats.recentResources.map((resource) => (
                        <tr key={resource.id} className="hover:bg-zinc-800/50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-0">
                            {resource.title}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-300">
                            <a 
                              href={resource.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 hover:underline truncate block max-w-xs"
                            >
                              {resource.url}
                            </a>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-300">
                            {resource.category_id || "未分类"}
                          </td>
                          <td className="px-3 py-4 text-sm text-zinc-300 max-w-xs truncate">
                            {resource.description || "无描述"}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <a href={`/admin/resources`} className="text-indigo-400 hover:text-indigo-300">
                              查看
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
