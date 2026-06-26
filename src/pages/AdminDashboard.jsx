import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Shield,
  Users,
  Stethoscope,
  Building2,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import HealthCard from '@/components/ui/HealthCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
  };

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: ['allDoctors'],
    queryFn: () => base44.entities.Doctor.filter({}, '-created_date'),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['allPatientsAdmin'],
    queryFn: () => base44.entities.Patient.filter({}, '-created_date'),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['allAppointments'],
    queryFn: () => base44.entities.Appointment.filter({}, '-created_date', 100),
  });

  const { data: pharmacies = [] } = useQuery({
    queryKey: ['allPharmacies'],
    queryFn: () => base44.entities.Pharmacy.filter({}),
  });

  const { data: insuranceProviders = [] } = useQuery({
    queryKey: ['allInsurance'],
    queryFn: () => base44.entities.InsuranceProvider.filter({}),
  });

  const pendingDoctors = doctors.filter(d => d.verification_status === 'pending');
  const verifiedDoctors = doctors.filter(d => d.verification_status === 'verified');
  const todayAppointments = appointments.filter(apt => 
    apt.scheduled_date === format(new Date(), 'yyyy-MM-dd')
  );

  return (
    <div className="pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage NourAI platform</p>
        </div>

        {/* Pending Verification Alert */}
        {pendingDoctors.length > 0 && (
          <HealthCard className="mb-6 bg-amber-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-10 h-10 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-800">
                    {pendingDoctors.length} Doctor(s) Awaiting Verification
                  </h3>
                  <p className="text-sm text-amber-700">
                    Review and verify pending doctor applications
                  </p>
                </div>
              </div>
              <Link to={createPageUrl('AdminDoctorVerification')}>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  Review Now
                </Button>
              </Link>
            </div>
          </HealthCard>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <HealthCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Doctors</p>
                <p className="text-3xl font-bold mt-1">{doctors.length}</p>
                <p className="text-xs text-emerald-600 mt-1">
                  {verifiedDoctors.length} verified
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </HealthCard>

          <HealthCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Patients</p>
                <p className="text-3xl font-bold mt-1">{patients.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </HealthCard>

          <HealthCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Pharmacies</p>
                <p className="text-3xl font-bold mt-1">{pharmacies.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </HealthCard>

          <HealthCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Insurance Partners</p>
                <p className="text-3xl font-bold mt-1">{insuranceProviders.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </HealthCard>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <HealthCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Today's Activity</h2>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-[#1464F4]">{todayAppointments.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Appointments</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">
                    {todayAppointments.filter(a => a.status === 'completed').length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Completed</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{pendingDoctors.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Pending Docs</p>
                </div>
              </div>

              <h3 className="font-medium text-slate-700 mb-3">Pending Verifications</h3>
              {doctorsLoading ? (
                <LoadingSpinner text="Loading..." />
              ) : pendingDoctors.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                  <p>All doctors are verified!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingDoctors.slice(0, 5).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-[#1464F4]/10 flex items-center justify-center text-[#1464F4] font-bold">
                        {doc.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.full_name}</p>
                        <p className="text-sm text-slate-500">{doc.specialization}</p>
                      </div>
                      <StatusBadge status={doc.verification_status} />
                    </div>
                  ))}
                </div>
              )}
            </HealthCard>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <HealthCard>
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to={createPageUrl('AdminDoctorVerification')} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Doctor Verification
                    {pendingDoctors.length > 0 && (
                      <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {pendingDoctors.length}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to={createPageUrl('AdminPharmacies')} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="w-4 h-4 mr-2" />
                    Manage Pharmacies
                  </Button>
                </Link>
                <Link to={createPageUrl('AdminInsurance')} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Insurance Providers
                  </Button>
                </Link>
              </div>
            </HealthCard>

            <HealthCard>
              <h3 className="font-semibold mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm">API Status</span>
                  </div>
                  <span className="text-sm text-emerald-600">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm">Database</span>
                  </div>
                  <span className="text-sm text-emerald-600">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm">AI Services</span>
                  </div>
                  <span className="text-sm text-emerald-600">Active</span>
                </div>
              </div>
            </HealthCard>
          </div>
        </div>
      </div>
    </div>
  );
}