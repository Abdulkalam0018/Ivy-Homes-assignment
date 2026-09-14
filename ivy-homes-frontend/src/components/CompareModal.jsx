import { X, Scale } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatPrice, formatArea } from '../lib/api'

export default function CompareModal({ listings, onClose }) {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Scale className="w-5 h-5 text-blue-400" />
            Property Comparison
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-x-auto p-6 flex-1 overflow-y-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <tbody>
              {/* Header Row */}
              <tr className="border-b border-slate-800">
                <th className="py-4 px-4 font-semibold text-white w-1/4">Feature</th>
                {listings.map((l) => (
                  <th key={l.listing_id} className="py-4 px-4 w-1/4">
                    <div className="font-bold text-xl text-white">{formatPrice(l.price)}</div>
                    <div className="text-slate-400 font-normal mt-1">{l.apartment_name || 'Unnamed Property'}</div>
                  </th>
                ))}
              </tr>

              {/* Rows */}
              {[
                { label: 'Locality', key: 'locality', render: (l) => <span className="capitalize">{l.locality}</span> },
                { label: 'Bedrooms', key: 'bedroom', render: (l) => `${l.bedroom} BHK` },
                { label: 'Area', key: 'carpet_area', render: (l) => l.carpet_area > 0 ? formatArea(l.carpet_area) : 'N/A' },
                { label: 'Price per Sqft', key: 'price_sqft', render: (l) => l.carpet_area > 0 ? `₹${Math.round(l.price / l.carpet_area).toLocaleString('en-IN')}/sq.ft` : 'N/A' },
                { label: 'Furnishing', key: 'furnishing', render: (l) => <span className="capitalize">{l.furnishing?.replace('-', ' ') || 'N/A'}</span> },
                { label: 'Floor', key: 'floor', render: (l) => l.floor != null ? `${l.floor} of ${l.total_floors || '?'}` : 'N/A' },
                { label: 'Facing', key: 'facing_direction', render: (l) => <span className="capitalize">{l.facing_direction || 'N/A'}</span> },
                { label: 'Website', key: 'website', render: (l) => <span className="uppercase text-xs font-semibold">{l.website || 'N/A'}</span> },
              ].map((row) => (
                <tr key={row.key} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                  <td className="py-4 px-4 font-medium text-slate-400">{row.label}</td>
                  {listings.map((l) => (
                    <td key={l.listing_id} className="py-4 px-4">
                      {row.render(l)}
                    </td>
                  ))}
                </tr>
              ))}
              
              {/* Footer Actions */}
              <tr>
                <td className="py-6 px-4"></td>
                {listings.map((l) => (
                  <td key={l.listing_id} className="py-6 px-4">
                    <button
                      onClick={() => navigate(`/listings/${l.listing_id}`)}
                      className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700"
                    >
                      View Details
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
