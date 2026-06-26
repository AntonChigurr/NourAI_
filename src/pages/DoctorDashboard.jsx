import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, parseISO } from 'date-fns';
import {
  Calendar,
  Video,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Stethoscope,
  DollarSign,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import HealthCard from '@/components/ui/HealthCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DoctorDashboard() {
  const [user, setUser] = useState(null);
  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const doctors = await base44.entities.Doctor.filter({ created_by: userData.email });
      if (doctors[0]) setDoctor(doctors[0]);
    } catch (e) {}
  };

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['doctorAppointments', doctor?.id],
    queryFn: async () => {
      if (!doctor?.id) return [];
      return base44.entities.Appointment.filter(
        { doctor_id: doctor.id },
        '-scheduled_date',
        50
      );
    },
    enabled: !!doctor?.id,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['doctorPatients', doctor?.id],
    queryFn: async () => {
      if (!doctor?.id) return [];
      const patientIds = [...new Set(appointments.map(a => a.patient_id))];
      if (patientIds.length === 0) return [];
      return base44.entities.Patient.filter({ id: { $in: patientIds } });
    },
    enabled: !!doctor?.id && appointments.length > 0,
  });

  const todayAppointments = appointments.filter(apt => 
    apt.scheduled_date === format(new Date(), 'yyyy-MM-dd') &&
    ['scheduled', 'confirmed', 'in_progress'].includes(apt.status)
  );

  const pendingAppointments = appointments.filter(apt => 
    ['scheduled', 'confirmed'].includes(apt.status)
  );

  const completedAppointments = appointments.filter(apt => 
    apt.status === 'completed'
  );

  const getPatientInfo = (patientId) => {
    return patients.find(p => p.id === patientId);
  };

  // Calculate earnings (mock calculation)
  const totalEarnings = completedAppointments.reduce((sum, apt) => sum + (apt.amount || 0), 0);
  const monthlyEarnings = completedAppointments
    .filter(apt => {
      const date = new Date(apt.scheduled_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, apt) => sum + (apt.amount || 0), 0);

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Doctor Profile Not Found</h2>
          <p className="text-slate-500 mb-4">Please complete your doctor registration first.</p>
          <Link to={createPageUrl('DoctorRegistration')}>
            <Button className="bg-[#1464F4]">Register as Doctor</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, Dr. {doctor.full_name?.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* Verification Status */}
        {doctor.verification_status !== 'verified' && (
          <HealthCard className="mb-6 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-10 h-10 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">Verification Pending</h3>
                <p className="text-sm text-amber-700">
                  Your profile is awaiting verification. You can start consulting once approved.
                </p>
              </div>
            </div>
          </HealthCard>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <HealthCard className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Today's Appointments</p>
                <p className="text-3xl font-bold mt-1">{todayAppointments.length}</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-200" />
            </div>
          </HealthCard>

          <HealthCard className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Total Patients</p>
                <p className="text-3xl font-bold mt-1">{patients.length}</p>
              </div>
              <Users className="w-10 h-10 text-emerald-200" />
            </div>
          </HealthCard>

          <HealthCard className="bg-gradient-to-br from-violet-500 to-violet-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm">Completed</p>
                <p className="text-3xl font-bold mt-1">{completedAppointments.length}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-violet-200" />
            </div>
          </HealthCard>

          <HealthCard className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">This Month</p>
                <p className="text-3xl font-bold mt-1">AED {monthlyEarnings}</p>
              </div>
              <DollarSign className="w-10 h-10 text-amber-200" />
            </div>
          </HealthCard>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <HealthCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Today's Schedule</h2>
                <Link to={createPageUrl('DoctorAppointments')}>
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              {isLoading ? (
                <LoadingSpinner text="Loading appointments..." />
              ) : todayAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.map((apt) => {
                    const patient = getPatientInfo(apt.patient_id);
                    return (
                      <div key={apt.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                        <div className="text-center min-w-[60px]">
                          <p className="text-lg font-bold text-[#1464F4]">{apt.scheduled_time}</p>
                        </div>
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-slate-200">
                            {patient?.user_id?.charAt(0) || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">Patient #{apt.patient_id?.slice(0, 8)}</p>
                          <p className="text-sm text-slate-500 truncate">{apt.reason || 'General Consultation'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={apt.type} />
                          {apt.type === 'online' && apt.status === 'scheduled' && (
                            <Link to={createPageUrl(`VideoConsultation?appointment=${apt.id}`)}>
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                <Video className="w-4 h-4 mr-1" />
                                Join
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </HealthCard>
          </div>

          {/* Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <HealthCard>
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to={createPageUrl('DoctorAppointments')} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Appointments
                  </Button>
                </Link>
                <Link to={createPageUrl('DoctorPatients')} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    View Patients
                  </Button>
                </Link>
                <Link to={createPageUrl('DoctorPrescriptions')} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Create Prescription
                  </Button>
                </Link>
              </div>
            </HealthCard>

            {/* Profile Stats */}
            <HealthCard>
              <h3 className="font-semibold mb-4">Your Profile</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold">{doctor.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total Reviews</span>
                  <span className="font-semibold">{doctor.total_reviews || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status</span>
                  <StatusBadge status={doctor.verification_status} />
                </div>
              </div>
            </HealthCard>

            {/* Pending */}
            <HealthCard>
              <h3 className="font-semibold mb-3">Pending Appointments</h3>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-[#1464F4]">{pendingAppointments.length}</p>
                <p className="text-sm text-slate-500 mt-1">awaiting consultation</p>
              </div>
            </HealthCard>
          </div>
        </div>
      </div>
    </div>
  );
}