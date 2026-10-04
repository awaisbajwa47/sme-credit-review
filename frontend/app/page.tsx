"use client";
import { useEffect, useRef, useState } from "react";

const pkr = (n: number) => `Rs. ${Math.round(n || 0).toLocaleString("en-PK")}`;
const labels: Record<string, string> = {
  approve: "Approve",
  refer: "Committee review",
  decline: "Decline",
};
function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    chart: (
      <>
        <path d="M4 4v16h17M8 16v-4m5 4V8m5 8V5" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1" />
      </>
    ),
    moon: <path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z" />,
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4m-4 4 4-4 4 4M4 17v4h16v-4" />
      </>
    ),
    bell: (
      <>
        <path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5ZM10 21h4" />
      </>
    ),
    arrow: <path d="m7 17 10-10M7 7h10v10" />,
    check: <path d="m5 12 4 4L19 6" />,
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="3" />
        <path d="M3 9h18m-6 5h6" />
      </>
    ),
  };
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.chart}
    </svg>
  );
}
async function api(url: string, options?: RequestInit) {
  const r = await fetch(url, options);
  if (!r.ok) {
    let message = `Request failed (${r.status})`;
    try {
      const d = await r.json();
      message = typeof d.detail === "string" ? d.detail : message;
    } catch {}
    throw new Error(message);
  }
  return r.json();
}
function download(name: string, content: string, type: string) {
  const u = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
function csv(rows: any[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const cell = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    keys.map(cell).join(","),
    ...rows.map((r) => keys.map((k) => cell(r[k])).join(",")),
  ].join("\r\n");
}
function Dial({ score, decision }: { score: number; decision: string }) {
  const frac = Math.max(0, Math.min(1, (score - 300) / 550));
  return (
    <svg
      viewBox="0 0 220 140"
      className="dial"
      role="img"
      aria-label={`Credit score ${score} out of 850`}
    >
      <path
        d="M20 110 A90 90 0 0 1 200 110"
        fill="none"
        stroke="var(--track)"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        d="M20 110 A90 90 0 0 1 200 110"
        fill="none"
        stroke={`var(--${decision})`}
        strokeWidth="13"
        strokeLinecap="round"
        strokeDasharray="282.74"
        strokeDashoffset={282.74 * (1 - frac)}
      />
      <text x="110" y="96" textAnchor="middle" className="score">
        {score}
      </text>
      <text x="110" y="119" textAnchor="middle" className="dial-label">
        CREDIT SCORE / 850
      </text>
    </svg>
  );
}
export default function Page() {
  const [theme, setTheme] = useState("light"),
    [tab, setTab] = useState("overview"),
    [list, setList] = useState<any[]>([]),
    [impact, setImpact] = useState<any>(null),
    [sel, setSel] = useState<number | null>(null),
    [detail, setDetail] = useState<any>(null),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [city, setCity] = useState("all"),
    [applied, setApplied] = useState(0),
    [committee, setCommittee] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [notifications, setNotifications] = useState(false),
    [loan, setLoan] = useState(""),
    [scenario, setScenario] = useState<any>(null),
    [simBusy, setSimBusy] = useState(false),
    [uploadBusy, setUploadBusy] = useState(false),
    [imported, setImported] = useState<any[]>([]);
  const file = useRef<HTMLInputElement>(null);
  const currentId = useRef<number | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem("sme-theme");
    setTheme(
      saved ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    );
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const [l, i] = await Promise.all([
        api("/api/applicants"),
        api("/api/impact"),
      ]);
      setList(l);
      setImpact(i);
      setSel((s) => s ?? l[0]?.id ?? null);
    } catch (e: any) {
      setError(`${e.message}. Start the backend on port 8000, then retry.`);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (sel == null) return;
    currentId.current = sel;
    const controller = new AbortController();
    setDetail(null);
    setCommittee(null);
    setApplied(0);
    setScenario(null);
    api(`/api/applicants/${sel}`, { signal: controller.signal })
      .then((d) => {
        setDetail(d);
        setLoan(String(d.record.loan_amount));
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [sel]);
  async function convene() {
    const id = sel;
    setBusy(true);
    setError("");
    try {
      const result = await api("/api/committee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (currentId.current === id) setCommittee(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function simulate() {
    const id = sel;
    setSimBusy(true);
    setError("");
    try {
      const result = await api("/api/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, overrides: { loan_amount: Number(loan) } }),
      });
      if (currentId.current === id) setScenario(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSimBusy(false);
    }
  }
  async function upload(f: File) {
    setUploadBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", f);
      setImported(await api("/api/upload-csv", { method: "POST", body }));
      setTab("imports");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadBusy(false);
      if (file.current) file.current.value = "";
    }
  }
  const filtered = list.filter(
    (x) =>
      (filter === "all" || x.decision === filter) &&
      (city === "all" || x.city === city) &&
      `${x.name} ${x.city} ${x.sector}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const volume = list.reduce((n, x) => n + x.loan_amount, 0),
    approved = list.filter((x) => x.decision === "approve");
  const a = detail?.assessment,
    steps = detail?.path?.steps || [];
  const shown =
    a &&
    (applied
      ? {
          ...a,
          pd: steps[applied - 1].pd_after,
          score: steps[applied - 1].score_after,
        }
      : a);
  const decision = shown
    ? shown.pd <= 0.15
      ? "approve"
      : shown.pd > 0.3
        ? "decline"
        : "refer"
    : "refer";
  const maxFactor = a
    ? Math.max(1, ...a.factors.map((f: any) => Math.abs(f.impact_pts)))
    : 1;
  const sectors = Array.from(new Set(list.map((x) => x.sector))).map(
    (name) => ({
      name,
      value: list
        .filter((x) => x.sector === name)
        .reduce((n, x) => n + x.loan_amount, 0),
    }),
  );
  const maxSector = Math.max(1, ...sectors.map((x) => x.value));
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setTab("overview")}>
          <span className="brand-mark">
            <Icon name="chart" />
          </span>
          <span>
            SME<span className="brand-light">Credit</span>
            <small>SMARTER FINANCING</small>
          </span>
        </a>
        <div className="search">
          <Icon name="search" />
          <input
            aria-label="Search applications"
            placeholder="Search businesses, cities or sectors…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setTab("applications");
            }}
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")}>
              ×
            </button>
          )}
        </div>
        <div className="top-actions">
          <span className="demo">Synthetic demo</span>
          <button
            className="icon-button"
            title={
              theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
            aria-label={
              theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
            onClick={() => {
              const t = theme === "light" ? "dark" : "light";
              setTheme(t);
              localStorage.setItem("sme-theme", t);
            }}
          >
            <Icon name={theme === "light" ? "moon" : "sun"} />
          </button>
          <button
            className="icon-button notification-button"
            aria-label="Notifications"
            aria-expanded={notifications}
            onClick={() => setNotifications(!notifications)}
          >
            <Icon name="bell" />
            <i />
          </button>
          <div className="profile">
            <span className="avatar">CO</span>
            <span>
              Credit officer<small>Review workspace</small>
            </span>
          </div>
        </div>
      </header>
      {notifications && (
        <aside className="notification-panel">
          <h3>Workspace updates</h3>
          <p>
            {list.filter((x) => x.decision === "refer").length} applications
            need committee review.
          </p>
          <p>
            {list.filter((x) => x.thin_file).length} businesses have no credit
            file.
          </p>
          <small>Based on the current synthetic applicant pool.</small>
        </aside>
      )}
      <div className="workspace">
        <nav className="sidebar" aria-label="Main navigation">
          {[
            { id: "overview", icon: "grid", label: "Dashboard" },
            { id: "applications", icon: "people", label: "Applications" },
            { id: "impact", icon: "chart", label: "Impact" },
            { id: "imports", icon: "upload", label: "CSV imports" },
          ].map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "active" : ""}
              aria-current={tab === n.id ? "page" : undefined}
              onClick={() => setTab(n.id)}
              title={n.label}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </button>
          ))}
          <div className="sidebar-bottom">
            <span>SC</span>
            <small>
              SME CREDIT
              <br />
              WORKSPACE
            </small>
          </div>
        </nav>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">FINANCIAL INTELLIGENCE / WORKSPACE</div>
              <h1>
                {tab === "overview"
                  ? "Dashboard"
                  : tab === "applications"
                    ? "Applications"
                    : tab === "impact"
                      ? "Financing impact"
                      : "Portfolio imports"}
              </h1>
              <p>Better insights. More inclusive credit decisions.</p>
            </div>
            <div className="heading-actions">
              <span className="connection">
                <i className={error ? "offline" : ""} />
                {loading
                  ? "Connecting"
                  : error
                    ? "Check connection"
                    : "API connected"}
              </span>
              <button
                className="button secondary"
                disabled={!filtered.length}
                onClick={() =>
                  download("sme-applications.csv", csv(filtered), "text/csv")
                }
              >
                <Icon name="download" />
                Export CSV
              </button>
              <button
                className="button"
                disabled={uploadBusy}
                onClick={() => file.current?.click()}
              >
                <Icon name="upload" />
                {uploadBusy ? "Scoring…" : "Import portfolio"}
              </button>
              <input
                ref={file}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) upload(e.target.files[0]);
                }}
              />
            </div>
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
              <button onClick={load}>Retry connection</button>
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                ×
              </button>
            </div>
          )}
          {loading && (
            <div className="loading">Connecting to your credit data…</div>
          )}
          {(tab === "overview" || tab === "applications") && (
            <>
              <div className="metrics">
                <article className="metric featured">
                  <div className="card-top">
                    Requested financing
                    <Icon name="wallet" />
                  </div>
                  <h2>{pkr(volume)}</h2>
                  <span className="metric-caption">
                    Across {list.length} demo applications
                  </span>
                  <svg
                    className="mini-chart"
                    viewBox="0 0 150 65"
                    role="img"
                    aria-label="Requested financing by decision: approve, review, decline"
                  >
                    <title>Requested financing by decision</title>
                    {["approve", "refer", "decline"].map((d, i) => {
                      const h = volume
                        ? (list
                            .filter((x) => x.decision === d)
                            .reduce((n, x) => n + x.loan_amount, 0) /
                            volume) *
                          60
                        : 0;
                      return (
                        <rect
                          key={d}
                          x={i * 48 + 5}
                          y={65 - h}
                          width="32"
                          height={h}
                          rx="4"
                          fill={["#78eed4", "#ffd08c", "#ffacc0"][i]}
                        />
                      );
                    })}
                  </svg>
                </article>
                <article className="metric">
                  <div className="card-top">
                    Approval-ready requests
                    <span className="icon-tile">
                      <Icon name="check" />
                    </span>
                  </div>
                  <h2>
                    {pkr(approved.reduce((n, x) => n + x.loan_amount, 0))}
                  </h2>
                  <span className="metric-caption">
                    <b className="green">{approved.length} businesses</b> meet
                    the model threshold
                  </span>
                </article>
                <article className="metric">
                  <div className="card-top">
                    Review queue
                    <span className="icon-tile">
                      <Icon name="people" />
                    </span>
                  </div>
                  <h2>
                    {list.filter((x) => x.decision === "refer").length}
                    <small> / {list.length}</small>
                  </h2>
                  <span className="metric-caption">
                    Applications needing committee review
                  </span>
                </article>
              </div>
              <div className="dashboard-grid">
                <section className="card applicants-card">
                  <div className="section-head">
                    <div>
                      <h2>Business applications</h2>
                      <p>Select a business to explore its assessment</p>
                    </div>
                    <span className="count">{filtered.length}</span>
                  </div>
                  <div className="filters">
                    <select
                      aria-label="Decision filter"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      <option value="all">All decisions</option>
                      {Object.entries(labels).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="City filter"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    >
                      <option value="all">All cities</option>
                      {Array.from(new Set(list.map((x) => x.city)))
                        .sort()
                        .map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                    </select>
                  </div>
                  <div className="application-list">
                    {filtered.map((x) => (
                      <button
                        key={x.id}
                        className={`application ${sel === x.id ? "selected" : ""}`}
                        onClick={() => setSel(x.id)}
                        aria-pressed={sel === x.id}
                      >
                        <span className="business-avatar">
                          {x.name
                            .split(" ")
                            .map((w: string) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <span className="application-info">
                          <strong>{x.name}</strong>
                          <small>
                            {x.city} · {x.sector}
                          </small>
                          <span className={`status ${x.decision}`}>
                            {labels[x.decision]}
                          </span>
                          {x.thin_file && (
                            <span className="thin-file">No credit file</span>
                          )}
                        </span>
                        <span className="application-value">
                          {pkr(x.loan_amount)}
                          <small>Score {x.score}</small>
                        </span>
                      </button>
                    ))}
                    {!filtered.length && !loading && (
                      <p className="empty">
                        No applications match your search.
                      </p>
                    )}
                  </div>
                </section>
                <div className="assessment-column">
                  {detail && shown ? (
                    <>
                      <section className="card assessment">
                        <div className="section-head">
                          <div>
                            <div className="eyebrow">
                              APPLICATION #{sel?.toString().padStart(3, "0")}
                            </div>
                            <h2>{detail.record.name}</h2>
                            <p>
                              {detail.record.sector} · {detail.record.city}
                            </p>
                          </div>
                          <button
                            className="icon-button"
                            aria-label="Download assessment report"
                            title="Download assessment report"
                            onClick={() =>
                              download(
                                `assessment-${sel}.json`,
                                JSON.stringify(
                                  {
                                    business: detail.record,
                                    assessment: a,
                                    path: detail.path,
                                    committee,
                                  },
                                  null,
                                  2,
                                ),
                                "application/json",
                              )
                            }
                          >
                            <Icon name="download" />
                          </button>
                        </div>
                        <div className="assessment-summary">
                          <Dial score={shown.score} decision={decision} />
                          <div className="decision-summary">
                            <span className={`status ${decision}`}>
                              {labels[decision]}
                            </span>
                            <h3>
                              {(shown.pd * 100).toFixed(1)}%
                              <small>estimated default risk</small>
                            </h3>
                            <p>Approval threshold: ≤15%</p>
                            {applied > 0 && (
                              <span className="simulation-label">
                                Approval-path simulation
                              </span>
                            )}
                          </div>
                          <div className="business-facts">
                            <div>
                              <small>Monthly revenue</small>
                              <strong>
                                {pkr(detail.record.monthly_revenue)}
                              </strong>
                            </div>
                            <div>
                              <small>Loan request</small>
                              <strong>
                                {pkr(
                                  applied === steps.length && applied
                                    ? detail.path.final.loan_amount
                                    : detail.record.loan_amount,
                                )}
                              </strong>
                            </div>
                            <div>
                              <small>Operating history</small>
                              <strong>
                                {detail.record.business_age_years} years
                              </strong>
                            </div>
                          </div>
                        </div>
                      </section>
                      <div className="detail-grid">
                        <section className="card factors">
                          <div className="section-head">
                            <div>
                              <h2>What drives the score</h2>
                              <p>
                                Original risk impact · percentage points vs
                                average
                              </p>
                            </div>
                            <Icon name="chart" />
                          </div>
                          {a.factors.map((f: any) => (
                            <div className="factor" key={f.key}>
                              <div className="factor-label">
                                <strong>{f.label}</strong>
                                <small>{f.value}</small>
                              </div>
                              <div className="factor-track">
                                <i
                                  className={f.impact_pts < 0 ? "good" : "bad"}
                                  style={{
                                    width: `${(Math.abs(f.impact_pts) / maxFactor) * 100}%`,
                                  }}
                                />
                              </div>
                              <span
                                className={
                                  f.impact_pts < 0 ? "green" : "orange"
                                }
                              >
                                {f.impact_pts > 0 ? "+" : ""}
                                {f.impact_pts}
                              </span>
                            </div>
                          ))}
                          <div className="legend">
                            <span>
                              <i className="green-dot" /> Reduces risk
                            </span>
                            <span>
                              <i className="orange-dot" /> Adds risk
                            </span>
                          </div>
                        </section>
                        <section className="card">
                          <div className="section-head">
                            <div>
                              <h2>Business health</h2>
                              <p>Observed alternative-data signals</p>
                            </div>
                          </div>
                          {[
                            {
                              label: "Digital payments",
                              value: detail.record.digital_payment_share,
                            },
                            {
                              label: "On-time utility payments",
                              value: detail.record.utility_on_time_rate,
                            },
                            {
                              label: "Existing debt ratio",
                              value: detail.record.existing_debt_ratio,
                            },
                            {
                              label: "Customer concentration",
                              value: detail.record.customer_concentration,
                            },
                          ].map((s, i) => (
                            <div className="signal" key={s.label}>
                              <div>
                                <span>{s.label}</span>
                                <strong>{(s.value * 100).toFixed(1)}%</strong>
                              </div>
                              <div className="signal-track">
                                <i
                                  style={{
                                    width: `${s.value * 100}%`,
                                    background: [
                                      "var(--blue)",
                                      "var(--approve)",
                                      "var(--refer)",
                                      "#8b7ce8",
                                    ][i],
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                          <div className="reserve">
                            <Icon name="wallet" />
                            <div>
                              <small>Cash reserve runway</small>
                              <strong>
                                {detail.record.cash_reserve_months} months
                              </strong>
                            </div>
                          </div>
                        </section>
                      </div>
                      <div className="detail-grid">
                        <section className="card">
                          <div className="section-head">
                            <div>
                              <h2>Path to approval</h2>
                              <p>Explore the model’s suggested changes</p>
                            </div>
                            <span className="icon-tile">
                              <Icon name="arrow" />
                            </span>
                          </div>
                          {!detail.path ? (
                            <div className="success-panel">
                              <Icon name="check" />
                              <h3>Already approval-ready</h3>
                              <p>
                                This business meets the current risk threshold.
                              </p>
                            </div>
                          ) : detail.path.reachable ? (
                            <>
                              <div className="slider-label">
                                <span>Changes applied</span>
                                <strong>
                                  {applied} / {steps.length}
                                </strong>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max={steps.length}
                                value={applied}
                                onChange={(e) =>
                                  setApplied(Number(e.target.value))
                                }
                                aria-label="Approval changes applied"
                              />
                              <ol className="steps">
                                {steps.map((s: any, i: number) => (
                                  <li
                                    key={s.key}
                                    className={i < applied ? "on" : ""}
                                  >
                                    <span className="step-number">
                                      {i < applied ? "✓" : i + 1}
                                    </span>
                                    <div>
                                      <strong>{s.action}</strong>
                                      <small>
                                        {s.from} → {s.to}
                                      </small>
                                    </div>
                                    <span className="step-risk">
                                      {(s.pd_after * 100).toFixed(1)}% risk
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            </>
                          ) : (
                            <p className="empty">
                              No realistic combination of changes reaches
                              approval. Consider a smaller request or a longer
                              business track record.
                            </p>
                          )}
                        </section>
                        <section className="card">
                          <div className="section-head">
                            <div>
                              <h2>Loan what-if calculator</h2>
                              <p>Recalculate risk with a different request</p>
                            </div>
                          </div>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              simulate();
                            }}
                          >
                            <label htmlFor="loan">Loan amount (PKR)</label>
                            <input
                              id="loan"
                              type="number"
                              min="1"
                              step="1"
                              required
                              value={loan}
                              onChange={(e) => {
                                setLoan(e.target.value);
                                setScenario(null);
                              }}
                            />
                            <button
                              className="button full"
                              disabled={
                                simBusy || !Number(loan) || Number(loan) <= 0
                              }
                            >
                              {simBusy ? "Calculating…" : "Calculate scenario"}
                              <Icon name="arrow" />
                            </button>
                          </form>
                          {scenario && (
                            <div className="scenario" aria-live="polite">
                              <span className={`status ${scenario.decision}`}>
                                {labels[scenario.decision]}
                              </span>
                              <h3>
                                {scenario.score}
                                <small>credit score</small>
                              </h3>
                              <p>
                                {(scenario.pd * 100).toFixed(1)}% default risk ·
                                original {(a.pd * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                          <p className="footnote">
                            Scenario results are simulations and do not update
                            the application.
                          </p>
                        </section>
                      </div>
                      <section className="card committee-card">
                        <div className="section-head">
                          <div>
                            <h2>AI credit committee</h2>
                            <p>
                              Underwriting, risk challenge, and data quality
                              review
                            </p>
                          </div>
                          <button
                            className="button"
                            onClick={convene}
                            disabled={busy}
                          >
                            {busy ? "Reviewing…" : "Convene committee"}
                            <Icon name="people" />
                          </button>
                        </div>
                        {committee ? (
                          <>
                            <div className="committee-members">
                              {["underwriter", "skeptic", "compliance"].map(
                                (k, i) => (
                                  <article key={k}>
                                    <span className="reviewer-number">
                                      0{i + 1}
                                    </span>
                                    <h3>
                                      {k === "skeptic"
                                        ? "Risk challenger"
                                        : k === "compliance"
                                          ? "Data & compliance"
                                          : "Underwriter"}
                                    </h3>
                                    <p>{committee[k]}</p>
                                  </article>
                                ),
                              )}
                            </div>
                            <div className="verdict">
                              <span
                                className={`status ${committee.verdict.decision}`}
                              >
                                {labels[committee.verdict.decision]}
                              </span>
                              <p>{committee.verdict.summary}</p>
                              {committee.verdict.conditions?.length > 0 && (
                                <ul>
                                  {committee.verdict.conditions.map(
                                    (c: string) => (
                                      <li key={c}>{c}</li>
                                    ),
                                  )}
                                </ul>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="committee-empty">
                            <span className="icon-tile">
                              <Icon name="people" />
                            </span>
                            <p>
                              Bring three perspectives together for a
                              transparent recommendation.
                              <small>
                                Supports offline review when no AI key is
                                configured.
                              </small>
                            </p>
                          </div>
                        )}
                      </section>
                    </>
                  ) : (
                    <section className="card empty">
                      {loading
                        ? "Loading assessment…"
                        : list.length
                          ? "Loading selected business…"
                          : "Start the backend to view business assessments."}
                    </section>
                  )}
                </div>
              </div>
            </>
          )}
          {(tab === "impact" || tab === "overview") && (
            <div className="impact-grid">
              <section className="card">
                <div className="section-head">
                  <div>
                    <h2>Financing by sector</h2>
                    <p>Requested volume in the current applicant pool</p>
                  </div>
                  <Icon name="chart" />
                </div>
                <div className="sector-chart">
                  {sectors.map((s) => (
                    <div className="sector-row" key={s.name}>
                      <span>{s.name}</span>
                      <div>
                        <i
                          style={{ width: `${(s.value / maxSector) * 100}%` }}
                        />
                      </div>
                      <strong>{pkr(s.value)}</strong>
                    </div>
                  ))}
                </div>
                {!sectors.length && (
                  <p className="empty">No portfolio data loaded.</p>
                )}
              </section>
              <section className="card">
                <div className="section-head">
                  <div>
                    <h2>Inclusive credit impact</h2>
                    <p>Alternative data versus a credit-history rule</p>
                  </div>
                  <span className="demo">Synthetic outcomes</span>
                </div>
                {impact ? (
                  <>
                    <div className="impact-numbers">
                      <div>
                        <strong>{impact.ai_approved}</strong>
                        <small>AI approvals</small>
                      </div>
                      <div>
                        <strong>{impact.traditional_approved}</strong>
                        <small>Traditional approvals</small>
                      </div>
                      <div>
                        <strong>{impact.thin_file_approved_by_ai}</strong>
                        <small>No-file businesses approved</small>
                      </div>
                    </div>
                    <div className="comparison">
                      <div>
                        <span>AI default rate</span>
                        <b>
                          {impact.ai_default_rate ?? "N/A"}
                          {impact.ai_default_rate != null ? "%" : ""}
                        </b>
                      </div>
                      <div>
                        <span>Traditional default rate</span>
                        <b>
                          {impact.traditional_default_rate ?? "N/A"}
                          {impact.traditional_default_rate != null ? "%" : ""}
                        </b>
                      </div>
                      <div>
                        <span>Extra financing volume</span>
                        <b>{pkr(impact.extra_loan_volume_pkr)}</b>
                      </div>
                      <div>
                        <span>Estimated additional jobs</span>
                        <b>{impact.estimated_jobs_supported}</b>
                      </div>
                      <div>
                        <span>Decision time assumption</span>
                        <b>
                          Minutes vs {impact.decision_time.traditional_days}{" "}
                          days
                        </b>
                      </div>
                    </div>
                    <p className="footnote">
                      {impact.sample_size} held-out businesses · Model AUC{" "}
                      {impact.model_auc}. {impact.assumptions}
                    </p>
                  </>
                ) : (
                  <p className="empty">
                    Connect the backend to see the impact comparison.
                  </p>
                )}
              </section>
            </div>
          )}
          {tab === "imports" && (
            <section className="card">
              <div className="section-head">
                <div>
                  <h2>Score a portfolio from CSV</h2>
                  <p>
                    Required columns: monthly_revenue and loan_amount. Optional:
                    name and the existing risk fields.
                  </p>
                </div>
                <button
                  className="button secondary"
                  onClick={() =>
                    download(
                      "portfolio-template.csv",
                      "name,monthly_revenue,loan_amount,business_age_years,revenue_growth_6m,revenue_volatility,cash_reserve_months,existing_debt_ratio,digital_payment_share,utility_on_time_rate,customer_concentration,revenue_gap\nExample Store,350000,1000000,3,0.05,0.3,1,0.2,0.3,0.9,0.3,0.05\n",
                      "text/csv",
                    )
                  }
                >
                  Get template
                </button>
              </div>
              <p className="footnote">
                Imported records are scored separately; the existing applicant
                pool remains the same.
              </p>
              {imported.length ? (
                <>
                  <div className="section-head">
                    <h3>{imported.length} records scored</h3>
                    <button
                      className="button secondary"
                      onClick={() =>
                        download(
                          "portfolio-scores.csv",
                          csv(imported),
                          "text/csv",
                        )
                      }
                    >
                      Export results
                    </button>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Business</th>
                          <th>Score</th>
                          <th>Default risk</th>
                          <th>Decision</th>
                          <th>Top factor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {imported.map((r, i) => (
                          <tr key={i}>
                            <td>{r.name}</td>
                            <td>{r.score}</td>
                            <td>{(r.pd * 100).toFixed(1)}%</td>
                            <td>
                              <span className={`status ${r.decision}`}>
                                {labels[r.decision]}
                              </span>
                            </td>
                            <td>{r.top_factor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="import-empty">
                  <Icon name="upload" />
                  <h3>Your next portfolio starts here</h3>
                  <p>
                    Upload a CSV to see scores, decisions, and the strongest
                    risk factor for each business.
                  </p>
                  <button
                    className="button"
                    disabled={uploadBusy}
                    onClick={() => file.current?.click()}
                  >
                    Choose CSV file
                  </button>
                </div>
              )}
            </section>
          )}
          <footer>
            SME Credit · Alternative-data assessment{" "}
            <span>Practice build · Synthetic data · Human review required</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
