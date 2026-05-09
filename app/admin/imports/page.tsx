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
  cronIntervalHours: number;
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

type SourceEditState = {
  name: string;
  type: string;
  connectorKey: string;
  baseUrl: string;
  listUrlsText: string;
  configText: string;
  defaultSellerEmail: string;
  defaultSellerType: "PRIVATE" | "DEALER";
  defaultCurrency: "EUR" | "ALL";
  autoPublish: boolean;
  requestDelayMs: string;
  maxPerRun: string;
  cronIntervalHours: string;
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

function sourceToEditState(source: ImportSource): SourceEditState {
  return {
    name: source.name,
    type: source.type,
    connectorKey: source.connectorKey,
    baseUrl: source.baseUrl ?? "",
    listUrlsText: (source.listUrls ?? []).join("\n"),
    configText: JSON.stringify(source.config ?? {}, null, 2),
    defaultSellerEmail: source.defaultSellerEmail,
    defaultSellerType: source.defaultSellerType,
    defaultCurrency: source.defaultCurrency,
    autoPublish: source.autoPublish,
    requestDelayMs: String(source.requestDelayMs),
    maxPerRun: String(source.maxPerRun),
    cronIntervalHours: String(source.cronIntervalHours ?? 6),
  };
}

export default function AdminImportsPage() {
  const [sources, setSources] = useState<ImportSource[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [recentRuns, setRecentRuns] = useState<ImportRun[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<RunDetails["run"] | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editSource, setEditSource] = useState<SourceEditState | null>(null);

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
  const [cronIntervalHours, setCronIntervalHours] = useState("6");

  async function loadAll() {
    setError("");
    const [sourcesRes, runsRes] = await Promise.all([
      fetch("/api/admin/import-sources"),
      fetch("/api/admin/import-runs?limit=20"),
    ]);
    const sourcesData = await sourcesRes.json();
    const runsData = await runsRes.json();
    if (!sourcesRes.ok) {
      setError(sourcesData?.error ?? "Ngarkimi i burimeve dështoi");
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
      setError("Konfigurimi i konektorit duhet të jetë JSON i vlefshëm");
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
        cronIntervalHours: Number(cronIntervalHours) || 6,
        isActive: true,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "Krijimi i burimit dështoi");
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
      setError(data?.error ?? "Ekzekutimi dështoi");
      return;
    }
    void loadAll();
  }

  async function deleteSource(id: string) {
    if (!confirm("Të fshihet ky burim dhe historia e ekzekutimeve?")) return;
    setError("");
    const res = await fetch(`/api/admin/import-sources?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Fshirja dështoi");
      return;
    }
    void loadAll();
  }

  function beginEditSource(source: ImportSource) {
    setError("");
    setEditingSourceId(source.id);
    setEditSource(sourceToEditState(source));
  }

  async function saveEditedSource(id: string) {
    if (!editSource) return;
    setError("");
    setBusy(true);
    let parsedConfig: unknown = {};
    try {
      parsedConfig = editSource.configText.trim() ? JSON.parse(editSource.configText) : {};
    } catch {
      setError("Connector config must be valid JSON");
      setBusy(false);
      return;
    }
    const res = await fetch("/api/admin/import-sources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: editSource.name,
        type: editSource.type,
        connectorKey: editSource.connectorKey,
        baseUrl: editSource.baseUrl || null,
        listUrls: editSource.listUrlsText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean),
        config: parsedConfig,
        defaultSellerEmail: editSource.defaultSellerEmail,
        defaultSellerType: editSource.defaultSellerType,
        defaultCurrency: editSource.defaultCurrency,
        autoPublish: editSource.autoPublish,
        requestDelayMs: Number(editSource.requestDelayMs) || 1500,
        maxPerRun: Number(editSource.maxPerRun) || 100,
        cronIntervalHours: Number(editSource.cronIntervalHours) || 6,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "Përditësimi i burimit dështoi");
      return;
    }
    setEditingSourceId(null);
    setEditSource(null);
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
      setError(data?.error ?? "Përditësimi i burimit dështoi");
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
      setError(data?.error ?? "Ngarkimi i ekzekutimit dështoi");
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
          <h1 className="text-3xl font-bold text-slate-900">Importet</h1>
          <p className="mt-1 text-sm text-slate-600">
            Konfiguro burimet e scraper-ave dhe ekzekutoji manualisht. Të dhënat e vlefshme publikohen
            automatikisht. Synoni vetëm burimet që ju lejohet t&apos;i mbledhni.
          </p>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Burim i ri</h2>
        <p className="mt-1 text-xs text-slate-500">
          Email-i i shitësit të paracaktuar duhet të ekzistojë tashmë si Përdorues në sistem.
          Emrat e Markës dhe Modelit të prodhuara nga konektori duhet të ekzistojnë tashmë në
          katalogun tuaj.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Emri</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Shembull: Koncesionari A — makina të përdorura"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Lloji i burimit</span>
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
            <span className="font-medium text-slate-700">Konektori</span>
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
            <span className="font-medium text-slate-700">URL bazë (origjina)</span>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">URL-të e listave (një për rresht)</span>
            <textarea
              value={listUrlsText}
              onChange={(e) => setListUrlsText(e.target.value)}
              rows={3}
              placeholder={"https://example.com/cars?page=1\nhttps://example.com/cars?page=2"}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Konfigurimi i konektorit (JSON)</span>
            <textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              rows={10}
              spellCheck={false}
              className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Email-i i shitësit të paracaktuar</span>
            <input
              value={defaultSellerEmail}
              onChange={(e) => setDefaultSellerEmail(e.target.value)}
              placeholder="dealer@example.com"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Lloji i shitësit të paracaktuar</span>
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
            <span className="font-medium text-slate-700">Monedha e paracaktuar</span>
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
            <span className="font-medium text-slate-700">Vonesa midis kërkesave (ms)</span>
            <input
              type="number"
              value={requestDelayMs}
              onChange={(e) => setRequestDelayMs(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Listime maksimale për ekzekutim</span>
            <input
              type="number"
              value={maxPerRun}
              onChange={(e) => setMaxPerRun(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Intervali i ekzekutimit automatik (orë)</span>
            <input
              type="number"
              min={1}
              max={168}
              value={cronIntervalHours}
              onChange={(e) => setCronIntervalHours(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
            />
            <span className="text-[11px] text-slate-500">
              Sa shpesh planifikuesi duhet ta riekzekutojë këtë burim (parazgjedhja 6 orë).
              Cron kontrollohet çdo 6 orë; intervalet më të shkurtra se 6 orë ekzekutohen po çdo 6 orë.
            </span>
          </label>
          <label className="mt-1 flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={autoPublish}
              onChange={(e) => setAutoPublish(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-slate-700">Publiko automatikisht listimet e vlefshme</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={() => void createSource()}
            className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            Krijo burim
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Burimet</h2>
        {sources.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Ende nuk ka burime.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {sources.map((source) => (
              <li key={source.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[200px] flex-1">
                  <p className="text-sm font-semibold text-slate-900">{source.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {source.type} · konektori: {source.connectorKey} · shitësi: {source.defaultSellerEmail} · ekzekutimi i fundit: {formatDate(source.lastRunAt)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(source.listUrls ?? []).length} URL listash · {source._count?.runs ?? 0} ekzekutim(e) · automatikisht çdo {source.cronIntervalHours}h · {source.autoPublish ? "publikim automatik" : "vetëm draft"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void runSource(source.id)}
                    disabled={busy || !source.isActive}
                    className="h-9 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Ekzekuto tani
                  </button>
                  <button
                    type="button"
                    onClick={() => beginEditSource(source)}
                    className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700"
                  >
                    Modifiko
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(source)}
                    className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700"
                  >
                    {source.isActive ? "Çaktivizo" : "Aktivizo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteSource(source.id)}
                    className="h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700"
                  >
                    Fshi
                  </button>
                </div>
                {editingSourceId === source.id && editSource ? (
                  <div className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Modifiko burimin</h3>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-700">Emri</span>
                        <input
                          value={editSource.name}
                          onChange={(e) => setEditSource({ ...editSource, name: e.target.value })}
                          className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-700">Lloji i burimit</span>
                        <select
                          value={editSource.type}
                          onChange={(e) => setEditSource({ ...editSource, type: e.target.value })}
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
                        <span className="font-medium text-slate-700">Konektori</span>
                        <select
                          value={editSource.connectorKey}
                          onChange={(e) => setEditSource({ ...editSource, connectorKey: e.target.value })}
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
                        <span className="font-medium text-slate-700">URL bazë (origjina)</span>
                        <input
                          value={editSource.baseUrl}
                          onChange={(e) => setEditSource({ ...editSource, baseUrl: e.target.value })}
                          className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm md:col-span-2">
                        <span className="font-medium text-slate-700">URL-të e listave (një për rresht)</span>
                        <textarea
                          value={editSource.listUrlsText}
                          onChange={(e) => setEditSource({ ...editSource, listUrlsText: e.target.value })}
                          rows={3}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm md:col-span-2">
                        <span className="font-medium text-slate-700">Konfigurimi i konektorit (JSON)</span>
                        <textarea
                          value={editSource.configText}
                          onChange={(e) => setEditSource({ ...editSource, configText: e.target.value })}
                          rows={8}
                          spellCheck={false}
                          className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-slate-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-700">Email-i i shitësit të paracaktuar</span>
                        <input
                          value={editSource.defaultSellerEmail}
                          onChange={(e) => setEditSource({ ...editSource, defaultSellerEmail: e.target.value })}
                          className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-700">Lloji i shitësit të paracaktuar</span>
                        <select
                          value={editSource.defaultSellerType}
                          onChange={(e) =>
                            setEditSource({ ...editSource, defaultSellerType: e.target.value as "PRIVATE" | "DEALER" })
                          }
                          className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                        >
                          <option value="DEALER">Dealer</option>
                          <option value="PRIVATE">Private</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-700">Monedha e paracaktuar</span>
                        <select
                          value={editSource.defaultCurrency}
                          onChange={(e) =>
                            setEditSource({ ...editSource, defaultCurrency: e.target.value as "EUR" | "ALL" })
                          }
                          className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                        >
                          <option value="EUR">EUR</option>
                          <option value="ALL">ALL</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-700">Vonesa midis kërkesave (ms)</span>
                        <input
                          type="number"
                          value={editSource.requestDelayMs}
                          onChange={(e) => setEditSource({ ...editSource, requestDelayMs: e.target.value })}
                          className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-700">Listime maksimale për ekzekutim</span>
                        <input
                          type="number"
                          value={editSource.maxPerRun}
                          onChange={(e) => setEditSource({ ...editSource, maxPerRun: e.target.value })}
                          className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="font-medium text-slate-700">Intervali i ekzekutimit automatik (orë)</span>
                        <input
                          type="number"
                          min={1}
                          max={168}
                          value={editSource.cronIntervalHours}
                          onChange={(e) =>
                            setEditSource({ ...editSource, cronIntervalHours: e.target.value })
                          }
                          className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                        />
                      </label>
                      <label className="mt-1 flex items-center gap-2 text-sm md:col-span-2">
                        <input
                          type="checkbox"
                          checked={editSource.autoPublish}
                          onChange={(e) => setEditSource({ ...editSource, autoPublish: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <span className="text-slate-700">Publiko automatikisht listimet e vlefshme</span>
                      </label>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSourceId(null);
                          setEditSource(null);
                        }}
                        className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700"
                      >
                        Anulo
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void saveEditedSource(source.id)}
                        className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Ruaj ndryshimet
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Ekzekutimet e fundit</h2>
        {recentRuns.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Ende nuk ka ekzekutime.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {recentRuns.map((run) => {
              const sourceName = run.source?.name ?? sourcesById[run.sourceId]?.name ?? "(burim i fshirë)";
              return (
                <li key={run.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-[200px] flex-1">
                    <p className="font-semibold text-slate-900">{sourceName}</p>
                    <p className="text-xs text-slate-500">
                      {run.status} · filloi {formatDate(run.startedAt)} · përfundoi {formatDate(run.finishedAt)}
                    </p>
                    <p className="text-xs text-slate-500">
                      krijuar {run.createdCount} · përditësuar {run.updatedCount} · kapërcyer {run.skippedCount} · dështuar {run.failedCount}
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
                    Shiko
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
            <h2 className="text-lg font-semibold text-slate-900">Detajet e ekzekutimit</h2>
            <button
              type="button"
              onClick={() => {
                setOpenRunId(null);
                setRunDetails(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Mbyll
            </button>
          </div>
          {!runDetails ? (
            <p className="mt-3 text-sm text-slate-500">Po ngarkohet…</p>
          ) : (
            <div className="mt-3 space-y-4 text-sm">
              <div>
                <p className="text-slate-700">
                  Burimi: <span className="font-semibold">{runDetails.source.name}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Statusi {runDetails.status} · krijuar {runDetails.createdCount} · përditësuar {runDetails.updatedCount} · kapërcyer {runDetails.skippedCount} · dështuar {runDetails.failedCount}
                </p>
              </div>
              {runDetails.logs && runDetails.logs.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-800">Regjistrat</p>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                    {runDetails.logs
                      .map((entry) => `[${entry.level}] ${entry.message}`)
                      .join("\n")}
                  </pre>
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-800">Të dhënat ({runDetails.records.length})</p>
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
                          <span className="text-slate-700">{rec.externalId ?? "(panjohur)"}</span>
                        )}
                        {rec.message && <p className="text-red-700">{rec.message}</p>}
                        {rec.listingSlug && (
                          <p className="text-slate-500">Slug i listimit: {rec.listingSlug}</p>
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
