/**
 * Ivy Homes — Data Harvest Script
 * --------------------------------
 * Pulls ALL listings, rentals, and projects from the API.
 * Saves raw JSON to ./data/ for offline analysis.
 *
 * Usage:
 *   node scripts/harvest.js
 *
 * Requires Node 18+ (built-in fetch) or Node <18 with node-fetch.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = "https://solve.ivy.homes";
const API_KEY = "IVY26-58EF32DDF2FE";
const EMAIL = "demo1@ivy.homes";
const PASSWORD = "e5ccaf155c";
const ASSIGNED_LOCALITY = "hinjewadi";
const REFERENCE = new Date("2026-09-10T00:00:00+05:30");
const LIMIT = 50; // real API max
const DATA_DIR = path.join(__dirname, "../data");

// ── Helpers ───────────────────────────────────────────────────────────────────
function apiHeaders(token) {
  const headers = { "X-API-Key": API_KEY };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function login() {
  console.log("🔐 Logging in...");
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Login failed: " + JSON.stringify(data));
  console.log(`✅ Logged in. Token expires in ${data.expires_in}s (${data.expires_in / 60} min)`);
  return data.access_token;
}

async function fetchAllPages(endpoint, token, extraParams = {}) {
  let offset = 0;
  let total = null;
  const allResults = [];

  while (true) {
    const params = new URLSearchParams({ limit: LIMIT, offset, ...extraParams });
    const url = `${BASE_URL}${endpoint}?${params}`;
    const res = await fetch(url, { headers: apiHeaders(token) });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`${res.status} on ${url}: ${JSON.stringify(err)}`);
    }

    const data = await res.json();

    // Capture total on first page
    if (total === null) {
      total = data.total;
      console.log(`  → ${endpoint}: total=${total}, fetching with limit=${LIMIT}`);
    }

    allResults.push(...(data.results || []));
    process.stdout.write(`\r  → fetched ${allResults.length}/${total}`);

    if (!data.has_more) break;
    offset += LIMIT;

    // Small polite delay — well within 1200 req/min limit
    await sleep(50);
  }

  console.log(`\n  ✅ ${endpoint}: collected ${allResults.length} records`);
  return allResults;
}

function saveJSON(filename, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`💾 Saved ${filepath} (${data.length ?? "object"} records)`);
}

// ── Analysis helpers ──────────────────────────────────────────────────────────
function analyze(listings, rentals, projects) {
  console.log("\n\n══════════════════════════════════════════");
  console.log("  ANALYSIS — 10 QUESTIONS");
  console.log("══════════════════════════════════════════\n");

  // Q1: total_listing_records
  const q1 = listings.length;
  console.log(`Q1  total_listing_records     = ${q1}`);

  // Q2: unique_properties — distinct listing_ids (check for dupes)
  const uniqueIds = new Set(listings.map((l) => l.listing_id));
  const q2_byId = uniqueIds.size;
  // Also group by (apartment_name, locality, bedroom, price, carpet_area) as a proxy
  const propKey = (l) =>
    `${l.apartment_name}|${l.locality}|${l.bedroom}|${l.price}|${l.carpet_area}`;
  const uniqueProps = new Set(listings.map(propKey));
  console.log(`Q2  unique_properties`);
  console.log(`      by listing_id:           ${q2_byId}`);
  console.log(`      by property fingerprint: ${uniqueProps.size}`);
  console.log(`      → DUPLICATE listing_ids: ${q1 - q2_byId}`);

  // Find actual duplicate listing_ids
  const idCount = {};
  for (const l of listings) idCount[l.listing_id] = (idCount[l.listing_id] || 0) + 1;
  const dupIds = Object.entries(idCount)
    .filter(([, c]) => c > 1)
    .map(([id]) => id);
  if (dupIds.length > 0) console.log(`      duplicate listing_ids:`, dupIds);

  // Q3: active_listings
  const active = listings.filter((l) => l.is_live === true);
  const q3 = active.length;
  console.log(`Q3  active_listings (is_live=true) = ${q3}`);

  // Q4: corrupt_listing_ids — listings describing impossible properties
  // Impossibilities: negative area, 0 bedrooms on apartment, price=0,
  // carpet > super_built_up, floor > total_floors, etc.
  const corrupt = listings.filter((l) => {
    const reasons = [];
    if (l.carpet_area <= 0) reasons.push("carpet_area<=0");
    if (l.price <= 0) reasons.push("price<=0");
    if (l.bedroom < 0) reasons.push("bedroom<0");
    if (l.bathroom < 0) reasons.push("bathroom<0");
    if (l.floor < 0) reasons.push("floor<0");
    if (l.total_floors < 0) reasons.push("total_floors<0");
    if (l.floor > l.total_floors && l.floor > 0 && l.total_floors > 0)
      reasons.push(`floor(${l.floor})>total_floors(${l.total_floors})`);
    if (l.carpet_area > l.super_built_up_area && l.super_built_up_area > 0)
      reasons.push(`carpet(${l.carpet_area})>super_builtup(${l.super_built_up_area})`);
    if (l.bedroom === 0 && l.property_type === "apartment")
      reasons.push("0-bedroom apartment");
    if (reasons.length > 0) {
      l._corrupt_reasons = reasons;
      return true;
    }
    return false;
  });
  const q4 = corrupt.map((l) => l.listing_id).sort();
  console.log(`Q4  corrupt_listing_ids (${q4.length}):`);
  for (const l of corrupt) {
    console.log(`    ${l.listing_id}: ${l._corrupt_reasons.join(", ")}`);
  }

  // Q5: total_monthly_rent for assigned locality (Hinjewadi)
  const hinjRentals = rentals.filter(
    (r) => r.locality?.toLowerCase() === ASSIGNED_LOCALITY
  );
  const q5 = hinjRentals.reduce((sum, r) => sum + (r.price || 0), 0);
  console.log(`Q5  total_monthly_rent (${ASSIGNED_LOCALITY}, ${hinjRentals.length} records) = ₹${q5.toLocaleString()}`);

  // Q6: avg_price_per_sqft for live 2BHK, excl corrupt and fake
  // (fake_listing_ids filled in after Q9 analysis — placeholder for now)
  const corruptSet = new Set(q4);
  const live2bhk = listings.filter(
    (l) =>
      l.is_live === true &&
      l.bedroom === 2 &&
      !corruptSet.has(l.listing_id) &&
      l.carpet_area > 0
  );
  const ppsqft = live2bhk.map((l) => l.price / l.carpet_area);
  const q6 = ppsqft.length > 0
    ? (ppsqft.reduce((a, b) => a + b, 0) / ppsqft.length).toFixed(2)
    : 0;
  console.log(`Q6  avg_price_per_sqft_2bhk (${live2bhk.length} listings, excl corrupt) = ₹${q6}`);

  // Q7: costliest_project (highest price_max)
  // Note: price_max values look wrong (e.g., 3.22) — investigate units
  let costliest = null;
  for (const p of projects) {
    if (!costliest || p.price_max > costliest.price_max) costliest = p;
  }
  console.log(`Q7  costliest_project = ${costliest?.project_id} (price_max=${costliest?.price_max})`);
  console.log(`    ⚠️  price_max units unclear — sample values:`);
  projects.slice(0, 5).forEach((p) =>
    console.log(`    ${p.project_id}: price_min=${p.price_min}, price_max=${p.price_max}`)
  );

  // Q8: listings_last_7_days
  // REFERENCE = 2026-09-10T00:00:00+05:30, window = [REFERENCE-7d, REFERENCE)
  const windowStart = new Date(REFERENCE.getTime() - 7 * 24 * 60 * 60 * 1000);
  const inWindow = listings.filter((l) => {
    if (!l.posted_at) return false;
    const posted = new Date(l.posted_at);
    return posted >= windowStart && posted < REFERENCE;
  });
  const q8 = inWindow.length;
  console.log(`Q8  listings_last_7_days = ${q8}`);
  console.log(`    window: [${windowStart.toISOString()}, ${REFERENCE.toISOString()})`);

  // Q9: fake_listing_ids — seller-written content that may be fraudulent
  // Signals: duplicate phone numbers across many listings, impossible prices,
  // repeated descriptions, price far below/above market for locality+bhk
  console.log(`Q9  fake_listing_ids — statistical detection:`);

  // Signal 1: Duplicate contact numbers (one "agent" with many listings)
  const contactCount = {};
  for (const l of listings) {
    const c = l.posted_by_contact;
    if (c) contactCount[c] = (contactCount[c] || []).concat(l.listing_id);
  }
  const suspectContacts = Object.entries(contactCount)
    .filter(([, ids]) => ids.length >= 10)
    .sort((a, b) => b[1].length - a[1].length);
  console.log(`    contacts with ≥10 listings: ${suspectContacts.length}`);
  suspectContacts.slice(0, 5).forEach(([c, ids]) =>
    console.log(`    ${c}: ${ids.length} listings`)
  );

  // Signal 2: Price outliers per locality+bhk
  const groups = {};
  for (const l of listings) {
    if (!l.is_live || corruptSet.has(l.listing_id)) continue;
    const key = `${l.locality}|${l.bedroom}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(l.price);
  }
  let priceOutliers = [];
  for (const l of listings) {
    if (!l.is_live || corruptSet.has(l.listing_id)) continue;
    const key = `${l.locality}|${l.bedroom}`;
    const prices = groups[key];
    if (!prices || prices.length < 5) continue;
    prices.sort((a, b) => a - b);
    const q1 = prices[Math.floor(prices.length * 0.25)];
    const q3 = prices[Math.floor(prices.length * 0.75)];
    const iqr = q3 - q1;
    const lo = q1 - 3 * iqr;
    const hi = q3 + 3 * iqr;
    if (l.price < lo || l.price > hi) priceOutliers.push(l.listing_id);
  }
  console.log(`    price outliers (3×IQR): ${priceOutliers.length}`);

  // Q10: projects_with_wrong_listing_count
  // Build count of live listings per project from the listings data
  const projectListingCounts = {};
  for (const l of listings) {
    if (l.project_id) {
      projectListingCounts[l.project_id] =
        (projectListingCounts[l.project_id] || 0) + 1;
    }
  }
  let wrongCount = 0;
  const wrongProjects = [];
  for (const p of projects) {
    const actual = projectListingCounts[p.project_id] || 0;
    const reported = p.total_listings;
    if (reported !== actual) {
      wrongCount++;
      wrongProjects.push({
        project_id: p.project_id,
        reported,
        actual,
        diff: reported - actual,
      });
    }
  }
  console.log(`Q10 projects_with_wrong_listing_count = ${wrongCount}`);
  if (wrongProjects.length > 0) {
    console.log(`    Sample wrong projects (reported vs actual):`);
    wrongProjects.slice(0, 10).forEach((p) =>
      console.log(`    ${p.project_id}: reported=${p.reported}, actual=${p.actual}`)
    );
  }

  console.log("\n══════════════════════════════════════════\n");

  return {
    q1, q2_byId, q3, q4, q5: q5, q6: parseFloat(q6), q8,
    costliest: costliest ? { project_id: costliest.project_id, price_max_inr: costliest.price_max } : null,
    wrongCount, wrongProjects, suspectContacts, priceOutliers, dupIds,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🏠 Ivy Homes Data Harvest\n");

  const token = await login();

  console.log("\n📦 Fetching all listings...");
  const listings = await fetchAllPages("/v1/listings", token);

  console.log("\n🏠 Fetching all rentals...");
  const rentals = await fetchAllPages("/v1/rentals", token);

  console.log("\n🏗️  Fetching all projects...");
  const projects = await fetchAllPages("/v1/projects", token);

  // Save raw data
  saveJSON("listings.json", listings);
  saveJSON("rentals.json", rentals);
  saveJSON("projects.json", projects);

  // Run analysis
  const results = analyze(listings, rentals, projects);

  // Save analysis summary
  const summary = {
    harvested_at: new Date().toISOString(),
    total_listings: listings.length,
    total_rentals: rentals.length,
    total_projects: projects.length,
    analysis: results,
  };
  saveJSON("summary.json", [summary]);

  console.log("\n✅ Harvest complete! Check ./data/ for raw JSON files.");
  console.log("   Run deeper analysis on data/listings.json, data/rentals.json, data/projects.json");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
