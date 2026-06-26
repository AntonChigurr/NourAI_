import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import HealthCard from '@/components/ui/HealthCard';
import EmptyState from '@/components/common/EmptyState';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AppointmentAnalytics({ appointments = [] }) {
  if (appointments.length === 0) {
    return (
      <HealthCard>
        <EmptyState
          icon={Calendar}
          title="No appointments"
          description="Your appointment history will appear here"
        />
      </HealthCard>
    );
  }

  // Group by type
  const byType = appointments.reduce((acc, apt) => {
    acc[apt.type] = (acc[apt.type] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(byType).map(([name, value]) => ({
    name: name === 'online' ? 'Video Call' : 'In-Clinic',
    value
  }));

  // Group by status
  const byStatus = appointments.reduce((acc, apt) => {
    acc[apt.status] = (acc[apt.status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(byStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value
  }));

  // Group by month
  const byMonth = appointments.reduce((acc, apt) => {
    const month = format(new Date(apt.scheduled_date), 'MMM yyyy');
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const monthData = Object.entries(byMonth).map(([name, value]) => ({
    name,
    appointments: value
  }));

  const COLORS = ['#1464F4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-medium text-slate-900">{payload[0].name}</p>
          <p className="text-sm text-slate-600">{payload[0].value} appointment{payload[0].value !== 1 ? 's' : ''}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Appointments Over Time */}
      <HealthCard>
        <h3 className="font-semibold text-lg mb-4">Appointments Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="appointments" fill="#1464F4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </HealthCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Type */}
        <HealthCard>
          <h3 className="font-semibold text-lg mb-4">By Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </HealthCard>

        {/* By Status */}
        <HealthCard>
          <h3 className="font-semibold text-lg mb-4">By Status</h3>
          <div className="space-y-3">
            {statusData.map((item, idx) => {
              const percentage = (item.value / appointments.length * 100).toFixed(0);
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                    <Badge variant="outline">{item.value}</Badge>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: COLORS[idx % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </HealthCard>
      </div>

      {/* Recent Appointments List */}
      <HealthCard>
        <h3 className="font-semibold text-lg mb-4">Recent Appointments</h3>
        <div className="space-y-3">
          {appointments.slice(0, 5).map((apt, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-slate-900">{format(new Date(apt.scheduled_date), 'PPP')}</p>
                <p className="text-sm text-slate-500">{apt.type === 'online' ? 'Video Call' : 'In-Clinic'} • {apt.reason || 'General consultation'}</p>
              </div>
              <Badge variant="outline" className={
                apt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                apt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-blue-50 text-blue-700 border-blue-200'
              }>
                {apt.status}
              </Badge>
            </div>
          ))}
        </div>
      </HealthCard>
    </div>
  );
}