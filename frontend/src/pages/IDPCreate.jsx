import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Target } from 'lucide-react';

const IDPCreate = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                            <Target className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Create Development Plan</h1>
                            <p className="text-slate-400">Define your goals and skills for the next quarter.</p>
                        </div>
                    </div>

                    <div className="space-y-6 max-w-2xl">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Primary Goal</label>
                            <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" placeholder="e.g. Become a Team Lead" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Target Skills</label>
                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-slate-500 italic text-sm">
                                Skill selection widget coming soon...
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Timeline</label>
                            <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500">
                                <option>3 Months</option>
                                <option>6 Months</option>
                                <option>1 Year</option>
                            </select>
                        </div>

                        <div className="pt-6 flex gap-4">
                            <button className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save Draft
                            </button>
                            <button className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IDPCreate;
