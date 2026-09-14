import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, SlidersHorizontal, X, Scale } from 'lucide-react'
import { listingsApi, favouritesApi } from '../lib/api'
import ListingCard from '../components/ListingCard'
import { LoadingScreen, ErrorMessage, EmptyState, Pagination, PageHeader } from '../components/ui'
import { Home } from 'lucide-react'
import CompareModal from '../components/CompareModal'

const LIMIT = 20

const LOCALITIES = [
  'hinjewadi', 'wakad', 'baner', 'kothrud', 'kharadi', 'viman nagar', 'magarpatta', 'hadapsar', 'aundh'
]

const FURNISHING = ['unfurnished', 'semi-furnished', 'fully-furnished']

const initialFilters = {
  locality: '',
  bhk: '',
  min_price: '',
  max_price: '',
  furnishing: '',
}

export default function ListingsPage() {
  const queryClient = useQueryClient()
  const [offset, setOffset] = useState(0)
  const [filters, setFilters] = useState(initialFilters)
  const [applied, setApplied] = useState(initialFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState([])
  const [showCompareModal, setShowCompareModal] = useState(false)

  // Build query params — only include non-empty values
  const queryParams = useCallback(() => {
    const p = { limit: LIMIT, offset }
    if (applied.locality) p.locality = applied.locality
    if (applied.bhk) p.bhk = parseInt(applied.bhk)
    if (applied.min_price) p.min_price = parseInt(applied.min_price)
    if (applied.max_price) p.max_price = parseInt(applied.max_price)
    if (applied.furnishing) p.furnishing = applied.furnishing
    return p
  }, [offset, applied])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['listings', offset, applied],
    queryFn: () => listingsApi.getAll(queryParams()),
    keepPreviousData: true,
  })

  // Saved listings query
  const { data: savedData } = useQuery({
    queryKey: ['favourites'],
    queryFn: () => favouritesApi.getAll(),
    retry: false,
  })
  const savedIds = new Set((savedData?.results || []).map((listing) => String(listing.listing_id)))

  // Toggle save mutation
  const toggleSave = useMutation({
    mutationFn: async (listing) => {
      const listingId = listing.listing_id
      if (savedIds.has(String(listingId))) {
        await favouritesApi.remove(listingId)
      } else {
        await favouritesApi.add(listing)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favourites'] }),
  })

  function applyFilters() {
    setApplied({ ...filters })
    setOffset(0)
    setShowFilters(false)
  }

  function clearFilters() {
    setFilters(initialFilters)
    setApplied(initialFilters)
    setOffset(0)
  }

  function toggleCompare(listing) {
    setSelectedForCompare(prev => {
      const isSelected = prev.some(item => item.listing_id === listing.listing_id)
      if (isSelected) {
        return prev.filter(item => item.listing_id !== listing.listing_id)
      }
      if (prev.length >= 3) {
        alert("You can only compare up to 3 properties at a time.")
        return prev
      }
      return [...prev, listing]
    })
  }

  const hasActiveFilters = Object.values(applied).some(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      <PageHeader
        title="Property Listings"
        description={data ? `${data.total.toLocaleString()} properties in Pune` : 'Browse properties for sale'}
      >
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            hasActiveFilters
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters {hasActiveFilters && '(active)'}
        </button>
      </PageHeader>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Locality */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Locality</label>
              <select
                value={filters.locality}
                onChange={(e) => setFilters((f) => ({ ...f, locality: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                <option value="">All localities</option>
                {LOCALITIES.map((l) => (
                  <option key={l} value={l} className="capitalize">{l}</option>
                ))}
              </select>
            </div>

            {/* BHK */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Bedrooms</label>
              <select
                value={filters.bhk}
                onChange={(e) => setFilters((f) => ({ ...f, bhk: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} BHK</option>
                ))}
              </select>
            </div>

            {/* Min price */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Min Price (₹)</label>
              <input
                type="number"
                placeholder="e.g. 5000000"
                value={filters.min_price}
                onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max price */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Max Price (₹)</label>
              <input
                type="number"
                placeholder="e.g. 20000000"
                value={filters.max_price}
                onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Furnishing */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Furnishing</label>
              <select
                value={filters.furnishing}
                onChange={(e) => setFilters((f) => ({ ...f, furnishing: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                <option value="">Any</option>
                {FURNISHING.map((f) => (
                  <option key={f} value={f} className="capitalize">{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={applyFilters}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading && <LoadingScreen message="Loading listings..." />}
      {isError && (
        <ErrorMessage
          message={error?.response?.data?.detail || error?.message}
          onRetry={refetch}
        />
      )}

      {data && (
        <>
          {data.results.length === 0 ? (
            <EmptyState
              title="No listings found"
              description="Try adjusting your filters to see more results."
              icon={Home}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.results.map((listing) => (
                <ListingCard
                  key={listing.listing_id}
                  listing={listing}
                  isSaved={savedIds.has(String(listing.listing_id))}
                  isSaving={toggleSave.isPending}
                  onToggleSave={(savedListing) => toggleSave.mutate(savedListing)}
                  isCompared={selectedForCompare.some(item => item.listing_id === listing.listing_id)}
                  onToggleCompare={toggleCompare}
                />
              ))}
            </div>
          )}

          {data.total > LIMIT && (
            <Pagination
              offset={offset}
              limit={LIMIT}
              total={data.total}
              hasMore={data.has_more}
              onPageChange={(newOffset) => {
                setOffset(newOffset)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          )}
        </>
      )}

      {/* Floating Compare Bar */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-4 z-50">
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedForCompare.length} properties selected
          </span>
          <button
            onClick={() => setShowCompareModal(true)}
            disabled={selectedForCompare.length < 2}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-100 text-blue-800 hover:bg-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Scale className="w-4 h-4" />
            Compare Now
          </button>
          <button
            onClick={() => setSelectedForCompare([])}
            className="p-1 hover:bg-slate-700 rounded-full transition-colors text-slate-300 hover:text-white shrink-0 ml-1"
            title="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {showCompareModal && (
        <CompareModal
          listings={selectedForCompare}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  )
}
