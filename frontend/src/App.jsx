import { Link, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/useAuth.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import IDPCreate from './pages/IDPCreate.jsx';
import ScrollToAnchor from './components/ScrollToAnchor.jsx';

function AppShell() {
  const { user } = useAuth(); // Get user state
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToAnchor />
      <nav className="sticky top-0 z-50 bg-slate-800/90 backdrop-blur-lg border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:scale-105 transition-transform">
              Optima IDP
            </Link>
            {/* Right Side Group */}
            <div className="flex items-center gap-8">
              {user ? (
                <>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `text-sm font-medium transition-colors ${isActive
                        ? 'text-purple-400'
                        : 'text-slate-300 hover:text-white'
                      }`
                    }
                  >
                    Dashboard
                  </NavLink>

                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all border ${isActive
                        ? 'bg-purple-900 border-purple-500 text-white shadow-lg shadow-purple-900/20'
                        : 'border-transparent text-slate-300 hover:text-white'
                      }`
                    }
                  >
                    <span className="text-sm font-medium">{user.name}</span>
                  </NavLink>
                </>
              ) : (
                <div className="flex gap-4 items-center">
                  <Link to="/login" className="px-4 py-2 rounded-lg border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white transition-all text-sm font-medium">
                    Login
                  </Link>
                  <Link to="/register" className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 text-sm font-medium">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

// ... imports ...

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/idp/create" element={<IDPCreate />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;

