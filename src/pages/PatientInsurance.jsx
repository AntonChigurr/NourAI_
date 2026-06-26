import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Upload,
  Plus,
  Building2,
  CheckCircle2,
  FileText,
  MapPin,
  User,
  Edit,
  X,
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import HealthCard from '@/components/ui/HealthCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function PatientInsurance() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cardImageUrl, setCardImageUrl] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');

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

  const { data: providers = [] } = useQuery({
    queryKey: ['insuranceProviders'],
    queryFn: () => base44.entities.InsuranceProvider.filter({ is_active: true }),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['insurancePlans', selectedProvider],
    queryFn: async () => {
      if (!selectedProvider) return [];
      return base44.entities.InsurancePlan.filter({ provider_id: selectedProvider, is_active: true });
    },
    enabled: !!selectedProvider,
  });

  const { data: myInsurance, isLoading } = useQuery({
    queryKey: ['patientInsurance', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return null;
      const insurance = await base44.entities.PatientInsurance.filter({ 
        patient_id: patient.id, 
        is_active: true 
      });
      return insurance[0] || null;
    },
    enabled: !!patient?.id,
  });

  const { data: coverage = [] } = useQuery({
    queryKey: ['insuranceCoverage', myInsurance?.insurance_plan_id],
    queryFn: async () => {
      if (!myInsurance?.insurance_plan_id) return [];
      return base44.entities.InsuranceCoverage.filter({ 
        insurance_plan_id: myInsurance.insurance_plan_id 
      });
    },
    enabled: !!myInsurance?.insurance_plan_id,
  });

  const { data: coveredDoctors = [] } = useQuery({
    queryKey: ['coveredDoctors', myInsurance?.insurance_plan_id],
    queryFn: async () => {
      if (!myInsurance?.insurance_plan_id) return [];
      const coverageRecords = await base44.entities.InsuranceCoverage.filter({ 
        insurance_plan_id: myInsurance.insurance_plan_id 
      });
      const doctorIds = coverageRecords.map(c => c.doctor_id).filter(Boolean);
      if (doctorIds.length === 0) return [];
      return base44.entities.Doctor.filter({ id: { $in: doctorIds } });
    },
    enabled: !!myInsurance?.insurance_plan_id,
  });

  const saveInsuranceMutation = useMutation({
    mutationFn: (data) => {
      if (myInsurance?.id) {
        return base44.entities.PatientInsurance.update(myInsurance.id, data);
      }
      return base44.entities.PatientInsurance.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientInsurance'] });
      setShowAddDialog(false);
      resetForm();
    },
  });

  const deleteInsuranceMutation = useMutation({
    mutationFn: () => base44.entities.PatientInsurance.delete(myInsurance.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientInsurance'] });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCardImageUrl(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    saveInsuranceMutation.mutate({
      patient_id: patient.id,
      insurance_provider_id: selectedProvider,
      insurance_plan_id: selectedPlan,
      card_image_url: cardImageUrl,
      policy_number: policyNumber,
      is_active: true
    });
  };

  const resetForm = () => {
    setCardImageUrl('');
    setSelectedProvider('');
    setSelectedPlan('');
    setPolicyNumber('');
  };

  const provider = providers.find(p => p.id === myInsurance?.insurance_provider_id);
  const plan = plans.find(p => p.id === myInsurance?.insurance_plan_id);

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Insurance</h1>
            <p className="text-slate-500 mt-1">Manage your health insurance coverage</p>
          </div>
          {!myInsurance && (
            <Button onClick={() => setShowAddDialog(true)} className="bg-[#1464F4]">
              <Plus className="w-4 h-4 mr-2" />
              Add Insurance
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading insurance..." />
        ) : !myInsurance ? (
          <EmptyState
            icon={Shield}
            title="No insurance added"
            description="Add your insurance information to see your coverage"
            action={() => setShowAddDialog(true)}
            actionLabel="Add Insurance"
          />
        ) : (
          <div className="space-y-6">
            {/* Insurance Card */}
            <HealthCard className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-6 h-6" />
                    <h2 className="text-xl font-bold">{provider?.name}</h2>
                  </div>
                  <p className="text-blue-100">{plan?.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-blue-400"
                    onClick={() => {
                      setSelectedProvider(myInsurance.insurance_provider_id);
                      setSelectedPlan(myInsurance.insurance_plan_id);
                      setPolicyNumber(myInsurance.policy_number || '');
                      setCardImageUrl(myInsurance.card_image_url || '');
                      setShowAddDialog(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-red-400"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete your insurance?')) {
                        deleteInsuranceMutation.mutate();
                      }
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {myInsurance.policy_number && (
                <div className="mt-4">
                  <p className="text-blue-100 text-sm">Policy Number</p>
                  <p className="text-lg font-mono">{myInsurance.policy_number}</p>
                </div>
              )}

              {myInsurance.card_image_url && (
                <div className="mt-4 pt-4 border-t border-blue-400">
                  <a href={myInsurance.card_image_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-blue-400">
                      <FileText className="w-4 h-4 mr-2" />
                      View Insurance Card
                    </Button>
                  </a>
                </div>
              )}
            </HealthCard>

            {/* Coverage Details */}
            <Tabs defaultValue="doctors" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="doctors">Covered Doctors ({coveredDoctors.length})</TabsTrigger>
                <TabsTrigger value="hospitals">Covered Hospitals ({coverage.filter(c => c.hospital_name).length})</TabsTrigger>
              </TabsList>

              <TabsContent value="doctors" className="mt-4">
                {coveredDoctors.length === 0 ? (
                  <EmptyState
                    icon={User}
                    title="No doctors found"
                    description="No doctors are currently linked to your insurance plan"
                  />
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {coveredDoctors.map((doctor) => {
                      const doctorCoverage = coverage.find(c => c.doctor_id === doctor.id);
                      return (
                        <HealthCard key={doctor.id}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold">Dr. {doctor.full_name}</h3>
                              <p className="text-sm text-[#1464F4]">{doctor.specialization}</p>
                              <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                                <MapPin className="w-3 h-3" />
                                {doctor.emirate}
                              </div>
                              {doctorCoverage?.copay_amount > 0 && (
                                <div className="mt-2 flex items-center gap-1 text-sm text-amber-700">
                                  <Percent className="w-3 h-3" />
                                  <span>Copay: AED {doctorCoverage.copay_amount}</span>
                                </div>
                              )}
                              {doctorCoverage?.coverage_type === 'full' && doctorCoverage?.copay_amount === 0 && (
                                <div className="mt-2 text-sm text-emerald-700 font-medium">
                                  100% Covered
                                </div>
                              )}
                            </div>
                            <Badge className={
                              doctorCoverage?.coverage_type === 'full'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }>
                              {doctorCoverage?.coverage_type || 'Covered'}
                            </Badge>
                          </div>
                        </HealthCard>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="hospitals" className="mt-4">
                {coverage.filter(c => c.hospital_name).length === 0 ? (
                  <EmptyState
                    icon={Building2}
                    title="No hospitals found"
                    description="No hospitals are currently linked to your insurance plan"
                  />
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {coverage.filter(c => c.hospital_name).map((item) => (
                      <HealthCard key={item.id}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.hospital_name}</h3>
                            {item.copay_amount > 0 ? (
                              <div className="mt-2 flex items-center gap-1 text-sm text-amber-700">
                                <Percent className="w-3 h-3" />
                                <span>Copay: AED {item.copay_amount}</span>
                              </div>
                            ) : (
                              <div className="mt-2 text-sm text-emerald-700 font-medium">
                                100% Covered
                              </div>
                            )}
                          </div>
                          <Badge className={
                            item.coverage_type === 'full'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }>
                            {item.coverage_type}
                          </Badge>
                        </div>
                      </HealthCard>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Add/Edit Insurance Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{myInsurance ? 'Edit' : 'Add'} Insurance</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Insurance Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProvider && (
              <div>
                <label className="text-sm font-medium mb-2 block">Insurance Plan</label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500 text-center">
                        No plans available for this provider
                      </div>
                    ) : (
                      plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{plan.name}</span>
                            {plan.description && (
                              <span className="text-xs text-slate-500">{plan.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedPlan && plans.find(p => p.id === selectedPlan) && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Coverage Details:</p>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>• Consultation: {plans.find(p => p.id === selectedPlan)?.coverage_details?.consultation_coverage}%</p>
                      <p>• Medication: {plans.find(p => p.id === selectedPlan)?.coverage_details?.medication_coverage}%</p>
                      <p>• Lab Tests: {plans.find(p => p.id === selectedPlan)?.coverage_details?.lab_tests_coverage}%</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Policy Number</label>
              <Input
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="Enter policy number"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Insurance Card</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="max-w-xs mx-auto"
                />
                {isUploading && <LoadingSpinner text="Uploading..." />}
                {cardImageUrl && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Card uploaded
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedProvider || !selectedPlan}
              className="flex-1 bg-[#1464F4]"
            >
              Save Insurance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}