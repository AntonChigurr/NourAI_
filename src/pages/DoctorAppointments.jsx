import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isFuture, parseISO } from 'date-fns';
import {
  Calendar,
  Video,
  Building2,
  Clock,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Pill
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import HealthCard from '@/components/ui/HealthCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function DoctorAppointments() {
  const [user, setUser] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const queryClient = useQueryClient();

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
    queryKey: ['doctorAppointmentsPage', doctor?.id],
    queryFn: async () => {
      if (!doctor?.id) return [];
      return base44.entities.Appointment.filter({ doctor_id: doctor.id }, '-scheduled_date');
    },
    enabled: !!doctor?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.Appointment.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['doctorAppointmentsPage']);
      setShowNotesDialog(false);
      setSelectedAppointment(null);
    },
  });

  const upcomingAppointments = appointments.filter(apt => {
    try {
      return ['scheduled', 'confirmed'].includes(apt.status) &&
        (isToday(parseISO(apt.scheduled_date)) || isFuture(parseISO(apt.scheduled_date)));
    } catch {
      return false;
    }
  });

  const completedAppointments = appointments.filter(apt => 
    apt.status === 'completed'
  );

  const handleSaveNotes = () => {
    if (!selectedAppointment) return;
    updateMutation.mutate({
      id: selectedAppointment.id,
      data: {
        consultation_notes: consultationNotes,
        diagnosis: diagnosis,
        status: 'completed'
      }
    });
  };

  const AppointmentCard = ({ appointment }) => {
    let aptDate;
    try {
      aptDate = parseISO(appointment.scheduled_date);
    } catch {
      aptDate = new Date();
    }
    const isUpcoming = isToday(aptDate) || isFuture(aptDate);

    return (
      <HealthCard>
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-slate-200">
              <User className="w-6 h-6 text-slate-500" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Patient #{appointment.patient_id?.slice(0, 8)}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {format(aptDate, 'EEEE, MMM d, yyyy')} at {appointment.scheduled_time}
                </p>
                <p className="text-sm text-slate-600 mt-1">{appointment.reason || 'General Consultation'}</p>
              </div>
              <StatusBadge status={appointment.status} />
            </div>

            <div className="flex items-center gap-2 mt-3">
              {appointment.type === 'online' ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                  <Video className="w-3 h-3 mr-1" />
                  Video Call
                </Badge>
              ) : (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <Building2 className="w-3 h-3 mr-1" />
                  In-Clinic
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {isUpcoming && appointment.type === 'online' && appointment.status === 'confirmed' && (
                <Link to={createPageUrl(`VideoConsultation?appointment=${appointment.id}&role=doctor`)}>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <Video className="w-4 h-4 mr-1" />
                    Start Video Call
                  </Button>
                </Link>
              )}
              
              {appointment.status === 'in_progress' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setConsultationNotes(appointment.consultation_notes || '');
                    setDiagnosis(appointment.diagnosis || '');
                    setShowNotesDialog(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Add Notes
                </Button>
              )}

              <Link to={createPageUrl(`DoctorPrescriptions`)}>
                <Button size="sm" variant="outline">
                  <Pill className="w-4 h-4 mr-1" />
                  Create Prescription
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </HealthCard>
    );
  };

  return (
    <div className="pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Appointments</h1>

        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading appointments..." />
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedAppointments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {upcomingAppointments.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming appointments"
                  description="Your scheduled consultations will appear here"
                />
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt) => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completedAppointments.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="No completed appointments"
                  description="Completed consultations will appear here"
                />
              ) : (
                <div className="space-y-4">
                  {completedAppointments.map((apt) => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Consultation Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Diagnosis</label>
              <Input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter diagnosis..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Consultation Notes</label>
              <Textarea
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                placeholder="Enter detailed notes about the consultation..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={updateMutation.isPending}
              className="bg-[#1464F4]"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save & Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}