import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Users, Activity, Settings, Database,
    Shield, ArrowRight, Zap, Bell, Command
} from 'lucide-react';
import api from '../../services/api'; // Ensure this path is correct based on project structure

const AdminHome = ({ user }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [systemStatus, setSystemStatus] = useState({ status: 'checking', label: 'Checking System...' });

    // Quick "Switchboard" Actions
    const quickLinks = [
        {
            title: "User Management",
            description: "Approve, manage roles, and review profiles.",
            icon: Users,
            to: "/dashboard#approvals",
            color: "from-blue-500 to-cyan-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20"
        },
        {
            title: "System Health",
            description: "View logs, performance metrics, and queue status.",
            icon: Activity,
            to: "/dashboard#health",
            color: "from-emerald-500 to-teal-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        },
        {
            title: "Resources & Content",
            description: "Manage learning materials and company assets.",
            icon: Database,
            to: "/dashboard#resources",
            color: "from-purple-500 to-pink-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20"
        },
        {
            title: "Security & Audit",
            description: "Review audit logs and configure security settings.",
            icon: Shield,
            to: "/dashboard#analytics", // Assuming analytics/security section
            color: "from-amber-500 to-orange-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20"
        }
    ];

    useEffect(() => {
        const checkHealth = async () => {
            try {
                // Determine system status based on health endpoint
                // Just a lightweight check if available, or simulate
                const { data } = await api.get('/admin/system-health');
                const isHealthy = data.backend === 'UP' && data.database === 'UP';
                setSystemStatus({
                    status: isHealthy ? 'healthy' : 'issue',
                    label: isHealthy ? 'System Operational' : 'Issues Detected'
                });
            } catch (error) {
                setSystemStatus({ status: 'issue', label: 'System Check Failed' });
            }
        };
        checkHealth();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        // Simple redirection logic for the "Command Bar"
        // In a real app, this could be a global search. 
        // For now, we'll map keywords to routes.
        const term = searchTerm.toLowerCase();
        if (term.includes('user') || term.includes('approve')) navigate('/dashboard#approvals');
        else if (term.includes('health') || term.includes('log')) navigate('/dashboard#health');
        else if (term.includes('setting') || term.includes('config')) navigate('/profile'); // Admin profile has settings
        else navigate('/dashboard'); // Default
    };

    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center relative px-4 text-center overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Header / Greeting */}
            <div className="mb-12 relative z-10 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm mb-6 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => navigate('/dashboard#health')}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${systemStatus.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className={`text-xs font-mono tracking-wider ${systemStatus.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {systemStatus.label.toUpperCase()}
                    </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user.name.split(' ')[0]}</span>
                </h1>
                <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
                    Command Center active. What would you like to manage today?
                </p>
            </div>

            {/* Command Bar */}
            <div className="w-full max-w-2xl mb-16 relative z-10 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                <form onSubmit={handleSearch} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-32 py-4 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all shadow-2xl backdrop-blur-xl text-lg"
                        placeholder="Search users, settings, or system logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                        <span className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded-lg text-xs text-slate-500 font-mono border border-slate-700/50 mr-2 pointer-events-none">
                            <Command className="w-3 h-3" /> K
                        </span>
                        <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Navigation Grid (The Switchboard) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl px-4">
                {quickLinks.map((item, index) => (
                    <div
                        key={index}
                        onClick={() => navigate(item.to)}
                        className={`group relative overflow-hidden bg-slate-900/40 backdrop-blur-sm border ${item.border} p-6 rounded-2xl text-left hover:bg-slate-800/60 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl`}
                    >
                        {/* Hover Gradient Effect */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 blur-[60px] transition-opacity duration-500 rounded-full -mr-10 -mt-10`}></div>

                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} p-[1px] mb-4 group-hover:scale-110 transition-transform duration-300`}>
                            <div className="w-full h-full bg-slate-950/90 rounded-[11px] flex items-center justify-center">
                                <item.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-100 transition-colors">{item.title}</h3>
                        <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
                            {item.description}
                        </p>

                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                            <ArrowRight className="w-5 h-5 text-slate-500" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Minimal Footer */}
            <div className="mt-16 text-slate-600 text-sm font-mono flex items-center gap-4">
                <span>v2.4.0-stable</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                <span>Secure Connection</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                <span className="flex items-center gap-1.5 cursor-pointer hover:text-slate-400 transition-colors" onClick={() => navigate('/notifications')}>
                    <Bell className="w-3 h-3" /> No new alerts
                </span>
            </div>
        </div>
    );
};

export default AdminHome;
