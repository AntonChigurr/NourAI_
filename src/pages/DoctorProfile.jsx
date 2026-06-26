import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import {
  ArrowLeft,
  Star,
  Video,
  Building2,
  MapPin,
  Languages,
  Shield,
  Clock,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Phone,
  Mail,
  DollarSign,
  CreditCard,
  Users,
  ThumbsUp } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
'@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
import HealthCard from '@/components/ui/HealthCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DoctorProfile() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentType, setAppointmentType] = useState('online');
  const [bookingReason, setBookingReason] = useState('');
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const doctorId = urlParams.get('id');

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

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: async () => {
      const doctors = await base44.entities.Doctor.filter({ id: doctorId });
      return doctors[0];
    },
    enabled: !!doctorId
  });

  // Generate next 7 days for booking
  const availableDates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i + 1));

  // Generate time slots
  const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];


  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot) {
      alert('Please select a date and time');
      return;
    }

    if (!patient && !user) {
      alert('Please log in first');
      return;
    }

    setIsBooking(true);

    try {
      let patientId = patient?.id;

      // Create patient record if it doesn't exist
      if (!patient && user) {
        const newPatient = await base44.entities.Patient.create({
          user_id: user.id,
          onboarding_completed: false
        });
        patientId = newPatient.id;
        setPatient(newPatient);
      }

      const appointment = await base44.entities.Appointment.create({
        patient_id: patientId,
        doctor_id: doctor.id,
        type: appointmentType,
        status: 'scheduled',
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        scheduled_time: selectedSlot,
        duration_minutes: 30,
        reason: bookingReason,
        amount: appointmentType === 'online' ? doctor.consultation_fee_online : doctor.consultation_fee_clinic,
        payment_status: 'pending'
      });

      window.location.href = createPageUrl('Appointments');
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book appointment. Please try again.');
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading doctor profile..." />
      </div>);

  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Doctor not found</p>
      </div>);

  }

  return (
    <div className="pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1464F4] via-[#0D4ED8] to-[#1464F4] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Link to={createPageUrl('DoctorSearch')} className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="w-24 h-24 rounded-2xl border-4 border-white/20">
              <AvatarImage src={doctor.profile_photo} />
              <AvatarFallback className="rounded-2xl bg-white text-[#1464F4] text-2xl font-bold">
                {doctor.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{doctor.full_name}</h1>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-blue-100 text-lg">{doctor.specialization}</p>
              {doctor.subspecialty &&
              <p className="text-blue-200 text-sm">{doctor.subspecialty}</p>
              }
              
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {doctor.rating &&
                <div className="flex items-center gap-1 bg-white/10 rounded-lg px-3 py-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold">{doctor.rating.toFixed(1)}</span>
                    <span className="text-blue-200 text-sm">({doctor.total_reviews} reviews)</span>
                  </div>
                }
                <div className="flex items-center gap-1 text-blue-100">
                  <Users className="w-4 h-4" />
                  <span>{doctor.total_consultations || 0} consultations</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {setAppointmentType('online');setIsBookingDialogOpen(true);}}
                className="bg-white text-[#1464F4] hover:bg-blue-50"
                disabled={!doctor.available_online}>

                <Video className="w-4 h-4 mr-2" />
                Book Video Call - AED {doctor.consultation_fee_online || '---'}
              </Button>
              <Button
                onClick={() => {setAppointmentType('clinic');setIsBookingDialogOpen(true);}}
                variant="outline" className="bg-slate-50 text-blue-600 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-9 border-white/30 hover:bg-white/10"

                disabled={!doctor.available_clinic}>

                <Building2 className="w-4 h-4 mr-2" />
                Book In-Clinic - AED {doctor.consultation_fee_clinic || '---'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="about">
                <HealthCard>
                  <h3 className="font-semibold text-lg mb-4">About Dr. {doctor.full_name?.split(' ')[0]}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {doctor.bio || `Dr. ${doctor.full_name} is a verified ${doctor.specialization} with ${doctor.years_experience || 'several'} years of experience. They are licensed by ${doctor.license_type} and provide both online and in-clinic consultations.`}
                  </p>

                  <div className="mt-6 grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">License</p>
                        <p className="font-medium">{doctor.license_type} - {doctor.license_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Experience</p>
                        <p className="font-medium">{doctor.years_experience || '---'} years</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Languages className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Languages</p>
                        <p className="font-medium">{doctor.languages?.join(', ') || 'English'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Clinic</p>
                        <p className="font-medium">{doctor.clinic_name || 'Independent'}</p>
                      </div>
                    </div>
                  </div>
                </HealthCard>
              </TabsContent>

              <TabsContent value="experience">
                <HealthCard>
                  <h3 className="font-semibold text-lg mb-4">Education & Experience</h3>
                  
                  {doctor.education?.length > 0 ?
                  <div className="space-y-4">
                      {doctor.education.map((edu, idx) =>
                    <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{edu.degree}</p>
                            <p className="text-sm text-slate-600">{edu.institution}</p>
                            {edu.year && <p className="text-sm text-slate-400">{edu.year}</p>}
                          </div>
                        </div>
                    )}
                    </div> :

                  <p className="text-slate-500">Education details not available</p>
                  }
                </HealthCard>
              </TabsContent>

              <TabsContent value="reviews">
                <HealthCard>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg">Patient Reviews</h3>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="text-2xl font-bold">{doctor.rating?.toFixed(1) || '---'}</span>
                      <span className="text-slate-500">({doctor.total_reviews || 0})</span>
                    </div>
                  </div>
                  
                  <div className="text-center py-8 text-slate-500">
                    <ThumbsUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Reviews will appear here after patients rate their consultations</p>
                  </div>
                </HealthCard>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Location */}
            {doctor.clinic_address &&
            <HealthCard>
                <h4 className="font-semibold mb-3">Location</h4>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{doctor.clinic_name}</p>
                    <p className="text-sm text-slate-600">{doctor.clinic_address}</p>
                    <p className="text-sm text-slate-500">{doctor.emirate}</p>
                  </div>
                </div>
              </HealthCard>
            }

            {/* Insurance */}
            {doctor.accepted_insurance?.length > 0 &&
            <HealthCard>
                <h4 className="font-semibold mb-3">Accepted Insurance</h4>
                <div className="flex flex-wrap gap-2">
                  {doctor.accepted_insurance.map((ins, idx) =>
                <Badge key={idx} variant="outline" className="text-slate-600">
                      <CreditCard className="w-3 h-3 mr-1" />
                      {ins}
                    </Badge>
                )}
                </div>
              </HealthCard>
            }

            {/* Availability */}
            <HealthCard>
              <h4 className="font-semibold mb-3">Availability</h4>
              <div className="space-y-2">
                {doctor.available_online &&
                <div className="flex items-center gap-2 text-sm">
                    <Video className="w-4 h-4 text-emerald-500" />
                    <span>Online consultations available</span>
                  </div>
                }
                {doctor.available_clinic &&
                <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span>In-clinic visits available</span>
                  </div>
                }
              </div>
            </HealthCard>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Book {appointmentType === 'online' ? 'Video Consultation' : 'Clinic Visit'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Date</label>
              <div className="grid grid-cols-4 gap-2">
                {availableDates.map((date) =>
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`p-2 rounded-lg text-center transition-all ${
                  selectedDate?.toDateString() === date.toDateString() ?
                  'bg-[#1464F4] text-white' :
                  'bg-slate-100 hover:bg-slate-200'}`
                  }>

                    <p className="text-xs">{format(date, 'EEE')}</p>
                    <p className="font-semibold">{format(date, 'd')}</p>
                  </button>
                )}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate &&
            <div>
                <label className="text-sm font-medium mb-2 block">Select Time</label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) =>
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-2 rounded-lg text-sm transition-all ${
                  selectedSlot === slot ?
                  'bg-[#1464F4] text-white' :
                  'bg-slate-100 hover:bg-slate-200'}`
                  }>

                      {slot}
                    </button>
                )}
                </div>
              </div>
            }

            {/* Reason */}
            <div>
              <label className="text-sm font-medium mb-2 block">Reason for visit</label>
              <Textarea
                value={bookingReason}
                onChange={(e) => setBookingReason(e.target.value)}
                placeholder="Describe your symptoms or reason for consultation..."
                rows={3} />

            </div>

            {/* Summary */}
            {selectedDate && selectedSlot &&
            <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-medium mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span className="text-slate-500">Doctor</span>
                    <span>{doctor.full_name}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Date</span>
                    <span>{format(selectedDate, 'MMM d, yyyy')}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Time</span>
                    <span>{selectedSlot}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Type</span>
                    <span>{appointmentType === 'online' ? 'Video Call' : 'In-Clinic'}</span>
                  </p>
                  <div className="border-t border-slate-200 mt-2 pt-2">
                    <p className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>AED {appointmentType === 'online' ? doctor.consultation_fee_online : doctor.consultation_fee_clinic}</span>
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBooking}
              disabled={!selectedDate || !selectedSlot || isBooking}
              className="bg-[#1464F4] hover:bg-[#0D4ED8]">

              {isBooking ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}