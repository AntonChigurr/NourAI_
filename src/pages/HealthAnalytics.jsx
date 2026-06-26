import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  TrendingUp,
  Activity,
  Heart,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import HealthCard from '@/components/ui/HealthCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import MentalHealthChart from '@/components/analytics/MentalHealthChart';
import AppointmentAnalytics from '@/components/analytics/AppointmentAnalytics';
import HealthSummaryCards from '@/components/analytics/HealthSummaryCards';
import VitalSignsChart from '@/components/analytics/VitalSignsChart';

export default function HealthAnalytics() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const patients = await base44.entities.Patient.filter({ created_by: userData.email });
      if (patients[0]) setPatient(patients[0]);
    } catch (e) {}
  };

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    let startDate;
    
    switch(dateRange) {
      case '7':
        startDate = subDays(endDate, 7);
        break;
      case '30':
        startDate = subDays(endDate, 30);
        break;
      case '90':
        startDate = subDays(endDate, 90);
        break;
      case '365':
        startDate = subDays(endDate, 365);
        break;
      case 'month':
        startDate = startOfMonth(endDate);
        break;
      default:
        startDate = subDays(endDate, 30);
    }
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch all health data
  const { data: mentalHealthData = [], isLoading: mentalLoading } = useQuery({
    queryKey: ['analytics-mental', patient?.id, dateRange],
    queryFn: async () => {
      if (!patient?.id) return [];
      const data = await base44.entities.MentalHealthEntry.filter(
        { patient_id: patient.id },
        '-date',
        365
      );
      return data.filter(entry => {
        const entryDate = new Date(entry.date);
        return isWithinInterval(entryDate, { start: startDate, end: endDate });
      });
    },
    enabled: !!patient?.id,
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['analytics-appointments', patient?.id, dateRange],
    queryFn: async () => {
      if (!patient?.id) return [];
      const data = await base44.entities.Appointment.filter(
        { patient_id: patient.id },
        '-scheduled_date',
        365
      );
      return data.filter(apt => {
        const aptDate = new Date(apt.scheduled_date);
        return isWithinInterval(aptDate, { start: startDate, end: endDate });
      });
    },
    enabled: !!patient?.id,
  });

  const { data: medicalRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['analytics-records', patient?.id, dateRange],
    queryFn: async () => {
      if (!patient?.id) return [];
      const data = await base44.entities.MedicalRecord.filter(
        { patient_id: patient.id },
        '-date',
        365
      );
      return data.filter(record => {
        const recordDate = new Date(record.date);
        return isWithinInterval(recordDate, { start: startDate, end: endDate });
      });
    },
    enabled: !!patient?.id,
  });

  const { data: prescriptions = [], isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['analytics-prescriptions', patient?.id, dateRange],
    queryFn: async () => {
      if (!patient?.id) return [];
      const data = await base44.entities.Prescription.filter(
        { patient_id: patient.id },
        '-issue_date',
        365
      );
      return data.filter(rx => {
        const rxDate = new Date(rx.issue_date);
        return isWithinInterval(rxDate, { start: startDate, end: endDate });
      });
    },
    enabled: !!patient?.id,
  });

  const isLoading = mentalLoading || appointmentsLoading || recordsLoading || prescriptionsLoading;

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      // Generate comprehensive health report
      const report = {
        patient: {
          name: user?.full_name,
          id: patient?.patient_id,
          generated: format(new Date(), 'PPpp')
        },
        period: {
          start: format(startDate, 'PP'),
          end: format(endDate, 'PP'),
          days: dateRange
        },
        summary: {
          appointments: appointments.length,
          mentalHealthEntries: mentalHealthData.length,
          medicalRecords: medicalRecords.length,
          prescriptions: prescriptions.length
        },
        mentalHealth: mentalHealthData.map(e => ({
          date: e.date,
          mood: e.mood_score,
          anxiety: e.anxiety_level,
          stress: e.stress_level,
          energy: e.energy_level
        })),
        appointments: appointments.map(a => ({
          date: a.scheduled_date,
          type: a.type,
          status: a.status,
          reason: a.reason
        })),
        vitalSigns: medicalRecords
          .filter(r => r.lab_values?.length > 0)
          .map(r => ({
            date: r.date,
            values: r.lab_values
          }))
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Health Analytics</h1>
            <p className="text-slate-500 mt-1">Track your health trends and insights</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 3 Months</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={handleExportReport}
              disabled={isExporting}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <HealthSummaryCards
          mentalHealthData={mentalHealthData}
          appointments={appointments}
          medicalRecords={medicalRecords}
          prescriptions={prescriptions}
        />

        {/* Analytics Tabs */}
        <Tabs defaultValue="mental" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mental">
              <Heart className="w-4 h-4 mr-2" />
              Mental Health
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <Calendar className="w-4 h-4 mr-2" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="vitals">
              <Activity className="w-4 h-4 mr-2" />
              Vital Signs
            </TabsTrigger>
            <TabsTrigger value="insights">
              <TrendingUp className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mental" className="mt-6">
            <MentalHealthChart data={mentalHealthData} />
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            <AppointmentAnalytics appointments={appointments} />
          </TabsContent>

          <TabsContent value="vitals" className="mt-6">
            <VitalSignsChart medicalRecords={medicalRecords} />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <HealthCard>
              <h3 className="font-semibold text-lg mb-4">Health Insights</h3>
              
              <div className="space-y-4">
                {/* Mental Health Insights */}
                {mentalHealthData.length > 0 && (
                  <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 mb-1">Mental Wellness Trend</h4>
                        <p className="text-sm text-slate-600">
                          {(() => {
                            const avgMood = mentalHealthData.reduce((sum, e) => sum + (e.mood_score || 0), 0) / mentalHealthData.length;
                            if (avgMood >= 7) return "Your mood has been consistently positive! Keep up the great self-care habits.";
                            if (avgMood >= 5) return "Your mood is stable. Consider incorporating more activities that bring you joy.";
                            return "We notice some challenging days. Consider reaching out to a mental health professional.";
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appointment Insights */}
                {appointments.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 mb-1">Healthcare Engagement</h4>
                        <p className="text-sm text-slate-600">
                          You've had {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} in this period. 
                          {appointments.filter(a => a.status === 'completed').length > 0 && 
                            ` ${appointments.filter(a => a.status === 'completed').length} completed successfully.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Records Insights */}
                {medicalRecords.length > 0 && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 mb-1">Medical Records</h4>
                        <p className="text-sm text-slate-600">
                          {medicalRecords.length} medical record{medicalRecords.length !== 1 ? 's' : ''} added. 
                          {medicalRecords.some(r => r.is_flagged) && 
                            " Some records are flagged for review - please consult your doctor."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {mentalHealthData.length === 0 && appointments.length === 0 && medicalRecords.length === 0 && (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                      No data available for the selected period. Start tracking your health to see insights here.
                    </p>
                  </div>
                )}
              </div>
            </HealthCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}