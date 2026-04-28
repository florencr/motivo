"use client";

import { useEffect, useState } from "react";

type FooterPageItem = {
  id: string;
  title: string;
  slug: string;
  section: "GET_STARTED" | "USER_LINKS" | "COMPANY" | "APP";
  isPublished: boolean;
};

export default function AdminFooterPages() {
  const [pages, setPages] = useState<FooterPageItem[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [section, setSection] =
    useState<FooterPageItem["section"]>("COMPANY");
  const [sortOrder, setSortOrder] = useState("0");
  const [error, setError] = useState("");

  async function loadPages() {
    const res = await fetch("/api/admin/footer-pages");
    const data = await res.json();
    setPages(data.pages ?? []);
  }

  useEffect(() => {
    loadPages();
  }, []);

  async function createPage() {
    setError("");
    const res = await fetch("/api/admin/footer-pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, content, section, sortOrder }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Failed to create page");
      return;
    }
    setTitle("");
    setSlug("");
    setContent("");
    setSortOrder("0");
    await loadPages();
  }

  async function togglePublished(page: FooterPageItem) {
    await fetch("/api/admin/footer-pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: page.id, isPublished: !page.isPublished }),
    });
    await loadPages();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Admin Footer Pages</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create and manage pages linked from footer columns.
          </p>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            />
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Slug (optional)"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            />
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as FooterPageItem["section"])}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            >
              <option value="GET_STARTED">Get Started</option>
              <option value="USER_LINKS">User Links</option>
              <option value="COMPANY">Company</option>
              <option value="APP">App</option>
            </select>
            <input
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="Sort order"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Page content"
            className="mt-2 min-h-36 w-full rounded-lg border border-slate-300 p-3 text-sm"
          />

          <button
            type="button"
            onClick={createPage}
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Add Footer Page
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Existing Pages</h2>
          <div className="mt-3 space-y-2">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between rounded border border-slate-200 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{page.title}</p>
                  <p className="text-xs text-slate-600">
                    /info/{page.slug} - {page.section}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePublished(page)}
                  className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                >
                  {page.isPublished ? "Unpublish" : "Publish"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
