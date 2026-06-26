import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  FileText,
  Plus,
  Upload,
  Send,
  Pill,
  Calendar,
  User,
  Trash2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import HealthCard from '@/components/ui/HealthCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function PatientPrescriptions() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [addMethod, setAddMethod] = useState('manual');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedPharmacies, setSelectedPharmacies] = useState([]);

  const [medications, setMedications] = useState([
    { drug_name: '', dosage: '', form: 'tablet', quantity: 1, instructions: '' }
  ]);

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

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['prescriptions', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.Prescription.filter({ patient_id: patient.id }, '-issue_date');
    },
    enabled: !!patient?.id,
  });

  const { data: pharmacies = [] } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: () => base44.entities.Pharmacy.filter({ is_active: true }),
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: (data) => base44.entities.Prescription.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      setShowAddDialog(false);
      resetForm();
    },
  });

  const sendToPharmacyMutation = useMutation({
    mutationFn: async ({ prescriptionId, pharmacyIds }) => {
      const orders = pharmacyIds.map(pharmacyId => ({
        patient_id: patient.id,
        pharmacy_id: pharmacyId,
        prescription_id: prescriptionId,
        status: 'pending',
        items: selectedPrescription.medications.map(med => ({
          medicine_name: med.drug_name,
          quantity: med.quantity || 1,
          availability_status: 'available'
        }))
      }));
      
      return Promise.all(orders.map(order => base44.entities.PharmacyOrder.create(order)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacyOrders'] });
      setShowSendDialog(false);
      setSelectedPharmacies([]);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile(file_url);
      
      setIsExtracting(true);
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            medications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  drug_name: { type: "string" },
                  dosage: { type: "string" },
                  form: { type: "string" },
                  quantity: { type: "number" },
                  instructions: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extracted.status === 'success' && extracted.output?.medications) {
        setMedications(extracted.output.medications);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setIsExtracting(false);
    }
  };

  const addMedication = () => {
    setMedications([...medications, { drug_name: '', dosage: '', form: 'tablet', quantity: 1, instructions: '' }]);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleSubmit = () => {
    createPrescriptionMutation.mutate({
      patient_id: patient.id,
      source: addMethod === 'upload' ? 'patient_upload' : 'patient_manual',
      medications: medications.filter(m => m.drug_name),
      attachment_url: uploadedFile,
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'active'
    });
  };

  const handleSendToPharmacy = () => {
    if (selectedPharmacies.length === 0) return;
    sendToPharmacyMutation.mutate({
      prescriptionId: selectedPrescription.id,
      pharmacyIds: selectedPharmacies
    });
  };

  const resetForm = () => {
    setMedications([{ drug_name: '', dosage: '', form: 'tablet', quantity: 1, instructions: '' }]);
    setUploadedFile(null);
    setAddMethod('manual');
  };

  const doctorPrescriptions = prescriptions.filter(p => p.source === 'doctor');
  const myPrescriptions = prescriptions.filter(p => p.source !== 'doctor');

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Prescriptions</h1>
            <p className="text-slate-500 mt-1">Manage your prescriptions and send to pharmacies</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="bg-[#1464F4]">
            <Plus className="w-4 h-4 mr-2" />
            Add Prescription
          </Button>
        </div>

        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading prescriptions..." />
        ) : (
          <Tabs defaultValue="doctor" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="doctor">From Doctors ({doctorPrescriptions.length})</TabsTrigger>
              <TabsTrigger value="mine">My Prescriptions ({myPrescriptions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="doctor">
              {doctorPrescriptions.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No doctor prescriptions"
                  description="Prescriptions from your consultations will appear here"
                />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {doctorPrescriptions.map((rx) => (
                    <PrescriptionCard
                      key={rx.id}
                      prescription={rx}
                      onSend={() => {
                        setSelectedPrescription(rx);
                        setShowSendDialog(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mine">
              {myPrescriptions.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No prescriptions added"
                  description="Add prescriptions from external doctors or upload images"
                  action={() => setShowAddDialog(true)}
                  actionLabel="Add Prescription"
                />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {myPrescriptions.map((rx) => (
                    <PrescriptionCard
                      key={rx.id}
                      prescription={rx}
                      onSend={() => {
                        setSelectedPrescription(rx);
                        setShowSendDialog(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Add Prescription Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Prescription</DialogTitle>
          </DialogHeader>

          <Tabs value={addMethod} onValueChange={setAddMethod}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="upload">Upload Image/PDF</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="max-w-xs mx-auto"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Upload a photo or PDF of your prescription
                </p>
              </div>

              {isUploading && <LoadingSpinner text="Uploading..." />}
              {isExtracting && <LoadingSpinner text="Extracting medications..." />}
            </TabsContent>

            <TabsContent value="manual" />
          </Tabs>

          <div className="space-y-4 mt-4">
            <h3 className="font-semibold">Medications</h3>
            {medications.map((med, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Medication {index + 1}</span>
                  {medications.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Medicine name"
                    value={med.drug_name}
                    onChange={(e) => updateMedication(index, 'drug_name', e.target.value)}
                  />
                  <Input
                    placeholder="Dosage (e.g., 500mg)"
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                  />
                  <Select
                    value={med.form}
                    onValueChange={(value) => updateMedication(index, 'form', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="capsule">Capsule</SelectItem>
                      <SelectItem value="syrup">Syrup</SelectItem>
                      <SelectItem value="injection">Injection</SelectItem>
                      <SelectItem value="cream">Cream</SelectItem>
                      <SelectItem value="drops">Drops</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={med.quantity}
                    onChange={(e) => updateMedication(index, 'quantity', Number(e.target.value))}
                  />
                  <Textarea
                    placeholder="Instructions (e.g., Take twice daily)"
                    value={med.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    className="col-span-2"
                  />
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addMedication} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Medication
            </Button>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!medications.some(m => m.drug_name)}
              className="flex-1 bg-[#1464F4]"
            >
              Save Prescription
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send to Pharmacy Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send to Pharmacy</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Prescription Details</h4>
              <div className="space-y-1 text-sm text-blue-800">
                {selectedPrescription?.medications.map((med, i) => (
                  <div key={i}>• {med.drug_name} - {med.dosage}</div>
                ))}
              </div>
            </div>

            <h4 className="font-semibold">Select Pharmacies</h4>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {pharmacies.map((pharmacy) => (
                <div
                  key={pharmacy.id}
                  className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer"
                  onClick={() => {
                    if (selectedPharmacies.includes(pharmacy.id)) {
                      setSelectedPharmacies(selectedPharmacies.filter(id => id !== pharmacy.id));
                    } else {
                      setSelectedPharmacies([...selectedPharmacies, pharmacy.id]);
                    }
                  }}
                >
                  <Checkbox
                    checked={selectedPharmacies.includes(pharmacy.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h5 className="font-semibold">{pharmacy.name}</h5>
                    {pharmacy.branch_name && (
                      <p className="text-sm text-slate-600">{pharmacy.branch_name}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {pharmacy.emirate}
                      </span>
                      {pharmacy.is_24_hours && (
                        <Badge className="bg-emerald-100 text-emerald-700">24/7</Badge>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">
                    All medicines likely available
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowSendDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSendToPharmacy}
              disabled={selectedPharmacies.length === 0}
              className="flex-1 bg-[#1464F4]"
            >
              <Send className="w-4 h-4 mr-2" />
              Send to {selectedPharmacies.length} Pharmacy(ies)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PrescriptionCard({ prescription, onSend }) {
  return (
    <HealthCard>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-900">
            {prescription.prescription_number || `Prescription #${prescription.id.slice(0, 8)}`}
          </h3>
          <p className="text-sm text-slate-500">
            {prescription.issue_date ? format(new Date(prescription.issue_date), 'MMM d, yyyy') : 'No date'}
          </p>
        </div>
        <StatusBadge status={prescription.status} />
      </div>

      {prescription.doctor_name && (
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
          <User className="w-4 h-4" />
          Dr. {prescription.doctor_name}
        </div>
      )}

      <div className="space-y-1 mb-4">
        {prescription.medications.slice(0, 3).map((med, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <Pill className="w-3 h-3 text-slate-400" />
            <span>{med.drug_name} - {med.dosage}</span>
          </div>
        ))}
        {prescription.medications.length > 3 && (
          <p className="text-xs text-slate-500 pl-5">
            +{prescription.medications.length - 3} more
          </p>
        )}
      </div>

      {prescription.attachment_url && (
        <a href={prescription.attachment_url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="w-full mb-2">
            <FileText className="w-4 h-4 mr-2" />
            View Document
          </Button>
        </a>
      )}

      <Button onClick={onSend} size="sm" className="w-full bg-[#1464F4]">
        <Send className="w-4 h-4 mr-2" />
        Send to Pharmacy
      </Button>
    </HealthCard>
  );
}