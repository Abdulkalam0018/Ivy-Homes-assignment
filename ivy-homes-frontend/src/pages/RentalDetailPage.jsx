import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, MapPin, BedDouble, Bath, Maximize2,
  Phone, Home, DollarSign, Shield, Wrench, User, Tag, ExternalLink,
} from 'lucide-react'
import { rentalsApi, formatPrice, formatArea } from '../lib/api'
import { LoadingScreen, ErrorMessage, Badge } from '../components/ui'

function DetailRow({ icon: Icon, label, value, color = 'text-slate-600' }) {
  if (value == null || value === '' || value === 0) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className={`text-sm font-medium ${color}`}>{value}</p>
      </div>
    </div>
  )
}

export default function RentalDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: rental, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['rental', id],
    queryFn: () => rentalsApi.getOne(id),
  })

  if (isLoading) return <LoadingScreen message="Loading rental details…" />
  if (isError) return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/rentals')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <ErrorMessage message={error?.response?.data?.detail || error?.message} onRetry={refetch} />
    </div>
  )

  const r = rental

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button
        onClick={() => navigate('/rentals')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Rentals
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6 shadow-sm">
        <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 className="text-xl font-bold text-slate-900">
              {r.apartment_name || r.title || 'Rental Property'}
            </h1>
            {r.furnishing && (
              <Badge variant="blue" className="shrink-0 capitalize">{r.furnishing}</Badge>
            )}
          </div>
          {r.title && r.apartment_name && (
            <p className="text-sm text-slate-500 mb-3">{r.title}</p>
          )}
          {r.latitude && r.longitude ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 rounded-lg text-sm font-medium transition-colors mb-4 w-fit"
              title="View on Google Maps"
            >
              <MapPin className="w-4 h-4 shrink-0 text-emerald-500" />
              <span className="capitalize">{r.locality}, Pune</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-emerald-400" />
            </a>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="capitalize">{r.locality}, Pune</span>
            </div>
          )}

          {/* Key stats bar */}
          <div className="flex flex-wrap gap-5 text-sm text-slate-700">
            {r.bedroom != null && (
              <span className="flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-slate-400" />
                {r.bedroom} BHK
              </span>
            )}
            {r.bathroom != null && (
              <span className="flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-slate-400" />
                {r.bathroom} Bath
              </span>
            )}
            {r.carpet_area > 0 && (
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-slate-400" />
                {formatArea(r.carpet_area)}
              </span>
            )}
            {r.property_type && (
              <span className="flex items-center gap-1.5">
                <Home className="w-4 h-4 text-slate-400" />
                <span className="capitalize">{r.property_type}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Pricing
          </h2>
          <div className="mb-4">
            <p className="text-2xl font-bold text-slate-900">
              {formatPrice(r.price)}
              <span className="text-sm font-normal text-slate-400">/mo</span>
            </p>
            {r.carpet_area > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                ₹{Math.round(r.price / r.carpet_area).toLocaleString('en-IN')}/sq.ft
              </p>
            )}
          </div>
          <DetailRow icon={Shield} label="Security Deposit" value={r.deposit > 0 ? formatPrice(r.deposit) : null} />
          <DetailRow icon={Wrench} label="Monthly Maintenance" value={r.maintenance > 0 ? `₹${r.maintenance.toLocaleString('en-IN')}/mo` : null} />
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" /> Contact
          </h2>
          {r.posted_by && (
            <p className="text-sm font-medium text-slate-800 mb-1">{r.posted_by}</p>
          )}
          {r.posted_by_role && (
            <p className="text-xs text-slate-400 mb-4 capitalize">{r.posted_by_role}</p>
          )}
          {r.posted_by_contact && (
            <a
              href={`tel:${r.posted_by_contact}`}
              className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {r.posted_by_contact}
            </a>
          )}
          {!r.posted_by_contact && (
            <p className="text-sm text-slate-400 italic">No contact available</p>
          )}
        </div>
      </div>

      {/* Extra details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mt-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-500" /> Details
        </h2>
        <DetailRow icon={MapPin} label="Locality" value={r.locality} />
        <DetailRow icon={Home} label="Property Type" value={r.property_type} />
        <DetailRow icon={BedDouble} label="Bedrooms" value={r.bedroom != null ? `${r.bedroom} BHK` : null} />
        <DetailRow icon={Bath} label="Bathrooms" value={r.bathroom} />
        <DetailRow icon={Maximize2} label="Carpet Area" value={r.carpet_area > 0 ? formatArea(r.carpet_area) : null} />
        {r.listing_id && (
          <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Listing ID</p>
              <p className="text-sm font-mono text-slate-600">{r.listing_id}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
