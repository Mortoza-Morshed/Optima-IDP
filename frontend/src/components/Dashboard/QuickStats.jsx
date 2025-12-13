import React from 'react';
import { StatCard } from './DashboardWidgets';
import { Users, FileText, CheckCircle, TrendingUp, Shield, Activity, BookOpen, Clock } from 'lucide-react';

const QuickStats = ({ role, metrics, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-xl"></div>
                ))}
            </div>
        );
    }

    if (!metrics) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {role === 'admin' && (
                <>
                    <StatCard
                        label="Total Users"
                        value={metrics.totalUsers}
                        icon={Users}
                        color="indigo"
                        subtext={`${metrics.activeUsers7d || 0} active in last 7 days`}
                    />
                    <StatCard
                        label="Pending Approvals"
                        value={metrics.pendingApprovals}
                        icon={Clock}
                        color={metrics.pendingApprovals > 0 ? "amber" : "emerald"}
                        subtext="Requires immediate attention"
                    />
                    <StatCard
                        label="System Health"
                        value={metrics.systemStatus || "Healthy"}
                        icon={Activity}
                        color={metrics.systemStatus === 'Healthy' ? "emerald" : "rose"}
                        subtext="All systems operational"
                    />
                    <StatCard
                        label="Security Incidents"
                        value={metrics.securityIncidents || 0}
                        icon={Shield}
                        color={metrics.securityIncidents > 0 ? "rose" : "slate"}
                        subtext="Last 30 days"
                    />
                </>
            )}

            {role === 'manager' && (
                <>
                    <StatCard
                        label="Team Size"
                        value={metrics.totalReports}
                        icon={Users}
                        color="blue"
                        subtext="Direct reports"
                    />
                    <StatCard
                        label="Pending IDPs"
                        value={metrics.pendingApprovals}
                        icon={FileText}
                        color={metrics.pendingApprovals > 0 ? "amber" : "emerald"}
                        subtext="Awaiting your review"
                    />
                    <StatCard
                        label="Team Skill Avg"
                        value={metrics.teamAvgSkill}
                        icon={TrendingUp}
                        color="purple"
                        subtext="Across all skills"
                    />
                    <StatCard
                        label="Completed Goals"
                        value={metrics.teamCompletedGoals || 0}
                        icon={CheckCircle}
                        color="emerald"
                        subtext="This quarter"
                    />
                </>
            )}

            {role === 'employee' && (
                <>
                    <StatCard
                        label="Active Plans"
                        value={metrics.inProgressIDPs}
                        icon={FileText}
                        color="blue"
                        subtext="Goals in progress"
                    />
                    <StatCard
                        label="Completed Goals"
                        value={metrics.completedIDPs}
                        icon={CheckCircle}
                        color="emerald"
                        subtext="Keep up the great work!"
                    />
                    <StatCard
                        label="Current Level"
                        value={metrics.currentLevel || "N/A"}
                        icon={Activity}
                        color="purple"
                        subtext="Skill proficiency"
                    />
                    <StatCard
                        label="Resources"
                        value={metrics.recommendedResources || 0}
                        icon={BookOpen}
                        color="cyan"
                        subtext="Recommended for you"
                    />
                </>
            )}
        </div>
    );
};

export default QuickStats;
