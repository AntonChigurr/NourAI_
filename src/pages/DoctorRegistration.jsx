import React, { useState, useEffect, useRef } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  Upload,
  FileText,
  GraduationCap,
  User,
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Shield,
  Award,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import HealthCard from '@/components/ui/HealthCard';

const specializations = [
  'General Practitioner',
  'Cardiologist',
  'Dermatologist',
  'ENT Specialist',
  'Gastroenterologist',
  'Gynecologist',
  'Neurologist',
  'Ophthalmologist',
  'Orthopedic',
  'Pediatrician',
  'Psychiatrist',
  'Psychologist',
  'Pulmonologist',
  'Urologist',
  'Dentist',
  'Oncologist',
  'Endocrinologist'
];

const languages = ['English', 'Arabic', 'Russian', 'Hindi', 'Urdu', 'Tagalog', 'French', 'German'];
const emirates = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

export default function DoctorRegistration() {
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    specialization: '',
    subspecialty: '',
    license_type: '',
    license_number: '',
    license_document_url: '',
    diploma_url: '',
    passport_id_url: '',
    clinic_affiliation_url: '',
    insurance_policy_url: '',
    years_experience: '',
    clinic_name: '',
    clinic_address: '',
    emirate: '',
    languages: [],
    bio: '',
    consultation_fee_online: '',
    consultation_fee_clinic: '',
    available_online: true,
    available_clinic: true,
    education: [],
    work_experience: [],
    certifications: []
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        full_name: userData.full_name || ''
      }));
    } catch (e) {}
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(fieldName);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Check if it's a certification upload
      if (fieldName.startsWith('cert_')) {
        const certIndex = parseInt(fieldName.split('_')[1]);
        updateCertification(certIndex, 'certificate_url', file_url);
      } else {
        setFormData(prev => ({
          ...prev,
          [fieldName]: file_url
        }));
      }
    } catch (error) {
      console.error(error);
    }
    
    setUploadingDoc(null);
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await base44.entities.Doctor.create({
        ...formData,
        user_id: user.id,
        years_experience: parseInt(formData.years_experience) || 0,
        consultation_fee_online: parseFloat(formData.consultation_fee_online) || 0,
        consultation_fee_clinic: parseFloat(formData.consultation_fee_clinic) || 0,
        verification_status: 'pending',
        rating: 0,
        total_reviews: 0,
        total_consultations: 0
      });

      window.location.href = createPageUrl('DoctorDashboard');
    } catch (error) {
      console.error(error);
    }
    
    setIsSubmitting(false);
  };

  const toggleLanguage = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const DocumentUploadField = ({ label, fieldName, icon: Icon }) => (
    <div className="p-4 bg-slate-50 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-slate-500">PDF, PNG, or JPG</p>
          </div>
        </div>
        {formData[fieldName] ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        ) : uploadingDoc === fieldName ? (
          <Loader2 className="w-6 h-6 animate-spin text-[#1464F4]" />
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fileInputRef.current.dataset.field = fieldName;
              fileInputRef.current.click();
            }}
          >
            <Upload className="w-4 h-4 mr-1" />
            Upload
          </Button>
        )}
      </div>
    </div>
  );

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', institution: '', year: '', country: '' }]
    }));
  };

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      work_experience: [...prev.work_experience, { 
        position: '', 
        hospital_clinic: '', 
        start_year: '', 
        end_year: '', 
        current: false,
        responsibilities: ''
      }]
    }));
  };

  const removeWorkExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      work_experience: prev.work_experience.filter((_, i) => i !== index)
    }));
  };

  const updateWorkExperience = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      work_experience: prev.work_experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { 
        name: '', 
        issuing_organization: '', 
        issue_date: '', 
        expiry_date: '',
        certificate_url: ''
      }]
    }));
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const updateCertification = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const steps = [
    {
      title: 'Basic Information',
      content: (
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Full Name (as on license) *</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Dr. John Smith"
            />
          </div>
          
          <div>
            <Label className="mb-2 block">Specialization *</Label>
            <Select
              value={formData.specialization}
              onValueChange={(value) => setFormData({ ...formData, specialization: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your specialty" />
              </SelectTrigger>
              <SelectContent>
                {specializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Subspecialty (optional)</Label>
            <Input
              value={formData.subspecialty}
              onChange={(e) => setFormData({ ...formData, subspecialty: e.target.value })}
              placeholder="e.g., Interventional Cardiology"
            />
          </div>

          <div>
            <Label className="mb-2 block">Years of Experience *</Label>
            <Input
              type="number"
              value={formData.years_experience}
              onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
              placeholder="e.g., 10"
              min="0"
            />
          </div>

          <div>
            <Label className="mb-2 block">Languages Spoken</Label>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    formData.languages.includes(lang)
                      ? 'bg-[#1464F4] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'License & Verification',
      content: (
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">License Authority *</Label>
            <Select
              value={formData.license_type}
              onValueChange={(value) => setFormData({ ...formData, license_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select authority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DHA">DHA (Dubai Health Authority)</SelectItem>
                <SelectItem value="MOH">MOH (Ministry of Health)</SelectItem>
                <SelectItem value="HAAD">HAAD (Abu Dhabi)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">License Number *</Label>
            <Input
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              placeholder="e.g., DHA-P-0012345"
            />
          </div>

          <p className="text-sm text-slate-500 pt-2">Upload required documents:</p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => handleFileUpload(e, fileInputRef.current.dataset.field)}
            className="hidden"
          />

          <DocumentUploadField
            label="Medical License"
            fieldName="license_document_url"
            icon={FileText}
          />
          
          <DocumentUploadField
            label="Medical Diploma"
            fieldName="diploma_url"
            icon={GraduationCap}
          />
          
          <DocumentUploadField
            label="Passport / Emirates ID"
            fieldName="passport_id_url"
            icon={User}
          />
          
          <DocumentUploadField
            label="Clinic Affiliation Letter"
            fieldName="clinic_affiliation_url"
            icon={Building2}
          />
          
          <DocumentUploadField
            label="Professional Liability Insurance *"
            fieldName="insurance_policy_url"
            icon={Shield}
          />
        </div>
      )
    },
    {
      title: 'Education & Experience',
      content: (
        <div className="space-y-6">
          {/* Education */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#1464F4]" />
                Education
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEducation}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.education.map((edu, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Education #{idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEducation(idx)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Degree (e.g., MBBS)"
                      value={edu.degree}
                      onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                    />
                    <Input
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Year"
                      value={edu.year}
                      onChange={(e) => updateEducation(idx, 'year', parseInt(e.target.value))}
                    />
                    <Input
                      placeholder="Country"
                      value={edu.country}
                      onChange={(e) => updateEducation(idx, 'country', e.target.value)}
                    />
                  </div>
                </div>
              ))}
              {formData.education.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No education added yet</p>
              )}
            </div>
          </div>

          {/* Work Experience */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#1464F4]" />
                Work Experience
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWorkExperience}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.work_experience.map((exp, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Experience #{idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWorkExperience(idx)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Position"
                      value={exp.position}
                      onChange={(e) => updateWorkExperience(idx, 'position', e.target.value)}
                      className="col-span-2"
                    />
                    <Input
                      placeholder="Hospital/Clinic"
                      value={exp.hospital_clinic}
                      onChange={(e) => updateWorkExperience(idx, 'hospital_clinic', e.target.value)}
                      className="col-span-2"
                    />
                    <Input
                      type="number"
                      placeholder="Start Year"
                      value={exp.start_year}
                      onChange={(e) => updateWorkExperience(idx, 'start_year', parseInt(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="End Year"
                      value={exp.end_year}
                      onChange={(e) => updateWorkExperience(idx, 'end_year', parseInt(e.target.value))}
                      disabled={exp.current}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={exp.current}
                      onCheckedChange={(checked) => updateWorkExperience(idx, 'current', checked)}
                    />
                    <span className="text-sm">Currently working here</span>
                  </label>
                  <Textarea
                    placeholder="Key responsibilities and achievements..."
                    value={exp.responsibilities}
                    onChange={(e) => updateWorkExperience(idx, 'responsibilities', e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
              {formData.work_experience.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No work experience added yet</p>
              )}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-[#1464F4]" />
                Certifications & Training
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCertification}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.certifications.map((cert, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Certificate #{idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCertification(idx)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Certification Name"
                    value={cert.name}
                    onChange={(e) => updateCertification(idx, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="Issuing Organization"
                    value={cert.issuing_organization}
                    onChange={(e) => updateCertification(idx, 'issuing_organization', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="date"
                      placeholder="Issue Date"
                      value={cert.issue_date}
                      onChange={(e) => updateCertification(idx, 'issue_date', e.target.value)}
                    />
                    <Input
                      type="date"
                      placeholder="Expiry Date (optional)"
                      value={cert.expiry_date}
                      onChange={(e) => updateCertification(idx, 'expiry_date', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fileInputRef.current.dataset.field = `cert_${idx}`;
                      fileInputRef.current.click();
                    }}
                    className="w-full"
                  >
                    {cert.certificate_url ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                        Certificate Uploaded
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Certificate
                      </>
                    )}
                  </Button>
                </div>
              ))}
              {formData.certifications.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No certifications added yet</p>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Practice Details',
      content: (
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Clinic Name</Label>
            <Input
              value={formData.clinic_name}
              onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
              placeholder="e.g., Dubai Medical Center"
            />
          </div>

          <div>
            <Label className="mb-2 block">Clinic Address</Label>
            <Input
              value={formData.clinic_address}
              onChange={(e) => setFormData({ ...formData, clinic_address: e.target.value })}
              placeholder="Full address"
            />
          </div>

          <div>
            <Label className="mb-2 block">Emirate</Label>
            <Select
              value={formData.emirate}
              onValueChange={(value) => setFormData({ ...formData, emirate: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select emirate" />
              </SelectTrigger>
              <SelectContent>
                {emirates.map((emirate) => (
                  <SelectItem key={emirate} value={emirate}>{emirate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Bio / About</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief description of your experience and expertise..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Online Consultation Fee (AED)</Label>
              <Input
                type="number"
                value={formData.consultation_fee_online}
                onChange={(e) => setFormData({ ...formData, consultation_fee_online: e.target.value })}
                placeholder="e.g., 200"
              />
            </div>
            <div>
              <Label className="mb-2 block">Clinic Visit Fee (AED)</Label>
              <Input
                type="number"
                value={formData.consultation_fee_clinic}
                onChange={(e) => setFormData({ ...formData, consultation_fee_clinic: e.target.value })}
                placeholder="e.g., 300"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.available_online}
                onCheckedChange={(checked) => setFormData({ ...formData, available_online: checked })}
              />
              <span className="text-sm">Available for online consultations</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.available_clinic}
                onCheckedChange={(checked) => setFormData({ ...formData, available_clinic: checked })}
              />
              <span className="text-sm">Available for clinic visits</span>
            </label>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl mt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Your profile will be reviewed by our team. You will be notified once verified (usually within 24-48 hours).
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const isLastStep = step === steps.length - 1;
  const canProceed = step === 0 
    ? formData.full_name && formData.specialization && formData.years_experience
    : step === 1
    ? formData.license_type && formData.license_number && formData.license_document_url && formData.insurance_policy_url
    : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Registration</h1>
          <p className="text-slate-500 mt-1">Join NourAI as a verified healthcare provider</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full transition-all ${
                idx <= step ? 'bg-[#1464F4]' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Form */}
        <HealthCard>
          <h2 className="text-lg font-semibold mb-6">{steps[step].title}</h2>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {steps[step].content}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              onClick={() => isLastStep ? handleSubmit() : setStep(step + 1)}
              disabled={!canProceed || isSubmitting}
              className="flex-1 bg-[#1464F4] hover:bg-[#0D4ED8]"
            >
              {isSubmitting ? 'Submitting...' : isLastStep ? (
                <>
                  Submit Application
                  <CheckCircle2 className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </HealthCard>
      </div>
    </div>
  );
}