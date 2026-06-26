import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  MessageCircle,
  Calendar,
  FileText,
  Pill,
  Bell,
  Stethoscope,
  Upload,
  Clock,
  ArrowRight,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import HealthCard from '@/components/ui/HealthCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function Home() {
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    loadUser();
    setGreetingMessage();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      // Not logged in
    }
  };

  const setGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  };

  const { data: patient } = useQuery({
    queryKey: ['patient', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const patients = await base44.entities.Patient.filter({ created_by: user.email });
      return patients[0];
    },
    enabled: !!user?.email,
  });

  const { data: upcomingAppointments = [] } = useQuery({
    queryKey: ['upcomingAppointments', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      return base44.entities.Appointment.filter(
        { patient_id: patient.id, status: 'scheduled' },
        '-scheduled_date',
        3
      );
    },
    enabled: !!patient?.id,
  });

  const { data: recentRecords = [] } = useQuery({
    queryKey: ['recentRecords', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.MedicalRecord.filter(
        { patient_id: patient.id },
        '-date',
        3
      );
    },
    enabled: !!patient?.id,
  });

  const { data: activeReminders = [] } = useQuery({
    queryKey: ['activeReminders', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.Reminder.filter(
        { patient_id: patient.id, is_active: true },
        '-created_date',
        5
      );
    },
    enabled: !!patient?.id,
  });



  const quickActions = [
    { name: 'Ask Dr. Nour', icon: MessageCircle, page: 'DrNourChat', color: 'from-blue-500 to-blue-600' },
    { name: 'Find Doctor', icon: Stethoscope, page: 'DoctorSearch', color: 'from-emerald-500 to-emerald-600' },
    { name: 'Prescriptions', icon: FileText, page: 'PatientPrescriptions', color: 'from-violet-500 to-violet-600' },
    { name: 'Insurance', icon: Shield, page: 'PatientInsurance', color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#1464F4] via-[#0D4ED8] to-[#1464F4] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-6 gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-blue-100 text-sm">{greeting}</p>
              <h1 className="text-2xl font-bold mt-1 truncate">{user?.full_name || 'Welcome'}</h1>
            </div>

          </div>


        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4 overflow-hidden">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.page}
                to={createPageUrl(action.page)}
                className="group"
              >
                <div className={`bg-gradient-to-br ${action.color} p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                  <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-medium text-sm">{action.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Dr. Nour AI Assistant Card */}
        <HealthCard className="mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 break-words">Dr. Nour AI Assistant</h3>
              <p className="text-sm text-slate-500 mt-1 break-words">
                Describe your symptoms and get instant guidance from our AI health assistant
              </p>
              <Link to={createPageUrl('DrNourChat')}>
                <Button className="mt-4 bg-[#1464F4] hover:bg-[#0D4ED8]">
                  Start Conversation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </HealthCard>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <HealthCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Upcoming Appointments</h3>
              <Link to={createPageUrl('Appointments')} className="text-[#1464F4] text-sm font-medium hover:underline">
                View All
              </Link>
            </div>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-[#1464F4]/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#1464F4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{apt.reason || 'Consultation'}</p>
                      <p className="text-sm text-slate-500">
                        {format(new Date(apt.scheduled_date), 'MMM d')} at {apt.scheduled_time}
                      </p>
                    </div>
                    <StatusBadge status={apt.type} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No upcoming appointments</p>
                <Link to={createPageUrl('DoctorSearch')}>
                  <Button variant="link" className="text-[#1464F4] mt-2">Book Now</Button>
                </Link>
              </div>
            )}
          </HealthCard>

          {/* Active Reminders */}
          <HealthCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Reminders</h3>
              <Link to={createPageUrl('Reminders')} className="text-[#1464F4] text-sm font-medium hover:underline">
                View All
              </Link>
            </div>
            {activeReminders.length > 0 ? (
              <div className="space-y-3">
                {activeReminders.slice(0, 3).map((reminder) => (
                  <div key={reminder.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      reminder.type === 'medication' ? 'bg-rose-100' : 'bg-blue-100'
                    }`}>
                      {reminder.type === 'medication' ? (
                        <Pill className="w-5 h-5 text-rose-600" />
                      ) : (
                        <Bell className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{reminder.title}</p>
                      {reminder.times && (
                        <p className="text-sm text-slate-500">
                          {reminder.times.join(', ')}
                        </p>
                      )}
                    </div>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No active reminders</p>
              </div>
            )}
          </HealthCard>
        </div>

        {/* Recent Medical Records */}
        <HealthCard className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent Records</h3>
            <Link to={createPageUrl('MedicalRecords')} className="text-[#1464F4] text-sm font-medium hover:underline">
              View All
            </Link>
          </div>
          {recentRecords.length > 0 ? (
            <div className="grid sm:grid-cols-3 gap-3">
              {recentRecords.map((record) => (
                <div key={record.id} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <StatusBadge status={record.record_type}>{record.record_type.replace(/_/g, ' ')}</StatusBadge>
                  </div>
                  <p className="font-medium text-slate-900 line-clamp-1">{record.title}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {format(new Date(record.date), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No medical records yet</p>
              <Link to={createPageUrl('MedicalRecords')}>
                <Button variant="link" className="text-[#1464F4] mt-2">Upload Document</Button>
              </Link>
            </div>
          )}
        </HealthCard>


      </div>
    </div>
  );
}