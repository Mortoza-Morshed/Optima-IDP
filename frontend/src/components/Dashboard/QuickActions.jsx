import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    UserPlus, FilePlus, Search, BarChart2, Shield,
    BookOpen, Users, PlusCircle, CheckSquare, Activity,
    LogOut, User
} from 'lucide-react';

const QuickActions = ({ role }) => {
    const navigate = useNavigate();
    const searchRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const actions = {
        admin: [
            { label: "Approve Users", icon: UserPlus, to: "/dashboard#approvals", color: "text-amber-400" },
            { label: "Add Resource", icon: FilePlus, to: "/dashboard#resources", color: "text-emerald-400" },
            { label: "View Analytics", icon: BarChart2, to: "/dashboard#analytics", color: "text-blue-400" },
            { label: "System Health", icon: Shield, to: "/dashboard#health", color: "text-rose-400" }
        ],
        manager: [
            { label: "Review IDPs", icon: CheckSquare, to: "/dashboard#approvals", color: "text-amber-400" },
            { label: "Team Overview", icon: Users, to: "/dashboard#team", color: "text-blue-400" },
            { label: "Add Review", icon: PlusCircle, to: "/dashboard#reviews", color: "text-purple-400" }
        ],
        employee: [
            { label: "Create IDP", icon: PlusCircle, to: "/idp/create", color: "text-emerald-400" },
            { label: "Recommendations", icon: BookOpen, to: "/dashboard#recommendations", color: "text-blue-400" },
            { label: "Update Skills", icon: Activity, to: "/profile#skills", color: "text-purple-400" }
        ]
    };

    const globalCommands = [
        { label: "My Profile", icon: User, to: "/profile", color: "text-slate-400" },
        { label: "Dashboard", icon: BarChart2, to: "/dashboard", color: "text-slate-400" },
    ];

    const currentRoleActions = actions[role] || [];
    const allCommands = [...currentRoleActions, ...globalCommands];

    const filteredCommands = allCommands.filter(cmd =>
        cmd.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
            if (isSearchOpen) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const cmd = filteredCommands[selectedIndex];
                    if (cmd) {
                        handleCommandSelect(cmd);
                    }
                } else if (e.key === 'Escape') {
                    setIsSearchOpen(false);
                    searchRef.current?.blur();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen, filteredCommands, selectedIndex]);

    const handleCommandSelect = (cmd) => {
        if (cmd.to.startsWith('#')) {
            const element = document.getElementById(cmd.to.substring(1));
            element?.scrollIntoView({ behavior: 'smooth' });
        } else if (cmd.to.includes('#')) {
            const [path, hash] = cmd.to.split('#');
            if (window.location.pathname === path) {
                const element = document.getElementById(hash);
                element?.scrollIntoView({ behavior: 'smooth' });
            } else {
                navigate(cmd.to);
            }
        } else {
            navigate(cmd.to);
        }
        setIsSearchOpen(false);
        setSearchTerm('');
    };

    if (currentRoleActions.length === 0) return null;

    return (
        <div className="sticky top-[80px] z-30 mb-8">
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-4 overflow-visible">

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 whitespace-nowrap">Quick Actions</span>
                    <div className="h-6 w-px bg-slate-700 shrink-0"></div>
                    <div className="flex gap-2">
                        {currentRoleActions.map((action, idx) => (
                            <Link
                                key={idx}
                                to={action.to}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg transition-all text-sm font-medium text-slate-200 hover:text-white whitespace-nowrap"
                            >
                                <action.icon className={`w-4 h-4 ${action.color}`} />
                                {action.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Global Search / Command Palette */}
                <div className="relative hidden lg:block group w-64 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                    <input
                        ref={searchRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsSearchOpen(true);
                            setSelectedIndex(0);
                        }}
                        onFocus={() => setIsSearchOpen(true)}
                        onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                        placeholder="Quick Find... (Cmd+K)"
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 w-full transition-all"
                    />

                    {/* Dropdown Results */}
                    {isSearchOpen && (
                        <div className="absolute top-full right-0 mt-2 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                            {filteredCommands.length === 0 ? (
                                <div className="px-4 py-3 text-xs text-slate-500 text-center">No results found</div>
                            ) : (
                                <div>
                                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-950/30">Commands</div>
                                    {filteredCommands.map((cmd, idx) => (
                                        <button
                                            key={idx}
                                            onMouseDown={(e) => { e.preventDefault(); handleCommandSelect(cmd); }}
                                            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${idx === selectedIndex ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                                                }`}
                                        >
                                            <cmd.icon className={`w-4 h-4 ${idx === selectedIndex ? 'text-white' : cmd.color}`} />
                                            <span>{cmd.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex justify-between text-[10px] text-slate-500">
                                <span>Navigate <kbd className="font-sans border border-slate-700 rounded px-1">↓</kbd> <kbd className="font-sans border border-slate-700 rounded px-1">↑</kbd></span>
                                <span>Select <kbd className="font-sans border border-slate-700 rounded px-1">↵</kbd></span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default QuickActions;
