import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  Download,
  User,
  Building2,
  GraduationCap,
  Languages,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import HealthCard from '@/components/ui/HealthCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function AdminDoctorVerification() {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['allDoctorsAdmin'],
    queryFn: () => base44.entities.Doctor.filter({}, '-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, reason }) => {
      const data = { verification_status: status };
      if (reason) data.rejection_reason = reason;
      return base44.entities.Doctor.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allDoctorsAdmin']);
      setShowDetailDialog(false);
      setShowRejectDialog(false);
      setSelectedDoctor(null);
      setRejectionReason('');
    },
  });

  const handleApprove = (doctor) => {
    updateMutation.mutate({ id: doctor.id, status: 'verified' });
  };

  const handleReject = () => {
    if (!selectedDoctor || !rejectionReason) return;
    updateMutation.mutate({
      id: selectedDoctor.id,
      status: 'rejected',
      reason: rejectionReason
    });
  };

  const filteredDoctors = doctors.filter(doc => {
    if (filterStatus !== 'all' && doc.verification_status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return doc.full_name?.toLowerCase().includes(query) ||
             doc.specialization?.toLowerCase().includes(query) ||
             doc.license_number?.toLowerCase().includes(query);
    }
    return true;
  });

  const pendingCount = doctors.filter(d => d.verification_status === 'pending').length;
  const verifiedCount = doctors.filter(d => d.verification_status === 'verified').length;
  const rejectedCount = doctors.filter(d => d.verification_status === 'rejected').length;

  const DoctorCard = ({ doctor }) => (
    <HealthCard className="hover:border-[#1464F4]/30 cursor-pointer" onClick={() => {
      setSelectedDoctor(doctor);
      setShowDetailDialog(true);
    }}>
      <div className="flex items-start gap-4">
        <Avatar className="w-14 h-14 rounded-xl">
          <AvatarImage src={doctor.profile_photo} />
          <AvatarFallback className="rounded-xl bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] text-white">
            {doctor.full_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">{doctor.full_name}</h3>
              <p className="text-sm text-[#1464F4]">{doctor.specialization}</p>
            </div>
            <StatusBadge status={doctor.verification_status} />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              {doctor.license_type} - {doctor.license_number}
            </span>
            {doctor.clinic_name && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {doctor.clinic_name}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-2">
            Applied: {format(new Date(doctor.created_date), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
    </HealthCard>
  );

  return (
    <div className="pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Doctor Verification</h1>
            <p className="text-slate-500 mt-1">Review and verify doctor applications</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <HealthCard className="text-center p-4 bg-amber-50 border-amber-200">
            <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
            <p className="text-sm text-amber-600">Pending</p>
          </HealthCard>
          <HealthCard className="text-center p-4 bg-emerald-50 border-emerald-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-700">{verifiedCount}</p>
            <p className="text-sm text-emerald-600">Verified</p>
          </HealthCard>
          <HealthCard className="text-center p-4 bg-red-50 border-red-200">
            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
            <p className="text-sm text-red-600">Rejected</p>
          </HealthCard>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, specialty, or license..."
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Doctors List */}
        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading doctors..." />
        ) : filteredDoctors.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No doctors found"
            description="No doctors match your search criteria"
          />
        ) : (
          <div className="space-y-4">
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Doctor Application Details</DialogTitle>
          </DialogHeader>
          
          {selectedDoctor && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20 rounded-xl">
                  <AvatarImage src={selectedDoctor.profile_photo} />
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] text-white text-2xl">
                    {selectedDoctor.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedDoctor.full_name}</h3>
                  <p className="text-[#1464F4] font-medium">{selectedDoctor.specialization}</p>
                  {selectedDoctor.subspecialty && (
                    <p className="text-slate-500 text-sm">{selectedDoctor.subspecialty}</p>
                  )}
                  <StatusBadge status={selectedDoctor.verification_status} className="mt-2" />
                </div>
              </div>

              {/* License Info */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  License Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">License Type</p>
                    <p className="font-medium">{selectedDoctor.license_type}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">License Number</p>
                    <p className="font-medium">{selectedDoctor.license_number}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="font-semibold mb-3">Uploaded Documents</h4>
                <div className="space-y-2">
                  {selectedDoctor.license_document_url && (
                    <a href={selectedDoctor.license_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="flex-1">License Document</span>
                      <Eye className="w-4 h-4 text-slate-400" />
                    </a>
                  )}
                  {selectedDoctor.diploma_url && (
                    <a href={selectedDoctor.diploma_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                      <GraduationCap className="w-5 h-5 text-violet-600" />
                      <span className="flex-1">Medical Diploma</span>
                      <Eye className="w-4 h-4 text-slate-400" />
                    </a>
                  )}
                  {selectedDoctor.passport_id_url && (
                    <a href={selectedDoctor.passport_id_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                      <User className="w-5 h-5 text-emerald-600" />
                      <span className="flex-1">ID / Passport</span>
                      <Eye className="w-4 h-4 text-slate-400" />
                    </a>
                  )}
                  {selectedDoctor.clinic_affiliation_url && (
                    <a href={selectedDoctor.clinic_affiliation_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100">
                      <Building2 className="w-5 h-5 text-rose-600" />
                      <span className="flex-1">Clinic Affiliation</span>
                      <Eye className="w-4 h-4 text-slate-400" />
                    </a>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Experience</p>
                  <p className="font-medium">{selectedDoctor.years_experience || 'N/A'} years</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Languages</p>
                  <p className="font-medium">{selectedDoctor.languages?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Clinic</p>
                  <p className="font-medium">{selectedDoctor.clinic_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Emirate</p>
                  <p className="font-medium">{selectedDoctor.emirate || 'N/A'}</p>
                </div>
              </div>

              {/* Rejection Reason */}
              {selectedDoctor.verification_status === 'rejected' && selectedDoctor.rejection_reason && (
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                  <p className="text-sm text-red-700 mt-1">{selectedDoctor.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedDoctor?.verification_status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailDialog(false);
                    setShowRejectDialog(true);
                  }}
                  className="text-red-600 border-red-200"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedDoctor)}
                  disabled={updateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {updateMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
              </>
            )}
            {selectedDoctor?.verification_status !== 'pending' && (
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-slate-600 mb-4">
              Please provide a reason for rejecting {selectedDoctor?.full_name}'s application.
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., License document is unclear, please resubmit..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionReason || updateMutation.isPending}
              variant="destructive"
            >
              {updateMutation.isPending ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}