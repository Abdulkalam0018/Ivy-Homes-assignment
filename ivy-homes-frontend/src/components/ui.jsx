// Reusable UI primitives

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-4', lg: 'w-12 h-12 border-4' }
  return (
    <div
      className={`${sizes[size]} border-blue-600 border-t-transparent rounded-full animate-spin ${className}`}
    />
  )
}

export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Spinner />
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  )
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <span className="text-red-500 text-xl">!</span>
      </div>
      <p className="text-slate-700 font-medium">Something went wrong</p>
      <p className="text-slate-500 text-sm text-center max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here', description = '', icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-1">
          <Icon className="w-7 h-7 text-slate-400" />
        </div>
      )}
      <p className="font-semibold text-slate-700">{title}</p>
      {description && <p className="text-slate-400 text-sm max-w-xs">{description}</p>}
    </div>
  )
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${variants[variant]}`}>
      {children}
    </span>
  )
}

export function StatCard({ label, value, sub, icon: Icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}

export function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function Pagination({ offset, limit, total, hasMore, onPageChange }) {
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
      <p className="text-sm text-slate-500">
        Showing {offset + 1}–{Math.min(offset + limit, total)} of {total.toLocaleString()} results
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          disabled={offset === 0}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
        >
          ← Prev
        </button>
        <span className="px-3 py-1.5 text-sm text-slate-600">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(offset + limit)}
          disabled={!hasMore}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
