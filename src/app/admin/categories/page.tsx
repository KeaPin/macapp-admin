"use client";
import { useEffect, useState } from "react";

type Category = { id: string; name: string; description: string | null; status: string };

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("NORMAL");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("NORMAL");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // 状态筛选

  async function load(p = page, ps = pageSize, query = q, statusF = statusFilter) {
    setLoading(true);
    try {
      let url = `/api/categories?page=${p}&pageSize=${ps}`;
      if (query) url += `&q=${encodeURIComponent(query)}`;
      if (statusF) url += `&status=${encodeURIComponent(statusF)}`;
      
      const res = await fetch(url);
      const data = (await res.json()) as { items: Category[]; total: number; page: number; pageSize: number; q?: string; status?: string };
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setPage(typeof data.page === "number" ? data.page : p);
      setPageSize(typeof data.pageSize === "number" ? data.pageSize : ps);
      if (typeof data.q === "string") setQ(data.q);
      if (typeof data.status === "string") setStatusFilter(data.status);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createCategory() {
    if (!name.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null, status }),
    });
    setName("");
    setDescription("");
    setStatus("NORMAL");
    setCreating(false);
    await load(1, pageSize, q, statusFilter);
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    await load();
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "NORMAL" ? "VOID" : "NORMAL";
    await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    await load();
  }

  function openEdit(c: Category) {
    setEditing(c);
    setEditName(c.name);
    setEditDescription(c.description || "");
    setEditStatus(c.status || "NORMAL");
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editName.trim()) return;
    await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, name: editName, description: editDescription || null, status: editStatus }),
    });
    setEditing(null);
    await load();
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">分类管理</h1>
          <p className="text-sm text-zinc-400 mt-1">维护资源分类，用于资源归类与筛选。</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <input
              className="block w-48 rounded-md border-0 bg-zinc-800 py-1.5 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-sm"
              placeholder="搜索名称/描述"
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
      <div id="create-category-form" className="hidden rounded-lg bg-zinc-900 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">名称</label>
            <input
              className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              placeholder="请输入分类名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">描述（可选）</label>
            <input
              className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
              placeholder="填写该分类的简要说明"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex md:justify-end">
            <button
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              onClick={createCategory}
              disabled={!name.trim()}
            >
              新建分类
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
                    <col className="w-[240px]" />
                    <col />
                    <col className="w-[100px]" />
                    <col className="w-[120px]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-zinc-300 sm:pl-0">
                        ID
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        名称
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-zinc-300">
                        描述
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
                    {items.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-800/50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-zinc-300 sm:pl-0">
                          {c.id}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-white truncate">
                          {c.name}
                        </td>
                        <td className="px-3 py-4 text-sm text-zinc-300 truncate">
                          {c.description || "无描述"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            c.status === "NORMAL" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {c.status === "NORMAL" ? "正常" : "下架"}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <button
                            className={`mr-3 ${c.status === "NORMAL" ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}`}
                            onClick={() => toggleStatus(c.id, c.status)}
                          >
                            {c.status === "NORMAL" ? "下架" : "上架"}
                          </button>
                          <button
                            className="mr-3 text-indigo-400 hover:text-indigo-300"
                            onClick={() => openEdit(c)}
                          >
                            编辑
                          </button>
                          <button
                            className="text-red-400 hover:text-red-300"
                            onClick={() => deleteCategory(c.id)}
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && !loading && (
                      <tr>
                        <td className="px-3 py-8 text-center text-zinc-400" colSpan={5}>
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
      {/* Edit modal */
      }
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditing(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-lg bg-zinc-900 p-6 shadow">
            <h3 className="text-lg font-semibold text-white">编辑分类</h3>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">名称</label>
                <input
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
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
                disabled={!editName.trim()}
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
          <div className="relative z-10 w-full max-w-lg rounded-lg bg-zinc-900 p-6 shadow">
            <h3 className="text-lg font-semibold text-white">新增分类</h3>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">名称</label>
                <input
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  placeholder="请输入分类名称"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">描述（可选）</label>
                <input
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  placeholder="填写该分类的简要说明"
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
                disabled={!name.trim()}
                onClick={createCategory}
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
          {/* Numbered pages */}
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


