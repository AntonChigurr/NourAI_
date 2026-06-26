import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Users,
  Search,
  Eye,
  FileText,
  Calendar,
  Heart,
  AlertTriangle,
  ChevronRight,
  Activity,
  Pill,
  TestTube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HealthCard from '@/components/ui/HealthCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function DoctorPatients() {
  const [user, setUser] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

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

  const { data: appointments = [] } = useQuery({
    queryKey: ['doctorAppointmentsForPatients', doctor?.id],
    queryFn: async () => {
      if (!doctor?.id) return [];
      return base44.entities.Appointment.filter({ doctor_id: doctor.id }, '-scheduled_date');
    },
    enabled: !!doctor?.id,
  });

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['doctorPatientsList', doctor?.id],
    queryFn: async () => {
      if (!doctor?.id || appointments.length === 0) return [];
      const patientIds = [...new Set(appointments.map(a => a.patient_id))];
      return base44.entities.Patient.filter({ id: { $in: patientIds } });
    },
    enabled: !!doctor?.id && appointments.length > 0,
  });

  const { data: medicalRecords = [] } = useQuery({
    queryKey: ['patientRecordsForDoctor', selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient?.id) return [];
      return base44.entities.MedicalRecord.filter(
        { patient_id: selectedPatient.id },
        '-date',
        20
      );
    },
    enabled: !!selectedPatient?.id,
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ['patientPrescriptions', selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient?.id) return [];
      return base44.entities.Prescription.filter(
        { patient_id: selectedPatient.id },
        '-issue_date',
        10
      );
    },
    enabled: !!selectedPatient?.id,
  });

  const getPatientAppointments = (patientId) => {
    return appointments.filter(a => a.patient_id === patientId);
  };

  const filteredPatients = patients.filter(patient => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const patientAppts = getPatientAppointments(patient.id);
    return patient.user_id?.toLowerCase().includes(query) ||
           patient.gender?.toLowerCase().includes(query) ||
           patient.emirate?.toLowerCase().includes(query);
  });

  return (
    <div className="pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Patients</h1>
            <p className="text-slate-500 mt-1">View and manage patient records</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Patients List */}
        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading patients..." />
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No patients yet"
            description="Patients will appear here after consultations"
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredPatients.map((patient) => {
              const patientAppts = getPatientAppointments(patient.id);
              const completedCount = patientAppts.filter(a => a.status === 'completed').length;
              
              return (
                <HealthCard
                  key={patient.id}
                  className="cursor-pointer hover:border-[#1464F4]/30"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarFallback className="bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] text-white text-lg">
                        P
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">Patient #{patient.id.slice(0, 8)}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-500">
                        <span className="capitalize">{patient.gender || 'N/A'}</span>
                        <span>•</span>
                        <span>{patient.emirate || 'N/A'}</span>
                        {patient.blood_type && patient.blood_type !== 'unknown' && (
                          <>
                            <span>•</span>
                            <span className="text-rose-600 font-medium">{patient.blood_type}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">
                          {completedCount} consultations
                        </Badge>
                        {patient.chronic_conditions?.length > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            {patient.chronic_conditions.length} conditions
                          </Badge>
                        )}
                        {patient.allergies?.length > 0 && (
                          <Badge className="bg-red-100 text-red-700 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Allergies
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </HealthCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Patient Detail Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Patient Information</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[75vh] pr-4">
            {selectedPatient && (
              <div className="space-y-6 py-4">
                {/* Patient Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Gender</p>
                    <p className="font-medium capitalize">{selectedPatient.gender || 'Not specified'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Blood Type</p>
                    <p className="font-medium">{selectedPatient.blood_type || 'Unknown'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Date of Birth</p>
                    <p className="font-medium">
                      {selectedPatient.date_of_birth 
                        ? format(new Date(selectedPatient.date_of_birth), 'MMM d, yyyy')
                        : 'Not specified'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">Insurance</p>
                    <p className="font-medium">{selectedPatient.insurance_provider || 'None'}</p>
                  </div>
                </div>

                {/* Allergies */}
                {selectedPatient.allergies?.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold text-red-800">Allergies</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedPatient.allergies.map((allergy, idx) => (
                        <Badge key={idx} className="bg-red-100 text-red-800">{allergy}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chronic Conditions */}
                {selectedPatient.chronic_conditions?.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-amber-600" />
                      <h4 className="font-semibold text-amber-800">Chronic Conditions</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedPatient.chronic_conditions.map((condition, idx) => (
                        <Badge key={idx} className="bg-amber-100 text-amber-800">{condition}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Tabs defaultValue="records" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="records">Records ({medicalRecords.length})</TabsTrigger>
                    <TabsTrigger value="prescriptions">Prescriptions ({prescriptions.length})</TabsTrigger>
                    <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  </TabsList>

                  <TabsContent value="records" className="mt-4">
                    {medicalRecords.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">No medical records</p>
                    ) : (
                      <div className="space-y-3">
                        {medicalRecords.map((record) => (
                          <div key={record.id} className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-medium">{record.title}</h5>
                                <p className="text-sm text-slate-500 mt-1">
                                  {format(new Date(record.date), 'MMM d, yyyy')} • {record.record_type}
                                </p>
                                {record.description && (
                                  <p className="text-sm text-slate-600 mt-2">{record.description}</p>
                                )}
                              </div>
                              {record.document_url && (
                                <a href={record.document_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="prescriptions" className="mt-4">
                    {prescriptions.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">No prescriptions</p>
                    ) : (
                      <div className="space-y-3">
                        {prescriptions.map((rx) => (
                          <div key={rx.id} className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{rx.prescription_number}</h5>
                                <p className="text-sm text-slate-500">{format(new Date(rx.issue_date), 'MMM d, yyyy')}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {rx.medications?.slice(0, 3).map((med, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {med.drug_name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Badge>{rx.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="appointments" className="mt-4">
                    {getPatientAppointments(selectedPatient.id).length === 0 ? (
                      <p className="text-center text-slate-500 py-8">No appointments</p>
                    ) : (
                      <div className="space-y-3">
                        {getPatientAppointments(selectedPatient.id).slice(0, 10).map((apt) => (
                          <div key={apt.id} className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {format(new Date(apt.scheduled_date), 'MMM d, yyyy')} at {apt.scheduled_time}
                                </p>
                                <p className="text-sm text-slate-500">{apt.type} • {apt.reason || 'General'}</p>
                              </div>
                              <Badge>{apt.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}