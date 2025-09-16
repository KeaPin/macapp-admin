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

  // async function deleteCategory(id: string) {
  //   await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
  //   await load();
  // }

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
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold leading-6 text-white">分类管理</h1>
          <p className="mt-2 text-sm text-zinc-400">维护资源分类，用于资源归类与筛选。</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            onClick={() => setCreating(true)}
          >
            <span className="sm:hidden">新增分类</span>
            <span className="hidden sm:block">新增</span>
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <div className="relative">
            <input
              className="block w-full sm:w-64 rounded-md border-0 bg-zinc-800 py-2 pl-10 pr-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-sm"
              placeholder="搜索名称或描述..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setQ(search);
                  load(1, pageSize, search, statusFilter);
                }
              }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
          <select
            className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-200 border-0 focus:ring-2 focus:ring-indigo-500 min-w-0"
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
          <div className="flex gap-2">
            <button
              className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
              onClick={() => {
                setQ(search);
                load(1, pageSize, search, statusFilter);
              }}
            >
              搜索
            </button>
            <button
              className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
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
        </div>
        <div className="text-sm text-zinc-400">
          {loading ? "加载中..." : `共 ${total} 条记录`}
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

      {/* Data display */}
      <div className="bg-zinc-900 shadow rounded-lg">
        {/* Desktop table view */}
        <div className="hidden sm:block">
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
                      <col className="w-[140px]" />
                    </colgroup>
                    <thead className="bg-zinc-900/40">
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
                        <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-zinc-300">
                            操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {items.map((c) => (
                        <tr key={c.id} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm text-zinc-300 sm:pl-0">
                            {c.id}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-white truncate">
                            {c.name}
                          </td>
                          <td className="px-3 py-3 text-sm text-zinc-300 truncate">
                            {c.description || "无描述"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              c.status === "NORMAL" ? "bg-green-900/50 text-green-400 ring-1 ring-green-400/20" : "bg-red-900/50 text-red-400 ring-1 ring-red-400/20"
                            }`}>
                              {c.status === "NORMAL" ? "正常" : "下架"}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <div className="flex gap-2 justify-end">
                              <button
                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                  c.status === "NORMAL" 
                                    ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                                    : "text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                }`}
                                onClick={() => toggleStatus(c.id, c.status)}
                              >
                                {c.status === "NORMAL" ? "下架" : "上架"}
                              </button>
                              <button
                                className="px-2 py-1 rounded text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 transition-colors"
                                onClick={() => openEdit(c)}
                              >
                                编辑
                              </button>
                              {/*<button*/}
                              {/*  className="px-2 py-1 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"*/}
                              {/*  onClick={() => deleteCategory(c.id)}*/}
                              {/*>*/}
                              {/*  删除*/}
                              {/*</button>*/}
                            </div>
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
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center text-zinc-400">
                暂无数据
              </div>
            ) : (
              items.map((c) => (
                <div key={c.id} className="px-4 py-4 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{c.name}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.status === "NORMAL" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
                        }`}>
                          {c.status === "NORMAL" ? "正常" : "下架"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-400 truncate">
                        {c.description || "无描述"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">ID: {c.id}</p>
                    </div>
                    <div className="ml-3 flex gap-1">
                      <button
                        className={`p-2 rounded-full transition-colors ${
                          c.status === "NORMAL" 
                            ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                            : "text-green-400 hover:text-green-300 hover:bg-green-900/20"
                        }`}
                        onClick={() => toggleStatus(c.id, c.status)}
                        title={c.status === "NORMAL" ? "下架" : "上架"}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          {c.status === "NORMAL" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          )}
                        </svg>
                      </button>
                      <button
                        className="p-2 rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 transition-colors"
                        onClick={() => openEdit(c)}
                        title="编辑"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      {/*<button*/}
                      {/*  className="p-2 rounded-full text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"*/}
                      {/*  onClick={() => deleteCategory(c.id)}*/}
                      {/*  title="删除"*/}
                      {/*>*/}
                      {/*  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">*/}
                      {/*    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />*/}
                      {/*  </svg>*/}
                      {/*</button>*/}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setEditing(null)} 
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-zinc-900 p-6 shadow-xl ring-1 ring-zinc-700 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">编辑分类</h3>
              <button
                className="rounded-md p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                onClick={() => setEditing(null)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">名称 *</label>
                <input
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-colors"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">描述</label>
                <textarea
                  rows={3}
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-colors resize-none"
                  placeholder="填写该分类的简要说明..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">状态</label>
                <select
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-colors"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="NORMAL">正常</option>
                  <option value="VOID">下架</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                className="w-full sm:w-auto rounded-md bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
                onClick={() => setEditing(null)}
              >
                取消
              </button>
              <button
                className="w-full sm:w-auto rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={!editName.trim()}
                onClick={saveEdit}
              >
                保存更改
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setCreating(false)} 
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-zinc-900 p-6 shadow-xl ring-1 ring-zinc-700 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">新增分类</h3>
              <button
                className="rounded-md p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                onClick={() => setCreating(false)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">名称 *</label>
                <input
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-colors"
                  placeholder="请输入分类名称"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">描述</label>
                <textarea
                  rows={3}
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-colors resize-none"
                  placeholder="填写该分类的简要说明..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">状态</label>
                <select
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm transition-colors"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="NORMAL">正常</option>
                  <option value="VOID">下架</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                className="w-full sm:w-auto rounded-md bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
                onClick={() => setCreating(false)}
              >
                取消
              </button>
              <button
                className="w-full sm:w-auto rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={!name.trim()}
                onClick={createCategory}
              >
                创建分类
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pagination */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Mobile pagination info */}
        <div className="text-sm text-zinc-400 sm:hidden">
          第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页，共 {total} 条记录
        </div>

        {/* Desktop pagination controls */}
        <div className="hidden sm:flex sm:items-center sm:space-x-2">
          <button
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-700 transition-colors"
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
              <span className="inline-flex items-center gap-1">
                {pages.map((p, idx) =>
                  typeof p === "number" ? (
                    <button
                      key={`${p}-${idx}`}
                      className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                        p === page 
                          ? "bg-indigo-600 text-white" 
                          : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                      }`}
                      disabled={loading || p === page}
                      onClick={() => load(p, pageSize, q, statusFilter)}
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
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-zinc-700 transition-colors"
            disabled={page >= Math.max(1, Math.ceil(total / pageSize)) || loading}
            onClick={() => load(page + 1, pageSize, q, statusFilter)}
          >
            下一页
          </button>
        </div>

        {/* Mobile pagination controls */}
        <div className="flex items-center justify-between sm:hidden">
          <button
            className="flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50 hover:bg-zinc-700 transition-colors"
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1, pageSize, q, statusFilter)}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            上一页
          </button>
          <button
            className="flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50 hover:bg-zinc-700 transition-colors"
            disabled={page >= Math.max(1, Math.ceil(total / pageSize)) || loading}
            onClick={() => load(page + 1, pageSize, q, statusFilter)}
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
            第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页
          </span>
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm text-zinc-400">每页:</label>
            <select
              id="page-size"
              className="rounded-md bg-zinc-800 px-2 py-1 text-sm border-0 focus:ring-2 focus:ring-indigo-500"
              value={pageSize}
              onChange={async (e) => {
                const ps = Number(e.target.value);
                setPageSize(ps);
                await load(1, ps, q, statusFilter);
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
  );
}


