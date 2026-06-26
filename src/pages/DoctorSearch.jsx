import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  MapPin,
  Star,
  Video,
  Building2,
  Languages,
  Shield,
  ChevronDown,
  X,
  Clock,
  DollarSign,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import HealthCard from '@/components/ui/HealthCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

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

const emirates = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah'
];

const languages = ['English', 'Arabic', 'Russian', 'Hindi', 'Urdu', 'Tagalog', 'French'];

export default function DoctorSearch() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    specialization: searchParams.get('specialty') || '',
    emirate: '',
    language: '',
    availableOnline: false,
    insuranceProvider: '',
    minRating: 0,
    coveredByMyInsurance: false,
  });
  const [patient, setPatient] = useState(null);
  const [myInsurance, setMyInsurance] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors', filters],
    queryFn: async () => {
      const query = { verification_status: 'verified' };
      if (filters.specialization) query.specialization = filters.specialization;
      if (filters.emirate) query.emirate = filters.emirate;
      if (filters.availableOnline) query.available_online = true;
      
      return base44.entities.Doctor.filter(query, '-rating', 50);
    },
  });

  const { data: insuranceProviders = [] } = useQuery({
    queryKey: ['insuranceProviders'],
    queryFn: () => base44.entities.InsuranceProvider.filter({ is_active: true }),
  });

  const { data: coveredDoctorIds = [] } = useQuery({
    queryKey: ['coveredDoctors', myInsurance?.insurance_plan_id],
    queryFn: async () => {
      if (!myInsurance?.insurance_plan_id) return [];
      const coverage = await base44.entities.InsuranceCoverage.filter({
        insurance_plan_id: myInsurance.insurance_plan_id
      });
      return coverage.map(c => c.doctor_id).filter(Boolean);
    },
    enabled: !!myInsurance?.insurance_plan_id,
  });

  useEffect(() => {
    loadPatientInsurance();
  }, []);

  const loadPatientInsurance = async () => {
    try {
      const user = await base44.auth.me();
      const patients = await base44.entities.Patient.filter({ created_by: user.email });
      if (patients[0]) {
        setPatient(patients[0]);
        const insurance = await base44.entities.PatientInsurance.filter({
          patient_id: patients[0].id,
          is_active: true
        });
        if (insurance[0]) setMyInsurance(insurance[0]);
      }
    } catch (e) {}
  };

  const filteredDoctors = doctors.filter((doctor) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        doctor.full_name?.toLowerCase().includes(query) ||
        doctor.specialization?.toLowerCase().includes(query) ||
        doctor.clinic_name?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    if (filters.language && !doctor.languages?.includes(filters.language)) return false;
    if (filters.minRating && (doctor.rating || 0) < filters.minRating) return false;
    if (filters.insuranceProvider && !doctor.accepted_insurance?.includes(filters.insuranceProvider)) return false;
    if (filters.coveredByMyInsurance && !coveredDoctorIds.includes(doctor.id)) return false;
    
    return true;
  });

  const clearFilters = () => {
    setFilters({
      specialization: '',
      emirate: '',
      language: '',
      availableOnline: false,
      insuranceProvider: '',
      minRating: 0,
      coveredByMyInsurance: false,
    });
    setSearchQuery('');
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 0).length;

  return (
    <div className="pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#1464F4] via-[#0D4ED8] to-[#1464F4] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold mb-2">Find a Doctor</h1>
          <p className="text-blue-100 mb-6">Book online or in-clinic consultations with verified specialists</p>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, specialty, or clinic..."
              className="w-full pl-12 pr-4 py-6 rounded-xl text-slate-900 bg-white border-0 shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-4">
        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={filters.specialization}
              onValueChange={(value) => setFilters({ ...filters, specialization: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {specializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.emirate}
              onValueChange={(value) => setFilters({ ...filters, emirate: value })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Emirates</SelectItem>
                {emirates.map((emirate) => (
                  <SelectItem key={emirate} value={emirate}>{emirate}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={filters.availableOnline ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilters({ ...filters, availableOnline: !filters.availableOnline })}
              className={filters.availableOnline ? 'bg-[#1464F4]' : ''}
            >
              <Video className="w-4 h-4 mr-2" />
              Online Available
            </Button>

            {myInsurance && (
              <Button
                variant={filters.coveredByMyInsurance ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, coveredByMyInsurance: !filters.coveredByMyInsurance })}
                className={filters.coveredByMyInsurance ? 'bg-emerald-600' : ''}
              >
                <Shield className="w-4 h-4 mr-2" />
                Covered by Insurance
              </Button>
            )}

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  More Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="bg-[#1464F4] text-white ml-1">{activeFiltersCount}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Doctors</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Language</label>
                    <Select
                      value={filters.language}
                      onValueChange={(value) => setFilters({ ...filters, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Languages</SelectItem>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Insurance Provider</label>
                    <Select
                      value={filters.insuranceProvider}
                      onValueChange={(value) => setFilters({ ...filters, insuranceProvider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select insurance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Insurance</SelectItem>
                        {insuranceProviders.map((ins) => (
                          <SelectItem key={ins.id} value={ins.name}>{ins.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                    <div className="flex gap-2">
                      {[0, 3, 4, 4.5].map((rating) => (
                        <Button
                          key={rating}
                          variant={filters.minRating === rating ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilters({ ...filters, minRating: rating })}
                          className={filters.minRating === rating ? 'bg-[#1464F4]' : ''}
                        >
                          {rating === 0 ? 'Any' : `${rating}+`}
                          {rating > 0 && <Star className="w-3 h-3 ml-1 fill-current" />}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button variant="outline" onClick={clearFilters} className="flex-1">
                      Clear All
                    </Button>
                    <Button onClick={() => setIsFilterOpen(false)} className="flex-1 bg-[#1464F4]">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                <X className="w-4 h-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {filteredDoctors.length} doctors found
          </p>
        </div>

        {isLoading ? (
          <div className="py-20">
            <LoadingSpinner size="lg" text="Finding doctors..." />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No doctors found"
            description="Try adjusting your filters or search terms"
            action={clearFilters}
            actionLabel="Clear Filters"
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doctor) => (
              <Link key={doctor.id} to={createPageUrl(`DoctorProfile?id=${doctor.id}`)}>
                <HealthCard className="h-full hover:border-[#1464F4]/30 transition-all">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 rounded-xl">
                      <AvatarImage src={doctor.profile_photo} />
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] text-white text-lg">
                        {doctor.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900 flex items-center gap-1">
                            {doctor.full_name}
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </h3>
                          <p className="text-sm text-[#1464F4] font-medium">{doctor.specialization}</p>
                        </div>
                        {doctor.rating && (
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-medium text-amber-700">{doctor.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {doctor.clinic_name && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {doctor.clinic_name}
                      </div>
                    )}
                    {doctor.emirate && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {doctor.emirate}
                      </div>
                    )}
                    {doctor.years_experience && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {doctor.years_experience} years experience
                      </div>
                    )}
                    {doctor.languages?.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Languages className="w-4 h-4 text-slate-400" />
                        {doctor.languages.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {doctor.available_online && (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
                        <Video className="w-3 h-3 mr-1" />
                        Online
                      </Badge>
                    )}
                    {doctor.available_clinic && (
                      <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                        <Building2 className="w-3 h-3 mr-1" />
                        In-Clinic
                      </Badge>
                    )}
                    {coveredDoctorIds.includes(doctor.id) && (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
                        <Shield className="w-3 h-3 mr-1" />
                        Covered
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-slate-600 border-slate-200">
                      {doctor.license_type}
                    </Badge>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-slate-500">From </span>
                      <span className="font-semibold text-slate-900">
                        AED {doctor.consultation_fee_online || doctor.consultation_fee_clinic || '---'}
                      </span>
                    </div>
                    <Button size="sm" className="bg-[#1464F4] hover:bg-[#0D4ED8]">
                      <Calendar className="w-4 h-4 mr-1" />
                      Book
                    </Button>
                  </div>
                </HealthCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}