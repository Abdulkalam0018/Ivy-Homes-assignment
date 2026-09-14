import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, MapPin, Building2, Calendar, Layers,
  TrendingUp, TrendingDown, ExternalLink, CheckCircle, Tag,
} from 'lucide-react'
import { projectsApi, formatPrice } from '../lib/api'
import { LoadingScreen, ErrorMessage, Badge } from '../components/ui'

const STATUS_VARIANTS = {
  'new launch': 'blue',
  'under construction': 'amber',
  'ready to move': 'green',
}

// User's rule:
// If right < left -> left is in Lacs, right is in Crores
// If left < right -> both are in Crores
const formatMinPrice = (min, max) => {
  if (min == null) return '—'
  if (max != null && min < max) {
    return formatPrice(Math.round(min * 10000000)) // Crores
  }
  return formatPrice(Math.round(min * 100000)) // Lacs
}

const formatMaxPrice = (min, max) => {
  if (max == null) return '—'
  return formatPrice(Math.round(max * 10000000)) // Always Crores
}

function DetailRow({ icon: Icon, label, value }) {
  if (value == null || value === '' || value === false) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: project, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getOne(id),
  })

  if (isLoading) return <LoadingScreen message="Loading project details…" />
  if (isError) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <ErrorMessage message={error?.response?.data?.detail || error?.message} onRetry={refetch} />
    </div>
  )

  const p = project

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6 shadow-sm">
        <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-600" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{p.apartment_name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {p.project_status && (
                <Badge variant={STATUS_VARIANTS[p.project_status] || 'default'}>
                  {p.project_status}
                </Badge>
              )}
              {p.project_url && (
                <button
                  type="button"
                  onClick={() => window.open(p.project_url, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Website
                </button>
              )}
            </div>
          </div>

          {p.developer_name && (
            <p className="text-sm text-slate-500 mb-1">{p.developer_name}</p>
          )}
          {p.latitude && p.longitude ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-900 rounded-lg text-sm font-medium transition-colors mb-5 w-fit"
              title="View on Google Maps"
            >
              <MapPin className="w-4 h-4 shrink-0 text-violet-500" />
              <span className="capitalize">{p.locality}, Pune</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-violet-400" />
            </a>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-5">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="capitalize">{p.locality}, Pune</span>
            </div>
          )}

          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 mb-0.5">Total Units</p>
              <p className="text-lg font-bold text-slate-800">{p.total_units ?? '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 mb-0.5">Towers</p>
              <p className="text-lg font-bold text-slate-800">{p.total_towers ?? '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 mb-0.5">Floors</p>
              <p className="text-lg font-bold text-slate-800">{p.total_floors ?? '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 mb-0.5">Listings</p>
              <p className="text-lg font-bold text-slate-800">{p.total_listings ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" /> Price Range
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Minimum Price</p>
              <p className="text-xl font-bold text-slate-900">{formatMinPrice(p.price_min, p.price_max)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Maximum Price</p>
              <p className="text-xl font-bold text-violet-700">{formatMaxPrice(p.price_min, p.price_max)}</p>
            </div>
            {p.min_area_sqft && p.max_area_sqft && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-0.5">Area Range</p>
                <p className="text-sm font-medium text-slate-700">
                  {p.min_area_sqft.toLocaleString()} – {p.max_area_sqft.toLocaleString()} sq.ft
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-500" /> Timeline
          </h2>
          <DetailRow
            icon={Calendar}
            label="Launch Date"
            value={p.launch_date ? new Date(p.launch_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null}
          />
          <DetailRow
            icon={CheckCircle}
            label="Possession Date"
            value={p.possession_date ? new Date(p.possession_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null}
          />
          <DetailRow icon={Layers} label="RERA Number" value={p.rera_number} />
        </div>
      </div>

      {/* Amenities */}
      {p.amenities?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-violet-500" /> Amenities
          </h2>
          <div className="flex flex-wrap gap-2">
            {p.amenities.map((a) => (
              <span
                key={a}
                className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium capitalize"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* BHK configs */}
      {p.bhk_configs?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-500" /> Unit Configurations
          </h2>
          <div className="flex flex-wrap gap-2">
            {p.bhk_configs.map((c) => (
              <span
                key={c}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold"
              >
                {c} BHK
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {p.description && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-violet-500" /> About this project
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{p.description}</p>
        </div>
      )}

      {/* IDs */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-400 font-mono">
        Project ID: {p.project_id}
      </div>
    </div>
  )
}
