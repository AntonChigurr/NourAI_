import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import HealthCard from '@/components/ui/HealthCard';
import EmptyState from '@/components/common/EmptyState';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function VitalSignsChart({ medicalRecords = [] }) {
  // Filter records that have lab values
  const recordsWithVitals = medicalRecords.filter(r => r.lab_values?.length > 0);

  if (recordsWithVitals.length === 0) {
    return (
      <HealthCard>
        <EmptyState
          icon={Activity}
          title="No vital signs data"
          description="Lab results with vital signs will appear here"
        />
      </HealthCard>
    );
  }

  // Extract common vital signs for charting
  const extractVitalSigns = () => {
    const vitalsMap = {};
    
    recordsWithVitals.forEach(record => {
      const date = format(new Date(record.date), 'MMM d');
      if (!vitalsMap[date]) {
        vitalsMap[date] = { date, fullDate: record.date };
      }
      
      record.lab_values.forEach(lab => {
        const name = lab.name.toLowerCase();
        
        // Map common vital signs
        if (name.includes('blood pressure') || name.includes('bp')) {
          // Handle blood pressure separately
          const value = lab.value;
          if (typeof value === 'string' && value.includes('/')) {
            const [systolic, diastolic] = value.split('/').map(Number);
            vitalsMap[date].systolic = systolic;
            vitalsMap[date].diastolic = diastolic;
          }
        } else if (name.includes('heart rate') || name.includes('pulse')) {
          vitalsMap[date].heartRate = lab.value;
        } else if (name.includes('glucose') || name.includes('blood sugar')) {
          vitalsMap[date].glucose = lab.value;
        } else if (name.includes('cholesterol')) {
          vitalsMap[date].cholesterol = lab.value;
        } else if (name.includes('weight')) {
          vitalsMap[date].weight = lab.value;
        }
      });
    });
    
    return Object.values(vitalsMap).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
  };

  const chartData = extractVitalSigns();

  // Determine which vitals we have data for
  const hasVital = (key) => chartData.some(d => d[key] !== undefined);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-medium text-slate-900 mb-2">{payload[0].payload.date}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Blood Pressure */}
      {(hasVital('systolic') || hasVital('diastolic')) && (
        <HealthCard>
          <h3 className="font-semibold text-lg mb-4">Blood Pressure (mmHg)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {hasVital('systolic') && (
                <Line
                  type="monotone"
                  dataKey="systolic"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Systolic"
                />
              )}
              {hasVital('diastolic') && (
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Diastolic"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </HealthCard>
      )}

      {/* Heart Rate */}
      {hasVital('heartRate') && (
        <HealthCard>
          <h3 className="font-semibold text-lg mb-4">Heart Rate (bpm)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="#ec4899"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Heart Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </HealthCard>
      )}

      {/* Glucose */}
      {hasVital('glucose') && (
        <HealthCard>
          <h3 className="font-semibold text-lg mb-4">Blood Glucose (mg/dL)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="glucose"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Glucose"
              />
            </LineChart>
          </ResponsiveContainer>
        </HealthCard>
      )}

      {/* Lab Results Summary */}
      <HealthCard>
        <h3 className="font-semibold text-lg mb-4">Recent Lab Results</h3>
        <div className="space-y-4">
          {recordsWithVitals.slice(0, 5).map((record, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-slate-900">{format(new Date(record.date), 'PPP')}</p>
                <Badge variant="outline">{record.record_type}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {record.lab_values.slice(0, 6).map((lab, labIdx) => (
                  <div key={labIdx} className="text-sm">
                    <p className="text-slate-500 text-xs">{lab.name}</p>
                    <p className={`font-medium ${
                      lab.status === 'high' || lab.status === 'low' ? 'text-red-600' :
                      lab.status === 'critical' ? 'text-red-700 font-bold' :
                      'text-slate-900'
                    }`}>
                      {lab.value} {lab.unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </HealthCard>
    </div>
  );
}