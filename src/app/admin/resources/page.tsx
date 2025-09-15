"use client";
import { useEffect, useState } from "react";

type Resource = {
  id: number;
  title: string;
  icon: string | null;
  category_name: string | null;
  status: string;
};

type Category = { id: number; name: string };

export default function ResourcesPage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("NORMAL");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("NORMAL");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // 状态筛选

  async function load(p = page, ps = pageSize, query = q, statusF = statusFilter) {
    setLoading(true);
    try {
      let resourceUrl = `/api/resources?page=${p}&pageSize=${ps}`;
      if (query) resourceUrl += `&q=${encodeURIComponent(query)}`;
      if (statusF) resourceUrl += `&status=${encodeURIComponent(statusF)}`;
      
      const [r1, r2] = await Promise.all([
        fetch(resourceUrl).then(async (r) => (await r.json()) as { items: Resource[]; total: number; page: number; pageSize: number; q?: string; status?: string }),
        fetch(`/api/categories?page=1&pageSize=1000`).then(async (r) => (await r.json()) as { items: Category[] } | Category[]),
      ]);
      setItems(Array.isArray(r1.items) ? r1.items : []);
      setTotal(typeof r1.total === "number" ? r1.total : 0);
      setPage(typeof r1.page === "number" ? r1.page : p);
      setPageSize(typeof r1.pageSize === "number" ? r1.pageSize : ps);
      if (typeof r1.q === "string") setQ(r1.q);
      if (typeof r1.status === "string") setStatusFilter(r1.status);
      const cats = Array.isArray((r2 as any)?.items) ? (r2 as any).items : (Array.isArray(r2) ? (r2 as Category[]) : []);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createResource() {
    if (!title.trim() || !url.trim()) return;
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        url,
        categoryId: categoryId ? Number(categoryId) : null,
        description: description || null,
        status,
      }),
    });
    setTitle("");
    setUrl("");
    setCategoryId("");
    setDescription("");
    setStatus("NORMAL");
    setCreating(false);
    await load(1, pageSize, q, statusFilter);
  }

  async function deleteResource(id: number) {
    await fetch(`/api/resources?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function toggleStatus(id: number, currentStatus: string) {
    const newStatus = currentStatus === "NORMAL" ? "VOID" : "NORMAL";
    await fetch("/api/resources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    await load();
  }

  async function openEdit(r: Resource) {
    setEditing(r);
    try {
      const res = await fetch(`/api/resources?id=${r.id}`);
      if (res.ok) {
        const data = (await res.json()) as { id: number; title: string; url: string; category_id: number | null; description: string | null; status: string };
        setEditTitle(data.title);
        setEditUrl(data.url);
        setEditCategoryId(data.category_id ? String(data.category_id) : "");
        setEditDescription(data.description || "");
        setEditStatus(data.status || "NORMAL");
      } else {
        setEditTitle(r.title);
        setEditStatus("NORMAL");
      }
    } catch {
      setEditTitle(r.title);
      setEditStatus("NORMAL");
    }
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editTitle.trim() || !editUrl.trim()) return;
    await fetch("/api/resources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        title: editTitle,
        url: editUrl,
        categoryId: editCategoryId ? Number(editCategoryId) : null,
        description: editDescription || null,
        status: editStatus,
      }),
    });
    setEditing(null);
    await load();
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">资源管理</h1>
          <p className="text-sm text-zinc-400 mt-1">维护资源信息与下载链接。</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <input
              className="block w-56 rounded-md border-0 bg-zinc-800 py-1.5 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-sm"
              placeholder="搜索标题/URL/描述"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setQ(search);
                  load(1, pageSize, search, statusFilter);
                }
              }}
            />
            <select
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 border-0 focus:ring-2 focus:ring-indigo-500"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                load(1, pageSize, q, e.target.value);
              }}
            >
              <option value="">全部状态</option>
              <option value="NORMAL">正常</option>
              <option value="VOID">下架</option>
            </select>
            <button
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700"
              onClick={() => {
                setQ(search);
                load(1, pageSize, search, statusFilter);
              }}
            >
              搜索
            </button>
            <button
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700"
              onClick={() => {
                setSearch("");
                setQ("");
                setStatusFilter("");
                load(1, pageSize, "", "");
              }}
            >
              重置
            </button>
          </div>
          <div className="text-sm text-zinc-400">
            {loading ? "加载中..." : `共 ${total} 条`}
          </div>
          <button
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            onClick={() => setCreating(true)}
          >
            新增
          </button>
        </div>
      </div>

      {/* Create form (hidden, replaced by modal) */}
      <div id="create-resource-form" className="hidden rounded-lg bg-zinc-900 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_2fr_auto] gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">标题</label>
            <input
              className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              placeholder="资源标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">链接 URL</label>
            <input
              className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              placeholder="如：https://example.com/download"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">分类</label>
            <select
              className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">未分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">描述（可选）</label>
            <input
              className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              placeholder="简要描述资源用途"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex md:justify-end">
            <button
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              onClick={createResource}
              disabled={!title.trim() || !url.trim()}
            >
              新建资源
            </button>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-zinc-900 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full table-fixed divide-y divide-zinc-700">
                  <colgroup>
                    <col className="w-[80px]" />
                    <col className="w-[80px]" />
                    <col className="w-[240px]" />
                    <col />
                    <col className="w-[100px]" />
                    <col className="w-[140px]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-300 sm:pl-0">
                        ID
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        图标
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        标题
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        分类名称
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        状态
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">操作</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {items.map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-800/50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-zinc-300 sm:pl-0">
                          {r.id}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-300">
                          {r.icon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.icon} alt="icon" className="h-8 w-8 rounded" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-zinc-800" />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-white truncate">
                          {r.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-300">
                          {r.category_name || "未分类"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            r.status === "NORMAL" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {r.status === "NORMAL" ? "正常" : "下架"}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <button
                            className={`mr-3 ${r.status === "NORMAL" ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}`}
                            onClick={() => toggleStatus(r.id, r.status)}
                          >
                            {r.status === "NORMAL" ? "下架" : "上架"}
                          </button>
                          <button
                            className="mr-3 text-indigo-400 hover:text-indigo-300"
                            onClick={() => { void openEdit(r); }}
                          >
                            编辑
                          </button>
                          <button
                            className="text-red-400 hover:text-red-300"
                            onClick={() => deleteResource(r.id)}
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && !loading && (
                      <tr>
                        <td className="px-3 py-8 text-center text-zinc-400" colSpan={6}>
                          暂无数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditing(null)} />
          <div className="relative z-10 w-full max-w-3xl rounded-lg bg-zinc-900 p-6 shadow">
            <h3 className="text-lg font-semibold text-white">编辑资源</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">标题</label>
                <input
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">链接 URL</label>
                <input
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">分类</label>
                <select
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                >
                  <option value="">未分类</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">描述（可选）</label>
                <input
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">状态</label>
                <select
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="NORMAL">正常</option>
                  <option value="VOID">下架</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
                onClick={() => setEditing(null)}
              >
                取消
              </button>
              <button
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                disabled={!editTitle.trim() || !editUrl.trim()}
                onClick={saveEdit}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCreating(false)} />
          <div className="relative z-10 w-full max-w-3xl rounded-lg bg-zinc-900 p-6 shadow">
            <h3 className="text-lg font-semibold text-white">新增资源</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">标题</label>
                <input
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">链接 URL</label>
                <input
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">分类</label>
                <select
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">未分类</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">描述（可选）</label>
                <input
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">状态</label>
                <select
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="NORMAL">正常</option>
                  <option value="VOID">下架</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
                onClick={() => setCreating(false)}
              >
                取消
              </button>
              <button
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                disabled={!title.trim() || !url.trim()}
                onClick={createResource}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-zinc-300">
        <div className="space-x-2">
          <button
            className="rounded-md bg-zinc-800 px-3 py-1.5 disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1, pageSize, q, statusFilter)}
          >
            上一页
          </button>
          {(() => {
            const totalPages = Math.max(1, Math.ceil(total / pageSize));
            const pages: Array<number | string> = [];
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              const start = Math.max(2, page - 1);
              const end = Math.min(totalPages - 1, page + 1);
              if (start > 2) pages.push("...");
              for (let i = start; i <= end; i++) pages.push(i);
              if (end < totalPages - 1) pages.push("...");
              pages.push(totalPages);
            }
            return (
              <span className="inline-flex items-center gap-1 align-middle">
                {pages.map((p, idx) =>
                  typeof p === "number" ? (
                    <button
                      key={`${p}-${idx}`}
                      className={`rounded-md px-3 py-1.5 ${p === page ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"}`}
                      disabled={loading || p === page}
                      onClick={() => load(p, pageSize, q, statusFilter)}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={`dots-${idx}`} className="px-2 text-zinc-500">…</span>
                  )
                )}
              </span>
            );
          })()}
          <button
            className="rounded-md bg-zinc-800 px-3 py-1.5 disabled:opacity-50"
            disabled={page >= Math.max(1, Math.ceil(total / pageSize)) || loading}
            onClick={() => load(page + 1, pageSize, q, statusFilter)}
          >
            下一页
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <span>
            第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页
          </span>
          <select
            className="rounded-md bg-zinc-800 px-2 py-1"
            value={pageSize}
            onChange={async (e) => {
              const ps = Number(e.target.value);
              setPageSize(ps);
              await load(1, ps, q, statusFilter);
            }}
          >
            <option value={10}>10/页</option>
            <option value={20}>20/页</option>
            <option value={50}>50/页</option>
          </select>
        </div>
      </div>
    </div>
  );
}


