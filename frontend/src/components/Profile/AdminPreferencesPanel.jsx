import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Settings, Mail, Target, Globe, Save } from 'lucide-react';

const AdminPreferencesPanel = () => {
    const [preferences, setPreferences] = useState({
        weeklyManagerReports: true,
        notifyManagerOnNewIDP: true,
        defaultTargetLevel: 5,
        timezone: 'UTC'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const res = await api.get('/admin/preferences');
            setPreferences(res.data);
        } catch (error) {
            console.error('Failed to fetch preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (field) => {
        setPreferences(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleChange = (field, value) => {
        setPreferences(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.put('/admin/preferences', preferences);
            setMessage({ type: 'success', text: 'Preferences saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save preferences' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Organizational Policies */}
            <div className="border-t border-slate-800 pt-8">
                <div className="flex items-center gap-3 mb-6">
                    <Mail className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-semibold text-white">Organizational Policies</h3>
                </div>

                <div className="space-y-4">
                    {/* Weekly Manager Reports */}
                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                        <div>
                            <h4 className="text-white font-medium">Weekly Manager Reports</h4>
                            <p className="text-sm text-slate-400">Send automatic weekly IDP progress reports to managers</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={preferences.weeklyManagerReports}
                                onChange={() => handleToggle('weeklyManagerReports')}
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {/* New IDP Notification */}
                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                        <div>
                            <h4 className="text-white font-medium">New IDP Notifications</h4>
                            <p className="text-sm text-slate-400">Notify managers immediately when employees submit new IDPs</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={preferences.notifyManagerOnNewIDP}
                                onChange={() => handleToggle('notifyManagerOnNewIDP')}
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* IDP Configuration */}
            <div className="border-t border-slate-800 pt-8">
                <div className="flex items-center gap-3 mb-6">
                    <Target className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-semibold text-white">IDP Configuration</h3>
                </div>

                <div className="bg-slate-950 rounded-lg border border-slate-800 p-6">
                    <h4 className="text-white font-medium mb-4">Default Target Skill Level</h4>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={preferences.defaultTargetLevel}
                            onChange={(e) => handleChange('defaultTargetLevel', parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="w-16 text-center">
                            <span className="text-2xl font-bold text-purple-400">{preferences.defaultTargetLevel}</span>
                            <p className="text-xs text-slate-500">/ 10</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-3">
                        Default target level for new IDPs. Affects skill gap calculations and recommendations.
                    </p>
                </div>
            </div>

            {/* Regional Settings */}
            <div className="border-t border-slate-800 pt-8">
                <div className="flex items-center gap-3 mb-6">
                    <Globe className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-semibold text-white">Regional Settings</h3>
                </div>

                <div className="bg-slate-950 rounded-lg border border-slate-800 p-6">
                    <h4 className="text-white font-medium mb-4">Organization Timezone</h4>
                    <select
                        value={preferences.timezone}
                        onChange={(e) => handleChange('timezone', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT/BST)</option>
                        <option value="Europe/Paris">Central European Time (CET)</option>
                        <option value="Asia/Dubai">Dubai (GST)</option>
                        <option value="Asia/Kolkata">India (IST)</option>
                        <option value="Asia/Singapore">Singapore (SGT)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                        <option value="Australia/Sydney">Sydney (AEDT)</option>
                    </select>
                    <p className="text-sm text-slate-400 mt-3">
                        Used for displaying timestamps and scheduling automated tasks
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="border-t border-slate-800 pt-6">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
        </div>
    );
};

export default AdminPreferencesPanel;
