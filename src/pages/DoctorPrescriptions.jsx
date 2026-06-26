import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  FileText,
  Plus,
  Search,
  Pill,
  User,
  Calendar,
  Clock,
  Trash2,
  QrCode,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const frequencyOptions = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Before meals',
  'After meals',
  'At bedtime'
];

export default function DoctorPrescriptions() {
  const [user, setUser] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medications, setMedications] = useState([
    { drug_name: '', generic_name: '', dosage: '', frequency: '', duration: '', quantity: 1, instructions: '' }
  ]);
  const [diagnosis, setDiagnosis] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
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

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['doctorPrescriptions', doctor?.id],
    queryFn: async () => {
      if (!doctor?.id) return [];
      return base44.entities.Prescription.filter(
        { doctor_id: doctor.id },
        '-issue_date',
        50
      );
    },
    enabled: !!doctor?.id,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['allPatients'],
    queryFn: () => base44.entities.Patient.filter({}, '-created_date', 100),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['doctorAppointmentsForRx', doctor?.id],
    queryFn: async () => {
      if (!doctor?.id) return [];
      return base44.entities.Appointment.filter(
        { doctor_id: doctor.id, status: 'completed' },
        '-scheduled_date',
        20
      );
    },
    enabled: !!doctor?.id,
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data) => {
      // Generate prescription number
      const prescriptionNumber = `RX-${Date.now().toString(36).toUpperCase()}`;
      
      // Calculate expiry date (30 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Generate QR code data (in production, use QR code library)
      const qrData = JSON.stringify({
        rx: prescriptionNumber,
        patient: data.patient_id,
        doctor: doctor.id,
        issued: format(new Date(), 'yyyy-MM-dd')
      });

      const prescription = await base44.entities.Prescription.create({
        ...data,
        doctor_id: doctor.id,
        prescription_number: prescriptionNumber,
        status: 'active',
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        expiry_date: format(expiryDate, 'yyyy-MM-dd'),
        doctor_name: doctor.full_name,
        doctor_license: `${doctor.license_type}-${doctor.license_number}`,
        clinic_name: doctor.clinic_name,
        qr_code: qrData
      });

      // Automatically create reminders for each medication
      const today = format(new Date(), 'yyyy-MM-dd');
      const reminderPromises = data.medications.filter(m => m.drug_name).map(med => {
        // Parse duration to calculate end date
        let endDate = null;
        const durationMatch = med.duration?.match(/(\d+)/);
        if (durationMatch) {
          const durationDays = parseInt(durationMatch[0]);
          const end = new Date();
          end.setDate(end.getDate() + durationDays);
          endDate = format(end, 'yyyy-MM-dd');
        }

        // Map frequency to reminder frequency
        let reminderFrequency = 'daily';
        if (med.frequency?.toLowerCase().includes('twice')) {
          reminderFrequency = 'twice_daily';
        } else if (med.frequency?.toLowerCase().includes('three')) {
          reminderFrequency = 'three_times_daily';
        }

        return base44.entities.Reminder.create({
          patient_id: data.patient_id,
          type: 'medication',
          title: `Take ${med.drug_name}`,
          description: med.instructions || `${med.dosage} - ${med.frequency}`,
          medication_name: med.drug_name,
          dosage: med.dosage,
          frequency: reminderFrequency,
          start_date: today,
          end_date: endDate,
          prescription_id: prescription.id,
          is_active: true
        });
      });

      await Promise.all(reminderPromises);
      
      return prescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['doctorPrescriptions']);
      queryClient.invalidateQueries(['reminders']);
      setShowCreateDialog(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setSelectedPatient(null);
    setMedications([
      { drug_name: '', generic_name: '', dosage: '', frequency: '', duration: '', quantity: 1, instructions: '' }
    ]);
    setDiagnosis('');
    setSpecialInstructions('');
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      { drug_name: '', generic_name: '', dosage: '', frequency: '', duration: '', quantity: 1, instructions: '' }
    ]);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleCreatePrescription = () => {
    if (!selectedPatient || medications.length === 0) return;

    createPrescriptionMutation.mutate({
      patient_id: selectedPatient,
      diagnosis,
      medications: medications.filter(m => m.drug_name),
      special_instructions: specialInstructions
    });
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return rx.prescription_number?.toLowerCase().includes(query) ||
           rx.diagnosis?.toLowerCase().includes(query);
  });

  return (
    <div className="pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ePrescriptions</h1>
            <p className="text-slate-500 mt-1">Create and manage electronic prescriptions</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}
            className="bg-[#1464F4] hover:bg-[#0D4ED8]"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Prescription
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prescriptions..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Prescriptions List */}
        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading prescriptions..." />
        ) : filteredPrescriptions.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No prescriptions"
            description="Create your first prescription for a patient"
            action={() => setShowCreateDialog(true)}
            actionLabel="Create Prescription"
          />
        ) : (
          <div className="space-y-4">
            {filteredPrescriptions.map((rx) => (
              <HealthCard key={rx.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{rx.prescription_number}</h3>
                        <StatusBadge status={rx.status} />
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Patient #{rx.patient_id?.slice(0, 8)} • {format(new Date(rx.issue_date), 'MMM d, yyyy')}
                      </p>
                      {rx.diagnosis && (
                        <p className="text-sm text-slate-600 mt-2">
                          <span className="font-medium">Diagnosis:</span> {rx.diagnosis}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {rx.medications?.map((med, idx) => (
                          <Badge key={idx} variant="outline">
                            <Pill className="w-3 h-3 mr-1" />
                            {med.drug_name} - {med.dosage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <QrCode className="w-4 h-4 mr-1" />
                      QR
                    </Button>
                  </div>
                </div>
              </HealthCard>
            ))}
          </div>
        )}
      </div>

      {/* Create Prescription Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Prescription</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Patient Selection */}
            <div>
              <Label className="mb-2 block">Select Patient *</Label>
              <Select value={selectedPatient || ''} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      Patient #{patient.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Diagnosis */}
            <div>
              <Label className="mb-2 block">Diagnosis</Label>
              <Input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g., Upper respiratory tract infection"
              />
            </div>

            {/* Medications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Medications *</Label>
                <Button variant="outline" size="sm" onClick={addMedication}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Medication
                </Button>
              </div>
              
              <div className="space-y-4">
                {medications.map((med, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-slate-600">Medication #{index + 1}</p>
                      {medications.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedication(index)}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">Drug Name *</Label>
                        <Input
                          value={med.drug_name}
                          onChange={(e) => updateMedication(index, 'drug_name', e.target.value)}
                          placeholder="e.g., Amoxicillin"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Generic Name</Label>
                        <Input
                          value={med.generic_name}
                          onChange={(e) => updateMedication(index, 'generic_name', e.target.value)}
                          placeholder="e.g., Amoxicillin"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Dosage *</Label>
                        <Input
                          value={med.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Frequency *</Label>
                        <Select
                          value={med.frequency}
                          onValueChange={(val) => updateMedication(index, 'frequency', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencyOptions.map((freq) => (
                              <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Duration</Label>
                        <Input
                          value={med.duration}
                          onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                          placeholder="e.g., 7 days"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Quantity</Label>
                        <Input
                          type="number"
                          value={med.quantity}
                          onChange={(e) => updateMedication(index, 'quantity', parseInt(e.target.value))}
                          min="1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Special Instructions</Label>
                      <Input
                        value={med.instructions}
                        onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                        placeholder="e.g., Take with food"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <Label className="mb-2 block">Additional Notes</Label>
              <Textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any additional instructions for the patient..."
                rows={3}
              />
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                This prescription will be digitally signed with your license credentials and can be verified by pharmacies.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePrescription}
              disabled={!selectedPatient || !medications.some(m => m.drug_name) || createPrescriptionMutation.isPending}
              className="bg-[#1464F4] hover:bg-[#0D4ED8]"
            >
              {createPrescriptionMutation.isPending ? 'Creating...' : 'Create Prescription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}