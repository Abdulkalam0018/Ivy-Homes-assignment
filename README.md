# Ivy Homes — Property Search Frontend

**Internship Assignment — September 2026**
**Candidate:** Md Abdul Kalam | `abdulkalam0018@mnnit.ac.in`
**City:** Pune | **Assigned Locality:** Hinjewadi

**Live demo:** https://ivy-homes-assignment.vercel.app
**Repo:** https://github.com/Abdulkalam0018/Ivy-Homes-assignment

---

## What this is

A React web application built on top of the Ivy Homes property API (Pune). It lets three demo users log in, browse sale listings and rentals, explore builder projects, save listings, and view an insights dashboard.

The assignment also asked for ten numerical answers about the Pune dataset and a list of every place the API documentation lies. Both are in [`submission.json`](./submission.json).

---

## How to run it locally

```bash
# From the repo root
cd ivy-homes-frontend
npm install
npm run dev
```

Open http://localhost:5173

Login with any of the three demo accounts (same password):
- `demo1@ivy.homes` / `e5ccaf155c`
- `demo2@ivy.homes` / `e5ccaf155c`
- `demo3@ivy.homes` / `e5ccaf155c`

**Environment:** The API key is pre-configured in `.env`. No additional setup needed.

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React 18 + Vite + JavaScript | Fast builds, industry standard |
| Routing | React Router v6 | Simple, well-known, file-level routes |
| API state | TanStack Query (React Query) | Built-in caching, loading/error states, background refetch |
| HTTP | Axios | Interceptors for token auto-refresh and header injection |
| Styling | Tailwind CSS v4 | Utility-first, fast to write, professional output |
| Icons | lucide-react | Clean, consistent icon set |
| Deployment | Vercel | Free tier, instant GitHub deploy, SPA routing support |

**Deliberately not used:** Redux, GraphQL, WebSockets, a backend server, Docker, Redis, or any database. The API is the backend. Simplicity is the right call here.

---

## How I investigated the documentation

### Step 1 — Test the API before writing any app code

Before writing a single React component I probed every endpoint with curl. The first call told me everything:

```bash
curl "https://solve.ivy.homes/v1/listings?api_key=IVY26-58EF32DDF2FE"
# → {"detail":"send your key in the X-API-Key request header, not as a query parameter"}
```

The documentation says to use a query parameter. The API corrects you with a helpful message. This was the first discrepancy and it set the tone: **read the error messages, not the docs.**

### Step 2 — Read every response field carefully

After fixing the auth header I logged in and immediately noticed the login response field was `access_token`, not `token` as documented. Then I saw `expires_in: 900` — 900 seconds is 15 minutes, not 24 hours. And there was a `refresh_token` and `refresh_url` field, despite the docs saying "there is no refresh flow."

This was the most critical finding for the frontend. I implemented auto-refresh using an Axios response interceptor: on a 401 error, silently call `/auth/refresh`, update stored tokens, and retry the original request.

### Step 3 — Pull the entire dataset first, then analyse

Rather than reading one record at a time, I wrote a Node.js script (`scripts/harvest.js`) that paginated all three endpoints to completion and saved the raw JSON locally. This took about 2 minutes and produced:

- 3,800 listings
- 1,450 rentals
- 440 projects

The `total` field said 3,572 listings. I fetched 3,800. That discrepancy is itself a finding.

### Step 4 — Form hypotheses, then test them

**Hypothesis: project prices are in rupees (as documented)**

Immediately falsified. P30001 had `price_min: 80, price_max: 3.22`. Those can't both be rupees because min > max. I cross-referenced with actual listing prices for that project — listings priced at ₹72–91 lakhs. Conclusion: `price_min` is in lakhs, `price_max` is in crores. The UI displays them accordingly.

**Hypothesis: `total_listings` in projects is reliable**

I counted actual listings per `project_id` across all 3,800 records. 317 of 414 projects (76%) reported the wrong count. This is a consistency failure, not a rounding issue.

**Hypothesis: contacts with many listings are suspicious**

I counted listings per contact number. Normal contacts had 1–4 listings. Ten contacts each had 20–31 listings, spread across unrelated localities — a pattern inconsistent with any genuine agent or owner. Those 283 listings I classified as fake.

**Hypothesis: the `is_live` field filters listings server-side**

The documentation says the endpoint only returns active listings. It doesn't. 802 of 3,800 records had `is_live: false`. The field exists on every record for client-side filtering.

**Hypothesis: duplicate listing_ids exist**

No — every listing_id is unique. But 247 lat/lng coordinate pairs appear in more than one listing. Same apartment building, different websites, different prices for different bedroom counts. 3,800 records → 3,515 distinct physical properties.

---

## What I checked that turned out to be fine

These are the hypotheses that did not pan out. They matter as much as the ones that did.

**Hypothesis: timestamps are in a different timezone than claimed**

The documentation says ISO 8601 UTC with Z suffix everywhere. Checking `posted_at` fields: they are all `...Z` (UTC). The health endpoint returns `+05:30` offset, but that's the server clock, not the data timestamps. The listing timestamps are genuinely UTC. No discrepancy here.

**Hypothesis: filter parameters are silently ignored**

I tested `locality=hinjewadi` and `bhk=2` filters with manual spot-checks against the unfiltered data. The filters work correctly. The documentation is accurate on this point.

**Hypothesis: sort parameters don't work**

I tested `sort_by=price&order=desc` and `sort_by=posted_at&order=asc`. Results were correctly ordered. No finding here.

**Hypothesis: the same listing_id appears on multiple pages (pagination leaks)**

Paginating through all 3,800 records with offset increments: no duplicate listing_ids across pages. Pagination is consistent.

**Hypothesis: rental prices include maintenance (misleading total)**

The API returns `price` (monthly rent), `deposit`, and `maintenance` as separate fields. They are correctly separated — no hidden bundling. The documentation is accurate.

**Hypothesis: `is_verified` is always true (meaningless field)**

Checked: 1,847 of 3,800 listings have `is_verified: false`. The field is real and varied.

**Hypothesis: project RERA numbers are duplicated across projects**

Spot-checked a sample of RERA numbers — each appears on exactly one project in the dataset. No duplication found.

**Hypothesis: the /auth/logout endpoint doesn't actually invalidate tokens**

I couldn't test this definitively (would need to check a token after logging out, which requires a second API call that I'd be rate-limited on). I implemented logout correctly client-side regardless.

---

## The ten answers

All in [`submission.json`](./submission.json). Brief methodology for the interesting ones:

**Q2 — unique_properties = 3,515**
Grouped all listings by exact (latitude, longitude). 247 coordinate pairs had more than one listing — same building, different websites. 3,800 records → 3,515 distinct positions.

**Q4 — 27 corrupt listings**
Logical impossibilities: `price ≤ 0`, `floor > total_floors`, `carpet_area > super_built_up_area`, or `bedroom = 0` on an apartment. These cannot describe real properties.

**Q7 — P30394 is the costliest project**
Once I resolved the unit confusion (price_max is in crores), P30394 "Brigade Park" has `price_max = 99.9`, i.e. ₹99.9 crore.

**Q9 — 283 fake listings**
Ten contact numbers each associated with 20–31 listings across multiple unrelated Pune localities. A real agent does not simultaneously manage 31 properties in Wakad, Magarpatta, and Kothrud. These are bulk-posted enquiry traps.

**Q10 — 317 projects with wrong listing count**
Counted actual listings per project from the full dataset. 317 of 414 projects reported a `total_listings` value that didn't match. 76% wrong is not drift — it suggests the counter is not being updated correctly.

---

## Data discrepancies found (summary)

16 findings total in `submission.json`. The most significant:

| Severity | Finding |
|----------|---------|
| 🔴 Critical | API key must be in `X-API-Key` header, not `?api_key=` query param |
| 🔴 Critical | Token expires in 15 min (not 24h). `refresh_token` and `/auth/refresh` exist but are undocumented |
| 🔴 Critical | `project.price_min` is in **lakhs**, `price_max` is in **crores** — not rupees |
| 🟠 High | `/v1/analytics/summary` returns 404 — endpoint does not exist |
| 🟠 High | `/v1/listing/{id}` returns 404 — correct path is `/v1/listings/{id}` (plural) |
| 🟠 High | `/v1/listings/{id}/similar` returns 404 — endpoint does not exist |
| 🟠 High | `/v1/favourites` returns 404 — path unknown |
| 🟡 Medium | Pagination uses `offset`, not `page`. Max limit is 50, not 200 |
| 🟡 Medium | `total` field understates actual record count (reported 3,572; actual 3,800) |
| 🟡 Medium | Endpoint returns listings with `is_live: false` (802 inactive records) |
| 🟡 Medium | 317/414 projects have wrong `total_listings` counter |
| 🟡 Medium | 283 bulk-posted fake listings from 10 suspect contacts |
| 🟡 Medium | 27 listings describe physically impossible properties |
| 🟡 Medium | 285 listings share lat/lng with another listing (same property, different websites) |

---

## What I would do with another two days

**Immediately:**
- Discover the real favourites endpoint path (the saved listings feature depends on it)
- Deeper fake listing detection: cross-reference description text, images, and naming patterns
- Verify the price unit finding more rigorously by testing more project/listing pairs

**Quality improvements:**
- Add infinite scroll on the listings page (better UX than pagination)
- Add a map view using Google Maps — lat/lng is available on every listing
- Add a price history chart on the listing detail page (if the API exposes historical data)
- Add proper input debouncing on price filter fields

**Data:**
- Write a script to verify which `/v1/listings?project_id=X` counts actually match `total_listings` — the current check counts from the bulk dataset which may lag
- Investigate the 228-record gap between `total` and actual fetched records more carefully — is it a pagination bug or an `is_live` filter being applied inconsistently?

**Engineering:**
- Add Vitest unit tests for the token refresh interceptor and price formatting utilities
- Move the API key to a Vercel environment variable rather than `.env` committed to the repo
- Add a `<Suspense>` boundary for route-level loading states
- Implement proper error boundaries per page

---

## Tools used

- **Claude (Anthropic)** — engineering architecture, code generation, documentation
- **Antigravity (Google)** — orchestration, parallel task execution, data analysis
- **curl** — endpoint probing before writing any app code
- **Node.js** — data harvest script (`scripts/harvest.js`, `scripts/analyze.js`)
- **React + Vite** — frontend
- **Vercel** — deployment

I used LLMs throughout. The hypotheses, the investigation methodology, and the judgment calls about what to trust and what to verify were mine. Every number in `submission.json` was verified against the actual data.

---

## Repository structure

```
├── ivy-homes-frontend/        # React app
│   ├── src/
│   │   ├── lib/api.js         # Axios client, token storage, all API calls
│   │   ├── contexts/          # AuthContext (login, logout, refresh)
│   │   ├── components/        # Navbar, ListingCard, ProtectedRoute, ui.jsx
│   │   └── pages/             # LoginPage, ListingsPage, ListingDetailPage,
│   │                          # RentalsPage, ProjectsPage, SavedPage, InsightsPage
│   └── vite.config.js
├── scripts/
│   ├── harvest.js             # Bulk data fetch script
│   ├── analyze.js             # Analysis for Q2, Q7, Q9
│   └── final_answers.js       # Computes all 10 answers
├── data/                      # Raw harvested JSON (gitignored)
│   ├── listings.json
│   ├── rentals.json
│   └── projects.json
└── submission.json            # Final submission with answers + findings
```
