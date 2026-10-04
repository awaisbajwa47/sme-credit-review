"use client";
import { useEffect, useState } from "react";

const DECISION_TEXT: Record<string, string> = { approve: "Approve", refer: "Refer to committee", decline: "Decline" };
const COLOR: Record<string, string> = { approve: "var(--approve)", refer: "var(--refer)", decline: "var(--decline)" };
const exactPkr = (n: number) => `PKR ${Math.round(n).toLocaleString("en-PK")}`;
const pkr = (n: number) => n >= 10000000 ? `PKR ${(n / 10000000).toFixed(2)} crore` : n >= 100000 ? `PKR ${(n / 100000).toFixed(2)} lakh` : exactPkr(n);
const FACTOR_COPY: Record<string, [string, string]> = {
  cash_reserve_months: ["Cash reserves", "The model uses the reserve duration to assess financial resilience."],
  digital_payment_share: ["Sales paid digitally", "The share of sales received through digital payments."],
  existing_debt_ratio: ["Existing debt ratio", "The business’s existing debt ratio supplied to the model."],
  customer_concentration: ["Sales from the largest customer", "A large share means the business depends heavily on one customer."],
  loan_ratio: ["Loan compared with yearly revenue", "The requested amount as a share of the business’s annual revenue."],
  revenue_gap: ["Reported vs bank-observed revenue", "The difference between reported revenue and revenue observed by the bank."],
  utility_on_time_rate: ["Utility bills paid on time", "The share of utility bills paid by their due date."],
  revenue_volatility: ["Variation in monthly sales", "How much revenue fluctuates across months."],
  business_age_years: ["Time in business", "How long the business has been operating."],
  revenue_growth_6m: ["Sales growth over six months", "The change in revenue over the past six months."],
  log_revenue: ["Monthly revenue", "The business’s monthly revenue used in the assessment."],
};
function FactorCards({ factors }: { factors: any[] }) {
  return <div className="factor-groups">{[true, false].map((helps) => {
    const items = factors.filter((f) => helps ? f.impact_pts < 0 : f.impact_pts >= 0);
    return <div key={String(helps)}><h3 className="group-title">{helps ? "Strengths" : "Concerns"}<span>{items.length}</span></h3>
      <p className="group-caption">{helps ? "Factors helping this application" : "Factors increasing estimated risk"}</p>
      {items.length === 0 && <p className="hint">None among the factors shown.</p>}
      {items.map((f) => <article className={`factor-card ${helps ? "strength" : "concern"}`} key={f.key}>
        <div className="factor-card-top"><h4>{FACTOR_COPY[f.key]?.[0] ?? f.label}</h4><span className="effect-badge">{helps ? "↓ Lowers risk" : f.impact_pts === 0 ? "No rounded effect" : "↑ Raises risk"}</span></div>
        <div className="factor-value">{f.value}</div><p>{FACTOR_COPY[f.key]?.[1]}</p>
        <details><summary>View calculation</summary><p>Estimated repayment risk is {Math.abs(f.impact_pts).toFixed(1)} percentage points {helps ? "lower" : "higher"} than when this factor is set to the training average, keeping other factors unchanged. These individual comparisons do not add up to the total risk.</p></details>
      </article>)}
    </div>;
  })}</div>;
}

function pointOnArc(score: number, r: number) {
  const f = (score - 300) / 550;
  return [110 - r * Math.cos(Math.PI * f), 110 - r * Math.sin(Math.PI * f)];
}

function Dial({ score, decision, pd }: { score: number; decision: string; pd: number }) {
  const position = 300 + 550 * (1 - pd);
  const [px, py] = pointOnArc(position, 89);
  const arc = (from: number, to: number) => {
    const a = pointOnArc(from, 90), b = pointOnArc(to, 90);
    return `M ${a[0]} ${a[1]} A 90 90 0 0 1 ${b[0]} ${b[1]}`;
  };
  return <div className="meter-card">
    <svg className="dial" viewBox="0 0 220 146" role="img" aria-label={`Demo credit score ${score} out of 850. ${DECISION_TEXT[decision]}. Higher score means lower estimated risk.`}>
      {[[300, 685, "var(--decline)"], [685, 767.5, "var(--refer)"], [767.5, 850, "var(--approve)"]].map(([from, to, color]) =>
        <path key={String(from)} d={arc(Number(from), Number(to))} fill="none" stroke={String(color)} strokeWidth="14" />)}
      {[685, 767.5].map((v) => { const a = pointOnArc(v, 80), b = pointOnArc(v, 100); return <line key={v} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="white" strokeWidth="3" />; })}
      <line x1="110" y1="110" x2={px} y2={py} stroke="var(--ink)" strokeWidth="2" />
      <circle cx={px} cy={py} r="5" fill="var(--ink)" stroke="white" strokeWidth="2" />
      <rect x="62" y="65" width="96" height="47" rx="10" fill="white" />
      <text className="score" x="110" y="99" textAnchor="middle">{score}</text>
      <text className="small" x="110" y="122" textAnchor="middle">out of 850</text>
      <text className="small" x="20" y="140" textAnchor="middle">300</text><text className="small" x="200" y="140" textAnchor="middle">850</text>
    </svg>
    <p className="meter-caption">Higher score means lower estimated repayment risk</p>
    <div className="meter-legend"><span><i className="dot decline" />Decline</span><span><i className="dot refer" />Review</span><span><i className="dot approve" />Approve</span></div>
    <details className="meter-rules"><summary>How the zones work</summary><p>Demo rules: approve at risk of 15% or less; review above 15% through 30%; decline above 30%. Score boundaries are 767.5 and 685. Decisions use risk before score rounding.</p></details>
  </div>;
}

export default function Page() {
  const [impact, setImpact] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [applied, setApplied] = useState(0);
  const [committee, setCommittee] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/impact").then((r) => r.json()).then(setImpact).catch(() => setError("Cannot reach the backend on port 8000."));
    fetch("/api/applicants").then((r) => r.json()).then((l) => { setList(l); setSel(l[0]?.id ?? null); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (sel == null) return;
    setDetail(null); setCommittee(null); setApplied(0);
    fetch(`/api/applicants/${sel}`).then((r) => r.json()).then(setDetail);
  }, [sel]);

  async function convene() {
    setBusy(true);
    try {
      const r = await fetch("/api/committee", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sel }) });
      setCommittee(await r.json());
    } finally { setBusy(false); }
  }

  const a = detail?.assessment;
  const steps = detail?.path?.steps ?? [];
  const shown = a && (applied === 0 ? a : { ...a, pd: steps[applied - 1].pd_after, score: steps[applied - 1].score_after,
    decision: applied === steps.length ? detail.path.final.decision : "refer" });

  const shownDecision = shown && (shown.pd <= 0.15 ? "approve" : shown.pd > 0.3 ? "decline" : "refer");

  return (
    <>
      <header className="dashboard-header"><div><strong>SME Credit Review</strong><span className="demo-label">Demo · Synthetic business data</span></div><p>Understand the application, review the evidence, and explore improvements.</p></header>
      {error && <p className="error-message">{error}</p>}
      {impact && <section className="impact-cards" aria-label="Demo portfolio summary">
        <div><span>Businesses assessed</span><strong>{impact.sample_size}</strong><small>Evaluation sample · fictional records</small></div>
        <div><span>Model approvals</span><strong>{impact.ai_approved}</strong><small>Credit-history rule: {impact.traditional_approved}</small></div>
        <div><span>Approved without credit history</span><strong>{impact.thin_file_approved_by_ai}</strong><small>Of {impact.thin_file_total} without a credit file</small></div>
        <div><span>Defaults in synthetic outcomes</span><strong>{impact.ai_default_rate == null ? "—" : `${impact.ai_default_rate}%`}</strong><small>Among model-approved businesses</small></div>
        <details className="portfolio-details"><summary>Comparison and illustrative assumptions</summary><p>Default rate under the credit-history rule: {impact.traditional_default_rate ?? "not available"}%. Additional lending volume: {pkr(impact.extra_loan_volume_pkr)}. Estimated jobs: {impact.estimated_jobs_supported}. {impact.assumptions} Decision-time figures are illustrative, not measured performance.</p></details>
      </section>}
      <div className="shell">
        <nav className="rail" aria-label="Applicants">
          <h2>Applications</h2>
          {list.map((x) => (
            <button key={x.id} className="row" aria-current={sel === x.id} onClick={() => setSel(x.id)}>
              <div className="name"><span className={`dot ${x.decision}`} />{x.name}</div>
              <div className="sub"><span>{x.city}{x.thin_file ? ", no credit file" : ""}</span><span>{pkr(x.loan_amount)}</span></div>
            </button>
          ))}
        </nav>
        <main className="main">
          {!detail && <p>Loading application…</p>}
          {detail && a && shown && (<>
            <div className="head">
              <h1>{detail.record.name}</h1>
              <p>{detail.record.sector} in {detail.record.city}. Requesting {pkr(applied && steps.length ? (applied === steps.length ? detail.path.final.loan_amount : detail.record.loan_amount) : detail.record.loan_amount)}
                {!detail.record.has_credit_history && <span className="tag">No formal credit history</span>}</p>
            </div>
            <div className="amount-card"><span>Requested loan · original application</span><strong>{pkr(detail.record.loan_amount)}</strong><small>{exactPkr(detail.record.loan_amount)}</small></div>
            <div className="top">
              <Dial score={shown.score} decision={shownDecision} pd={shown.pd} />
              <div>
                <div className="eyebrow">{applied ? "Simulated model recommendation" : "Model recommendation"}</div><div className={`verdict ${shownDecision}`}>{DECISION_TEXT[shownDecision]}</div>
                <div className="risk-card"><span>Estimated risk of not repaying</span><strong>{(shown.pd * 100).toFixed(1)}%</strong><p>{shown.pd <= 0.15 ? "Within" : "Above"} this demo’s approval limit of 15%.</p></div><p className="hint decision-note">This is a model recommendation for review, not a final loan approval.</p>
              </div>
            </div>

            <section className="block">
              <h2>Why this application received this result</h2>
              <p className="hint">The strongest factors shown below explain what helps the application and what increases estimated repayment risk.</p>
              {applied > 0 && <p className="simulation-note">Original application factors. The meter above shows simulated improvements; these cards describe the original assessment.</p>}
              <FactorCards factors={a.factors} />
            </section>

            {detail.path && (
              <section className="block">
                <h2>Path to approval</h2>
                {detail.path.reachable ? (<>
                  <p className="hint">These changes, applied in order, bring default risk under the approval line. Drag to see the score move.</p>
                  <div className="slider-lbl"><span>Changes applied</span><b>{applied} of {steps.length}</b></div>
                  <input className="slider" type="range" min={0} max={steps.length} value={applied} onChange={(e) => setApplied(+e.target.value)} aria-label="Changes applied" />
                  <ol className="steps">
                    {steps.map((s: any, i: number) => (
                      <li key={s.key} className={`step ${i < applied ? "on" : ""}`}>
                        <span className="n">{i + 1}</span>
                        <div><div>{s.action}</div><div className="chg">{s.from} to {s.to}</div></div>
                        <div className="after">risk {(s.pd_after * 100).toFixed(1)}%</div>
                      </li>
                    ))}
                  </ol>
                </>) : <p className="hint">No realistic combination of changes reaches approval for this request. A much smaller loan or a longer track record would be needed.</p>}
              </section>
            )}

            <section className="block">
              <h2>Credit committee</h2>{applied > 0 && <p className="simulation-note">The committee reviews the original application, before simulated changes.</p>}
              <p className="hint">Three AI reviewers, one for the loan, one against, one for data quality, then a verdict with conditions.</p>
              <button className="btn" onClick={convene} disabled={busy}>{busy ? "Committee is reviewing…" : "Convene committee"}</button>
              {committee && (<>
                <div className="committee">
                  {(["underwriter", "skeptic", "compliance"] as const).map((k) => (
                    <div className="member" key={k}><h3>{k[0].toUpperCase() + k.slice(1)}</h3>{committee[k]}</div>
                  ))}
                </div>
                <div className="final">
                  <b>{DECISION_TEXT[committee.verdict.decision]}.</b> {committee.verdict.summary}
                  {committee.verdict.conditions?.length > 0 && <ul>{committee.verdict.conditions.map((c: string) => <li key={c}>{c}</li>)}</ul>}
                </div>
              </>)}
            </section>
          </>)}
        </main>
      </div>
    </>
  );
}
