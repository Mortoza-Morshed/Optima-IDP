import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, Plus, Edit, Trash2, Link as LinkIcon, Search, Filter } from 'lucide-react';

const ResourceManager = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        type: 'course',
        relatedSkills: []
    });

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const res = await api.get('/resource/all');
            // Backend returns {resources: [...], source: "cache|database"}
            setResources(res.data.resources || res.data);
        } catch (err) {
            console.error('Failed to fetch resources:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddResource = async () => {
        if (!formData.title || !formData.link) {
            alert('Title and link are required');
            return;
        }

        try {
            if (editingResource) {
                await api.put(`/resource/update/${editingResource._id}`, formData);
                alert('Resource updated successfully');
            } else {
                await api.post('/resource/add', formData);
                alert('Resource added successfully');
            }
            setShowAddForm(false);
            setEditingResource(null);
            fetchResources();
            resetForm();
        } catch (err) {
            alert(`Failed to ${editingResource ? 'update' : 'add'} resource`);
        }
    };

    const handleEditResource = (resource) => {
        setEditingResource(resource);
        setFormData({
            title: resource.title,
            description: resource.description || '',
            link: resource.link,
            type: resource.type || 'course',
            relatedSkills: resource.relatedSkills || []
        });
        setShowAddForm(true);
    };

    const handleDeleteResource = async (id) => {
        if (!confirm('Delete this resource?')) return;
        try {
            await api.delete(`/resource/delete/${id}`);
            alert('Resource deleted');
            fetchResources();
        } catch (err) {
            alert('Failed to delete resource');
        }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', link: '', type: 'course', relatedSkills: [] });
    };

    const filteredResources = resources.filter(resource => {
        const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || resource.type === filterType;
        return matchesSearch && matchesType;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">Loading resources...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-cyan-400" />
                        Resource Library
                    </h2>
                    <p className="text-slate-400 mt-1">{resources.length} total resources available</p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(!showAddForm);
                        if (!showAddForm) {
                            setEditingResource(null);
                            resetForm();
                        }
                    }}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg">
                    <Plus className="w-5 h-5" /> Add Resource
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search resources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-cyan-500"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full md:w-48 pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-cyan-500 cursor-pointer">
                        <option value="all">All Types</option>
                        <option value="course">Courses</option>
                        <option value="article">Articles</option>
                        <option value="video">Videos</option>
                        <option value="book">Books</option>
                    </select>
                </div>
            </div>

            {/* Add/Edit Resource Form */}
            {showAddForm && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
                    <h3 className="text-xl font-semibold text-white mb-4">
                        {editingResource ? 'Edit Resource' : 'Add New Resource'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-slate-300 text-sm font-medium block mb-2">Resource Title *</label>
                            <input
                                type="text"
                                placeholder="e.g., Advanced React Patterns"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="text-slate-300 text-sm font-medium block mb-2">Description</label>
                            <textarea
                                placeholder="Brief description of the resource..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 min-h-[100px]"
                            />
                        </div>
                        <div>
                            <label className="text-slate-300 text-sm font-medium block mb-2">Resource URL *</label>
                            <input
                                type="url"
                                placeholder="https://example.com/resource"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="text-slate-300 text-sm font-medium block mb-2">Resource Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 cursor-pointer">
                                <option value="course">Course</option>
                                <option value="article">Article</option>
                                <option value="video">Video</option>
                                <option value="book">Book</option>
                            </select>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleAddResource}
                                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-all">
                                {editingResource ? 'Update Resource' : 'Add Resource'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingResource(null);
                                    resetForm();
                                }}
                                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resources Grid */}
            {filteredResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map(resource => (
                        <div key={resource._id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-semibold rounded-full">
                                    {resource.type}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEditResource(resource)}
                                        className="text-blue-400 hover:text-blue-300 transition-colors">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteResource(resource._id)}
                                        className="text-red-400 hover:text-red-300 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h4 className="text-white font-semibold text-lg mb-2 line-clamp-2">{resource.title}</h4>
                            <p className="text-slate-400 text-sm mb-4 line-clamp-3">{resource.description || 'No description provided'}</p>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">{resource.views || 0} views</span>
                                {resource.link && (
                                    <a
                                        href={resource.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors">
                                        <LinkIcon className="w-3 h-3" /> Open
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-slate-800/50 border border-slate-700 rounded-2xl">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400 font-medium">
                        {searchTerm || filterType !== 'all' ? 'No resources match your search' : 'No resources available yet'}
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                        {searchTerm || filterType !== 'all' ? 'Try adjusting your filters' : 'Click "Add Resource" to get started'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ResourceManager;
