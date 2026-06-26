import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Calendar,
  TestTube,
  Pill,
  Stethoscope,
  FileImage,
  Syringe,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  X,
  Loader2,
  Eye,
  Download,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import HealthCard from '@/components/ui/HealthCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

const recordTypeIcons = {
  lab_result: TestTube,
  prescription: Pill,
  diagnosis: Stethoscope,
  doctor_note: FileText,
  imaging: FileImage,
  vaccination: Syringe,
  procedure: Stethoscope,
  other: FileText
};

const recordTypeColors = {
  lab_result: 'bg-blue-100 text-blue-600',
  prescription: 'bg-rose-100 text-rose-600',
  diagnosis: 'bg-violet-100 text-violet-600',
  doctor_note: 'bg-slate-100 text-slate-600',
  imaging: 'bg-emerald-100 text-emerald-600',
  vaccination: 'bg-amber-100 text-amber-600',
  procedure: 'bg-cyan-100 text-cyan-600',
  other: 'bg-slate-100 text-slate-600'
};

export default function MedicalRecords() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      let patients = await base44.entities.Patient.filter({ created_by: userData.email });
      
      let patientRecord = patients[0];
      
      // Create patient if doesn't exist
      if (!patientRecord) {
        patientRecord = await base44.entities.Patient.create({
          user_id: userData.id,
          phone_number: userData.email
        });
      }
      
      setPatient(patientRecord);
    } catch (e) {
      console.error('Failed to load or create patient', e);
    }
  };

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['medicalRecords', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.MedicalRecord.filter(
        { patient_id: patient.id },
        '-date'
      );
    },
    enabled: !!patient?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId) => base44.entities.MedicalRecord.delete(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries(['medicalRecords']);
      setSelectedRecord(null);
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !patient) return;

    setIsUploading(true);
    setUploadProgress('Uploading file...');

    const file = selectedFile;

    try {
      // Upload file to Base44 storage
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadProgress('Analyzing document with AI...');

      // Enhanced AI extraction with better prompt
      const extractionResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a precise medical document analyzer. Extract information from this document with extreme accuracy.

CRITICAL RULES FOR LAB VALUES:
- Extract ONLY the actual numerical result shown in the document
- DO NOT make up, estimate, or hallucinate any numbers
- For reference ranges: Look for text like "Normal range:", "Reference:", "Ref:", or values in parentheses
  * Example: "4.5-6.0" or "4.5 - 6.0" means min=4.5, max=6.0
  * Example: "(3.5-5.0)" means min=3.5, max=5.0
  * If TRULY not present in document, use standard clinical reference ranges for common tests:
    - Leukocytes/WBC: 4.0-10.0 × 10⁹/L
    - Erythrocytes/RBC: 4.5-5.5 × 10¹²/L (men), 4.0-5.0 × 10¹²/L (women)
    - Hemoglobin: 13.0-17.0 g/dL (men), 12.0-15.0 g/dL (women)
    - Platelets: 150-400 × 10⁹/L
    - ESR: 0-15 mm/h (men), 0-20 mm/h (women)
    - Glucose: 70-100 mg/dL (fasting)
  * ONLY use standard ranges if no range is visible in the document
- Determine status by comparing value to reference range:
  * If reference_min and reference_max are BOTH 0 → "normal" (no range available)
  * If value < reference_min → "low"
  * If value > reference_max → "high"
  * If value is between min and max → "normal"
- Use proper symbols: × for multiplication (not x or *), ° for degrees (not plain text)
- Preserve proper unit formatting: "× 10⁹/L", "°C", "mg/dL"

Document type: lab_result, prescription, diagnosis, doctor_note, imaging, vaccination, procedure, or other

For 'diagnosis' type documents, also extract:
1. Diagnosis Name: The primary diagnosis or condition.
2. ICD Code: (if available) The International Classification of Diseases code.
3. Severity: (e.g., "mild", "moderate", "severe", "chronic", "acute").
4. Chief Complaint: The patient's main reason for seeking medical attention.
5. Presenting Symptoms: A list of symptoms the patient is experiencing.
6. Treatment Plan: Recommended treatments, therapies, or interventions.
7. Prognosis: The likely course of the disease or ailment.
8. Follow-up Recommendations: Suggested next steps, e.g., "follow-up in 2 weeks".

Extract:
1. Document type (prioritize lab_result if any lab data exists, else diagnosis, then prescription)
2. Title/name of test/document (e.g., "Complete Blood Count", "Diabetes Diagnosis")
3. Date in YYYY-MM-DD format (if unclear, use today's date)
4. Doctor's full name (or "Not specified")
5. Facility/hospital name (or "Not specified")
6. Lab values - for EACH test extract:
   - name: exact test name (clean, no special characters)
   - value: ONLY the numerical result (no text, no ranges)
   - unit: measurement unit with proper symbols (× 10⁹/L, °C, mg/dL, %, mmol/L, etc.)
   - reference_min: lower bound of normal range (use standard clinical ranges if not in document)
   - reference_max: upper bound of normal range (use standard clinical ranges if not in document)
   - status: "high", "normal", or "low" - MUST be accurate based on value vs reference range
7. Key findings from the report
8. Medications with dosages
9. Brief summary
10. If document_type is 'diagnosis', include the specific diagnosis fields as a 'diagnosis_details' object.

QUALITY CHECK BEFORE RETURNING:
- Verify all lab value statuses are CORRECT (compare value to reference range)
- Verify reference ranges are NOT 0-0 unless truly unavailable
- Verify units use proper symbols (×, °, not plain text)
- Verify numerical values are clean numbers without text

If any information is genuinely not present in the document, use "Not specified" for text. NEVER invent data that's not in the document.`,
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            document_type: { type: 'string' },
            title: { type: 'string' },
            date: { type: 'string' },
            facility_name: { type: 'string' },
            doctor_name: { type: 'string' },
            key_findings: { type: 'array', items: { type: 'string' } },
            lab_values: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'number' },
                  unit: { type: 'string' },
                  reference_min: { type: 'number' },
                  reference_max: { type: 'number' },
                  status: { type: 'string', enum: ['high', 'normal', 'low'] }
                }
              }
            },
            medications: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
            raw_text: { type: 'string' },
            diagnosis_details: {
              type: 'object',
              properties: {
                diagnosis_name: { type: 'string' },
                icd_code: { type: 'string' },
                severity: { type: 'string', enum: ['mild', 'moderate', 'severe', 'chronic', 'acute', 'not specified'] },
                chief_complaint: { type: 'string' },
                presenting_symptoms: { type: 'array', items: { type: 'string' } },
                treatment_plan: { type: 'array', items: { type: 'string' } },
                prognosis: { type: 'string' },
                follow_up_recommendations: { type: 'string' },
              }
            }
          }
        }
      });

      setUploadProgress('Creating record...');

      const data = extractionResult;
      
      // Use AI-determined status or fallback to calculation
      const labValuesWithStatus = data.lab_values?.map(lv => {
        // Validate that value is a real number
        const value = typeof lv.value === 'number' && !isNaN(lv.value) ? lv.value : 0;
        const refMin = typeof lv.reference_min === 'number' && !isNaN(lv.reference_min) ? lv.reference_min : 0;
        const refMax = typeof lv.reference_max === 'number' && !isNaN(lv.reference_max) ? lv.reference_max : 0;
        
        // Use AI status if provided, otherwise calculate
        let status = lv.status || 'normal';
        if (!lv.status && refMin > 0 && refMax > 0) {
          status = value < refMin ? 'low' : value > refMax ? 'high' : 'normal';
        }
        
        return {
          ...lv,
          value,
          reference_min: refMin,
          reference_max: refMax,
          status
        };
      }) || [];

      // Detect document type from extracted data
      const detectedType = data.document_type?.toLowerCase().includes('lab') ? 'lab_result'
        : data.document_type?.toLowerCase().includes('prescription') ? 'prescription'
        : data.document_type?.toLowerCase().includes('imaging') ? 'imaging'
        : data.document_type?.toLowerCase().includes('vaccination') ? 'vaccination'
        : data.document_type?.toLowerCase().includes('diagnosis') ? 'diagnosis'
        : 'other';

      // Create comprehensive medical record with full AI analysis
      let structuredData = {
        medications: data.medications || [],
        document_type: data.document_type
      };

      if (detectedType === 'diagnosis' && data.diagnosis_details) {
        structuredData = {
          ...structuredData,
          ...data.diagnosis_details
        };
      }

      const newRecord = await base44.entities.MedicalRecord.create({
        patient_id: patient.id,
        record_type: detectedType,
        title: data.title || file.name.replace(/\.[^/.]+$/, ''),
        description: data.summary,
        date: data.date || format(new Date(), 'yyyy-MM-dd'),
        source: 'ai_extracted',
        doctor_name: data.doctor_name,
        facility_name: data.facility_name,
        document_url: file_url,
        diagnosis: detectedType === 'diagnosis' ? data.diagnosis_details?.diagnosis_name : '',
        ai_extracted_data: {
          raw_text: data.raw_text || '',
          key_findings: data.key_findings || [],
          structured_data: structuredData,
          recommendations: data.diagnosis_details?.treatment_plan || []
        },
        lab_values: labValuesWithStatus,
        is_flagged: labValuesWithStatus.some(lv => lv.status === 'high' || lv.status === 'low'),
        tags: [detectedType, ...(data.medications?.length > 0 ? ['medication'] : [])]
      });

      queryClient.invalidateQueries(['medicalRecords']);
      setShowUploadDialog(false);
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
    }

    setIsUploading(false);
    setUploadProgress('');
  };

  const filteredRecords = records.filter(record => {
    if (filterType !== 'all' && record.record_type !== filterType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return record.title?.toLowerCase().includes(query) ||
             record.description?.toLowerCase().includes(query) ||
             record.doctor_name?.toLowerCase().includes(query);
    }
    return true;
  });

  const recordsByType = records.reduce((acc, record) => {
    acc[record.record_type] = (acc[record.record_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Medical Records</h1>
            <p className="text-slate-500 mt-1">Your complete health timeline</p>
          </div>
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="bg-[#1464F4] hover:bg-[#0D4ED8]"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {['lab_result', 'prescription', 'diagnosis', 'other'].map((type) => {
            const Icon = recordTypeIcons[type];
            const count = recordsByType[type] || 0;
            return (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? 'all' : type)}
                className={`p-4 rounded-xl border transition-all ${
                  filterType === type
                    ? 'border-[#1464F4] bg-[#1464F4]/5'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${recordTypeColors[type]} flex items-center justify-center mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{count}</p>
                <p className="text-xs text-slate-500 capitalize">{type.replace(/_/g, ' ')}s</p>
              </button>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="lab_result">Lab Results</SelectItem>
              <SelectItem value="prescription">Prescriptions</SelectItem>
              <SelectItem value="diagnosis">Diagnoses</SelectItem>
              <SelectItem value="doctor_note">Doctor Notes</SelectItem>
              <SelectItem value="imaging">Imaging</SelectItem>
              <SelectItem value="vaccination">Vaccinations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Records List */}
        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading records..." />
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No medical records"
            description="Upload your first medical document to start building your health timeline"
            action={() => setShowUploadDialog(true)}
            actionLabel="Upload Document"
          />
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const Icon = recordTypeIcons[record.record_type] || FileText;
              const hasAbnormalValues = record.lab_values?.some(lv => lv.status !== 'normal');
              
              return (
                <HealthCard
                  key={record.id}
                  className="cursor-pointer hover:border-[#1464F4]/30"
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${recordTypeColors[record.record_type]} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            {record.title}
                            {hasAbnormalValues && (
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            )}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-slate-500">
                              {format(new Date(record.date), 'MMM d, yyyy')}
                            </span>
                            {record.facility_name && (
                              <span className="text-sm text-slate-400">• {record.facility_name}</span>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={record.record_type}>{record.record_type.replace(/_/g, ' ')}</StatusBadge>
                      </div>

                      {record.description && (
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{record.description}</p>
                      )}

                      {/* Lab Values Preview */}
                      {record.lab_values?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {record.lab_values.slice(0, 3).map((lv, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className={
                                lv.status === 'high' ? 'text-red-700 border-red-200 bg-red-50' :
                                lv.status === 'low' ? 'text-blue-700 border-blue-200 bg-blue-50' :
                                'text-emerald-700 border-emerald-200 bg-emerald-50'
                              }
                            >
                              {lv.status === 'high' && <TrendingUp className="w-3 h-3 mr-1" />}
                              {lv.status === 'low' && <TrendingDown className="w-3 h-3 mr-1" />}
                              {lv.status === 'normal' && <Minus className="w-3 h-3 mr-1" />}
                              {lv.name}: {lv.value} {lv.unit}
                            </Badge>
                          ))}
                          {record.lab_values.length > 3 && (
                            <Badge variant="outline">+{record.lab_values.length - 3} more</Badge>
                          )}
                        </div>
                      )}

                      {record.source === 'ai_extracted' && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-[#1464F4]">
                          <Sparkles className="w-3 h-3" />
                          AI-analyzed
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </HealthCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        setShowUploadDialog(open);
        if (!open) setSelectedFile(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Medical Document</DialogTitle>
          </DialogHeader>
          
          {isUploading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#1464F4] mx-auto mb-4" />
              <p className="text-slate-600">{uploadProgress}</p>
            </div>
          ) : selectedFile ? (
            <div className="py-6 space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#1464F4]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-[#1464F4]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{selectedFile.name}</p>
                    <p className="text-sm text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#1464F4] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900 text-sm">AI-Powered Analysis</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Our AI will automatically extract key information from your document including lab values, dates, and findings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedFile(null)}
                  className="h-12 text-base"
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmUpload}
                  className="h-12 text-base bg-[#1464F4] hover:bg-[#0D4ED8] touch-manipulation"
                  type="button"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Confirm Upload
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">Choose a file to upload</p>
                <p className="text-sm text-slate-400 mb-4">PDF, PNG, JPG (max 10MB)</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#1464F4] hover:bg-[#0D4ED8]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                  key={selectedFile ? 'has-file' : 'no-file'}
                />
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#1464F4] mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">AI-Powered Analysis</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Our AI will automatically extract key information from your document including lab values, dates, and findings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedRecord?.title}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedRecord && (
              <div className="space-y-6 py-4">
                {/* Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Date</p>
                    <p className="font-medium">{format(new Date(selectedRecord.date), 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Type</p>
                    <p className="font-medium capitalize">{selectedRecord.record_type.replace(/_/g, ' ')}</p>
                  </div>
                  {selectedRecord.doctor_name && (
                    <div>
                      <p className="text-sm text-slate-500">Doctor</p>
                      <p className="font-medium">{selectedRecord.doctor_name}</p>
                    </div>
                  )}
                  {selectedRecord.facility_name && (
                    <div>
                      <p className="text-sm text-slate-500">Facility</p>
                      <p className="font-medium">{selectedRecord.facility_name}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedRecord.description && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Summary</p>
                    <p className="text-slate-700">{selectedRecord.description}</p>
                  </div>
                )}

                {/* Lab Values */}
                {selectedRecord.lab_values?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-3">Lab Values</p>
                    <div className="space-y-2">
                      {selectedRecord.lab_values.map((lv, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              lv.status === 'high' ? 'bg-red-100' :
                              lv.status === 'low' ? 'bg-blue-100' :
                              'bg-emerald-100'
                            }`}>
                              {lv.status === 'high' && <TrendingUp className="w-4 h-4 text-red-600" />}
                              {lv.status === 'low' && <TrendingDown className="w-4 h-4 text-blue-600" />}
                              {lv.status === 'normal' && <Minus className="w-4 h-4 text-emerald-600" />}
                            </div>
                            <div>
                              <p className="font-medium">{lv.name}</p>
                              <p className="text-xs text-slate-500">
                                Ref: {lv.reference_min} - {lv.reference_max} {lv.unit}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              lv.status === 'high' ? 'text-red-600' :
                              lv.status === 'low' ? 'text-blue-600' :
                              'text-emerald-600'
                            }`}>
                              {lv.value} {lv.unit}
                            </p>
                            <p className={`text-xs capitalize ${
                              lv.status === 'high' ? 'text-red-600' :
                              lv.status === 'low' ? 'text-blue-600' :
                              'text-emerald-600'
                            }`}>
                              {lv.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Findings */}
                {selectedRecord.ai_extracted_data?.key_findings?.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Key Findings</p>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedRecord.ai_extracted_data.key_findings.map((finding, idx) => (
                        <li key={idx} className="text-slate-700">{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Diagnosis Details */}
                {selectedRecord.record_type === 'diagnosis' && selectedRecord.ai_extracted_data?.structured_data?.diagnosis_name && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Diagnosis Details</p>
                    <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                      {selectedRecord.ai_extracted_data.structured_data.diagnosis_name && (
                        <p className="font-medium">
                          <span className="text-slate-500 mr-2">Diagnosis:</span>
                          {selectedRecord.ai_extracted_data.structured_data.diagnosis_name}
                        </p>
                      )}
                      {selectedRecord.ai_extracted_data.structured_data.icd_code && (
                        <p className="text-sm">
                          <span className="text-slate-500 mr-2">ICD Code:</span>
                          {selectedRecord.ai_extracted_data.structured_data.icd_code}
                        </p>
                      )}
                      {selectedRecord.ai_extracted_data.structured_data.severity && (
                        <p className="text-sm">
                          <span className="text-slate-500 mr-2">Severity:</span>
                          {selectedRecord.ai_extracted_data.structured_data.severity}
                        </p>
                      )}
                      {selectedRecord.ai_extracted_data.structured_data.chief_complaint && (
                        <p className="text-sm">
                          <span className="text-slate-500 mr-2">Chief Complaint:</span>
                          {selectedRecord.ai_extracted_data.structured_data.chief_complaint}
                        </p>
                      )}
                      {selectedRecord.ai_extracted_data.structured_data.presenting_symptoms?.length > 0 && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Presenting Symptoms:</p>
                          <ul className="list-disc list-inside text-sm">
                            {selectedRecord.ai_extracted_data.structured_data.presenting_symptoms.map((symptom, idx) => (
                              <li key={idx}>{symptom}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedRecord.ai_extracted_data.structured_data.treatment_plan?.length > 0 && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Treatment Plan:</p>
                          <ul className="list-disc list-inside text-sm">
                            {selectedRecord.ai_extracted_data.structured_data.treatment_plan.map((plan, idx) => (
                              <li key={idx}>{plan}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedRecord.ai_extracted_data.structured_data.prognosis && (
                        <p className="text-sm">
                          <span className="text-slate-500 mr-2">Prognosis:</span>
                          {selectedRecord.ai_extracted_data.structured_data.prognosis}
                        </p>
                      )}
                      {selectedRecord.ai_extracted_data.structured_data.follow_up_recommendations && (
                        <p className="text-sm">
                          <span className="text-slate-500 mr-2">Follow-up:</span>
                          {selectedRecord.ai_extracted_data.structured_data.follow_up_recommendations}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Document Link */}
                <div className="flex gap-2">
                  {selectedRecord.document_url && (
                    <a
                      href={selectedRecord.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Original Document
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this record?')) {
                        deleteMutation.mutate(selectedRecord.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}