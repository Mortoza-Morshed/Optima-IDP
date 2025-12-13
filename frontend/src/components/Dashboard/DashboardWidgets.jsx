import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, CheckCircle, AlertCircle, TrendingUp, Calendar } from 'lucide-react';

export const WelcomeBanner = ({ user, role, pendingCount = 0 }) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const getSubtext = () => {
        if (role === 'admin') return `You have ${pendingCount} pending approvals requiring attention.`;
        if (role === 'manager') return `You have ${pendingCount} IDPs awaiting review.`;
        return "Ready to continue your learning journey?";
    };

    return (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 mb-8">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <p className="text-purple-400 font-semibold tracking-wide uppercase text-xs mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Optima IDP
                    </p>
                    <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-2 pb-3 relative z-10 leading-normal">
                        {getGreeting()}, {user.name.split(' ')[0]}.
                    </h1>
                    <p className="text-lg text-slate-400 max-w-xl">
                        {getSubtext()}
                    </p>
                </div>

                {/* Date/Time Badge */}
                <div className="hidden md:flex flex-col items-end">
                    <div className="px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                        <p className="text-slate-300 font-mono text-sm">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const StatCard = ({ label, value, subtext, icon: Icon, color = 'purple', trend }) => {
    const colors = {
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        slate: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    };

    const style = colors[color] || colors.slate;

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group hover:transform hover:scale-[1.02] duration-300">
            <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{label}</p>
                <div className={`p-2 rounded-lg ${style}`}>
                    {Icon && <Icon className="w-5 h-5" />}
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-white">{value}</h3>
                {trend && (
                    <span className={`text-xs font-medium flex items-center ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                        <TrendingUp className={`w-3 h-3 ml-1 ${trend < 0 ? 'rotate-180' : ''}`} />
                    </span>
                )}
            </div>
            {subtext && <p className="text-xs text-slate-500 mt-2">{subtext}</p>}
        </div>
    );
};

export const ActivityFeedItem = ({ action, date, user, status }) => (
    <div className="relative pl-6 pb-6 last:pb-0 border-l border-slate-800">
        <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${status === 'completed' ? 'bg-emerald-500' :
            status === 'pending' ? 'bg-amber-500' :
                status === 'approved' ? 'bg-purple-500' : 'bg-blue-500'
            }`}></div>
        <p className="text-sm text-slate-200 font-medium">{action}</p>
        <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-slate-600" />
            <span className="text-xs text-slate-500">{new Date(date).toLocaleDateString()}</span>
            {user && <span className="text-xs text-slate-600">• {user}</span>}
        </div>
    </div>
);

export const NotificationItem = ({ title, message, time, type = 'info' }) => (
    <div className="p-4 bg-slate-800/30 border border-slate-800/50 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer group">
        <div className="flex gap-3">
            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${type === 'warning' ? 'bg-amber-500' :
                type === 'success' ? 'bg-emerald-500' :
                    type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
                }`} />
            <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{title}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{message}</p>
                <span className="text-[10px] text-slate-600 mt-2 block uppercase tracking-wider">{time}</span>
            </div>
        </div>
    </div>
);
