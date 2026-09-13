/**
 * Deep Analysis Script — answers ambiguous questions
 * Q2: unique properties (what counts as "distinct"?)
 * Q7: costliest project (what unit is price_max?)
 * Q9: fake listing IDs (needs careful definition)
 * Q8: timezone correction for IST reference
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../data')

const listings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listings.json'), 'utf-8'))
const rentals = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rentals.json'), 'utf-8'))
const projects = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'projects.json'), 'utf-8'))

console.log('=== DEEP ANALYSIS ===\n')

// ─── Q1: Confirm total ────────────────────────────────────────────────────────
console.log(`Q1 total_listing_records = ${listings.length}`)
// NOTE: API total says 3572 but we got 3800 records — this is a pagination discrepancy!
// The 'total' field may not be accurate — investigate
const uniqueIds = new Set(listings.map(l => l.listing_id))
console.log(`   unique listing_ids = ${uniqueIds.size}`)
console.log(`   ⚠️  API reported total=3572 but we fetched ${listings.length} records`)

// ─── Q2: Unique properties ────────────────────────────────────────────────────
console.log('\n--- Q2: Unique properties ---')
// Strategy 1: by listing_id (each is unique = all 3800)
console.log(`By listing_id: ${uniqueIds.size}`)

// Strategy 2: by listing_url (different websites may list same physical property)
const byUrl = new Set(listings.map(l => l.listing_url))
console.log(`By listing_url: ${byUrl.size}`)

// Strategy 3: by (lat, lng) rounded to 5 decimal places
const byLatLng = new Set(listings.map(l => `${l.latitude?.toFixed(5)},${l.longitude?.toFixed(5)}`))
console.log(`By lat/lng (5dp): ${byLatLng.size}`)

// Strategy 4: by (lat, lng) rounded to 4 decimal places (looser)
const byLatLng4 = new Set(listings.map(l => `${l.latitude?.toFixed(4)},${l.longitude?.toFixed(4)}`))
console.log(`By lat/lng (4dp): ${byLatLng4.size}`)

// Strategy 5: same apartment_name + locality + bedroom + bathroom + floor
const byPropKey = new Set(listings.map(l =>
  `${l.apartment_name}|${l.locality}|${l.bedroom}|${l.bathroom}|${l.floor}|${l.carpet_area}`
))
console.log(`By apartment+locality+bedroom+bathroom+floor+area: ${byPropKey.size}`)

// Find listings with duplicate lat/lng (same physical property?)
const latLngGroups = {}
for (const l of listings) {
  const key = `${l.latitude?.toFixed(5)},${l.longitude?.toFixed(5)}`
  if (!latLngGroups[key]) latLngGroups[key] = []
  latLngGroups[key].push(l.listing_id)
}
const dupLatLng = Object.entries(latLngGroups).filter(([, ids]) => ids.length > 1)
console.log(`Listings sharing exact lat/lng: ${dupLatLng.length} groups`)
dupLatLng.slice(0, 3).forEach(([key, ids]) => console.log(`  ${key}: ${ids.join(', ')}`))

// ─── Q7: Project prices — what unit? ─────────────────────────────────────────
console.log('\n--- Q7: Project price unit investigation ---')
// price_min=80, price_max=3.22 for P30001 — but min > max! That's impossible if same unit.
// Hypothesis: price_min is in LAKHS, price_max is in CRORES? Or vice versa?
// Let's check: if price_min=80 lakhs = 80,00,000 and price_max=3.22 crores = 3,22,00,000
// That would make min < max ✓ (80L < 3.22Cr)
// But wait: 80 lakhs = 0.8 crores which is LESS than 3.22 crores ✓

// Let's check more examples:
projects.slice(0, 10).forEach(p => {
  const minAsLakhs = p.price_min * 100000
  const maxAsCrores = p.price_max * 10000000
  const minAsCrores = p.price_min * 10000000
  const maxAsLakhs = p.price_max * 100000
  console.log(`${p.project_id}: price_min=${p.price_min}, price_max=${p.price_max}`)
  console.log(`  if min=lakhs,max=crores: ₹${(minAsLakhs/100000).toFixed(1)}L to ₹${(maxAsCrores/10000000).toFixed(2)}Cr`)
  console.log(`  if both=lakhs: ₹${p.price_min}L to ₹${p.price_max}L`)  
  console.log(`  if both=crores: ₹${p.price_min}Cr to ₹${p.price_max}Cr`)
})

// Cross-check with listings: find listings for a project and compare prices
const p30001Listings = listings.filter(l => l.project_id === 'P30001')
console.log(`\nP30001 listings (${p30001Listings.length}):`)
p30001Listings.forEach(l => console.log(`  ${l.listing_id}: price=₹${l.price}, area=${l.carpet_area} sqft`))
console.log(`P30001 project: price_min=${projects.find(p=>p.project_id==='P30001')?.price_min}, price_max=${projects.find(p=>p.project_id==='P30001')?.price_max}`)

// ─── Q8: Last 7 days — timezone careful ──────────────────────────────────────
console.log('\n--- Q8: Listings in last 7 days (timezone) ---')
// REFERENCE = 2026-09-10T00:00:00+05:30
// In UTC: 2026-09-09T18:30:00Z
// Window: [2026-09-03T00:00:00+05:30, 2026-09-10T00:00:00+05:30)
// In UTC: [2026-09-02T18:30:00Z, 2026-09-09T18:30:00Z)
const refUTC = new Date('2026-09-09T18:30:00Z')
const startUTC = new Date('2026-09-02T18:30:00Z')
const inWindow = listings.filter(l => {
  if (!l.posted_at) return false
  const d = new Date(l.posted_at)
  return d >= startUTC && d < refUTC
})
console.log(`In [Sep 3 00:00 IST, Sep 10 00:00 IST): ${inWindow.length}`)
// API timestamps: check their format
console.log('Sample posted_at values:', listings.slice(0, 5).map(l => l.posted_at))

// ─── Q9: Fake listings — deeper investigation ─────────────────────────────────
console.log('\n--- Q9: Fake listings investigation ---')

// Method 1: Same contact with massive number of listings (bulk fraud)
const contactListings = {}
for (const l of listings) {
  const c = l.posted_by_contact
  if (c) {
    if (!contactListings[c]) contactListings[c] = []
    contactListings[c].push(l)
  }
}
const suspectContacts = Object.entries(contactListings)
  .filter(([, ls]) => ls.length >= 20)
  .sort((a, b) => b[1].length - a[1].length)
console.log(`Contacts with ≥20 listings (strong fraud signal): ${suspectContacts.length}`)
suspectContacts.forEach(([c, ls]) => {
  console.log(`  ${c}: ${ls.length} listings, localities: ${[...new Set(ls.map(l=>l.locality))].slice(0,3).join(', ')}`)
})

// Method 2: Check if same property_id exists multiple times
// Method 3: Listings with price=0 (already found in corrupt)

// Method 4: Listings where description is identical (copy-paste fraud)
const descCount = {}
for (const l of listings) {
  const d = l.description
  if (d) descCount[d] = (descCount[d] || 0) + 1
}
const dupDescs = Object.entries(descCount).filter(([, c]) => c > 1).sort((a,b) => b[1]-a[1])
console.log(`\nDuplicate descriptions: ${dupDescs.length} groups`)
dupDescs.slice(0, 5).forEach(([desc, count]) => console.log(`  (${count}×) "${desc.substring(0,60)}..."`))

// Total fake IDs from high-volume contacts
const allFakeIds = suspectContacts.flatMap(([, ls]) => ls.map(l => l.listing_id))
console.log(`\nTotal listings from ≥20-listing contacts: ${allFakeIds.length}`)

// ─── Q5: Rentals in Hinjewadi ─────────────────────────────────────────────────
console.log('\n--- Q5: Hinjewadi rentals ---')
const hinjRentals = rentals.filter(r => r.locality?.toLowerCase() === 'hinjewadi')
console.log(`Hinjewadi rental records: ${hinjRentals.length}`)
const totalRent = hinjRentals.reduce((sum, r) => sum + (r.price || 0), 0)
console.log(`Total monthly rent: ₹${totalRent.toLocaleString('en-IN')}`)
console.log(`Sample rentals:`, hinjRentals.slice(0,3).map(r => ({id: r.listing_id, price: r.price})))

// ─── Q10: projects_with_wrong_listing_count ───────────────────────────────────
console.log('\n--- Q10: Projects with wrong listing count ---')
// Count ACTUAL listings per project from the listings dataset
const projectCounts = {}
for (const l of listings) {
  if (l.project_id) projectCounts[l.project_id] = (projectCounts[l.project_id] || 0) + 1
}
let wrong = 0
for (const p of projects) {
  const actual = projectCounts[p.project_id] || 0
  if (p.total_listings !== actual) wrong++
}
console.log(`Projects with wrong total_listings: ${wrong} / ${projects.length}`)

console.log('\n=== DONE ===')
