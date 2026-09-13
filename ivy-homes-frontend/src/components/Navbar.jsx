import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Home, Building2, BedDouble, Heart, BarChart3, LogOut, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/listings', label: 'Listings', icon: Home },
  { to: '/rentals', label: 'Rentals', icon: BedDouble },
  { to: '/projects', label: 'Projects', icon: Building2 },
  { to: '/saved', label: 'Saved', icon: Heart },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/listings" className="flex items-center gap-2 font-bold text-blue-600 text-lg">
            <Building2 className="w-6 h-6" />
            <span>Ivy Homes</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden gap-1 pb-2 overflow-x-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
