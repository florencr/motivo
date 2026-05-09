"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SearchOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
};

export default function SearchableSelect({
  name,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Shkruaj për të filtruar...",
  emptyText = "Asnjë rezultat",
  disabled = false,
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((item) => item.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) => item.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    function onDocMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-left text-sm outline-none disabled:bg-slate-100"
      >
        {selected?.label || placeholder}
      </button>
      {open && !disabled ? (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 shadow-lg">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="mb-2 h-9 w-full rounded border border-slate-300 px-2 text-sm outline-none"
          />
          <div className="max-h-56 overflow-auto">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100"
            >
              {placeholder}
            </button>
            {filtered.length === 0 ? (
              <p className="px-2 py-2 text-sm text-slate-500">{emptyText}</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100"
                >
                  {item.label}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
