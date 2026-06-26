import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import HealthCard from '@/components/ui/HealthCard';
import EmptyState from '@/components/common/EmptyState';
import { Heart } from 'lucide-react';

export default function MentalHealthChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <HealthCard>
        <EmptyState
          icon={Heart}
          title="No mental health data"
          description="Start tracking your mood to see trends here"
        />
      </HealthCard>
    );
  }

  // Sort by date and format for chart
  const chartData = [...data]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(entry => ({
      date: format(new Date(entry.date), 'MMM d'),
      fullDate: entry.date,
      mood: entry.mood_score || 0,
      anxiety: entry.anxiety_level || 0,
      stress: entry.stress_level || 0,
      energy: entry.energy_level || 0
    }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-medium text-slate-900 mb-2">{payload[0].payload.date}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}/10
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Mood Trend */}
      <HealthCard>
        <h3 className="font-semibold text-lg mb-4">Mood Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              domain={[0, 10]}
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="mood"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#moodGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </HealthCard>

      {/* Comprehensive Mental Health Metrics */}
      <HealthCard>
        <h3 className="font-semibold text-lg mb-4">Mental Health Metrics</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              domain={[0, 10]}
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Mood"
            />
            <Line
              type="monotone"
              dataKey="energy"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Energy"
            />
            <Line
              type="monotone"
              dataKey="anxiety"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Anxiety"
            />
            <Line
              type="monotone"
              dataKey="stress"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Stress"
            />
          </LineChart>
        </ResponsiveContainer>
      </HealthCard>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Mood', value: (chartData.reduce((sum, d) => sum + d.mood, 0) / chartData.length).toFixed(1), color: 'violet' },
          { label: 'Avg Energy', value: (chartData.reduce((sum, d) => sum + d.energy, 0) / chartData.length).toFixed(1), color: 'emerald' },
          { label: 'Avg Anxiety', value: (chartData.reduce((sum, d) => sum + d.anxiety, 0) / chartData.length).toFixed(1), color: 'amber' },
          { label: 'Avg Stress', value: (chartData.reduce((sum, d) => sum + d.stress, 0) / chartData.length).toFixed(1), color: 'red' }
        ].map((stat, idx) => (
          <HealthCard key={idx} className="text-center p-4">
            <p className={`text-2xl font-bold text-${stat.color}-600 mb-1`}>{stat.value}</p>
            <p className="text-sm text-slate-600">{stat.label}</p>
          </HealthCard>
        ))}
      </div>
    </div>
  );
}