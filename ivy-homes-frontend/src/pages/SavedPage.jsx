import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Trash2 } from 'lucide-react'
import { favouritesApi } from '../lib/api'
import ListingCard from '../components/ListingCard'
import { LoadingScreen, ErrorMessage, EmptyState, PageHeader } from '../components/ui'

export default function SavedPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['favourites'],
    queryFn: () => favouritesApi.getAll(),
  })

  const removeMutation = useMutation({
    mutationFn: (listingId) => favouritesApi.remove(listingId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favourites'] }),
  })

  const savedIds = new Set((data?.results || []).map((l) => l.listing_id))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Saved Listings"
        description={data ? `${data.count ?? data.results?.length ?? 0} saved properties` : 'Your saved properties'}
      />

      {isLoading && <LoadingScreen message="Loading saved listings..." />}
      {isError && (
        <ErrorMessage
          message={error?.response?.data?.detail || error?.message || 'Could not load saved listings'}
          onRetry={refetch}
        />
      )}

      {data && (
        <>
          {(data.results?.length ?? 0) === 0 ? (
            <EmptyState
              title="No saved listings yet"
              description="Browse listings and tap the heart icon to save properties you like."
              icon={Heart}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.results.map((listing) => (
                <ListingCard
                  key={listing.listing_id}
                  listing={listing}
                  isSaved={savedIds.has(listing.listing_id)}
                  onToggleSave={(id) => removeMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
