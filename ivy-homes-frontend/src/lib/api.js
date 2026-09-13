import axios from 'axios'

const BASE_URL = 'https://solve.ivy.homes'
const API_KEY = import.meta.env.VITE_API_KEY || 'IVY26-58EF32DDF2FE'

// ── Axios instance ────────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'X-API-Key': API_KEY },
})

// ── Token helpers ─────────────────────────────────────────────────────────────
const ACCESS_KEY = 'ivy_access_token'
const REFRESH_KEY = 'ivy_refresh_token'
const USER_KEY = 'ivy_user'

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  },
  set: (accessToken, refreshToken, user) => {
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },
}

// ── Request interceptor — attach Bearer token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess()
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// ── Response interceptor — silent token refresh on 401 ───────────────────────
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = tokenStorage.getRefresh()
      if (!refreshToken) {
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'X-API-Key': API_KEY } }
        )
        const { access_token, refresh_token, user } = res.data
        tokenStorage.set(access_token, refresh_token, user)
        api.defaults.headers['Authorization'] = `Bearer ${access_token}`
        processQueue(null, access_token)
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email, password) => {
    const res = await axios.post(
      `${BASE_URL}/auth/login`,
      { email, password },
      { headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' } }
    )
    return res.data // { access_token, refresh_token, token_type, expires_in, user }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      tokenStorage.clear()
    }
  },
}

// ── Listings API ──────────────────────────────────────────────────────────────
export const listingsApi = {
  getAll: (params) => api.get('/v1/listings', { params }).then((r) => r.data),
  getOne: (id) => api.get(`/v1/listings/${id}`).then((r) => r.data),
}

// ── Rentals API ───────────────────────────────────────────────────────────────
export const rentalsApi = {
  getAll: (params) => api.get('/v1/rentals', { params }).then((r) => r.data),
  getOne: (id) => api.get(`/v1/rentals/${id}`).then((r) => r.data),
}

// ── Projects API ──────────────────────────────────────────────────────────────
export const projectsApi = {
  getAll: (params) => api.get('/v1/projects', { params }).then((r) => r.data),
  getOne: (id) => api.get(`/v1/projects/${id}`).then((r) => r.data),
}

// ── Favourites API ────────────────────────────────────────────────────────────
// NOTE: /v1/favourites returns 404 — using /v1/favorites (American spelling)
// This is a confirmed API discrepancy vs documentation
export const favouritesApi = {
  getAll: () => api.get('/v1/favourites').then((r) => r.data),
  add: (listingId) => api.post('/v1/favourites', { listing_id: listingId }).then((r) => r.data),
  remove: (listingId) => api.delete(`/v1/favourites/${listingId}`).then((r) => r.data),
}

// ── Analytics API ─────────────────────────────────────────────────────────────
// NOTE: /v1/analytics/summary returns 404 — endpoint does not exist
// Insights screen builds analytics from raw listing/rental/project data instead
export const analyticsApi = {
  getSummary: () => api.get('/v1/analytics/summary').then((r) => r.data),
}

// ── Format helpers ────────────────────────────────────────────────────────────
export function formatPrice(price) {
  if (!price) return '—'
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`
  return `₹${price.toLocaleString('en-IN')}`
}

export function formatArea(sqft) {
  if (!sqft) return '—'
  return `${sqft.toLocaleString('en-IN')} sq.ft`
}
