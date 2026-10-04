# SME Credit Scrutiny (practice build)

Data -> AI -> impact: alternative-data credit assessment for SMEs with no formal credit history.

## Run it
Backend (terminal 1):
    cd backend
    python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
    pip install -r requirements.txt
    export ANTHROPIC_API_KEY=sk-ant-...                  # optional; without it the committee runs in offline mode
    uvicorn main:app --reload --port 8000

Frontend (terminal 2):
    cd frontend
    npm install
    npm run dev                                          # http://localhost:3000

## What is in it
- backend/data_gen.py   synthetic SME data (outcomes are synthetic: say so in the demo)
- backend/model.py      logistic regression, exact per-factor explanations, path-to-approval search (the wow feature)
- backend/llm.py        Claude credit committee + ledger-photo extraction
- backend/main.py       API: /api/applicants, /api/whatif, /api/committee, /api/impact, /api/upload-csv, /api/extract, /api/score-record
- frontend/app/page.tsx dashboard: score dial, factor bars, draggable path to approval, committee

## Ideas to add before the real event
1. A UI for /api/extract (photo of a khata or statement -> features -> score). The endpoint already works.
2. A UI for /api/upload-csv (credit officer uploads a portfolio).
3. Swap the linear model for XGBoost + SHAP if you want non-linear effects (keep the path-to-approval search).
4. Real-ish data: replace data_gen.py with a public SME/credit dataset.

## Demo script (5 minutes)
1. Impact bar: one sentence on the problem and the numbers.
2. Pick a declined business with no credit file. Show the score and the factors.
3. Drag the path-to-approval slider until it flips to Approve.
4. Convene the committee. Close on the impact line.

## Redesigned dashboard

The interface now follows the supplied blue-and-white financial dashboard reference, with responsive navigation, summary cards, sector financing bars, business health indicators, and an impact comparison. Every chart uses existing API fields; no transaction history or monthly series has been invented.

### New controls
- Sun/moon button switches light and dark themes and remembers your choice. First visit follows your system theme.
- Search by business name, city, or sector; filter by decision and city.
- Export the filtered applications as CSV, or download a selected assessment as JSON.
- Import a CSV portfolio through the existing `/api/upload-csv` endpoint. Download a template in the Imports view and export the scored results. Imports do not alter the demo applicant pool; they remain in the current browser session.
- Loan what-if calculator calls `/api/whatif` and shows the recalculated score and risk without changing the original application.
- Notifications summarize the current review queue and businesses with no credit file.
- Existing approval-path slider and three-reviewer committee are retained.

The synthetic applicant pool, scoring model, backend endpoints, and PKR amounts are preserved. Model recommendations and simulated changes are not actual bank approvals.

### Windows quick start
Install Python and Node.js, extract the ZIP, and open two terminals inside `SME-Credit`.

Backend terminal:
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m uvicorn main:app --reload --port 8000
```
Frontend terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:3000. No API key is needed for the offline committee. Ledger photo extraction remains available in the backend but is not part of this dashboard update.
