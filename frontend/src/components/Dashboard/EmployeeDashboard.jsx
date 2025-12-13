import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import QuickStats from './QuickStats';
import { WelcomeBanner } from './DashboardWidgets';
import { Link } from 'react-router-dom';

const EmployeeDashboard = ({ user }) => {
    const [metrics, setMetrics] = useState(null);
    const [activeIDPs, setActiveIDPs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, idpRes] = await Promise.all([
                    api.get('/idp/metrics/employee'),
                    api.get('/idp/my-idps')
                ]);
                setMetrics(metricsRes.data);
                setActiveIDPs(idpRes.data.idps.filter(idp => ['draft', 'pending', 'approved', 'processing'].includes(idp.status)));
            } catch (err) {
                console.error("Employee fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8 fade-in">
            <WelcomeBanner user={user} role="employee" />
            <QuickStats role="employee" metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Current Focus</h3>
                            <Link to="/idp/create" className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors">Start New Plan</Link>
                        </div>

                        {activeIDPs.length > 0 ? (
                            <div className="space-y-4">
                                {activeIDPs.map(idp => (
                                    <div key={idp._id} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-semibold text-white">{idp.goals}</span>
                                            <span className="text-xs px-2 py-1 bg-slate-950 rounded text-slate-400 uppercase">{idp.status}</span>
                                        </div>
                                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                            <div className="bg-purple-500 h-full w-1/3"></div>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400 flex justify-between">
                                            <span>Progress</span>
                                            <span>33%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                                <p className="text-slate-400 mb-4">You have no active development plans.</p>
                                <Link to="/idp/create" className="text-purple-400 hover:text-purple-300 font-medium">Create your first IDP &rarr;</Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    {/* Recommendations or Skills */}
                    <div id="recommendations" className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Recommended for You</h3>
                        <p className="text-slate-500 text-sm italic">AI Recommendations engine is analyzing your profile...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
