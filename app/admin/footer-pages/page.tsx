"use client";

import { useEffect, useState } from "react";
import MarkdownEditor from "./markdown-editor";

type FooterPageItem = {
  id: string;
  title: string;
  slug: string;
  content: string;
  section: "GET_STARTED" | "USER_LINKS" | "COMPANY" | "APP";
  sortOrder: number;
  isPublished: boolean;
};

const SECTION_LABELS: Record<FooterPageItem["section"], string> = {
  GET_STARTED: "Fillo",
  USER_LINKS: "Linke përdoruesi",
  COMPANY: "Kompania",
  APP: "Aplikacioni",
};

export default function AdminFooterPages() {
  const [pages, setPages] = useState<FooterPageItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [section, setSection] =
    useState<FooterPageItem["section"]>("COMPANY");
  const [sortOrder, setSortOrder] = useState("0");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadPages() {
    const res = await fetch("/api/admin/footer-pages");
    const data = await res.json();
    setPages(data.pages ?? []);
  }

  useEffect(() => {
    loadPages();
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setContent("");
    setSection("COMPANY");
    setSortOrder("0");
    setError("");
  }

  function loadPageIntoForm(page: FooterPageItem) {
    setEditingId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content);
    setSection(page.section);
    setSortOrder(String(page.sortOrder));
    setError("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function savePage() {
    setError("");
    setBusy(true);
    try {
      const payload = {
        title,
        slug,
        content,
        section,
        sortOrder,
      };
      const isEdit = Boolean(editingId);
      const res = await fetch("/api/admin/footer-pages", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingId, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data?.error ??
            (isEdit ? "Përditësimi i faqes dështoi" : "Krijimi i faqes dështoi"),
        );
        return;
      }
      resetForm();
      await loadPages();
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(page: FooterPageItem) {
    await fetch("/api/admin/footer-pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: page.id, isPublished: !page.isPublished }),
    });
    await loadPages();
  }

  async function deletePage(page: FooterPageItem) {
    if (!confirm(`Të fshihet faqja "${page.title}"?`)) return;
    setError("");
    const res = await fetch(
      `/api/admin/footer-pages?id=${encodeURIComponent(page.id)}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Fshirja e faqes dështoi");
      return;
    }
    if (editingId === page.id) resetForm();
    await loadPages();
  }

  return (
    <main className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Faqet e fundit</h1>
            <p className="mt-2 text-sm text-slate-600">
              Krijo dhe menaxho faqet e linkuara nga kolonat e footer-it.
            </p>
          </div>
          {editingId ? (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
              Po modifikohet faqja
            </span>
          ) : null}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titulli i faqes"
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug (opsional)"
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          />
          <select
            value={section}
            onChange={(e) =>
              setSection(e.target.value as FooterPageItem["section"])
            }
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          >
            <option value="GET_STARTED">Fillo</option>
            <option value="USER_LINKS">Linke përdoruesi</option>
            <option value="COMPANY">Kompania</option>
            <option value="APP">Aplikacioni</option>
          </select>
          <input
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="Renditja"
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          />
        </div>

        <div className="mt-3">
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Përmbajtja e faqes (mbështetet Markdown)"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={savePage}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {editingId
              ? busy
                ? "Po ruhet..."
                : "Ruaj ndryshimet"
              : busy
                ? "Po krijohet..."
                : "Shto faqe"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Anulo
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Faqet ekzistuese</h2>
        <div className="mt-3 space-y-2">
          {pages.length === 0 ? (
            <p className="text-sm text-slate-600">Ende nuk ka faqe.</p>
          ) : (
            pages.map((page) => (
              <div
                key={page.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {page.title}
                  </p>
                  <p className="text-xs text-slate-600">
                    /info/{page.slug} · {SECTION_LABELS[page.section]} · renditja{" "}
                    {page.sortOrder}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/info/${page.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                  >
                    Shiko
                  </a>
                  <button
                    type="button"
                    onClick={() => loadPageIntoForm(page)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                  >
                    Modifiko
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePublished(page)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                  >
                    {page.isPublished ? "Çpubliko" : "Publiko"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePage(page)}
                    className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                  >
                    Fshi
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
