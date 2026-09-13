import { useQuery } from '@tanstack/react-query'
import {
  BarChart3, TrendingUp, Home, Building2, MapPin,
  AlertTriangle, Info, BedDouble
} from 'lucide-react'
import { listingsApi, rentalsApi, projectsApi } from '../lib/api'
import { LoadingScreen, StatCard, PageHeader } from '../components/ui'

// Fetch ALL listings by paginating (for local aggregation)
async function fetchAll(apiFn, label) {
  let offset = 0
  const limit = 50
  let all = []
  while (true) {
    const data = await apiFn({ limit, offset })
    all = all.concat(data.results || [])
    if (!data.has_more) break
    offset += limit
  }
  return all
}

function median(arr) {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

function DiscoveryCard({ icon: Icon, title, description, variant = 'blue' }) {
  const variants = {
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50',
    green: 'border-green-200 bg-green-50',
  }
  const iconColors = {
    blue: 'text-blue-600', amber: 'text-amber-600', red: 'text-red-600', green: 'text-green-600',
  }
  return (
    <div className={`rounded-xl border p-4 ${variants[variant]}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors[variant]}`} />
        <div>
          <p className="font-semibold text-slate-800 text-sm">{title}</p>
          <p className="text-slate-600 text-xs mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}

function BarRow({ label, value, max, count }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-slate-600 w-28 capitalize shrink-0 truncate">{label}</p>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-500 w-12 text-right">{count}</p>
    </div>
  )
}

export default function InsightsPage() {
  // Fetch all listings for client-side aggregation
  // This is necessary because /v1/analytics/summary returns 404
  const { data: allListings, isLoading: loadingListings } = useQuery({
    queryKey: ['all-listings'],
    queryFn: () => fetchAll(listingsApi.getAll, 'listings'),
    staleTime: 10 * 60 * 1000, // 10 min cache
  })

  const { data: allRentals, isLoading: loadingRentals } = useQuery({
    queryKey: ['all-rentals'],
    queryFn: () => fetchAll(rentalsApi.getAll, 'rentals'),
    staleTime: 10 * 60 * 1000,
  })

  const { data: allProjects, isLoading: loadingProjects } = useQuery({
    queryKey: ['all-projects'],
    queryFn: () => fetchAll(projectsApi.getAll, 'projects'),
    staleTime: 10 * 60 * 1000,
  })

  const isLoading = loadingListings || loadingRentals || loadingProjects

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader title="Market Insights" description="Aggregating data from all listings..." />
        <LoadingScreen message="Fetching all data for analysis (this may take ~30 seconds)..." />
      </div>
    )
  }

  // ── Compute analytics ────────────────────────────────────────────────────────
  const liveListings = (allListings || []).filter((l) => l.is_live)
  const prices = liveListings.map((l) => l.price).filter(Boolean)
  const areas = liveListings.map((l) => l.carpet_area).filter(Boolean)
  const ppsqft = liveListings
    .filter((l) => l.price && l.carpet_area > 0)
    .map((l) => l.price / l.carpet_area)

  const medianPrice = median(prices)
  const medianPpsqft = median(ppsqft)

  // By locality
  const byLocality = groupBy(liveListings, 'locality')
  const localityStats = Object.entries(byLocality)
    .map(([loc, items]) => ({
      locality: loc,
      count: items.length,
      medianPrice: median(items.map((l) => l.price).filter(Boolean)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  const maxLocalityCount = Math.max(...localityStats.map((l) => l.count))

  // By BHK
  const byBhk = groupBy(liveListings, 'bedroom')
  const bhkStats = Object.entries(byBhk)
    .map(([bhk, items]) => ({ bhk: parseInt(bhk), count: items.length }))
    .sort((a, b) => a.bhk - b.bhk)
  const maxBhkCount = Math.max(...bhkStats.map((b) => b.count))

  // Rental insights
  const rentalPrices = (allRentals || []).map((r) => r.price).filter(Boolean)
  const medianRent = median(rentalPrices)

  // Duplicate detection (data quality)
  const contactCount = {}
  for (const l of allListings || []) {
    const c = l.posted_by_contact
    if (c) contactCount[c] = (contactCount[c] || 0) + 1
  }
  const highVolumeContacts = Object.values(contactCount).filter((c) => c >= 10).length

  // Projects insight
  const costliestProject = (allProjects || []).reduce(
    (max, p) => (p.price_max > (max?.price_max || 0) ? p : max), null
  )

  // Listings posted in last 7 days from reference
  const REFERENCE = new Date('2026-09-10T00:00:00+05:30')
  const windowStart = new Date(REFERENCE.getTime() - 7 * 24 * 3600 * 1000)
  const recentListings = (allListings || []).filter((l) => {
    if (!l.posted_at) return false
    const d = new Date(l.posted_at)
    return d >= windowStart && d < REFERENCE
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Market Insights"
        description="Live analytics computed from the full Pune dataset"
      />

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Listings"
          value={(allListings?.length || 0).toLocaleString()}
          sub={`${liveListings.length.toLocaleString()} active`}
          icon={Home}
          color="blue"
        />
        <StatCard
          label="Median Price"
          value={medianPrice >= 10000000
            ? `₹${(medianPrice / 10000000).toFixed(2)} Cr`
            : `₹${(medianPrice / 100000).toFixed(0)} L`}
          sub="Active sale listings"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Median ₹/sq.ft"
          value={`₹${Math.round(medianPpsqft).toLocaleString('en-IN')}`}
          sub="Carpet area basis"
          icon={BarChart3}
          color="purple"
        />
        <StatCard
          label="Total Rentals"
          value={(allRentals?.length || 0).toLocaleString()}
          sub={`Median ₹${medianRent.toLocaleString('en-IN')}/mo`}
          icon={BedDouble}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* By locality */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            Listings by Locality (Top 10)
          </h2>
          <div className="flex flex-col gap-2.5">
            {localityStats.map((s) => (
              <BarRow
                key={s.locality}
                label={s.locality}
                value={s.count}
                max={maxLocalityCount}
                count={s.count}
              />
            ))}
          </div>
        </div>

        {/* By BHK */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-blue-500" />
            Listings by Bedroom Count
          </h2>
          <div className="flex flex-col gap-2.5">
            {bhkStats.map((s) => (
              <BarRow
                key={s.bhk}
                label={`${s.bhk} BHK`}
                value={s.count}
                max={maxBhkCount}
                count={s.count}
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Recent listings (last 7 days before Sep 10): <strong>{recentListings.length}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Data Discoveries */}
      <div className="mb-6">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Data Discoveries
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DiscoveryCard
            icon={AlertTriangle}
            variant="amber"
            title="API Key Header — Not Query Parameter"
            description="The documentation says to pass the API key as ?api_key=... but the API actually requires X-API-Key request header. Query parameter returns a 401 with a helpful error message."
          />
          <DiscoveryCard
            icon={AlertTriangle}
            variant="amber"
            title="Token Expires in 15 min, Not 24h"
            description="Documentation claims tokens are valid for 86400 seconds (24 hours). The real expires_in is 900 seconds (15 minutes). A refresh token and /auth/refresh endpoint do exist."
          />
          <DiscoveryCard
            icon={AlertTriangle}
            variant="red"
            title="Project Prices — Wrong Unit"
            description="Documentation claims price_min and price_max are in rupees. Actual values like 80.0 and 3.22 are clearly in crores. The app displays these as Cr values."
          />
          <DiscoveryCard
            icon={Info}
            variant="blue"
            title="Analytics Endpoint Does Not Exist"
            description="/v1/analytics/summary returns 404. This Insights screen computes equivalent aggregates from the raw listings, rentals and projects data instead."
          />
          <DiscoveryCard
            icon={AlertTriangle}
            variant="amber"
            title="Pagination Uses offset, Not page"
            description="Documentation says to use page=1 (1-indexed). The real API uses offset=0 and returns limit, offset, has_more — not page, page_size, total."
          />
          <DiscoveryCard
            icon={Info}
            variant="blue"
            title={`Contacts with ≥10 Listings: ${highVolumeContacts}`}
            description={`${highVolumeContacts} unique contact numbers are associated with 10 or more listings each. This may indicate bulk-posted or fraudulent listings worth investigating.`}
          />
          {costliestProject && (
            <DiscoveryCard
              icon={TrendingUp}
              variant="green"
              title={`Costliest Project: ${costliestProject.apartment_name}`}
              description={`${costliestProject.project_id} in ${costliestProject.locality} has the highest price_max of ${costliestProject.price_max} Cr.`}
            />
          )}
          <DiscoveryCard
            icon={AlertTriangle}
            variant="amber"
            title="Single Listing Path is /v1/listings/{id}"
            description="Documentation says GET /v1/listing/{id} (singular). The actual path is GET /v1/listings/{id} (plural). The singular path returns 404."
          />
        </div>
      </div>
    </div>
  )
}
