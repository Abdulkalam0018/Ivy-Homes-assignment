import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import ListingsPage from './pages/ListingsPage'
import ListingDetailPage from './pages/ListingDetailPage'
import RentalsPage from './pages/RentalsPage'
import ProjectsPage from './pages/ProjectsPage'
import SavedPage from './pages/SavedPage'
import InsightsPage from './pages/InsightsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 min
      retry: 1,
    },
  },
})

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route
              path="/listings"
              element={
                <ProtectedRoute>
                  <AppLayout><ListingsPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id"
              element={
                <ProtectedRoute>
                  <AppLayout><ListingDetailPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/rentals"
              element={
                <ProtectedRoute>
                  <AppLayout><RentalsPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <AppLayout><ProjectsPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <AppLayout><SavedPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRoute>
                  <AppLayout><InsightsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/listings" replace />} />
            <Route path="*" element={<Navigate to="/listings" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
