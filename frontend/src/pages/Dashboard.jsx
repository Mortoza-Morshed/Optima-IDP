import React from 'react';
import { useAuth } from '../store/useAuth.jsx';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import ManagerDashboard from '../components/Dashboard/ManagerDashboard';
import EmployeeDashboard from '../components/Dashboard/EmployeeDashboard';
import QuickActions from '../components/Dashboard/QuickActions';

function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || 'employee';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <QuickActions role={role} />

        {role === 'admin' && <AdminDashboard user={user} />}
        {role === 'manager' && <ManagerDashboard user={user} />}
        {role === 'employee' && <EmployeeDashboard user={user} />}
      </div>
    </div>
  );
}

export default Dashboard;
