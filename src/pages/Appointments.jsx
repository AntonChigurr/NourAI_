import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import {
  Calendar,
  Video,
  Building2,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  FileText,
  Phone,
  MessageCircle,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import HealthCard from '@/components/ui/HealthCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function Appointments() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const queryClient = useQueryClient();

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

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.Appointment.filter(
        { patient_id: patient.id },
        '-scheduled_date'
      );
    },
    enabled: !!patient?.id,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctorsForAppointments'],
    queryFn: () => base44.entities.Doctor.filter({ verification_status: 'verified' }),
  });

  const getDoctorInfo = (doctorId) => {
    return doctors.find(d => d.id === doctorId);
  };

  const cancelMutation = useMutation({
    mutationFn: async (appointmentId) => {
      await base44.entities.Appointment.update(appointmentId, { status: 'cancelled' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      setShowCancelDialog(false);
      setSelectedAppointment(null);
    },
  });

  const ratingMutation = useMutation({
    mutationFn: async ({ appointmentId, rating, review }) => {
      await base44.entities.Appointment.update(appointmentId, {
        patient_rating: rating,
        patient_review: review
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments']);
      setShowRatingDialog(false);
      setSelectedAppointment(null);
      setRating(0);
      setReview('');
    },
  });

  const now = new Date();
  const upcomingAppointments = appointments.filter(apt => 
    ['scheduled', 'confirmed'].includes(apt.status) &&
    isAfter(parseISO(apt.scheduled_date), now)
  );
  const pastAppointments = appointments.filter(apt => 
    apt.status === 'completed' ||
    isBefore(parseISO(apt.scheduled_date), now)
  );

  const canJoinCall = (apt) => {
    if (apt.type !== 'online' || apt.status !== 'scheduled') return false;
    const aptDateTime = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`);
    const diffMinutes = (aptDateTime - now) / (1000 * 60);
    return diffMinutes <= 15 && diffMinutes >= -30;
  };

  const AppointmentCard = ({ appointment }) => {
    const doctor = getDoctorInfo(appointment.doctor_id);
    const canJoin = canJoinCall(appointment);
    
    return (
      <HealthCard className="mb-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14 rounded-xl">
            <AvatarImage src={doctor?.profile_photo} />
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] text-white">
              {doctor?.full_name?.charAt(0) || 'D'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{doctor?.full_name || 'Doctor'}</h3>
                <p className="text-sm text-[#1464F4]">{doctor?.specialization}</p>
              </div>
              <StatusBadge status={appointment.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                {format(parseISO(appointment.scheduled_date), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                {appointment.scheduled_time}
              </div>
              <div className="flex items-center gap-1">
                {appointment.type === 'online' ? (
                  <Video className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Building2 className="w-4 h-4 text-blue-500" />
                )}
                {appointment.type === 'online' ? 'Video Call' : 'In-Clinic'}
              </div>
            </div>

            {appointment.reason && (
              <p className="mt-2 text-sm text-slate-500 line-clamp-1">
                {appointment.reason}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {appointment.type === 'online' && ['scheduled', 'confirmed'].includes(appointment.status) && (
                <Link to={createPageUrl(`VideoConsultation?appointment=${appointment.id}`)}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Video className="w-4 h-4 mr-2" />
                    {canJoin ? 'Join Video Call' : 'Test Video Call'}
                  </Button>
                </Link>
              )}
              
              {['scheduled', 'confirmed'].includes(appointment.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setShowCancelDialog(true);
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              )}

              {appointment.status === 'completed' && !appointment.patient_rating && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setShowRatingDialog(true);
                  }}
                >
                  <Star className="w-4 h-4 mr-1" />
                  Rate Consultation
                </Button>
              )}

              {appointment.prescription_id && (
                <Link to={createPageUrl(`MedicalRecords?prescription=${appointment.prescription_id}`)}>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    View Prescription
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </HealthCard>
    );
  };

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
            <p className="text-slate-500 mt-1">Manage your consultations</p>
          </div>
          <Link to={createPageUrl('DoctorSearch')}>
            <Button className="bg-[#1464F4] hover:bg-[#0D4ED8]">
              <Plus className="w-4 h-4 mr-2" />
              Book New
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading appointments..." />
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastAppointments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming appointments"
                  description="Book a consultation with a doctor to get started"
                  action={() => window.location.href = createPageUrl('DoctorSearch')}
                  actionLabel="Find a Doctor"
                />
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastAppointments.length > 0 ? (
                pastAppointments.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} />
                ))
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No past appointments"
                  description="Your consultation history will appear here"
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate(selectedAppointment?.id)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Consultation</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 transition-all ${
                      star <= rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this consultation..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
              Skip
            </Button>
            <Button
              onClick={() => ratingMutation.mutate({
                appointmentId: selectedAppointment?.id,
                rating,
                review
              })}
              disabled={rating === 0 || ratingMutation.isPending}
              className="bg-[#1464F4] hover:bg-[#0D4ED8]"
            >
              {ratingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}