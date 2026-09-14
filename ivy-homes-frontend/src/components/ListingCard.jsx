import { useNavigate } from 'react-router-dom'
import { Heart, MapPin, BedDouble, Bath, Maximize2, CheckCircle } from 'lucide-react'
import { formatPrice, formatArea } from '../lib/api'

export default function ListingCard({ listing, isSaved, isSaving = false, onToggleSave }) {
  const navigate = useNavigate()
  const {
    listing_id,
    apartment_name,
    locality,
    bedroom,
    bathroom,
    carpet_area,
    price,
    furnishing,
    property_type,
    is_verified,
    is_live,
    posted_by,
  } = listing

  return (
    <div
      className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden hover:bg-slate-200 hover:shadow-md transition-all group cursor-pointer"
      onClick={() => navigate(`/listings/${listing_id}`)}
    >
      {/* Card header — color band based on property type */}
      <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />

      <div className="p-4">
        {/* Top row: name + save button */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-semibold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
            {apartment_name || 'Unnamed Property'}
          </span>
          {onToggleSave && (
            <button
              type="button"
              disabled={isSaving}
              onClick={(e) => { e.stopPropagation(); onToggleSave(listing) }}
              className={`shrink-0 p-1.5 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isSaved
                  ? 'text-red-500 hover:text-red-700'
                  : 'text-slate-400 hover:text-red-400'
              }`}
              aria-label={isSaved ? 'Remove from saved listings' : 'Save listing'}
              title={isSaved ? 'Remove from saved' : 'Save listing'}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Locality */}
        <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="capitalize">{locality}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
          {bedroom != null && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              {bedroom} BHK
            </span>
          )}
          {bathroom != null && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              {bathroom}
            </span>
          )}
          {carpet_area > 0 && (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" />
              {formatArea(carpet_area)}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {property_type && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs capitalize">
              {property_type}
            </span>
          )}
          {furnishing && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs capitalize">
              {furnishing}
            </span>
          )}
          {!is_live && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">
              Inactive
            </span>
          )}
        </div>

        {/* Price + verified */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="font-bold text-slate-900 text-base">{formatPrice(price)}</p>
            {carpet_area > 0 && (
              <p className="text-xs text-slate-400">
                ₹{Math.round(price / carpet_area).toLocaleString('en-IN')}/sq.ft
              </p>
            )}
          </div>
          {is_verified && (
            <div className="flex items-center gap-1 text-green-600 text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
