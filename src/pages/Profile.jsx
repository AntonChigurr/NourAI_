import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  User,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  AlertTriangle,
  Shield,
  Edit,
  Save,
  Copy,
  CheckCircle2,
  Plus,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import HealthCard from '@/components/ui/HealthCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [copied, setCopied] = useState(false);
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const patients = await base44.entities.Patient.filter({ created_by: userData.email });
      if (patients[0]) {
        setPatient(patients[0]);
        setEditedData(patients[0]);
      }
    } catch (e) {}
  };

  const updatePatientMutation = useMutation({
    mutationFn: (data) => base44.entities.Patient.update(patient.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient'] });
      loadUser();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updatePatientMutation.mutate({ photo_url: file_url });
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    updatePatientMutation.mutate(editedData);
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;
    const conditions = editedData.chronic_conditions || [];
    setEditedData({ ...editedData, chronic_conditions: [...conditions, newCondition.trim()] });
    setNewCondition('');
  };

  const removeCondition = (index) => {
    const conditions = [...(editedData.chronic_conditions || [])];
    conditions.splice(index, 1);
    setEditedData({ ...editedData, chronic_conditions: conditions });
  };

  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    const allergies = editedData.allergies || [];
    setEditedData({ ...editedData, allergies: [...allergies, newAllergy.trim()] });
    setNewAllergy('');
  };

  const removeAllergy = (index) => {
    const allergies = [...(editedData.allergies || [])];
    allergies.splice(index, 1);
    setEditedData({ ...editedData, allergies: allergies });
  };

  const copyPatientId = () => {
    if (patient?.patient_id) {
      navigator.clipboard.writeText(patient.patient_id);
      setCopied(true);
      toast.success('Patient ID copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-[#1464F4]">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Profile Header Card */}
          <HealthCard className="bg-gradient-to-br from-slate-50 to-white">
            <div className="flex items-start gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {patient.photo_url ? (
                    <img src={patient.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.full_name?.charAt(0) || 'P'
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#1464F4] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#0D4ED8] transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900">{user?.full_name}</h2>
                <p className="text-slate-500">{user?.email}</p>
                {patient.patient_id && (
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className="bg-emerald-100 text-emerald-700 font-mono text-sm">
                      ID: {patient.patient_id}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyPatientId}
                      className="h-6 px-2"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </HealthCard>

          {/* Personal Information */}
          <HealthCard>
            <h3 className="font-semibold text-lg mb-4">Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-500 mb-1 block">Phone Number</label>
                {isEditing ? (
                  <Input
                    value={editedData.phone_number || ''}
                    onChange={(e) => setEditedData({ ...editedData, phone_number: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-slate-900">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {patient.phone_number || 'Not set'}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-500 mb-1 block">Date of Birth</label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedData.date_of_birth || ''}
                    onChange={(e) => setEditedData({ ...editedData, date_of_birth: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-slate-900">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'MMM d, yyyy') : 'Not set'}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-500 mb-1 block">Gender</label>
                <div className="flex items-center gap-2 text-slate-900 capitalize">
                  <User className="w-4 h-4 text-slate-400" />
                  {patient.gender || 'Not set'}
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-500 mb-1 block">Blood Type</label>
                {isEditing ? (
                  <Select
                    value={editedData.blood_type || ''}
                    onValueChange={(value) => setEditedData({ ...editedData, blood_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 text-slate-900">
                    <Heart className="w-4 h-4 text-rose-500" />
                    {patient.blood_type || 'Unknown'}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-500 mb-1 block">City</label>
                {isEditing ? (
                  <Input
                    value={editedData.city || ''}
                    onChange={(e) => setEditedData({ ...editedData, city: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-slate-900">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {patient.city || patient.emirate || 'Not set'}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-500 mb-1 block">Emirate</label>
                {isEditing ? (
                  <Select
                    value={editedData.emirate || ''}
                    onValueChange={(value) => setEditedData({ ...editedData, emirate: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select emirate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                      <SelectItem value="Sharjah">Sharjah</SelectItem>
                      <SelectItem value="Ajman">Ajman</SelectItem>
                      <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                      <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                      <SelectItem value="Fujairah">Fujairah</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 text-slate-900">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {patient.emirate || 'Not set'}
                  </div>
                )}
              </div>
            </div>
          </HealthCard>

          {/* Health Information */}
          <HealthCard>
            <h3 className="font-semibold text-lg mb-4">Health Information</h3>
            
            {/* Chronic Conditions */}
            <div className="mb-6">
              <label className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Chronic Conditions
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editedData.chronic_conditions || []).map((condition, i) => (
                      <Badge key={i} className="bg-amber-100 text-amber-800 flex items-center gap-1">
                        {condition}
                        <button onClick={() => removeCondition(i)} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      placeholder="Add chronic condition"
                      onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                    />
                    <Button onClick={addCondition} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {patient.chronic_conditions?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.chronic_conditions.map((condition, i) => (
                        <Badge key={i} className="bg-amber-100 text-amber-800">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">None recorded</p>
                  )}
                </>
              )}
            </div>

            {/* Allergies */}
            <div>
              <label className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Allergies
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editedData.allergies || []).map((allergy, i) => (
                      <Badge key={i} className="bg-red-100 text-red-800 flex items-center gap-1">
                        {allergy}
                        <button onClick={() => removeAllergy(i)} className="ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                      placeholder="Add allergy"
                      onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                    />
                    <Button onClick={addAllergy} size="sm" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {patient.allergies?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, i) => (
                        <Badge key={i} className="bg-red-100 text-red-800">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">None recorded</p>
                  )}
                </>
              )}
            </div>
          </HealthCard>

          {/* Emergency Contact */}
          <HealthCard>
            <h3 className="font-semibold text-lg mb-4">Emergency Contact</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-500 mb-1 block">Name</label>
                {isEditing ? (
                  <Input
                    value={editedData.emergency_contact_name || ''}
                    onChange={(e) => setEditedData({ ...editedData, emergency_contact_name: e.target.value })}
                  />
                ) : (
                  <p className="text-slate-900">{patient.emergency_contact_name || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-500 mb-1 block">Phone</label>
                {isEditing ? (
                  <Input
                    value={editedData.emergency_contact_phone || ''}
                    onChange={(e) => setEditedData({ ...editedData, emergency_contact_phone: e.target.value })}
                  />
                ) : (
                  <p className="text-slate-900">{patient.emergency_contact_phone || 'Not set'}</p>
                )}
              </div>
            </div>
          </HealthCard>

          {/* Insurance */}
          <HealthCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Insurance</h3>
              <Shield className="w-5 h-5 text-[#1464F4]" />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-500 mb-1 block">Provider</label>
                {isEditing ? (
                  <Input
                    value={editedData.insurance_provider || ''}
                    onChange={(e) => setEditedData({ ...editedData, insurance_provider: e.target.value })}
                    placeholder="e.g., Daman, Aetna, AXA"
                  />
                ) : (
                  <p className="text-slate-900">{patient.insurance_provider || 'None'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-500 mb-1 block">Policy Number</label>
                {isEditing ? (
                  <Input
                    value={editedData.insurance_policy_number || ''}
                    onChange={(e) => setEditedData({ ...editedData, insurance_policy_number: e.target.value })}
                    placeholder="Enter policy number"
                  />
                ) : (
                  <p className="text-slate-900 font-mono text-sm">{patient.insurance_policy_number || 'Not set'}</p>
                )}
              </div>
              {patient.insurance_expiry && !isEditing && (
                <div>
                  <label className="text-sm text-slate-500 mb-1 block">Expiry Date</label>
                  <p className="text-slate-900">{format(new Date(patient.insurance_expiry), 'MMM d, yyyy')}</p>
                </div>
              )}
              {isEditing && (
                <div>
                  <label className="text-sm text-slate-500 mb-1 block">Expiry Date</label>
                  <Input
                    type="date"
                    value={editedData.insurance_expiry || ''}
                    onChange={(e) => setEditedData({ ...editedData, insurance_expiry: e.target.value })}
                  />
                </div>
              )}
            </div>
          </HealthCard>
        </div>
      </div>
    </div>
  );
}