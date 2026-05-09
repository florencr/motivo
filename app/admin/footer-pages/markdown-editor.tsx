"use client";

import { useRef } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
} from "lucide-react";

type MarkdownEditorProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
};

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 12,
}: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  function applyWrap(prefix: string, suffix: string = prefix) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end) || "";
    const after = value.slice(end);
    const next = `${before}${prefix}${selected}${suffix}${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + prefix.length + selected.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  function applyLinePrefix(prefix: string) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end) || "";
    const after = value.slice(end);
    const lines = selected.length > 0 ? selected.split("\n") : [""];
    const replaced = lines.map((line) => `${prefix}${line}`).join("\n");
    const next = `${before}${replaced}${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = before.length + replaced.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  function applyLink() {
    const el = ref.current;
    if (!el) return;
    const url = window.prompt("URL e linkut:", "https://");
    if (!url) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end) || "tekst i lidhur";
    const after = value.slice(end);
    const next = `${before}[${selected}](${url})${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
    });
  }

  return (
    <div className="rounded-lg border border-slate-300 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2">
        <ToolbarButton
          label="Bold"
          onClick={() => applyWrap("**")}
          icon={<Bold className="h-4 w-4" />}
        />
        <ToolbarButton
          label="Italic"
          onClick={() => applyWrap("*")}
          icon={<Italic className="h-4 w-4" />}
        />
        <span className="mx-1 h-6 w-px self-center bg-slate-200" />
        <ToolbarButton
          label="Titull i madh"
          onClick={() => applyLinePrefix("## ")}
          icon={<Heading2 className="h-4 w-4" />}
        />
        <ToolbarButton
          label="Nëntitull"
          onClick={() => applyLinePrefix("### ")}
          icon={<Heading3 className="h-4 w-4" />}
        />
        <span className="mx-1 h-6 w-px self-center bg-slate-200" />
        <ToolbarButton
          label="Listë"
          onClick={() => applyLinePrefix("- ")}
          icon={<List className="h-4 w-4" />}
        />
        <ToolbarButton
          label="Listë e numëruar"
          onClick={() => applyLinePrefix("1. ")}
          icon={<ListOrdered className="h-4 w-4" />}
        />
        <ToolbarButton
          label="Citat"
          onClick={() => applyLinePrefix("> ")}
          icon={<Quote className="h-4 w-4" />}
        />
        <span className="mx-1 h-6 w-px self-center bg-slate-200" />
        <ToolbarButton
          label="Link"
          onClick={applyLink}
          icon={<LinkIcon className="h-4 w-4" />}
        />
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="block w-full resize-y rounded-b-lg p-3 text-sm leading-6 outline-none focus:bg-slate-50"
      />
      <p className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
        Mbështetet Markdown. Shembull: <code>**bold**</code>, <code>*italic*</code>,{" "}
        <code>## Titull</code>, <code>- pikë e listës</code>,{" "}
        <code>[lidhje](https://)</code>.
      </p>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded border border-transparent text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
    >
      {icon}
    </button>
  );
}
