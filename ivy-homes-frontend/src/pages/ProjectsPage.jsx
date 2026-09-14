import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { MapPin, Building2, Calendar, Layers, ExternalLink, TrendingUp } from 'lucide-react'
import { projectsApi, formatPrice } from '../lib/api'
import { LoadingScreen, ErrorMessage, EmptyState, Pagination, PageHeader, Badge } from '../components/ui'

const LIMIT = 20
const STATUS_OPTIONS = ['new launch', 'under construction', 'ready to move']

const STATUS_VARIANTS = {
  'new launch': 'blue',
  'under construction': 'amber',
  'ready to move': 'green',
}

// price_min is returned in Lakhs (e.g. 80.0 → ₹80 L)
// price_max is returned in Crores (e.g. 3.22 → ₹3.22 Cr)
function formatMinPrice(val) {
  if (val == null) return '—'
  return formatPrice(Math.round(val * 100000))
}

function formatMaxPrice(val) {
  if (val == null) return '—'
  return formatPrice(Math.round(val * 10000000))
}

function ProjectCard({ project }) {
  const navigate = useNavigate()

  return (
    <div
      className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => navigate(`/projects/${project.project_id}`)}
    >
      <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-600" />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-violet-600 transition-colors line-clamp-2">
            {project.apartment_name}
          </span>
          <Badge variant={STATUS_VARIANTS[project.project_status] || 'default'}>
            {project.project_status}
          </Badge>
        </div>

        <p className="text-xs text-slate-500 mb-1">{project.developer_name}</p>

        <div className="flex items-center gap-1 text-slate-500 text-xs mb-4">
          <MapPin className="w-3.5 h-3.5" />
          <span className="capitalize">{project.locality}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{project.total_units} units</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{project.total_towers} towers · {project.total_floors}F</span>
          </div>
          {project.possession_date && (
            <div className="flex items-center gap-1.5 text-slate-600 col-span-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Possession: {new Date(project.possession_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Area range */}
        {project.min_area_sqft && project.max_area_sqft && (
          <p className="text-xs text-slate-500 mb-3">
            {project.min_area_sqft.toLocaleString()}–{project.max_area_sqft.toLocaleString()} sq.ft
          </p>
        )}

        {/* Amenities */}
        {project.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.amenities.slice(0, 4).map((a) => (
              <span key={a} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs capitalize">{a}</span>
            ))}
            {project.amenities.length > 4 && (
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-xs">+{project.amenities.length - 4}</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Price range</p>
            <p className="text-sm font-bold text-slate-900">
              {formatMinPrice(project.price_min)} – {formatMaxPrice(project.price_max)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">{project.total_listings} listing{project.total_listings !== 1 ? 's' : ''}</p>
            {project.project_url && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(project.project_url, '_blank', 'noopener,noreferrer')
                }}
                className="text-violet-500 hover:text-violet-700 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 inline" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [offset, setOffset] = useState(0)
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [applied, setApplied] = useState({})

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projects', offset, applied],
    queryFn: () => {
      const p = { limit: LIMIT, offset }
      if (applied.status) p.project_status = applied.status
      if (applied.sortBy) p.sort_by = applied.sortBy
      return projectsApi.getAll(p)
    },
    keepPreviousData: true,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Builder Projects"
        description={data ? `${data.total.toLocaleString()} projects in Pune` : 'New & under-construction projects'}
      />


      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 capitalize"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Default</option>
            <option value="price_max">Price (Max)</option>
            <option value="price_min">Price (Min)</option>
            <option value="total_units">Total Units</option>
            <option value="launch_date">Launch Date</option>
          </select>
        </div>
        <button
          onClick={() => { setApplied({ status, sortBy }); setOffset(0) }}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          Apply
        </button>
        <button
          onClick={() => { setStatus(''); setSortBy(''); setApplied({}); setOffset(0) }}
          className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        >
          Clear
        </button>
      </div>

      {isLoading && <LoadingScreen message="Loading projects..." />}
      {isError && <ErrorMessage message={error?.response?.data?.detail || error?.message} onRetry={refetch} />}

      {data && (
        <>
          {data.results.length === 0 ? (
            <EmptyState title="No projects found" description="Try different filters." icon={Building2} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.results.map((project) => (
                <ProjectCard key={project.project_id} project={project} />
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
