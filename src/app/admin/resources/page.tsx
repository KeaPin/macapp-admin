"use client";
import { useEffect, useRef, useState } from "react";

type Resource = {
  id: string;
  title: string;
  icon: string | null;
  category_names: string[];
  status: string;
};

type Category = { id: string; name: string };

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
  const [editSynopsis, setEditSynopsis] = useState("");
  const [editIcon, setEditIcon] = useState<string>("");
  const [editStatus, setEditStatus] = useState("NORMAL");
  const [isUploadingEditIcon, setIsUploadingEditIcon] = useState(false);
  const editIconInputRef = useRef<HTMLInputElement | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [synopsis, setSynopsis] = useState("");
  const [icon, setIcon] = useState<string>("");
  const [status, setStatus] = useState("NORMAL");
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const createIconInputRef = useRef<HTMLInputElement | null>(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // 状态筛选
  const [editLoading, setEditLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<{ title?: string; url?: string }>({});

  async function load(p = page, ps = pageSize, query = q, statusF = statusFilter) {
    setLoading(true);
    try {
      let resourceUrl = `/api/resources?page=${p}&pageSize=${ps}`;
      if (query) resourceUrl += `&q=${encodeURIComponent(query)}`;
      if (statusF) resourceUrl += `&status=${encodeURIComponent(statusF)}`;
      
      const [r1, r2] = await Promise.all([
        fetch(resourceUrl).then(async (r) => (await r.json()) as { items: Resource[]; total: number; page: number; pageSize: number; q?: string; status?: string }),
        fetch(`/api/categories?page=1&pageSize=1000`).then(async (r) => (await r.json()) as { items: Category[] }),
      ]);
      setItems(Array.isArray(r1.items) ? r1.items : []);
      setTotal(typeof r1.total === "number" ? r1.total : 0);
      setPage(typeof r1.page === "number" ? r1.page : p);
      setPageSize(typeof r1.pageSize === "number" ? r1.pageSize : ps);
      if (typeof r1.q === "string") setQ(r1.q);
      if (typeof r1.status === "string") setStatusFilter(r1.status);
      const cats = Array.isArray(r2.items) ? r2.items : [];
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!editing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveEdit();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setEditing(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing, editTitle, editUrl, editCategoryId, editSynopsis, editStatus]);

  function validateUrlLike(value: string): boolean {
    const v = value.trim();
    if (!v) return false;
    try {
      // eslint-disable-next-line no-new
      new URL(v);
      return true;
    } catch {
      return /^https?:\/\/\S+$/i.test(v);
    }
  }

  function validateEdit(): boolean {
    const errs: { title?: string; url?: string } = {};
    if (!editTitle.trim()) errs.title = "请输入标题";
    if (!editUrl.trim()) errs.url = "请输入 URL";
    else if (!validateUrlLike(editUrl)) errs.url = "URL 格式不正确";
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function copyEditUrl() {
    if (!editUrl) return;
    try {
      void navigator.clipboard?.writeText(editUrl);
    } catch {
      /* noop */
    }
  }

  async function createResource() {
    if (!title.trim() || !url.trim()) return;
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        url,
        categoryId: categoryId ? parseInt(categoryId) : null,
        synopsis: synopsis || null,
        icon: icon || null,
        status,
      }),
    });
    setTitle("");
    setUrl("");
    setCategoryId("");
    setSynopsis("");
    setIcon("");
    setStatus("NORMAL");
    setCreating(false);
    await load(1, pageSize, q, statusFilter);
  }

  // async function deleteResource(id: string) {
  //   await fetch(`/api/resources?id=${id}`, { method: "DELETE" });
  //   await load();
  // }

  async function toggleStatus(id: string, currentStatus: string) {
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
    setEditErrors({});
    setIsSaving(false);
    setEditLoading(true);
    try {
      const res = await fetch(`/api/resources?id=${r.id}`);
      if (res.ok) {
        const data = (await res.json()) as { id: string; title: string; url: string; categoryId: number | null; synopsis: string | null; status: string; icon: string | null };
        setEditTitle(data.title ?? r.title);
        setEditUrl(data.url ?? "");
        setEditCategoryId(data.categoryId ? String(data.categoryId) : "");
        setEditSynopsis(data.synopsis || "");
        setEditIcon(data.icon || "");
        setEditStatus((data.status as string) || "NORMAL");
      } else {
        setEditTitle(r.title);
        setEditUrl("");
        setEditCategoryId("");
        setEditSynopsis("");
        setEditIcon(r.icon || "");
        setEditStatus("NORMAL");
      }
    } catch {
      setEditTitle(r.title);
      setEditUrl("");
      setEditCategoryId("");
      setEditSynopsis("");
      setEditIcon(r.icon || "");
      setEditStatus("NORMAL");
    } finally {
      setEditLoading(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    if (!validateEdit()) return;
    setIsSaving(true);
    try {
      await fetch("/api/resources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          title: editTitle,
          url: editUrl,
          synopsis: editSynopsis || null,
          icon: editIcon || null,
          status: editStatus,
        }),
      });
      setEditing(null);
      await load();
    } finally {
      setIsSaving(false);
    }
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
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
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
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-zinc-300">
                          操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {items.map((r) => (
                      <tr key={r.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm text-zinc-300 sm:pl-0">
                          {r.id}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-sm text-zinc-300">
                          {r.icon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.icon} alt="icon" className="h-8 w-8 rounded" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-zinc-800" />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-white truncate">
                          {r.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-sm text-zinc-300">
                          {Array.isArray(r.category_names) && r.category_names.length > 0 ? r.category_names.join("，") : "未分类"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            r.status === "NORMAL" ? "bg-green-900/50 text-green-400 ring-1 ring-green-400/20" : "bg-red-900/50 text-red-400 ring-1 ring-red-400/20"
                          }`}>
                            {r.status === "NORMAL" ? "正常" : "下架"}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <div className="flex gap-2 justify-end">
                            <button
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                r.status === "NORMAL" 
                                  ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                                  : "text-green-400 hover:text-green-300 hover:bg-green-900/20"
                              }`}
                              onClick={() => toggleStatus(r.id, r.status)}
                            >
                              {r.status === "NORMAL" ? "下架" : "上架"}
                            </button>
                            <button
                              className="px-2 py-1 rounded text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 transition-colors"
                              onClick={() => { void openEdit(r); }}
                            >
                              编辑
                            </button>
                            {/*<button*/}
                            {/*  className="px-2 py-1 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"*/}
                            {/*  onClick={() => deleteResource(r.id)}*/}
                            {/*>*/}
                            {/*  删除*/}
                            {/*</button>*/}
                          </div>
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
              items.map((r) => (
                <div key={r.id} className="px-4 py-4 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {r.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.icon} alt="icon" className="h-6 w-6 rounded flex-shrink-0" />
                        ) : (
                          <div className="h-6 w-6 rounded bg-zinc-800 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium text-white truncate">{r.title}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === "NORMAL" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
                        }`}>
                          {r.status === "NORMAL" ? "正常" : "下架"}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 truncate mb-1">
                        {Array.isArray(r.category_names) && r.category_names.length > 0 ? r.category_names.join("，") : "未分类"}
                      </p>
                      <p className="text-xs text-zinc-500">ID: {r.id}</p>
                    </div>
                    <div className="ml-3 flex gap-1">
                      <button
                        className={`p-2 rounded-full transition-colors ${
                          r.status === "NORMAL" 
                            ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                            : "text-green-400 hover:text-green-300 hover:bg-green-900/20"
                        }`}
                        onClick={() => toggleStatus(r.id, r.status)}
                        title={r.status === "NORMAL" ? "下架" : "上架"}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          {r.status === "NORMAL" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          )}
                        </svg>
                      </button>
                      <button
                        className="p-2 rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 transition-colors"
                        onClick={() => { void openEdit(r); }}
                        title="编辑"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      {/*<button*/}
                      {/*  className="p-2 rounded-full text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"*/}
                      {/*  onClick={() => deleteResource(r.id)}*/}
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
      {/* Edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditing(null)} />
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div className="w-screen sm:max-w-xl">
              <div className="flex h-full flex-col bg-zinc-900 shadow-xl ring-1 ring-zinc-800">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-semibold text-white">编辑资源</h3>
                    <p className="text-xs text-zinc-400 mt-1">ID {editing.id}</p>
                  </div>
                  <button
                    className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700"
                    onClick={() => setEditing(null)}
                    aria-label="关闭编辑"
                  >
                    关闭
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {editLoading ? (
                    <div className="space-y-5 animate-pulse">
                      <div className="space-y-2">
                        <div className="h-4 w-16 rounded bg-zinc-800" />
                        <div className="h-9 w-full rounded-md bg-zinc-800" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-20 rounded bg-zinc-800" />
                        <div className="h-9 w-full rounded-md bg-zinc-800" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-16 rounded bg-zinc-800" />
                        <div className="h-9 w-full rounded-md bg-zinc-800" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-24 rounded bg-zinc-800" />
                        <div className="h-24 w-full rounded-md bg-zinc-800" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">标题</label>
                        <input
                          className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                          value={editTitle}
                          onChange={(e) => {
                            setEditTitle(e.target.value);
                            if (editErrors.title) setEditErrors({ ...editErrors, title: undefined });
                          }}
                        />
                        {editErrors.title && <p className="text-xs text-red-400">{editErrors.title}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">图标</label>
                        <div className="flex items-center gap-3">
                          {editIcon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={editIcon} alt="icon" className="h-10 w-10 rounded" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-zinc-800" />
                          )}
                          <input
                            ref={editIconInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              try {
                                setIsUploadingEditIcon(true);
                                const fd = new FormData();
                                fd.append("file", f);
                                const res = await fetch("/api/uploads/resource-icon", { method: "POST", body: fd });
                                if (res.ok) {
                                  const data = (await res.json()) as { url?: string; key: string };
                                  if (data.url) setEditIcon(data.url);
                                }
                              } finally {
                                setIsUploadingEditIcon(false);
                                if (editIconInputRef.current) editIconInputRef.current.value = "";
                              }
                            }}
                          />
                          <button
                            className="rounded-md bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                            onClick={() => editIconInputRef.current?.click()}
                            type="button"
                            disabled={isUploadingEditIcon}
                          >
                            {isUploadingEditIcon ? "上传中..." : editIcon ? "更换图标" : "上传图标"}
                          </button>
                          {editIcon && (
                            <button
                              className="rounded-md bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                              onClick={() => setEditIcon("")}
                              type="button"
                              disabled={isUploadingEditIcon}
                            >
                              移除
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">支持 PNG/JPG/SVG，建议正方形图标</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">链接 URL</label>
                        <div className="flex items-center gap-2">
                          <input
                            className="flex-1 rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                            value={editUrl}
                            onChange={(e) => {
                              setEditUrl(e.target.value);
                              if (editErrors.url) setEditErrors({ ...editErrors, url: undefined });
                            }}
                            placeholder="https://example.com"
                          />
                          <button
                            className="rounded-md bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
                            onClick={copyEditUrl}
                            type="button"
                          >
                            复制
                          </button>
                          <a
                            className="rounded-md bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
                            href={validateUrlLike(editUrl) ? editUrl : "#"}
                            target="_blank"
                            rel="noreferrer"
                          >
                            打开
                          </a>
                        </div>
                        {editErrors.url && <p className="text-xs text-red-400">{editErrors.url}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">分类</label>
                        <div className="block w-full rounded-md border-0 bg-zinc-800/50 py-2 px-3 text-zinc-400 sm:text-sm sm:leading-6 ring-1 ring-inset ring-zinc-700">
                          {editing?.category_names && editing.category_names.length > 0 
                            ? editing.category_names.join("，") 
                            : "未分类"
                          }
                        </div>
                        <p className="text-xs text-zinc-500">编辑时不可修改分类，如需修改请重新创建资源</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">描述（可选）</label>
                        <textarea
                          className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 min-h-[100px]"
                          value={editSynopsis}
                          onChange={(e) => setEditSynopsis(e.target.value)}
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
                  )}
                </div>
                <div className="border-t border-zinc-800 bg-zinc-900 px-6 py-4 flex justify-end gap-3">
                  <button
                    className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
                    onClick={() => setEditing(null)}
                  >
                    取消
                  </button>
                  <button
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    disabled={isSaving || !editTitle.trim() || !editUrl.trim()}
                    onClick={saveEdit}
                  >
                    {isSaving ? "保存中..." : "保存"}
                  </button>
                </div>
              </div>
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
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-300">图标</label>
                <div className="flex items-center gap-3">
                  {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={icon} alt="icon" className="h-10 w-10 rounded" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-zinc-800" />
                  )}
                  <input
                    ref={createIconInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        setIsUploadingIcon(true);
                        const fd = new FormData();
                        fd.append("file", f);
                        const res = await fetch("/api/uploads/resource-icon", { method: "POST", body: fd });
                        if (res.ok) {
                          const data = (await res.json()) as { url?: string; key: string };
                          if (data.url) setIcon(data.url);
                        }
                      } finally {
                        setIsUploadingIcon(false);
                        if (createIconInputRef.current) createIconInputRef.current.value = "";
                      }
                    }}
                  />
                  <button
                    className="rounded-md bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                    onClick={() => createIconInputRef.current?.click()}
                    type="button"
                    disabled={isUploadingIcon}
                  >
                    {isUploadingIcon ? "上传中..." : icon ? "更换图标" : "上传图标"}
                  </button>
                  {icon && (
                    <button
                      className="rounded-md bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                      onClick={() => setIcon("")}
                      type="button"
                      disabled={isUploadingIcon}
                    >
                      移除
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-500">支持 PNG/JPG/SVG，建议正方形图标</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">描述（可选）</label>
                <input
                  className="block w-full rounded-md border-0 bg-zinc-800 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
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


