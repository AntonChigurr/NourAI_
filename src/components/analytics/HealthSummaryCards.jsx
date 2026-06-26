import React from 'react';
import { Heart, Calendar, FileText, Pill, TrendingUp, TrendingDown } from 'lucide-react';
import HealthCard from '@/components/ui/HealthCard';

export default function HealthSummaryCards({ 
  mentalHealthData = [], 
  appointments = [], 
  medicalRecords = [],
  prescriptions = []
}) {
  // Calculate mental health average
  const avgMood = mentalHealthData.length > 0
    ? (mentalHealthData.reduce((sum, e) => sum + (e.mood_score || 0), 0) / mentalHealthData.length).toFixed(1)
    : null;

  // Calculate mood trend (comparing first half vs second half)
  const halfPoint = Math.floor(mentalHealthData.length / 2);
  const firstHalfAvg = mentalHealthData.slice(0, halfPoint).reduce((sum, e) => sum + (e.mood_score || 0), 0) / halfPoint;
  const secondHalfAvg = mentalHealthData.slice(halfPoint).reduce((sum, e) => sum + (e.mood_score || 0), 0) / (mentalHealthData.length - halfPoint);
  const moodTrend = secondHalfAvg > firstHalfAvg ? 'up' : secondHalfAvg < firstHalfAvg ? 'down' : 'stable';

  // Appointment statistics
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;
  const upcomingAppointments = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;

  // Medical records by type
  const labResults = medicalRecords.filter(r => r.record_type === 'lab_result').length;

  const cards = [
    {
      title: 'Avg Mood Score',
      value: avgMood || '--',
      subtitle: mentalHealthData.length > 0 ? `${mentalHealthData.length} check-ins` : 'No data',
      icon: Heart,
      color: 'violet',
      trend: moodTrend,
      showTrend: mentalHealthData.length > 5
    },
    {
      title: 'Appointments',
      value: appointments.length,
      subtitle: `${completedAppointments} completed`,
      icon: Calendar,
      color: 'blue'
    },
    {
      title: 'Medical Records',
      value: medicalRecords.length,
      subtitle: `${labResults} lab results`,
      icon: FileText,
      color: 'emerald'
    },
    {
      title: 'Prescriptions',
      value: prescriptions.length,
      subtitle: prescriptions.filter(p => p.status === 'active').length + ' active',
      icon: Pill,
      color: 'amber'
    }
  ];

  const colorClasses = {
    violet: {
      bg: 'bg-violet-100',
      text: 'text-violet-600',
      value: 'text-violet-900'
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      value: 'text-blue-900'
    },
    emerald: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
      value: 'text-emerald-900'
    },
    amber: {
      bg: 'bg-amber-100',
      text: 'text-amber-600',
      value: 'text-amber-900'
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const colors = colorClasses[card.color];
        
        return (
          <HealthCard key={idx} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${colors.text}`} />
              </div>
              {card.showTrend && card.trend !== 'stable' && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  card.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {card.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
              )}
            </div>
            <p className={`text-3xl font-bold ${colors.value} mb-1`}>
              {card.value}
            </p>
            <p className="text-sm font-medium text-slate-900">{card.title}</p>
            <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
          </HealthCard>
        );
      })}
    </div>
  );
}