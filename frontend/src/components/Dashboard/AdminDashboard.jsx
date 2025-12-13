import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    Activity, Server, Database, Cpu, Settings, BarChart2, AlertCircle, Save,
    Users, UserCheck, TrendingUp, Target, BookOpen, Shield, Megaphone,
    Plus, Download, UserPlus, ArrowUpCircle, CheckCircle, XCircle, FileText, Paperclip
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ResourceManager from '../Admin/ResourceManager';
import QuickStats from './QuickStats';
import { WelcomeBanner, ActivityFeedItem } from './DashboardWidgets';
import QuickActions from './QuickActions';

const AdminDashboard = ({ user }) => {
    // System Health & AI Tuning
    const [health, setHealth] = useState(null);
    const [queue, setQueue] = useState(null);
    const [gaps, setGaps] = useState([]);
    const [weights, setWeights] = useState(null);
    const [logs, setLogs] = useState([]);

    // New Dashboard Data
    const [kpis, setKpis] = useState(null);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [idpProgress, setIdpProgress] = useState(null);
    const [learningAnalytics, setLearningAnalytics] = useState(null);
    const [securityMetrics, setSecurityMetrics] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [skillTargets, setSkillTargets] = useState([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', file: null });
    const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const results = await Promise.allSettled([
                // Existing
                api.get('/admin/system-health'),
                api.get('/admin/queue-health'),
                api.get('/admin/skill-gaps'),
                api.get('/admin/recommender-config'),
                api.get('/admin/audit-logs'),
                // New
                api.get('/admin/dashboard/kpis'),
                api.get('/admin/approvals'),
                api.get('/admin/idp-progress'),
                api.get('/admin/learning-analytics'),
                api.get('/admin/security-metrics'),
                api.get('/admin/announcements'),
                api.get('/admin/skill-targets')
            ]);

            const getData = (result, defaultValue = null) =>
                result.status === 'fulfilled' ? result.value.data : defaultValue;

            setHealth(getData(results[0], { backend: 'UNKNOWN', database: 'UNKNOWN', redis: 'UNKNOWN', recommender: 'UNKNOWN' }));
            setQueue(getData(results[1], { queueLength: 0 }));
            setGaps(getData(results[2], []));
            setWeights(getData(results[3], {}));
            setLogs(getData(results[4], []));
            setKpis(getData(results[5], {}));
            setPendingApprovals(getData(results[6], []));
            setIdpProgress(getData(results[7], null));
            setLearningAnalytics(getData(results[8], null));
            setSecurityMetrics(getData(results[9], null));
            setAnnouncements(getData(results[10], []));
            setSkillTargets(getData(results[11], []));
        } catch (err) {
            console.error("Dashboard fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    // ... Handlers (reused from AdminOverview) ...
    const handleWeightChange = (key, value) => {
        setWeights(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    const saveWeights = async () => { /* ... existing logic ... */
        setSaving(true);
        try { await api.put('/admin/recommender-config', weights); alert("Updated!"); }
        catch (e) { alert("Failed"); } finally { setSaving(false); }
    };

    // Simplifications for brevity: assuming handlers exist or inline them
    const handleApproveUser = async (userId) => {
        if (!confirm('Approve?')) return;
        try { await api.post(`/admin/approvals/${userId}/approve`, { role: 'employee' }); fetchAllData(); } catch (e) { alert("Failed"); }
    };
    const handleDenyUser = async (userId) => {
        const reason = prompt('Reason:'); if (!reason) return;
        try { await api.post(`/admin/approvals/${userId}/deny`, { reason }); fetchAllData(); } catch (e) { alert("Failed"); }
    };
    const handleBulkApprove = async () => {
        if (!confirm(`Approve ${selectedUsers.length}?`)) return;
        try { await api.post('/admin/approvals/bulk-approve', { userIds: selectedUsers, role: 'employee' }); setSelectedUsers([]); fetchAllData(); } catch (e) { alert("Failed"); }
    };
    const toggleUserSelection = (id) => setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleSelectAll = () => setSelectedUsers(selectedUsers.length === pendingApprovals.length ? [] : pendingApprovals.map(u => u._id));
    const handleCreateAnnouncement = async () => {
        try {
            // Use FormData for file upload
            const formData = new FormData();
            formData.append('title', announcementForm.title);
            formData.append('content', announcementForm.content);
            if (announcementForm.file) {
                formData.append('attachment', announcementForm.file);
            }

            await api.post('/admin/announcements', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setAnnouncementForm({ title: '', content: '', file: null });
            setShowAnnouncementForm(false);
            fetchAllData();
        } catch (e) {
            alert("Failed to create announcement");
            console.error(e);
        }
    };
    const handleDeleteAnnouncement = async (id) => {
        if (!confirm('Delete?')) return;
        try { await api.delete(`/admin/announcements/${id}`); fetchAllData(); } catch (e) { alert("Failed"); }
    };

    const saveSkillTargets = async () => {
        setSaving(true);
        try { await api.put('/admin/skill-targets', { targets: skillTargets }); alert("Saved!"); } catch (e) { alert("Failed"); } finally { setSaving(false); }
    };
    const handleSkillTargetChange = (skill, val) => {
        setSkillTargets(prev => {
            const exists = prev.find(s => s.skill === skill);
            return exists ? prev.map(s => s.skill === skill ? { ...s, targetLevel: parseInt(val) } : s) : [...prev, { skill, targetLevel: parseInt(val) }];
        });
    };


    if (loading) return <div className="text-center p-10 text-slate-500">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 fade-in">
            <WelcomeBanner user={user} role="admin" pendingCount={pendingApprovals.length} />

            <QuickStats role="admin" metrics={{ ...kpis, systemStatus: health?.backend === 'UP' ? 'Healthy' : 'Issues', pendingApprovals: pendingApprovals.length }} />

            {/* System Health Section (Full Width) */}
            <div id="health" className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-6 h-6 text-blue-400" />
                        <h3 className="text-2xl font-bold text-white">System Health</h3>
                    </div>
                    <p className="text-slate-400 mb-8 ml-9">Monitor the status of all critical system components</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <SystemHealthCard
                            label="BACKEND API"
                            status={health?.backend}
                            icon={Server}
                        />
                        <SystemHealthCard
                            label="ENGINE"
                            status={health?.recommender}
                            icon={Cpu}
                        />
                        <SystemHealthCard
                            label="DATABASE"
                            status={health?.database}
                            icon={Database}
                        />
                        <SystemHealthCard
                            label="REDIS QUEUE"
                            status={health?.redis}
                            icon={Activity}
                            subtext={`${queue?.queueLength || 0} Jobs Pending`}
                        />
                    </div>
                </div>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>


            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Main Content Column */}
                <div className="xl:col-span-3 space-y-8">

                    {/* Pending Approvals Section */}
                    <div id="approvals" className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-amber-400" /> Pending Approvals
                            </h3>
                            <div className="flex gap-2">
                                {pendingApprovals.length > 0 && (
                                    <>
                                        {selectedUsers.length > 0 && (
                                            <button onClick={handleBulkApprove} className="px-3 py-1 bg-green-600 text-white text-xs rounded">Approve Selected ({selectedUsers.length})</button>
                                        )}
                                        <button onClick={toggleSelectAll} className="px-3 py-1 bg-slate-700 text-white text-xs rounded">Select All</button>
                                    </>
                                )}
                            </div>
                        </div>

                        {pendingApprovals.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 italic">
                                No pending approval requests
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pendingApprovals.map(u => (
                                    <div key={u._id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                        <input type="checkbox" checked={selectedUsers.includes(u._id)} onChange={() => toggleUserSelection(u._id)} className="rounded bg-slate-700 border-slate-600" />
                                        <div className="flex-1">
                                            <p className="text-sm text-white font-medium">{u.name}</p>
                                            <p className="text-xs text-slate-400">{u.email}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApproveUser(u._id)} className="p-1.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20"><CheckCircle className="w-4 h-4" /></button>
                                            <button onClick={() => handleDenyUser(u._id)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"><XCircle className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Charts / Skill Gaps */}
                    <div id="analytics" className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Skill Gap Analysis</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={gaps}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="_id" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                    <Bar dataKey="avgLevel" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* AI Tuning */}
                    {/* Reduced version or full version */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">AI Weight Tuning</h3>
                            <button onClick={saveWeights} disabled={saving} className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-500 disabled:opacity-50">Save</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {weights && Object.entries(weights).map(([k, v]) => (
                                <div key={k}>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span className="capitalize">{k.replace(/_/g, ' ')}</span>
                                        <span>{(v * 100).toFixed(0)}%</span>
                                    </div>
                                    <input type="range" min="0" max="1" step="0.05" value={v} onChange={(e) => handleWeightChange(k, e.target.value)} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Announcements (Moved) */}
                    {/* Announcements (Moved) */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-purple-400" /> Announcements
                            </h3>
                            <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className="text-xs bg-purple-600 px-3 py-1.5 rounded text-white hover:bg-purple-500 transition-colors">New Announcement</button>
                        </div>
                        {showAnnouncementForm && (
                            <div className="mb-6 space-y-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                <input
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="Announcement Title"
                                    value={announcementForm.title}
                                    onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                                />
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white h-24 focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="Content..."
                                    value={announcementForm.content}
                                    onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                                />
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition-colors">
                                        <Paperclip className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs text-slate-300">{announcementForm.file ? announcementForm.file.name : "Attach File (PDF, Doc, etc.)"}</span>
                                        <input type="file" className="hidden" onChange={e => setAnnouncementForm({ ...announcementForm, file: e.target.files[0] })} />
                                    </label>
                                    <div className="flex-1"></div>
                                    <button onClick={() => setShowAnnouncementForm(false)} className="text-slate-400 text-xs hover:text-white mr-3">Cancel</button>
                                    <button onClick={handleCreateAnnouncement} className="bg-purple-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors">Post Announcement</button>
                                </div>
                            </div>
                        )}
                        <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
                            {announcements.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No announcements yet</p>
                                </div>
                            ) : announcements.map(a => (
                                <div key={a._id} className="p-5 bg-slate-800/30 rounded-xl border border-slate-700/50 relative group transition-all hover:bg-slate-800 hover:border-slate-600">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-sm font-bold text-white">{a.title}</h4>
                                        <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">{new Date(a.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{a.content}</p>

                                    {a.attachment && (
                                        <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                                            <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                                                <FileText className="w-3.5 h-3.5 text-blue-400" />
                                            </div>
                                            <a
                                                href={`${api.defaults.baseURL}/admin/announcements/${a._id}/attachment`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                                            >
                                                {a.attachment.filename || "Download Attachment"}
                                                <Download className="w-3 h-3" />
                                            </a>
                                        </div>
                                    )}

                                    <button onClick={() => handleDeleteAnnouncement(a._id)} className="absolute top-3 right-3 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-900 rounded">
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ResourceManager */}
                    <div id="resources">
                        <ResourceManager />
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">

                    {/* Announcements */}


                    {/* Audit Logs */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Recent Audit Logs</h3>
                        <div className="space-y-0">
                            {logs.slice(0, 5).map((log, i) => (
                                <ActivityFeedItem key={i} action={log.action} date={log.timestamp} user={log.user} status="info" />
                            ))}
                        </div>
                    </div>

                    {/* New Sidebar Stats to fill space */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                    <Users className="w-5 h-5" />
                                </div>
                                <span className="text-slate-400 text-xs font-bold uppercase">Active Users (30d)</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{kpis?.activeUsers30d || 0}</p>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="bg-indigo-500 h-full w-3/4 animate-pulse"></div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="text-slate-400 text-xs font-bold uppercase">System Uptime</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{health?.uptime ? (parseInt(health.uptime) / 3600).toFixed(1) + 'h' : '0h'}</p>
                            <p className="text-xs text-slate-500 mt-1">Since last restart</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// New Styled Component matching the image
const SystemHealthCard = ({ label, status, icon: Icon, subtext }) => {
    const isUp = status === 'UP';
    return (
        <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between min-h-[160px] relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg hover:shadow-xl hover:translate-y-[-2px]">
            {/* Soft Glow */}
            <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

            <div className="flex justify-between items-start mb-6">
                <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">{label}</span>
                <div className={`p-2.5 rounded-xl border transition-colors ${isUp ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' : 'bg-red-950/30 text-red-400 border-red-500/20'}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isUp ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
                    <span className="text-2xl font-bold text-white tracking-tight">{status || 'UNKNOWN'}</span>
                </div>
                {subtext && (
                    <div className="inline-block px-3 py-1 rounded-md bg-slate-900 border border-slate-800/50 text-[11px] text-slate-400 font-mono mt-1">
                        {subtext}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminDashboard;
