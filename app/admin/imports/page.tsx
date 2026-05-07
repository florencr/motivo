"use client";

import { useEffect, useMemo, useState } from "react";

type Connector = { key: string; label: string };

type ImportSource = {
  id: string;
  name: string;
  type: string;
  connectorKey: string;
  baseUrl: string | null;
  listUrls: string[];
  config: Record<string, unknown> | null;
  defaultSellerEmail: string;
  defaultSellerType: "PRIVATE" | "DEALER";
  defaultCurrency: "EUR" | "ALL";
  autoPublish: boolean;
  requestDelayMs: number;
  maxPerRun: number;
  isActive: boolean;
  lastRunAt: string | null;
  _count?: { runs: number };
};

type ImportRun = {
  id: string;
  sourceId: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";
  startedAt: string;
  finishedAt: string | null;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  errorMessage: string | null;
  source?: { id: string; name: string };
};

type RunRecord = {
  id: string;
  sourceUrl: string | null;
  externalId: string | null;
  status: "CREATED" | "UPDATED" | "SKIPPED" | "FAILED";
  listingSlug: string | null;
  message: string | null;
  createdAt: string;
};

type RunDetails = {
  run: ImportRun & {
    logs: { level: "info" | "warn" | "error"; message: string; at: string }[] | null;
    records: RunRecord[];
    source: { id: string; name: string; connectorKey: string };
  };
};

const SOURCE_TYPES = [
  { value: "WEBSITE", label: "Website" },
  { value: "FACEBOOK_MARKETPLACE", label: "Facebook Marketplace (manual)" },
  { value: "FACEBOOK_POST", label: "Facebook Post (manual)" },
  { value: "INSTAGRAM_POST", label: "Instagram Post (manual)" },
  { value: "MANUAL", label: "Manual" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function AdminImportsPage() {
  const [sources, setSources] = useState<ImportSource[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [recentRuns, setRecentRuns] = useState<ImportRun[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<RunDetails["run"] | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState("WEBSITE");
  const [connectorKey, setConnectorKey] = useState("generic");
  const [baseUrl, setBaseUrl] = useState("");
  const [listUrlsText, setListUrlsText] = useState("");
  const [configText, setConfigText] = useState(
    JSON.stringify(
      {
        cardSelector: "",
        linkSelector: 'a[href*="/listing/"]',
        detail: {
          title: "h1",
          price: ".price",
          year: ".year",
          mileageKm: ".mileage",
          fuel: ".fuel",
          transmission: ".transmission",
          description: ".description",
          images: ".gallery img",
          imageSrcAttr: "src",
        },
      },
      null,
      2,
    ),
  );
  const [defaultSellerEmail, setDefaultSellerEmail] = useState("");
  const [defaultSellerType, setDefaultSellerType] = useState<"PRIVATE" | "DEALER">("DEALER");
  const [defaultCurrency, setDefaultCurrency] = useState<"EUR" | "ALL">("EUR");
  const [autoPublish, setAutoPublish] = useState(true);
  const [requestDelayMs, setRequestDelayMs] = useState("1500");
  const [maxPerRun, setMaxPerRun] = useState("100");

  async function loadAll() {
    setError("");
    const [sourcesRes, runsRes] = await Promise.all([
      fetch("/api/admin/import-sources"),
      fetch("/api/admin/import-runs?limit=20"),
    ]);
    const sourcesData = await sourcesRes.json();
    const runsData = await runsRes.json();
    if (!sourcesRes.ok) {
      setError(sourcesData?.error ?? "Failed to load sources");
      return;
    }
    setSources(sourcesData.sources ?? []);
    setConnectors(sourcesData.connectors ?? []);
    if (runsRes.ok) {
      setRecentRuns(runsData.runs ?? []);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function createSource() {
    setError("");
    setBusy(true);
    let parsedConfig: unknown = {};
    try {
      parsedConfig = configText.trim() ? JSON.parse(configText) : {};
    } catch {
      setError("Connector config must be valid JSON");
      setBusy(false);
      return;
    }
    const res = await fetch("/api/admin/import-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        connectorKey,
        baseUrl: baseUrl || null,
        listUrls: listUrlsText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean),
        config: parsedConfig,
        defaultSellerEmail,
        defaultSellerType,
        defaultCurrency,
        autoPublish,
        requestDelayMs: Number(requestDelayMs) || 1500,
        maxPerRun: Number(maxPerRun) || 100,
        isActive: true,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "Failed to create source");
      return;
    }
    setName("");
    setBaseUrl("");
    setListUrlsText("");
    setDefaultSellerEmail("");
    void loadAll();
  }

  async function runSource(id: string) {
    setError("");
    setBusy(true);
    const res = await fetch(`/api/admin/import-sources/${id}/run`, {
      method: "POST",
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "Run failed");
      return;
    }
    void loadAll();
  }

  async function deleteSource(id: string) {
    if (!confirm("Delete this source and its run history?")) return;
    setError("");
    const res = await fetch(`/api/admin/import-sources?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Failed to delete");
      return;
    }
    void loadAll();
  }

  async function toggleActive(source: ImportSource) {
    setError("");
    const res = await fetch("/api/admin/import-sources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: source.id, isActive: !source.isActive }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Failed to update source");
      return;
    }
    void loadAll();
  }

  async function openRun(runId: string) {
    setOpenRunId(runId);
    setRunDetails(null);
    const res = await fetch(`/api/admin/import-runs/${runId}`);
    const data = await res.json();
    if (res.ok) {
      setRunDetails(data.run);
    } else {
      setError(data?.error ?? "Failed to load run");
    }
  }

  const sourcesById = useMemo(() => {
    const map: Record<string, ImportSource> = {};
    for (const s of sources) map[s.id] = s;
    return map;
  }, [sources]);

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Imports</h1>
          <p className="mt-1 text-sm text-slate-600">
            Configure scraper sources and run them manually. Valid records
            auto-publish. Only target sources you are allowed to collect from.
          </p>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">New source</h2>
        <p className="mt-1 text-xs text-slate-500">
          The default seller email must already exist as a User in the system.
          Make and Model names produced by the connector must already exist in
          your catalog.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Dealer A — used cars"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Source type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Connector</span>
            <select
              value={connectorKey}
              onChange={(e) => setConnectorKey(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            >
              {connectors.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label} ({c.key})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Base URL (origin)</span>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">List URLs (one per line)</span>
            <textarea
              value={listUrlsText}
              onChange={(e) => setListUrlsText(e.target.value)}
              rows={3}
              placeholder={"https://example.com/cars?page=1\nhttps://example.com/cars?page=2"}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Connector config (JSON)</span>
            <textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              rows={10}
              spellCheck={false}
              className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Default seller email</span>
            <input
              value={defaultSellerEmail}
              onChange={(e) => setDefaultSellerEmail(e.target.value)}
              placeholder="dealer@example.com"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Default seller type</span>
            <select
              value={defaultSellerType}
              onChange={(e) => setDefaultSellerType(e.target.value as "PRIVATE" | "DEALER")}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="DEALER">Dealer</option>
              <option value="PRIVATE">Private</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Default currency</span>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value as "EUR" | "ALL")}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            >
              <option value="EUR">EUR</option>
              <option value="ALL">ALL</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Request delay (ms)</span>
            <input
              type="number"
              value={requestDelayMs}
              onChange={(e) => setRequestDelayMs(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Max listings per run</span>
            <input
              type="number"
              value={maxPerRun}
              onChange={(e) => setMaxPerRun(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="mt-1 flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={autoPublish}
              onChange={(e) => setAutoPublish(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-slate-700">Auto-publish valid listings</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => void createSource()}
            className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Create source
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Sources</h2>
        {sources.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No sources yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {sources.map((source) => (
              <li key={source.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[200px] flex-1">
                  <p className="text-sm font-semibold text-slate-900">{source.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {source.type} · connector: {source.connectorKey} · seller: {source.defaultSellerEmail} · last run: {formatDate(source.lastRunAt)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(source.listUrls ?? []).length} list URL(s) · {source._count?.runs ?? 0} run(s) · {source.autoPublish ? "auto-publish" : "draft only"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void runSource(source.id)}
                    disabled={busy || !source.isActive}
                    className="h-9 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Run now
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(source)}
                    className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700"
                  >
                    {source.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteSource(source.id)}
                    className="h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent runs</h2>
        {recentRuns.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No runs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {recentRuns.map((run) => {
              const sourceName = run.source?.name ?? sourcesById[run.sourceId]?.name ?? "(deleted source)";
              return (
                <li key={run.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-[200px] flex-1">
                    <p className="font-semibold text-slate-900">{sourceName}</p>
                    <p className="text-xs text-slate-500">
                      {run.status} · started {formatDate(run.startedAt)} · finished {formatDate(run.finishedAt)}
                    </p>
                    <p className="text-xs text-slate-500">
                      created {run.createdCount} · updated {run.updatedCount} · skipped {run.skippedCount} · failed {run.failedCount}
                    </p>
                    {run.errorMessage && (
                      <p className="mt-1 text-xs text-red-600">{run.errorMessage}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void openRun(run.id)}
                    className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700"
                  >
                    View
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {openRunId && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Run details</h2>
            <button
              type="button"
              onClick={() => {
                setOpenRunId(null);
                setRunDetails(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>
          {!runDetails ? (
            <p className="mt-3 text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="mt-3 space-y-4 text-sm">
              <div>
                <p className="text-slate-700">
                  Source: <span className="font-semibold">{runDetails.source.name}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Status {runDetails.status} · created {runDetails.createdCount} · updated {runDetails.updatedCount} · skipped {runDetails.skippedCount} · failed {runDetails.failedCount}
                </p>
              </div>
              {runDetails.logs && runDetails.logs.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-800">Logs</p>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                    {runDetails.logs
                      .map((entry) => `[${entry.level}] ${entry.message}`)
                      .join("\n")}
                  </pre>
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-800">Records ({runDetails.records.length})</p>
                <ul className="mt-2 divide-y divide-slate-100 text-xs">
                  {runDetails.records.map((rec) => (
                    <li key={rec.id} className="flex flex-wrap items-start gap-2 py-2">
                      <span
                        className={`inline-flex h-5 items-center rounded px-2 text-[10px] font-semibold ${
                          rec.status === "CREATED"
                            ? "bg-emerald-100 text-emerald-700"
                            : rec.status === "UPDATED"
                              ? "bg-sky-100 text-sky-700"
                              : rec.status === "SKIPPED"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {rec.status}
                      </span>
                      <div className="min-w-0 flex-1">
                        {rec.sourceUrl ? (
                          <a href={rec.sourceUrl} target="_blank" rel="noreferrer" className="text-slate-800 underline break-all">
                            {rec.sourceUrl}
                          </a>
                        ) : (
                          <span className="text-slate-700">{rec.externalId ?? "(unknown)"}</span>
                        )}
                        {rec.message && <p className="text-red-700">{rec.message}</p>}
                        {rec.listingSlug && (
                          <p className="text-slate-500">Listing slug: {rec.listingSlug}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
