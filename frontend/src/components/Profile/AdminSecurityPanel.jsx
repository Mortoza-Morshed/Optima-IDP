import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield, Users, Key, Lock, AlertTriangle, Check, X } from 'lucide-react';

const AdminSecurityPanel = () => {
    const [sessions, setSessions] = useState([]);
    const [passwordPolicy, setPasswordPolicy] = useState(null);
    const [securityConfig, setSecurityConfig] = useState(null);
    const [inactiveLockoutDays, setInactiveLockoutDays] = useState(90);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showRevokeModal, setShowRevokeModal] = useState(false);

    useEffect(() => {
        fetchSecurityData();
    }, []);

    const fetchSecurityData = async () => {
        try {
            const [sessionsRes, policyRes, configRes] = await Promise.all([
                api.get('/admin/security/company-sessions'),
                api.get('/admin/security/password-policy'),
                api.get('/admin/security/config')
            ]);

            setSessions(sessionsRes.data);
            setPasswordPolicy(policyRes.data);
            setSecurityConfig(configRes.data);
            setInactiveLockoutDays(configRes.data.companySettings.inactiveLockoutDays);
        } catch (error) {
            console.error('Failed to fetch security data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeTokens = async () => {
        try {
            const res = await api.post('/admin/security/revoke-company-tokens');
            alert(res.data.message);
            setShowRevokeModal(false);
            fetchSecurityData(); // Refresh data
        } catch (error) {
            alert('Failed to revoke tokens');
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await api.put('/admin/security/company-settings', {
                inactiveLockoutDays: parseInt(inactiveLockoutDays)
            });
            alert('Company settings updated successfully');
            fetchSecurityData();
        } catch (error) {
            alert('Failed to update settings');
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
            {/* Company Session Management */}
            <div className="border-t border-slate-800 pt-8">
                <div className="flex items-center gap-3 mb-6">
                    <Users className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-semibold text-white">Company Session Management</h3>
                </div>

                {/* Revoke Tokens Button */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowRevokeModal(true)}
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                        <AlertTriangle className="w-5 h-5" />
                        Revoke All Company Tokens
                    </button>
                    <p className="text-sm text-slate-400 mt-2">Force logout all users in your organization</p>
                </div>

                {/* Recent Sessions Table */}
                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800">
                        <h4 className="text-white font-medium">Recent Login Activity</h4>
                    </div>
                    {sessions.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Role</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Last Login</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((session, idx) => (
                                    <tr key={idx} className="border-b border-slate-800 last:border-0 hover:bg-slate-900">
                                        <td className="px-6 py-4 text-white">{session.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${session.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                                                    session.role === 'manager' ? 'bg-blue-500/20 text-blue-300' :
                                                        'bg-slate-500/20 text-slate-300'
                                                }`}>
                                                {session.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-400 font-mono text-sm">
                                            {new Date(session.lastLogin).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="px-6 py-12 text-center text-slate-500">
                            No recent login activity
                        </div>
                    )}
                </div>
            </div>

            {/* Company Security Policy */}
            <div className="border-t border-slate-800 pt-8">
                <div className="flex items-center gap-3 mb-6">
                    <Lock className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-semibold text-white">Company Security Policy</h3>
                </div>

                {/* Password Policy */}
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-6 mb-6">
                    <h4 className="text-white font-medium mb-4">Password Requirements</h4>
                    {passwordPolicy && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-slate-300">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span>Minimum {passwordPolicy.minLength} characters</span>
                            </div>
                            {passwordPolicy.requireUppercase && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Uppercase letter required</span>
                                </div>
                            )}
                            {passwordPolicy.requireLowercase && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Lowercase letter required</span>
                                </div>
                            )}
                            {passwordPolicy.requireNumber && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Number required</span>
                                </div>
                            )}
                            {passwordPolicy.requireSpecialChar && (
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span>Special character required</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Inactive Lockout Settings */}
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-6">
                    <h4 className="text-white font-medium mb-4">Inactive Account Lockout</h4>
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Auto-lock account after (days):
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={inactiveLockoutDays}
                                onChange={(e) => setInactiveLockoutDays(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                            />
                        </div>
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                    <p className="text-sm text-slate-400 mt-3">
                        Accounts inactive for this duration will be automatically locked
                    </p>
                </div>
            </div>

            {/* RBAC Overview */}
            <div className="border-t border-slate-800 pt-8">
                <div className="flex items-center gap-3 mb-6">
                    <Key className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-semibold text-white">Role Permissions Matrix</h3>
                </div>

                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Action</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Employee</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Manager</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase">Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {securityConfig?.rbacMatrix.map((row, idx) => (
                                <tr key={idx} className="border-b border-slate-800 last:border-0 hover:bg-slate-900">
                                    <td className="px-6 py-4 text-white">{row.action}</td>
                                    <td className="px-6 py-4 text-center">
                                        {row.employee ? (
                                            <Check className="w-5 h-5 text-emerald-500 inline" />
                                        ) : (
                                            <X className="w-5 h-5 text-red-500 inline" />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {row.manager ? (
                                            <Check className="w-5 h-5 text-emerald-500 inline" />
                                        ) : (
                                            <X className="w-5 h-5 text-red-500 inline" />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {row.admin ? (
                                            <Check className="w-5 h-5 text-emerald-500 inline" />
                                        ) : (
                                            <X className="w-5 h-5 text-red-500 inline" />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Revoke Tokens Modal */}
            {showRevokeModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                            <h3 className="text-2xl font-bold text-white">Confirm Token Revocation</h3>
                        </div>
                        <p className="text-slate-300 mb-6">
                            This will force logout <strong className="text-white">ALL users</strong> in your organization.
                            They will need to log in again to continue using the platform.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleRevokeTokens}
                                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
                            >
                                Yes, Revoke All Tokens
                            </button>
                            <button
                                onClick={() => setShowRevokeModal(false)}
                                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSecurityPanel;
