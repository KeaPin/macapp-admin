"use client";
import { useEffect, useState } from "react";

type Stats = {
  totalCategories: number;
  totalResources: number;
  recentResources: Array<{
    id: number;
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

  async function loadStats() {
    setLoading(true);
    try {
      const [categoriesRes, resourcesRes] = await Promise.all([
        fetch("/api/categories?page=1&pageSize=1"),
        fetch("/api/resources?page=1&pageSize=10"),
      ]);
      const categories = (await categoriesRes.json()) as { total: number } | unknown;
      const resources = (await resourcesRes.json()) as { items: Stats["recentResources"]; total: number } | unknown;

      const totalCategories = typeof (categories as any)?.total === "number" ? (categories as any).total : 0;
      const totalResources = typeof (resources as any)?.total === "number" ? (resources as any).total : 0;
      const recentResources = Array.isArray((resources as any)?.items) ? (resources as any).items : [];

      setStats({
        totalCategories,
        totalResources,
        recentResources,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Good afternoon, Admin</h1>
        <p className="mt-2 text-sm text-zinc-400">这里是您的管理面板概览</p>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-lg bg-zinc-900 px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
              </div>
              <p className="ml-16 truncate text-sm font-medium text-zinc-400">总分类数</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-white">{stats.totalCategories}</p>
              <p className="ml-2 flex items-baseline text-sm font-semibold text-green-400">
                <svg className="h-4 w-4 flex-shrink-0 self-center text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                </svg>
                <span className="sr-only"> Increased by </span>
                +4.5%
              </p>
              <div className="absolute inset-x-0 bottom-0 bg-zinc-800 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a href="/admin/categories" className="font-medium text-indigo-400 hover:text-indigo-300">
                    查看全部
                  </a>
                </div>
              </div>
            </dd>
          </div>

          <div className="relative overflow-hidden rounded-lg bg-zinc-900 px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="ml-16 truncate text-sm font-medium text-zinc-400">总资源数</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-white">{stats.totalResources}</p>
              <p className="ml-2 flex items-baseline text-sm font-semibold text-green-400">
                <svg className="h-4 w-4 flex-shrink-0 self-center text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                </svg>
                <span className="sr-only"> Increased by </span>
                +21.2%
              </p>
              <div className="absolute inset-x-0 bottom-0 bg-zinc-800 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a href="/admin/resources" className="font-medium text-indigo-400 hover:text-indigo-300">
                    查看全部
                  </a>
                </div>
              </div>
            </dd>
          </div>

          <div className="relative overflow-hidden rounded-lg bg-zinc-900 px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="ml-16 truncate text-sm font-medium text-zinc-400">页面访问</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-white">823,067</p>
              <p className="ml-2 flex items-baseline text-sm font-semibold text-green-400">
                <svg className="h-4 w-4 flex-shrink-0 self-center text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04L10.75 5.612V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                </svg>
                <span className="sr-only"> Increased by </span>
                +4.5%
              </p>
              <div className="absolute inset-x-0 bottom-0 bg-zinc-800 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                    查看详情
                  </a>
                </div>
              </div>
            </dd>
          </div>

          <div className="relative overflow-hidden rounded-lg bg-zinc-900 px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6">
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="ml-16 truncate text-sm font-medium text-zinc-400">平均评分</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-white">4.8</p>
              <p className="ml-2 flex items-baseline text-sm font-semibold text-red-400">
                <svg className="h-4 w-4 flex-shrink-0 self-center text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04L9.25 14.388V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                </svg>
                <span className="sr-only"> Decreased by </span>
                -0.5%
              </p>
              <div className="absolute inset-x-0 bottom-0 bg-zinc-800 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                    查看详情
                  </a>
                </div>
              </div>
            </dd>
          </div>
        </dl>
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
