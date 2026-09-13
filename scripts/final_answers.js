/**
 * Final analysis to confirm:
 * - Q2 unique properties (by lat/lng)
 * - Q7 project price unit (lakhs vs crores)
 * - Q9 fake listing IDs (define the exact set)
 * - Total field discrepancy
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../data')

const listings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listings.json'), 'utf-8'))
const projects = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'), 'utf-8'))
const rentals = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rentals.json'), 'utf-8'))

// ─── CONFIRM Q7: Price unit ────────────────────────────────────────────────────
console.log('=== Q7: PRICE UNIT CONFIRMATION ===')
// P30001: price_min=80, price_max=3.22
// P30001 actual listing prices: 72.6L, 79.1L, 91.6L, 89.4L
// If price_min=80 lakhs = ₹80,00,000 → matches range ✓
// If price_max=3.22 crores = ₹3,22,00,000 → max listing is ₹91.6L which is < 3.22Cr, so 3.22Cr is the upper range ✓
// BUT WAIT: 91.6L > 80L but 91.6L = 0.916Cr < 3.22Cr ✓
// CONCLUSION: price_min is in LAKHS, price_max is in CRORES

// Let's verify with more projects
for (const p of projects.slice(0, 5)) {
  const pListings = listings.filter(l => l.project_id === p.project_id)
  if (pListings.length === 0) continue
  const prices = pListings.map(l => l.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const minInLakhs = minPrice / 100000
  const maxInCrores = maxPrice / 10000000
  console.log(`${p.project_id}: doc_min=${p.price_min}, doc_max=${p.price_max}`)
  console.log(`  actual listing prices: min=₹${(minPrice/100000).toFixed(1)}L, max=₹${(maxPrice/100000).toFixed(1)}L`)
  console.log(`  if doc_min=lakhs: ₹${p.price_min}L | actual min: ₹${minInLakhs.toFixed(1)}L → ratio: ${(p.price_min/minInLakhs).toFixed(2)}`)
  console.log(`  if doc_max=crores: ₹${p.price_max}Cr | actual max: ₹${(maxPrice/10000000).toFixed(2)}Cr`)
}

// Costliest project by price_max (in crores)
const costliest = projects.reduce((max, p) => p.price_max > (max?.price_max || 0) ? p : max, null)
console.log(`\nCostliest project: ${costliest.project_id} - ${costliest.apartment_name}`)
console.log(`price_max = ${costliest.price_max} (crores) = ₹${costliest.price_max} Cr = ₹${(costliest.price_max * 10000000).toLocaleString('en-IN')}`)

// ─── CONFIRM Q2: Unique properties ────────────────────────────────────────────
console.log('\n=== Q2: UNIQUE PROPERTIES ===')
// The assignment says "distinct properties" — same physical property listed on multiple websites
// Best proxy: exact same lat/lng = same property
const latLngMap = {}
for (const l of listings) {
  const key = `${l.latitude},${l.longitude}`
  if (!latLngMap[key]) latLngMap[key] = []
  latLngMap[key].push(l.listing_id)
}
const uniqueProps = Object.keys(latLngMap).length
const dupGroups = Object.values(latLngMap).filter(ids => ids.length > 1)
console.log(`Unique lat/lng positions: ${uniqueProps}`)
console.log(`Duplicate position groups: ${dupGroups.length}`)
console.log(`Total extra listings (duplicates): ${listings.length - uniqueProps}`)

// Show some duplicate examples — are they the same property on different sites?
console.log('\nSample duplicate lat/lng groups:')
dupGroups.slice(0, 5).forEach(ids => {
  const these = ids.map(id => listings.find(l => l.listing_id === id))
  console.log(`  Same location (${these[0]?.latitude}, ${these[0]?.longitude}):`)
  these.forEach(l => console.log(`    ${l.listing_id}: ${l.apartment_name}, ${l.bedroom}BHK, ₹${(l.price/100000).toFixed(1)}L, ${l.website}`))
})

// ─── Q9: Define fake listings ─────────────────────────────────────────────────
console.log('\n=== Q9: FAKE LISTINGS DEFINITION ===')
// "Not real — exist to generate enquiries"
// The strongest signal is: contacts with an abnormally high number of listings
// A real agent handles maybe 5-15 properties. 20+ in multiple localities = fake
const contactListings = {}
for (const l of listings) {
  const c = l.posted_by_contact
  if (c) {
    if (!contactListings[c]) contactListings[c] = []
    contactListings[c].push(l.listing_id)
  }
}

// Count distribution
const dist = {}
for (const [, ids] of Object.entries(contactListings)) {
  const bucket = ids.length >= 20 ? '20+' : ids.length >= 10 ? '10-19' : ids.length >= 5 ? '5-9' : '1-4'
  dist[bucket] = (dist[bucket] || 0) + 1
}
console.log('Contact volume distribution:', dist)

// The fake listing IDs are those posted by contacts with 20+ listings
const fakeListingIds = Object.entries(contactListings)
  .filter(([, ids]) => ids.length >= 20)
  .flatMap(([, ids]) => ids)
  .sort()

console.log(`\nFake listing IDs (contact with 20+ listings): ${fakeListingIds.length}`)
console.log('First 10:', fakeListingIds.slice(0, 10))

// ─── Q8: Confirm timezone window ──────────────────────────────────────────────
console.log('\n=== Q8: TIMEZONE CONFIRMATION ===')
// REFERENCE = 2026-09-10T00:00:00+05:30 = 2026-09-09T18:30:00Z
// [REFERENCE - 7 days, REFERENCE) = [2026-09-03T00:00:00+05:30, 2026-09-10T00:00:00+05:30)
// In UTC: [2026-09-02T18:30:00Z, 2026-09-09T18:30:00Z)
const refUTC = new Date('2026-09-09T18:30:00Z')
const startUTC = new Date('2026-09-02T18:30:00Z')
const inWindow = listings.filter(l => {
  if (!l.posted_at) return false
  const d = new Date(l.posted_at)
  return d >= startUTC && d < refUTC
})
console.log(`Q8 = ${inWindow.length}`)

// ─── TOTAL DISCREPANCY ────────────────────────────────────────────────────────
console.log('\n=== TOTAL DISCREPANCY ===')
console.log(`API says total=3572, we fetched ${listings.length}`)
console.log(`Difference: ${listings.length - 3572}`)
console.log('This is a significant finding — the total field understates the actual record count')

// Active listings
const active = listings.filter(l => l.is_live === true)
console.log(`\nActive (is_live=true): ${active.length}`)

// ─── FINAL ANSWERS ────────────────────────────────────────────────────────────
console.log('\n=== FINAL ANSWERS ===')
const corrupt_ids = [
  '100-3000174','100-3000236','100-3000608','100-3001067','100-3001543',
  '100-3001548','100-3002344','100-3003022','DWE-3000235','DWE-3000299',
  'DWE-3001307','DWE-3001395','DWE-3001849','DWE-3003186','MAG-3001263',
  'MAG-3001979','MAG-3001986','MAG-3002780','MAG-3000932','SQU-3000419',
  'SQU-3000576','SQU-3000591','SQU-3001698','SQU-3002720','ZER-3000380',
  'ZER-3002377','ZER-3002902'
].sort()

const corruptSet = new Set(corrupt_ids)
const fakeSet = new Set(fakeListingIds)

// Q6: avg price/sqft for live 2BHK excl corrupt and fake
const live2bhk = listings.filter(l =>
  l.is_live === true &&
  l.bedroom === 2 &&
  !corruptSet.has(l.listing_id) &&
  !fakeSet.has(l.listing_id) &&
  l.carpet_area > 0
)
const ppsqft = live2bhk.map(l => l.price / l.carpet_area)
const avg = ppsqft.reduce((a,b) => a+b, 0) / ppsqft.length

// Hinjewadi rent
const hinjRentals = rentals.filter(r => r.locality?.toLowerCase() === 'hinjewadi')
const totalRent = hinjRentals.reduce((sum, r) => sum + (r.price || 0), 0)

console.log(JSON.stringify({
  total_listing_records: listings.length,
  unique_properties: uniqueProps,
  active_listings: active.length,
  corrupt_listing_ids: corrupt_ids,
  total_monthly_rent: totalRent,
  avg_price_per_sqft_2bhk: parseFloat(avg.toFixed(2)),
  costliest_project: {
    project_id: costliest.project_id,
    price_max_inr: costliest.price_max * 10000000
  },
  listings_last_7_days: inWindow.length,
  fake_listing_ids: fakeListingIds,
  projects_with_wrong_listing_count: 317
}, null, 2))
