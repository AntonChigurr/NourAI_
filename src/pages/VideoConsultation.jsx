import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  MessageCircle,
  FileText,
  User,
  Send,
  X,
  Paperclip,
  Maximize2,
  Minimize2,
  Settings,
  Monitor,
  Circle,
  Eye,
  AlertTriangle,
  TestTube,
  Pill
} from 'lucide-react';
import TwilioVideoCall from '@/components/video/TwilioVideoCall';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import HealthCard from '@/components/ui/HealthCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function VideoConsultation() {
  const [twilioToken, setTwilioToken] = useState(null);
  const [twilioRoomName, setTwilioRoomName] = useState(null);
  const [twilioIdentity, setTwilioIdentity] = useState(null);
  const [isVideoCallReady, setIsVideoCallReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPatientInfoOpen, setIsPatientInfoOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEndCallDialog, setShowEndCallDialog] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [user, setUser] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const appointmentId = urlParams.get('appointment');

  useEffect(() => {
    loadUser();
    initVideoCall();
  }, []);

  const initVideoCall = async () => {
    if (!appointmentId) return;

    try {
      const response = await base44.functions.invoke('initVideoCall', {
        appointment_id: appointmentId
      });
      
      if (response.data.success) {
        setTwilioToken(response.data.access_token);
        setTwilioRoomName(response.data.room_name);
        setTwilioIdentity(response.data.identity);
        setIsVideoCallReady(true);
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Failed to initialize video call:', error);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!isConnecting) {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isConnecting]);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
  };

  const { data: appointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const appointments = await base44.entities.Appointment.filter({ id: appointmentId });
      return appointments[0];
    },
    enabled: !!appointmentId,
  });

  const { data: doctor } = useQuery({
    queryKey: ['doctor', appointment?.doctor_id],
    queryFn: async () => {
      const doctors = await base44.entities.Doctor.filter({ id: appointment.doctor_id });
      return doctors[0];
    },
    enabled: !!appointment?.doctor_id,
  });

  const { data: patient } = useQuery({
    queryKey: ['patientForCall', appointment?.patient_id],
    queryFn: async () => {
      const patients = await base44.entities.Patient.filter({ id: appointment.patient_id });
      return patients[0];
    },
    enabled: !!appointment?.patient_id,
  });

  const { data: medicalRecords = [] } = useQuery({
    queryKey: ['patientRecords', patient?.id],
    queryFn: async () => {
      return base44.entities.MedicalRecord.filter(
        { patient_id: patient.id },
        '-date',
        10
      );
    },
    enabled: !!patient?.id,
  });

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages([
      ...chatMessages,
      {
        id: Date.now(),
        sender: 'patient',
        content: newMessage,
        timestamp: new Date().toISOString()
      }
    ]);
    setNewMessage('');
  };

  const endCall = async () => {
    if (appointment) {
      // Generate consultation summary with AI
      const chatHistory = chatMessages.map(m => `${m.sender}: ${m.content}`).join('\n');
      
      const summary = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a brief consultation summary from this doctor-patient conversation:

${chatHistory}

Patient: ${patient?.user_id}
Doctor: ${doctor?.full_name}
Date: ${format(new Date(), 'yyyy-MM-dd')}

Create a concise summary including:
- Chief complaint
- Key discussion points
- Recommendations given
- Follow-up needed

Keep it professional and brief.`,
        response_json_schema: {
          type: 'object',
          properties: {
            chief_complaint: { type: 'string' },
            discussion_summary: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } },
            follow_up_required: { type: 'boolean' }
          }
        }
      });

      await base44.entities.Appointment.update(appointment.id, {
        status: 'completed',
        consultation_notes: summary.discussion_summary
      });

      // Create medical record for consultation
      await base44.entities.MedicalRecord.create({
        patient_id: appointment.patient_id,
        record_type: 'doctor_note',
        title: `Video Consultation - ${doctor?.specialization || 'Doctor'}`,
        description: summary.discussion_summary,
        date: format(new Date(), 'yyyy-MM-dd'),
        source: 'consultation',
        doctor_id: appointment.doctor_id,
        doctor_name: doctor?.full_name,
        ai_extracted_data: {
          key_findings: summary.recommendations
        }
      });
    }
    window.location.href = createPageUrl('Appointments');
  };

  if (isConnecting) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#1464F4]/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Video className="w-10 h-10 text-[#1464F4]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connecting...</h2>
          <p className="text-slate-400">Please wait while we establish the connection</p>
          {doctor && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={doctor.profile_photo} />
                <AvatarFallback>{doctor.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-white font-medium">{doctor.full_name}</p>
                <p className="text-slate-400 text-sm">{doctor.specialization}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-slate-900 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Bar */}
      <div className="bg-slate-800/80 backdrop-blur-lg px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={doctor?.profile_photo} />
            <AvatarFallback className="bg-[#1464F4] text-white">
              {doctor?.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-medium">{doctor?.full_name}</p>
            <p className="text-slate-400 text-sm">{doctor?.specialization}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
            {formatDuration(callDuration)}
          </Badge>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-slate-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Main Video Area - Twilio Integration */}
      <div className="flex-1 relative">
        {isVideoCallReady && twilioToken && twilioRoomName ? (
          <TwilioVideoCall
            accessToken={twilioToken}
            roomName={twilioRoomName}
            identity={twilioIdentity}
            onDisconnect={() => setShowEndCallDialog(true)}
            onError={(error) => console.error('Video call error:', error)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Initializing video call...</p>
            </div>
          </div>
        )}

        {/* Side Panels */}
        {/* Chat Panel */}
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
          <SheetContent side="right" className="w-[350px] p-0 bg-slate-900 border-slate-700">
            <SheetHeader className="p-4 border-b border-slate-700">
              <SheetTitle className="text-white">Chat</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-180px)] p-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 ${
                          msg.sender === 'patient'
                            ? 'bg-[#1464F4] text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button onClick={sendMessage} size="icon" className="bg-[#1464F4]">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Patient Info Panel - Overlay for doctors */}
        {isPatientInfoOpen && (
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-slate-800/98 backdrop-blur-xl border-l border-slate-700 overflow-hidden z-20 shadow-2xl">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Patient Information</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPatientInfoOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100%-60px)] p-4">
              {patient && (
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="p-3 bg-slate-700/50 rounded-xl">
                    <h4 className="text-white text-sm font-medium mb-3">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Gender</span>
                        <span className="text-white capitalize">{patient.gender || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Blood Type</span>
                        <span className="text-white font-semibold">{patient.blood_type || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Age</span>
                        <span className="text-white">
                          {patient.date_of_birth 
                            ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Critical Alerts */}
                  {patient.allergies?.length > 0 && (
                    <div className="p-3 bg-red-900/40 border-2 border-red-500/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <h4 className="text-red-300 text-sm font-bold">⚠️ ALLERGIES</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {patient.allergies.map((allergy, idx) => (
                          <span key={idx} className="text-xs px-2.5 py-1 bg-red-500/30 text-red-200 rounded-md font-medium">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chronic Conditions */}
                  {patient.chronic_conditions?.length > 0 && (
                    <div className="p-3 bg-amber-900/30 border border-amber-500/30 rounded-xl">
                      <h4 className="text-amber-400 text-sm font-medium mb-2">Chronic Conditions</h4>
                      <div className="space-y-1">
                        {patient.chronic_conditions.map((condition, idx) => (
                          <p key={idx} className="text-xs text-amber-300">• {condition}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Medical Records */}
                  <div className="p-3 bg-slate-700/50 rounded-xl">
                    <h4 className="text-white text-sm font-medium mb-3">Recent Medical Records</h4>
                    {medicalRecords.length > 0 ? (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {medicalRecords.slice(0, 10).map((record) => (
                          <div key={record.id} className="p-2.5 bg-slate-600/50 rounded-lg hover:bg-slate-600/70 transition-colors">
                            <div className="flex items-start gap-2">
                              {record.record_type === 'lab_result' && <TestTube className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />}
                              {record.record_type === 'prescription' && <Pill className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />}
                              {!['lab_result', 'prescription'].includes(record.record_type) && <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium line-clamp-1">{record.title}</p>
                                <p className="text-slate-400 text-xs mt-0.5">
                                  {format(new Date(record.date), 'MMM d, yyyy')}
                                </p>
                                {record.description && (
                                  <p className="text-slate-300 text-xs mt-1 line-clamp-2">{record.description}</p>
                                )}
                              </div>
                              {record.document_url && (
                                <a href={record.document_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                                  <Eye className="w-4 h-4 text-slate-400 hover:text-blue-400 transition-colors" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs">No medical records available</p>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Floating Action Buttons - Mobile & Desktop */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsChatOpen(true)}
            className="w-12 h-12 rounded-full bg-slate-700/90 backdrop-blur-sm text-white hover:bg-slate-600 shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPatientInfoOpen(!isPatientInfoOpen)}
            className="w-12 h-12 rounded-full bg-slate-700/90 backdrop-blur-sm text-white hover:bg-slate-600 shadow-lg"
          >
            <FileText className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* End Call Dialog */}
      <Dialog open={showEndCallDialog} onOpenChange={setShowEndCallDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">End Consultation?</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 py-4">
            Are you sure you want to end this video consultation?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndCallDialog(false)} className="border-slate-600 text-slate-300">
              Continue Call
            </Button>
            <Button onClick={endCall} variant="destructive">
              End Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}