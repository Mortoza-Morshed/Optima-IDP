import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import QuickStats from './QuickStats';
import { WelcomeBanner, ActivityFeedItem } from './DashboardWidgets';
import { CheckCircle, Clock, XCircle, User } from 'lucide-react';

const ManagerDashboard = ({ user }) => {
    const [metrics, setMetrics] = useState(null);
    const [pendingIDPs, setPendingIDPs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, idpRes] = await Promise.all([
                    api.get('/idp/metrics/team'),
                    api.get('/idp/pending')
                ]);
                setMetrics(metricsRes.data);
                setPendingIDPs(idpRes.data.idps || []);
            } catch (err) {
                console.error("Manager fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAction = async (idpId, status) => {
        const feedback = status === 'approved' ? "Approved by manager" : prompt("Feedback:");
        if (status !== 'approved' && !feedback) return;

        try {
            await api.put(`/idp/approve/${idpId}`, { status, managerFeedback: feedback });
            setPendingIDPs(prev => prev.filter(p => p._id !== idpId));
            // Refresh metrics if needed
        } catch (err) {
            alert("Action failed");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8 fade-in">
            <WelcomeBanner user={user} role="manager" pendingCount={pendingIDPs.length} />
            <QuickStats role="manager" metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Pending Approvals */}
                    <div id="approvals" className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">IDP Review Requests</h3>
                            <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-sm font-medium">{pendingIDPs.length} Pending</span>
                        </div>

                        {pendingIDPs.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 italic">All caught up! No pending reviews.</div>
                        ) : (
                            <div className="space-y-4">
                                {pendingIDPs.map(idp => (
                                    <div key={idp._id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                                    {idp.employee?.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-white">{idp.employee?.name}</h4>
                                                    <p className="text-xs text-slate-400">{new Date(idp.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded uppercase tracking-wider">{idp.status}</span>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-sm text-slate-300 mb-2 font-medium">Goal Focus:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {idp.skillsToImprove?.map((s, i) => (
                                                    <span key={i} className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-1 rounded">
                                                        {s.skill?.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-3 border-t border-slate-700/50">
                                            <button onClick={() => handleAction(idp._id, 'approved')} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors">Approve Plan</button>
                                            <button onClick={() => handleAction(idp._id, 'needs_revision')} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">Request Changes</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    {/* Team Activity or Other Widgets */}
                    <div id="team" className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Team Shortcuts</h3>
                        <div id="reviews" className="space-y-2">
                            <button className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors text-sm">
                                View Team Analytics
                            </button>
                            <button className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors text-sm">
                                Generate Weekly Report
                            </button>
                            <button className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors text-sm" onClick={() => alert("Performance Reviews module is currently under development.")}>
                                Performance Reviews
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
