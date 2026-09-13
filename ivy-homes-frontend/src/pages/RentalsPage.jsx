import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, BedDouble, Bath, Maximize2, Phone, ExternalLink } from 'lucide-react'
import { rentalsApi, formatPrice, formatArea } from '../lib/api'
import { LoadingScreen, ErrorMessage, EmptyState, Pagination, PageHeader, Badge } from '../components/ui'
import { BedDouble as BedIcon } from 'lucide-react'

const LIMIT = 20
const FURNISHING = ['unfurnished', 'semi-furnished', 'fully-furnished']

function RentalCard({ rental }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-1">
          {rental.apartment_name || rental.title || 'Rental Property'}
        </h3>
        {rental.title && rental.apartment_name && (
          <p className="text-xs text-slate-500 mb-2">{rental.title}</p>
        )}

        <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="capitalize">{rental.locality}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
          {rental.bedroom != null && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              {rental.bedroom} BHK
            </span>
          )}
          {rental.bathroom != null && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              {rental.bathroom}
            </span>
          )}
          {rental.carpet_area > 0 && (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" />
              {formatArea(rental.carpet_area)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {rental.property_type && <Badge>{rental.property_type}</Badge>}
          {rental.furnishing && <Badge variant="blue">{rental.furnishing}</Badge>}
        </div>

        <div className="pt-3 border-t border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-slate-900">{formatPrice(rental.price)}<span className="text-xs font-normal text-slate-500">/mo</span></p>
              {rental.deposit > 0 && (
                <p className="text-xs text-slate-400">Deposit: {formatPrice(rental.deposit)}</p>
              )}
              {rental.maintenance > 0 && (
                <p className="text-xs text-slate-400">+ ₹{rental.maintenance.toLocaleString('en-IN')}/mo maintenance</p>
              )}
            </div>
            <div className="text-right">
              {rental.posted_by_contact && (
                <a
                  href={`tel:${rental.posted_by_contact}`}
                  className="flex items-center gap-1 text-blue-600 text-xs hover:text-blue-700"
                >
                  <Phone className="w-3 h-3" />
                  Contact
                </a>
              )}
              {rental.listing_url && (
                <a
                  href={rental.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-slate-400 text-xs hover:text-slate-600 mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RentalsPage() {
  const [offset, setOffset] = useState(0)
  const [locality, setLocality] = useState('')
  const [bhk, setBhk] = useState('')
  const [furnishing, setFurnishing] = useState('')
  const [applied, setApplied] = useState({})

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['rentals', offset, applied],
    queryFn: () => {
      const p = { limit: LIMIT, offset }
      if (applied.locality) p.locality = applied.locality
      if (applied.bhk) p.bhk = parseInt(applied.bhk)
      if (applied.furnishing) p.furnishing = applied.furnishing
      return rentalsApi.getAll(p)
    },
    keepPreviousData: true,
  })

  function applyFilters() {
    setApplied({ locality, bhk, furnishing })
    setOffset(0)
  }

  function clearFilters() {
    setLocality(''); setBhk(''); setFurnishing('')
    setApplied({})
    setOffset(0)
  }

  const hasFilters = locality || bhk || furnishing

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Rental Listings"
        description={data ? `${data.total.toLocaleString()} rentals available in Pune` : 'Find your next home'}
      />

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Locality</label>
          <input
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            placeholder="e.g. hinjewadi"
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-36"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Bedrooms</label>
          <select
            value={bhk}
            onChange={(e) => setBhk(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Any</option>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} BHK</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Furnishing</label>
          <select
            value={furnishing}
            onChange={(e) => setFurnishing(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
          >
            <option value="">Any</option>
            {FURNISHING.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <button
          onClick={applyFilters}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Search
        </button>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading && <LoadingScreen message="Loading rentals..." />}
      {isError && <ErrorMessage message={error?.response?.data?.detail || error?.message} onRetry={refetch} />}

      {data && (
        <>
          {data.results.length === 0 ? (
            <EmptyState title="No rentals found" description="Try different filters." icon={BedIcon} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.results.map((rental) => (
                <RentalCard key={rental.listing_id} rental={rental} />
              ))}
            </div>
          )}
          {data.total > LIMIT && (
            <Pagination
              offset={offset} limit={LIMIT} total={data.total} hasMore={data.has_more}
              onPageChange={(o) => { setOffset(o); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          )}
        </>
      )}
    </div>
  )
}
