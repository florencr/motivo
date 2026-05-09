"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SearchOption = {
  value: string;
  label: string;
};

type SearchableMultiSelectProps = {
  name?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: SearchOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
};

function sameValue(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export default function SearchableMultiSelect({
  name,
  values,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Shkruaj për të filtruar...",
  emptyText = "Asnjë rezultat",
  disabled = false,
  className = "",
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedOptions = options.filter((option) =>
    values.some((value) => sameValue(value, option.value)),
  );

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

  function toggleValue(value: string) {
    if (values.some((item) => sameValue(item, value))) {
      onChange(values.filter((item) => !sameValue(item, value)));
      return;
    }
    onChange([...values, value]);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name ? <input type="hidden" name={name} value={values.join(",")} /> : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-left text-sm outline-none disabled:bg-slate-100"
      >
        {selectedOptions.length > 0
          ? `${selectedOptions.length} selected`
          : placeholder}
      </button>

      {selectedOptions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => toggleValue(item.value)}
              className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white"
              title={`Remove ${item.label}`}
            >
              {item.label} ×
            </button>
          ))}
        </div>
      ) : null}

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
              onClick={() => onChange([])}
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100"
            >
              Clear selected
            </button>
            {filtered.length === 0 ? (
              <p className="px-2 py-2 text-sm text-slate-500">{emptyText}</p>
            ) : (
              filtered.map((item) => {
                const checked = values.some((value) => sameValue(value, item.value));
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleValue(item.value)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-100"
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                        checked
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
