import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Mic,
  Upload,
  Camera,
  Stethoscope,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Sparkles,
  Bot,
  User,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import HealthCard from '@/components/ui/HealthCard';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DrNourChat() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const patients = await base44.entities.Patient.filter({ created_by: userData.email });
      if (patients[0]) {
        setPatient(patients[0]);
        
        // Load or create conversation
        const conversations = await base44.entities.ChatConversation.filter({
          patient_id: patients[0].id,
          conversation_type: 'dr_nour',
          is_active: true
        }, '-created_date', 1);

        if (conversations[0]) {
          setConversation(conversations[0]);
          setMessages(conversations[0].messages || []);
        } else {
          // Create new conversation with welcome message
          const welcomeMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Hello! 👋 I'm Dr. Nour, your AI health assistant. I'm here to help you understand your symptoms, answer health questions, and guide you to the right care.\n\nHow can I assist you today? You can:\n- Describe any symptoms you're experiencing\n- Ask health-related questions\n- Upload medical documents for analysis\n- Get recommendations for specialists`,
            timestamp: new Date().toISOString()
          };
          
          const newConv = await base44.entities.ChatConversation.create({
            patient_id: patients[0].id,
            conversation_type: 'dr_nour',
            title: 'Dr. Nour Consultation',
            messages: [welcomeMessage],
            is_active: true
          });
          
          setConversation(newConv);
          setMessages([welcomeMessage]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;
    if (!conversation || !patient) return;

    setIsLoading(true);
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      attachments: attachments.map(a => ({
        type: a.type,
        url: a.url,
        name: a.name
      }))
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    const currentInput = inputMessage;
    const currentAttachments = [...attachments];
    setInputMessage('');
    setAttachments([]);

    try {
      // Get medical context
      const recentRecords = await base44.entities.MedicalRecord.filter(
        { patient_id: patient.id },
        '-date',
        3
      );
      
      const medicalContext = recentRecords.length > 0 
        ? `Recent medical history: ${recentRecords.map(r => `${r.title} (${r.date})`).join(', ')}`
        : '';

      // Get AI response with file analysis if attachments exist
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Dr. Nour, an empathetic AI health assistant for NourAI healthcare platform in UAE.

Patient Information:
- Name: ${user?.full_name}
- Gender: ${patient?.gender || 'Not specified'}
- Age: ${patient?.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'Unknown'}
- Known Allergies: ${patient?.allergies?.join(', ') || 'None recorded'}
- Chronic Conditions: ${patient?.chronic_conditions?.join(', ') || 'None recorded'}
${medicalContext}

Previous conversation (last 5 messages):
${messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

User's message: ${currentInput}

${currentAttachments.length > 0 ? `The user has uploaded ${currentAttachments.length} medical document(s). Analyze them if they are medical reports.` : ''}

CRITICAL Instructions:
1. Analyze symptoms and ask relevant follow-up questions
2. Assess urgency level (low/medium/high/emergency)
3. Detect specific symptoms mentioned
4. For concerning symptoms, recommend appropriate specialist
5. For EMERGENCY symptoms (chest pain, severe bleeding, difficulty breathing, stroke signs), strongly urge calling 998 immediately
6. Always add disclaimer: "I'm an AI assistant, not a replacement for professional medical advice"
7. Be warm, culturally sensitive, and supportive
8. If documents uploaded, analyze and explain findings in simple terms
9. Suggest creating reminders for medications if mentioned
10. Provide actionable health recommendations

Respond conversationally and helpfully.`,
        file_urls: currentAttachments.length > 0 ? currentAttachments.map(a => a.url) : undefined,
        response_json_schema: {
          type: 'object',
          properties: {
            response: { type: 'string' },
            urgency_level: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'] },
            symptoms_detected: { type: 'array', items: { type: 'string' } },
            recommended_specialty: { type: 'string' },
            recommended_action: { type: 'string' },
            red_flags: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date().toISOString(),
        ai_analysis: {
          urgency_level: aiResponse.urgency_level,
          symptoms_detected: aiResponse.symptoms_detected,
          recommended_specialty: aiResponse.recommended_specialty,
          red_flags: aiResponse.red_flags
        }
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Update conversation
      await base44.entities.ChatConversation.update(conversation.id, {
        messages: finalMessages,
        detected_symptoms: aiResponse.symptoms_detected,
        urgency_level: aiResponse.urgency_level,
        recommended_action: aiResponse.recommended_action
      });

    } catch (error) {
      console.error(error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date().toISOString()
      };
      setMessages([...updatedMessages, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setAttachments(prev => [...prev, {
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url: file_url,
          name: file.name
        }]);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    
    setShowUploadDialog(false);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startNewConversation = async () => {
    if (conversation) {
      await base44.entities.ChatConversation.update(conversation.id, { is_active: false });
    }
    
    const welcomeMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Starting a new conversation! How can I help you today?`,
      timestamp: new Date().toISOString()
    };
    
    const newConv = await base44.entities.ChatConversation.create({
      patient_id: patient.id,
      conversation_type: 'dr_nour',
      title: 'Dr. Nour Consultation',
      messages: [welcomeMessage],
      is_active: true
    });
    
    setConversation(newConv);
    setMessages([welcomeMessage]);
  };

  const quickPrompts = [
    { text: "I have a headache", icon: "🤕" },
    { text: "Feeling anxious", icon: "😰" },
    { text: "Can't sleep well", icon: "😴" },
    { text: "Stomach pain", icon: "🤢" },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Dr. Nour</h2>
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Online
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={startNewConversation}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className={`w-8 h-8 ${message.role === 'user' ? 'bg-slate-200' : 'bg-gradient-to-br from-[#1464F4] to-[#0D4ED8]'}`}>
                <AvatarFallback className={message.role === 'user' ? 'text-slate-600' : 'text-white'}>
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              
              <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[#1464F4] text-white'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <ReactMarkdown className="prose prose-sm max-w-none prose-slate">
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  
                  {/* Attachments */}
                  {message.attachments?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs opacity-80">
                          {att.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {att.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Analysis Badge */}
                {message.ai_analysis?.urgency_level && message.ai_analysis.urgency_level !== 'low' && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={message.ai_analysis.urgency_level} />
                    {message.ai_analysis.recommended_specialty && (
                      <Link to={createPageUrl(`DoctorSearch?specialty=${message.ai_analysis.recommended_specialty}`)}>
                        <Button size="sm" variant="outline" className="text-xs h-6 gap-1">
                          <Stethoscope className="w-3 h-3" />
                          Find {message.ai_analysis.recommended_specialty}
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                  {format(new Date(message.timestamp), 'HH:mm')}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 bg-gradient-to-br from-[#1464F4] to-[#0D4ED8]">
                <AvatarFallback className="text-white">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1464F4]" />
                  <span className="text-sm text-slate-500">Dr. Nour is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-slate-500 mb-2">Quick prompts:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage(prompt.text)}
                  className="text-sm"
                >
                  <span className="mr-1">{prompt.icon}</span>
                  {prompt.text}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 pb-2">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
                {att.type === 'image' ? <ImageIcon className="w-4 h-4 text-slate-500" /> : <FileText className="w-4 h-4 text-slate-500" />}
                <span className="text-sm text-slate-700">{att.name}</span>
                <button onClick={() => removeAttachment(idx)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-slate-100 p-4 mb-16 md:mb-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-400 hover:text-[#1464F4]"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Describe your symptoms or ask a question..."
                className="pr-12 rounded-xl border-slate-200 focus:border-[#1464F4] focus:ring-[#1464F4]/20"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={isLoading || (!inputMessage.trim() && attachments.length === 0)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#1464F4] hover:bg-[#0D4ED8]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            Dr. Nour provides guidance only. For emergencies, call 998.
          </p>
        </div>
      </div>
    </div>
  );
}