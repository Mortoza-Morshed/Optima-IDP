import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth.jsx';
import AdminHome from '../components/Home/AdminHome';

function Home() {
  const { user } = useAuth();

  // Authenticated View
  if (user) {
    if (user.role === 'admin') {
      return <AdminHome user={user} />;
    }

    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Welcome back, <span className="text-purple-400">{user.name}</span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mb-12">
          Ready to continue your growth journey?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Dashboard Card */}
          <Link to="/dashboard" className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/50 transition-all duration-300 text-left">
            <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Dashboard</h3>
            <p className="text-slate-400">View your learning plan, stats, and recent activity.</p>
          </Link>

          {/* Profile Card (Placeholder for now) */}
          <div className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-800/50 transition-all duration-300 text-left relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded">Coming Soon</div>
            <div className="h-12 w-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">My Profile</h3>
            <p className="text-slate-400">Manage your skills, preferences, and account settings.</p>
          </div>
        </div>
      </div>
    );
  }

  // Guest View
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
      </div>

      <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
        Intelligent Growth.<br />
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Personalized.
        </span>
      </h1>

      <p className="text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
        AI-driven skill gap analysis and personalized learning paths to bridge the gap between potential and performance.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Link
          to="/login"
          className="px-8 py-4 bg-white text-slate-950 font-bold rounded-xl hover:bg-slate-200 transition-all transform hover:scale-105 shadow-lg shadow-white/10"
        >
          Sign In
        </Link>
        <Link
          to="/register"
          className="px-8 py-4 bg-slate-800 text-white font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-all transform hover:scale-105"
        >
          Get Started
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-left">
        {/* Feature 1: Smart Recommendations */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-purple-500/50 transition-colors duration-300">
          <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Smart Recommendations</h3>
          <p className="text-slate-400">Content-based filtering algorithms curate the best resources for your specific skill gaps.</p>
        </div>

        {/* Feature 2: Skill Gap Analysis */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-pink-500/50 transition-colors duration-300">
          <div className="h-10 w-10 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Skill Gap Analysis</h3>
          <p className="text-slate-400">Automatically identify weaknesses from performance reviews and create targeted improvement plans.</p>
        </div>

        {/* Feature 3: Continuous Growth */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-blue-500/50 transition-colors duration-300">
          <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Continuous Growth</h3>
          <p className="text-slate-400">Tailored development paths that align employee goals with organizational needs.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
