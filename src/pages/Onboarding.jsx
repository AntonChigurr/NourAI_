import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import {
  ChevronRight,
  ChevronLeft,
  Globe,
  User,
  Shield,
  Camera,
  Bell,
  Heart,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

const insuranceProviders = [
  'Daman',
  'AXA',
  'ADNIC',
  'MetLife',
  'Oman Insurance',
  'Cigna',
  'Allianz',
  'BUPA',
  'National Health Insurance',
  'Other',
  'None'
];

const emirates = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah'
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    preferred_language: 'en',
    gender: '',
    date_of_birth: '',
    blood_type: 'unknown',
    emirate: '',
    phone_number: '',
    insurance_provider: '',
    insurance_policy_number: '',
    permissions: {
      camera: false,
      photos: false,
      notifications: true,
      health_data: false
    }
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {
      // Redirect to login
      window.location.href = '/login';
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await base44.entities.Patient.create({
        user_id: user.id,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        blood_type: formData.blood_type,
        emirate: formData.emirate,
        phone_number: formData.phone_number,
        insurance_provider: formData.insurance_provider !== 'None' ? formData.insurance_provider : null,
        insurance_policy_number: formData.insurance_policy_number,
        preferred_language: formData.preferred_language,
        health_permissions: formData.permissions,
        onboarding_completed: true
      });

      window.location.href = createPageUrl('Home');
    } catch (error) {
      console.error(error);
    }
    
    setIsSubmitting(false);
  };

  const steps = [
    {
      title: 'Language',
      icon: Globe,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 text-center mb-6">
            Choose your preferred language
          </p>
          <div className="grid gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setFormData({ ...formData, preferred_language: lang.code })}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  formData.preferred_language === lang.code
                    ? 'border-[#1464F4] bg-[#1464F4]/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-3xl">{lang.flag}</span>
                <span className="text-lg font-medium">{lang.name}</span>
                {formData.preferred_language === lang.code && (
                  <CheckCircle2 className="w-5 h-5 text-[#1464F4] ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Profile',
      icon: User,
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 text-center mb-6">
            Tell us about yourself
          </p>
          
          <div>
            <Label className="mb-3 block">Gender</Label>
            <RadioGroup
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
              className="flex gap-4"
            >
              <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.gender === 'male' ? 'border-[#1464F4] bg-[#1464F4]/5' : 'border-slate-200'
              }`}>
                <RadioGroupItem value="male" id="male" />
                <span className="text-2xl">👨</span>
                <span>Male</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.gender === 'female' ? 'border-[#1464F4] bg-[#1464F4]/5' : 'border-slate-200'
              }`}>
                <RadioGroupItem value="female" id="female" />
                <span className="text-2xl">👩</span>
                <span>Female</span>
              </label>
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 block">Date of Birth</Label>
            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div>
            <Label className="mb-2 block">Emirate</Label>
            <Select
              value={formData.emirate}
              onValueChange={(value) => setFormData({ ...formData, emirate: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your emirate" />
              </SelectTrigger>
              <SelectContent>
                {emirates.map((emirate) => (
                  <SelectItem key={emirate} value={emirate}>{emirate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Phone Number</Label>
            <Input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+971 50 123 4567"
            />
          </div>
        </div>
      )
    },
    {
      title: 'Insurance',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 text-center mb-6">
            Connect your insurance provider
          </p>
          
          <div>
            <Label className="mb-2 block">Insurance Provider</Label>
            <Select
              value={formData.insurance_provider}
              onValueChange={(value) => setFormData({ ...formData, insurance_provider: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your insurance" />
              </SelectTrigger>
              <SelectContent>
                {insuranceProviders.map((provider) => (
                  <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.insurance_provider && formData.insurance_provider !== 'None' && (
            <div>
              <Label className="mb-2 block">Policy Number (optional)</Label>
              <Input
                value={formData.insurance_policy_number}
                onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                placeholder="Enter your policy number"
              />
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800">
              <strong>Why connect insurance?</strong> Filter doctors who accept your insurance and get coverage estimates before booking.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Permissions',
      icon: Bell,
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 text-center mb-6">
            Grant permissions for the best experience
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Camera</p>
                  <p className="text-sm text-slate-500">For video consultations</p>
                </div>
              </div>
              <Switch
                checked={formData.permissions.camera}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  permissions: { ...formData.permissions, camera: checked }
                })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium">Photos & Documents</p>
                  <p className="text-sm text-slate-500">Upload medical records</p>
                </div>
              </div>
              <Switch
                checked={formData.permissions.photos}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  permissions: { ...formData.permissions, photos: checked }
                })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-slate-500">Reminders & updates</p>
                </div>
              </div>
              <Switch
                checked={formData.permissions.notifications}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  permissions: { ...formData.permissions, notifications: checked }
                })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="font-medium">Health Data</p>
                  <p className="text-sm text-slate-500">Sync with Apple Health / Google Fit</p>
                </div>
              </div>
              <Switch
                checked={formData.permissions.health_data}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  permissions: { ...formData.permissions, health_data: checked }
                })}
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;
  const isLastStep = step === steps.length - 1;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-6">
        <div className="flex gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full transition-all ${
                idx <= step ? 'bg-[#1464F4]' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            {/* Step Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                <StepIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{currentStep.title}</h1>
            </div>

            {/* Step Content */}
            <div className="max-w-md mx-auto">
              {currentStep.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 safe-area-bottom">
        <div className="max-w-md mx-auto flex gap-3">
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
            disabled={isSubmitting}
            className="flex-1 bg-[#1464F4] hover:bg-[#0D4ED8]"
          >
            {isSubmitting ? 'Setting up...' : isLastStep ? (
              <>
                <Sparkles className="w-4 h-4 mr-1" />
                Get Started
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}