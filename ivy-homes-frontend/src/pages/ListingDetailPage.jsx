import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, MapPin, BedDouble, Bath, Maximize2, CheckCircle,
  Heart, Phone, Building2, Calendar, Layers, Car, Wind,
  ExternalLink
} from 'lucide-react'
import { listingsApi, favouritesApi, formatPrice, formatArea } from '../lib/api'
import { LoadingScreen, ErrorMessage, Badge } from '../components/ui'

function DetailRow({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-200 last:border-0">
      <div className="p-1.5 bg-slate-200 rounded-lg shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-600" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 capitalize">{value}</p>
      </div>
    </div>
  )
}

export default function ListingDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()

  const { data: listing, isLoading, isError, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getOne(id),
  })

  const { data: savedData } = useQuery({
    queryKey: ['favourites'],
    queryFn: () => favouritesApi.getAll(),
    retry: false,
  })

  const savedIds = new Set((savedData?.results || []).map((l) => String(l.listing_id)))
  const isSaved = savedIds.has(String(id))

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (isSaved) await favouritesApi.remove(id)
      else await favouritesApi.add(listing)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favourites'] }),
  })

  if (isLoading) return <LoadingScreen message="Loading listing details..." />
  if (isError) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <ErrorMessage message={error?.response?.data?.detail || error?.message} />
    </div>
  )
  if (!listing) return null

  const pricePerSqft = listing.carpet_area > 0
    ? Math.round(listing.price / listing.carpet_area)
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        to="/listings"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Header card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                {listing.apartment_name || 'Unnamed Property'}
              </h1>
              <button
                type="button"
                disabled={toggleSave.isPending}
                onClick={() => toggleSave.mutate()}
                className={`shrink-0 p-2 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSaved
                    ? 'border-red-200 text-red-500 bg-red-50'
                    : 'border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-400'
                }`}
                aria-label={isSaved ? 'Remove from saved listings' : 'Save listing'}
              >
                <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="capitalize">{listing.locality}, Pune</span>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {listing.bedroom != null && (
                <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                  <BedDouble className="w-5 h-5 text-blue-600 mb-1" />
                  <p className="font-bold text-slate-900">{listing.bedroom}</p>
                  <p className="text-xs text-slate-500">Bedrooms</p>
                </div>
              )}
              {listing.bathroom != null && (
                <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                  <Bath className="w-5 h-5 text-blue-600 mb-1" />
                  <p className="font-bold text-slate-900">{listing.bathroom}</p>
                  <p className="text-xs text-slate-500">Bathrooms</p>
                </div>
              )}
              {listing.carpet_area > 0 && (
                <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                  <Maximize2 className="w-5 h-5 text-blue-600 mb-1" />
                  <p className="font-bold text-slate-900">{listing.carpet_area}</p>
                  <p className="text-xs text-slate-500">sq.ft carpet</p>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {listing.property_type && <Badge>{listing.property_type}</Badge>}
              {listing.furnishing && <Badge variant="blue">{listing.furnishing}</Badge>}
              {listing.is_verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
              {!listing.is_live && <Badge variant="amber">Inactive</Badge>}
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-3">About this property</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Property details */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-2">Property details</h2>
            <DetailRow icon={Building2} label="Property type" value={listing.property_type} />
            <DetailRow icon={Layers} label="Floor" value={listing.floor != null ? `${listing.floor} of ${listing.total_floors}` : null} />
            <DetailRow icon={Wind} label="Facing" value={listing.facing_direction} />
            <DetailRow icon={Car} label="Covered parking" value={listing.covered_parking > 0 ? `${listing.covered_parking} spot(s)` : 'None'} />
            <DetailRow icon={Maximize2} label="Super built-up area" value={listing.super_built_up_area ? formatArea(listing.super_built_up_area) : null} />
            <DetailRow icon={Calendar} label="Listed on" value={listing.posted_at ? new Date(listing.posted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 sticky top-24">
            <p className="text-2xl font-bold text-slate-900 mb-1">{formatPrice(listing.price)}</p>
            {pricePerSqft && (
              <p className="text-slate-500 text-sm mb-4">
                ₹{pricePerSqft.toLocaleString('en-IN')}/sq.ft
              </p>
            )}

            {/* Contact */}
            {listing.posted_by_name && (
              <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 mb-1 capitalize">{listing.posted_by}</p>
                <p className="text-sm font-medium text-slate-900">{listing.posted_by_name}</p>
                {listing.posted_by_contact && (
                  <a
                    href={`tel:${listing.posted_by_contact}`}
                    className="flex items-center gap-1.5 text-blue-600 text-sm mt-1 hover:text-blue-700"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {listing.posted_by_contact}
                  </a>
                )}
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  )
}
