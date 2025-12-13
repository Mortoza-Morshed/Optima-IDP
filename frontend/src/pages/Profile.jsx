import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../store/useAuth.jsx';
import AdminSecurityPanel from '../components/Profile/AdminSecurityPanel';
import AdminPreferencesPanel from '../components/Profile/AdminPreferencesPanel';

// Helper to get full image URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${api.defaults.baseURL.replace('/api', '')}/${path}`;
};

function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/user/me');
      setProfile(res.data?.user || null);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to fetch profile' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || ''
      }));
    }
  }, [profile]);

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || '??';
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size too large (max 5MB)' });
      return;
    }

    const uploadData = new FormData();
    uploadData.append('avatar', file);

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.put('/user/me', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data.user);
      setMessage({ type: 'success', text: 'Profile picture updated!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const payload = {};

      if (activeTab === 'security') {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        payload.password = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      } else if (activeTab === 'general') {
        payload.name = formData.name;
      }

      const res = await api.put('/user/me', payload);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setProfile(res.data.user);

      // Clear password fields (but keep name)
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Update failed'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile && loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8 font-sans flex justify-center">
      <div className="max-w-7xl w-full">

        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 shadow-xl">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-purple-900/40 overflow-hidden relative">
              {profile?.avatar ? (
                <img src={getImageUrl(profile.avatar)} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                getInitials(profile?.name)
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-medium text-white">Change</span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{profile?.name}</h1>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/30 capitalize">
                {profile?.role}
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={logout}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1 space-y-2 lg:sticky lg:top-28 h-fit">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'general'
                ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'security'
                ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'preferences'
                ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
            >
              Preferences
            </button>
            <button
              id="skills-tab"
              onClick={() => setActiveTab('skills')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'skills'
                ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
            >
              Skills
            </button>
          </div>

          {/* Form Area */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-white mb-6 border-b border-slate-800 pb-4">
                {activeTab === 'general' && 'General Information'}
                {activeTab === 'security' && 'Security Settings'}
                {activeTab === 'preferences' && 'User Preferences'}
              </h2>

              {message.text && (
                <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}>
                  {message.text}
                </div>
              )}

              {activeTab === 'general' && (
                <div className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                    <div className="w-full bg-slate-950/30 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-400 cursor-not-allowed">
                      {profile?.email}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleUpdate}
                      disabled={loading}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8 max-w-xl">
                  {/* Password Update - Available for everyone */}
                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                          placeholder="Min. 8 characters"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <button type="submit" disabled={loading} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>

                  {/* Admin Specific Security Options */}
                  {profile?.role === 'admin' && (
                    <AdminSecurityPanel />
                  )}
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6 max-w-xl">
                  {/* Common Preferences */}
                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                      <h4 className="text-white font-medium">Email Notifications</h4>
                      <p className="text-sm text-slate-400">Receive weekly digests and major updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={profile?.preferences?.emailNotifications ?? true}
                        onChange={async (e) => {
                          const newVal = e.target.checked;
                          // Optimistic update
                          const oldProfile = { ...profile };
                          setProfile(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, emailNotifications: newVal }
                          }));

                          try {
                            await api.put('/user/me', {
                              preferences: { emailNotifications: newVal }
                            });
                          } catch (err) {
                            // Revert on failure
                            setProfile(oldProfile);
                            setMessage({ type: 'error', text: 'Failed to update preference' });
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                      <h4 className="text-white font-medium">Dark Mode</h4>
                      <p className="text-sm text-slate-400">Sync with system theme</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={profile?.preferences?.darkMode ?? true}
                        onChange={async (e) => {
                          const newVal = e.target.checked;
                          const oldProfile = { ...profile };
                          setProfile(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, darkMode: newVal }
                          }));

                          try {
                            await api.put('/user/me', {
                              preferences: { darkMode: newVal }
                            });
                          } catch (err) {
                            setProfile(oldProfile);
                            setMessage({ type: 'error', text: 'Failed to update preference' });
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Manager Specific Preferences */}
                  {profile?.role === 'manager' && (
                    <div className="pt-6 border-t border-slate-800">
                      <h3 className="text-lg font-medium text-white mb-4">Manager Settings</h3>
                      <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                        <div>
                          <h4 className="text-white font-medium">Weekly Team Report</h4>
                          <p className="text-sm text-slate-400">Receive a summary of team IDP progress</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={profile?.preferences?.weeklyReports ?? true}
                            onChange={async (e) => {
                              const newVal = e.target.checked;
                              const oldProfile = { ...profile };
                              setProfile(prev => ({
                                ...prev,
                                preferences: { ...prev.preferences, weeklyReports: newVal }
                              }));

                              try {
                                await api.put('/user/me', {
                                  preferences: { weeklyReports: newVal }
                                });
                                setMessage({ type: 'success', text: 'Preference updated' });
                              } catch (err) {
                                setProfile(oldProfile);
                                setMessage({ type: 'error', text: 'Failed to update preference' });
                              }
                            }}
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Admin Specific Preferences */}
                  {profile?.role === 'admin' && (
                    <AdminPreferencesPanel />
                  )}
                </div>
              )}

              {activeTab === 'skills' && (
                <div id="skills" className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">My Skills</h3>
                    <button className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition-colors" onClick={() => alert("Skill assessment feature coming soon!")}>
                      Take Assessment
                    </button>
                  </div>
                  <div className="p-8 border-2 border-dashed border-slate-800 rounded-xl text-center bg-slate-900/50">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-slate-300 font-medium mb-2">No skills recorded yet</h4>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                      Start adding your verified skills to get personalized IDP recommendations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
