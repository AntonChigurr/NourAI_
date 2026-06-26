import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import {
  Heart,
  Brain,
  Smile,
  Meh,
  Frown,
  CloudRain,
  Sun,
  Moon,
  Wind,
  Sparkles,
  Trash2,
  Calendar,
  TrendingUp,
  PenLine,
  Video,
  MessageCircle,
  ChevronRight,
  Plus,
  Leaf,
  Music,
  Coffee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import HealthCard from '@/components/ui/HealthCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

const moodEmojis = {
  very_low: { icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Very Low' },
  low: { icon: Frown, color: 'text-indigo-500', bg: 'bg-indigo-100', label: 'Low' },
  neutral: { icon: Meh, color: 'text-slate-500', bg: 'bg-slate-100', label: 'Neutral' },
  good: { icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'Good' },
  excellent: { icon: Sun, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Excellent' },
};

const emotionTags = [
  'Happy', 'Calm', 'Grateful', 'Anxious', 'Stressed', 'Sad', 
  'Angry', 'Tired', 'Energetic', 'Hopeful', 'Overwhelmed', 'Peaceful'
];

const activityTags = [
  'Exercise', 'Meditation', 'Reading', 'Music', 'Nature Walk', 'Socializing',
  'Work', 'Family Time', 'Hobbies', 'Rest', 'Therapy', 'Journaling'
];

export default function MentalHealth() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [moodScore, setMoodScore] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [journalText, setJournalText] = useState('');
  const [anxietyLevel, setAnxietyLevel] = useState(3);
  const [stressLevel, setStressLevel] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(5);
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

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['mentalHealthEntries', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.MentalHealthEntry.filter(
        { patient_id: patient.id },
        '-date',
        30
      );
    },
    enabled: !!patient?.id,
  });

  const { data: therapists = [] } = useQuery({
    queryKey: ['therapists'],
    queryFn: () => base44.entities.Doctor.filter({
      specialization: 'Psychologist',
      verification_status: 'verified',
      available_online: true
    }),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId) => {
      return base44.entities.MentalHealthEntry.delete(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mentalHealthEntries']);
    },
  });

  const makeCallMutation = useMutation({
    mutationFn: async (phoneNumber) => {
      const response = await base44.functions.invoke('makeEmergencyCall', { phoneNumber });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Call initiated successfully');
    },
    onError: (error) => {
      toast.error('Failed to initiate call: ' + error.message);
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async ({ entryData, existingEntryId }) => {
      // Get AI analysis
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this mental health check-in and provide supportive insights:
        
Mood Score: ${entryData.mood_score}/10
Emotions: ${entryData.emotions?.join(', ')}
Activities: ${entryData.activities?.join(', ')}
Anxiety Level: ${entryData.anxiety_level}/10
Stress Level: ${entryData.stress_level}/10
Energy Level: ${entryData.energy_level}/10
Journal Entry: ${entryData.journal_text || 'No entry'}

Provide a brief, empathetic analysis with:
1. Overall sentiment
2. Any concerns noted
3. 2-3 personalized suggestions for wellbeing
4. Whether professional help might be beneficial`,
        response_json_schema: {
          type: 'object',
          properties: {
            sentiment: { type: 'string' },
            concerns: { type: 'array', items: { type: 'string' } },
            suggestions: { type: 'array', items: { type: 'string' } },
            professional_help_recommended: { type: 'boolean' }
          }
        }
      });

      const dataWithAnalysis = {
        ...entryData,
        ai_analysis: aiResponse
      };

      // Update existing entry or create new one
      if (existingEntryId) {
        return base44.entities.MentalHealthEntry.update(existingEntryId, dataWithAnalysis);
      } else {
        return base44.entities.MentalHealthEntry.create(dataWithAnalysis);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mentalHealthEntries']);
      setShowMoodDialog(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setMoodScore(5);
    setSelectedEmotions([]);
    setSelectedActivities([]);
    setJournalText('');
    setAnxietyLevel(3);
    setStressLevel(3);
    setEnergyLevel(5);
  };

  const getMoodLabel = (score) => {
    if (score <= 2) return 'very_low';
    if (score <= 4) return 'low';
    if (score <= 6) return 'neutral';
    if (score <= 8) return 'good';
    return 'excellent';
  };

  const handleSubmitMood = () => {
    if (!patient) return;
    
    const entryData = {
      patient_id: patient.id,
      entry_type: 'mood_check',
      date: format(new Date(), 'yyyy-MM-dd'),
      mood_score: moodScore,
      mood_label: getMoodLabel(moodScore),
      emotions: selectedEmotions,
      activities: selectedActivities,
      journal_text: journalText,
      anxiety_level: anxietyLevel,
      stress_level: stressLevel,
      energy_level: energyLevel
    };

    createEntryMutation.mutate({
      entryData,
      existingEntryId: todayEntry?.id
    });
  };

  const toggleEmotion = (emotion) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const toggleActivity = (activity) => {
    setSelectedActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  // Calculate weekly average
  const weekEntries = entries.filter(e => 
    new Date(e.date) >= subDays(new Date(), 7)
  );
  const weeklyAvgMood = weekEntries.length > 0
    ? parseFloat((weekEntries.reduce((sum, e) => sum + (e.mood_score || 5), 0) / weekEntries.length).toFixed(1))
    : null;

  const todayEntry = entries.find(e => e.date === format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mental Wellness</h1>
            <p className="text-slate-500 mt-1">Track your mood and find support</p>
          </div>
        </div>

        {/* Daily Check-in Card */}
        <HealthCard className={`mb-6 ${todayEntry ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100' : 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${todayEntry ? 'bg-emerald-100' : 'bg-violet-100'}`}>
                {todayEntry ? (
                  React.createElement(moodEmojis[todayEntry.mood_label]?.icon || Heart, {
                    className: `w-7 h-7 ${moodEmojis[todayEntry.mood_label]?.color || 'text-emerald-600'}`
                  })
                ) : (
                  <Heart className="w-7 h-7 text-violet-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {todayEntry ? "Today's Check-in Complete" : "How are you feeling today?"}
                </h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  {todayEntry 
                    ? `Mood: ${moodEmojis[todayEntry.mood_label]?.label} (${todayEntry.mood_score}/10)`
                    : "Take a moment to reflect on your wellbeing"
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowMoodDialog(true)}
              className={todayEntry ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-violet-600 hover:bg-violet-700'}
            >
              {todayEntry ? 'Update' : 'Check In'}
            </Button>
          </div>
        </HealthCard>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <HealthCard className="text-center p-4">
            <p className="text-3xl font-bold text-[#1464F4]">{weeklyAvgMood || '--'}</p>
            <p className="text-xs text-slate-500 mt-1">Week Avg Mood</p>
          </HealthCard>
          <HealthCard className="text-center p-4">
            <p className="text-3xl font-bold text-emerald-600">{weekEntries.length}</p>
            <p className="text-xs text-slate-500 mt-1">Days Tracked</p>
          </HealthCard>
          <HealthCard className="text-center p-4">
            <p className="text-3xl font-bold text-violet-600">{entries.length}</p>
            <p className="text-xs text-slate-500 mt-1">Total Entries</p>
          </HealthCard>
        </div>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="support">Get Support</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            {isLoading ? (
              <LoadingSpinner size="lg" text="Loading entries..." />
            ) : entries.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No entries yet"
                description="Start tracking your mood to see your history here"
                action={() => setShowMoodDialog(true)}
                actionLabel="Add First Entry"
              />
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => {
                  const moodInfo = moodEmojis[entry.mood_label] || moodEmojis.neutral;
                  const MoodIcon = moodInfo.icon;
                  
                  return (
                    <HealthCard key={entry.id}>
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${moodInfo.bg} flex items-center justify-center flex-shrink-0`}>
                          <MoodIcon className={`w-6 h-6 ${moodInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{moodInfo.label}</p>
                              <p className="text-sm text-slate-500">
                                {format(new Date(entry.date), 'EEEE, MMMM d')}
                              </p>
                            </div>
                            <Badge variant="outline" className={moodInfo.color}>
                              {entry.mood_score}/10
                            </Badge>
                          </div>
                          
                          {entry.emotions?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {entry.emotions.map((emotion, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {emotion}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {entry.journal_text && (
                            <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                              "{entry.journal_text}"
                            </p>
                          )}

                          {entry.ai_analysis?.suggestions?.length > 0 && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center gap-1 text-xs text-[#1464F4] mb-2">
                                <Sparkles className="w-3 h-3" />
                                AI Suggestion
                              </div>
                              <p className="text-sm text-slate-600">{entry.ai_analysis.suggestions[0]}</p>
                            </div>
                          )}

                          <div className="mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEntryMutation.mutate(entry.id)}
                              disabled={deleteEntryMutation.isPending}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </HealthCard>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="support">
            {/* Emergency Support */}
            <HealthCard className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Emergency Mental Health Support</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Free, confidential support available 24/7 for UAE residents
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-sm font-medium text-slate-900">Mental Support Line</p>
                      <button
                        onClick={() => makeCallMutation.mutate('+9718004673')}
                        disabled={makeCallMutation.isPending}
                        className="text-lg font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        800-4673
                      </button>
                      <p className="text-xs text-slate-500 mt-1">National psychological support hotline</p>
                    </div>
                    
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-sm font-medium text-slate-900">SEHA Health Services (Abu Dhabi)</p>
                      <button
                        onClick={() => makeCallMutation.mutate('+9718001717')}
                        disabled={makeCallMutation.isPending}
                        className="text-lg font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        800-1717
                      </button>
                      <p className="text-xs text-slate-500 mt-1">Abu Dhabi Department of Health hotline</p>
                    </div>
                    
                    <div className="p-3 bg-red-100 rounded-lg border border-red-200">
                      <p className="text-sm font-medium text-red-900 mb-2">Life-Threatening Emergency</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => makeCallMutation.mutate('+971998')}
                          disabled={makeCallMutation.isPending}
                          className="flex-1 text-center py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          998
                        </button>
                        <button
                          onClick={() => makeCallMutation.mutate('+971999')}
                          disabled={makeCallMutation.isPending}
                          className="flex-1 text-center py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          999
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </HealthCard>

            <HealthCard className="mb-6 bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Video className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Professional Therapy</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Our verified mental health professionals are here to help. 
                    Book a confidential online session.
                  </p>
                  <Link to={createPageUrl('DoctorSearch?specialty=Psychologist')}>
                    <Button className="mt-4 bg-rose-600 hover:bg-rose-700">
                      <Video className="w-4 h-4 mr-2" />
                      Find a Therapist
                    </Button>
                  </Link>
                </div>
              </div>
            </HealthCard>

            <h3 className="font-semibold text-slate-900 mb-3">Available Therapists</h3>
            {therapists.length > 0 ? (
              <div className="space-y-3">
                {therapists.slice(0, 4).map((therapist) => (
                  <Link key={therapist.id} to={createPageUrl(`DoctorProfile?id=${therapist.id}`)}>
                    <HealthCard className="hover:border-[#1464F4]/30">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                          {therapist.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{therapist.full_name}</h4>
                          <p className="text-sm text-slate-500">{therapist.specialization}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {therapist.languages?.slice(0, 2).join(', ')}
                            </Badge>
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              <Video className="w-3 h-3 mr-1" />
                              Online
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </HealthCard>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Heart}
                title="No therapists available"
                description="Therapists will appear here once registered"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Mood Check-in Dialog */}
      <Dialog open={showMoodDialog} onOpenChange={setShowMoodDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How are you feeling?</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Mood Score */}
            <div>
              <label className="text-sm font-medium mb-3 block">Overall Mood</label>
              <div className="flex items-center justify-center gap-4 mb-3">
                {Object.entries(moodEmojis).map(([key, val]) => {
                  const Icon = val.icon;
                  const isActive = getMoodLabel(moodScore) === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setMoodScore(
                        key === 'very_low' ? 1 :
                        key === 'low' ? 3 :
                        key === 'neutral' ? 5 :
                        key === 'good' ? 7 : 9
                      )}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isActive ? `${val.bg} scale-110` : 'bg-slate-100 opacity-50'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${val.color}`} />
                    </button>
                  );
                })}
              </div>
              <Slider
                value={[moodScore]}
                onValueChange={([val]) => setMoodScore(val)}
                min={1}
                max={10}
                step={1}
                className="mt-2"
              />
              <p className="text-center text-sm text-slate-500 mt-2">
                {moodScore}/10 - {moodEmojis[getMoodLabel(moodScore)].label}
              </p>
            </div>

            {/* Emotions */}
            <div>
              <label className="text-sm font-medium mb-2 block">How do you feel?</label>
              <div className="flex flex-wrap gap-2">
                {emotionTags.map((emotion) => (
                  <button
                    key={emotion}
                    onClick={() => toggleEmotion(emotion)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedEmotions.includes(emotion)
                        ? 'bg-[#1464F4] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            {/* Activities */}
            <div>
              <label className="text-sm font-medium mb-2 block">What did you do today?</label>
              <div className="flex flex-wrap gap-2">
                {activityTags.map((activity) => (
                  <button
                    key={activity}
                    onClick={() => toggleActivity(activity)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedActivities.includes(activity)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </div>

            {/* Levels */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Anxiety</label>
                <Slider
                  value={[anxietyLevel]}
                  onValueChange={([val]) => setAnxietyLevel(val)}
                  min={1}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-center text-slate-400 mt-1">{anxietyLevel}/10</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Stress</label>
                <Slider
                  value={[stressLevel]}
                  onValueChange={([val]) => setStressLevel(val)}
                  min={1}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-center text-slate-400 mt-1">{stressLevel}/10</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Energy</label>
                <Slider
                  value={[energyLevel]}
                  onValueChange={([val]) => setEnergyLevel(val)}
                  min={1}
                  max={10}
                  step={1}
                />
                <p className="text-xs text-center text-slate-400 mt-1">{energyLevel}/10</p>
              </div>
            </div>

            {/* Journal */}
            <div>
              <label className="text-sm font-medium mb-2 block">Journal (optional)</label>
              <Textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="Write about your day, thoughts, or anything on your mind..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoodDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitMood}
              disabled={createEntryMutation.isPending}
              className="bg-[#1464F4] hover:bg-[#0D4ED8]"
            >
              {createEntryMutation.isPending ? 'Saving...' : 'Save Check-in'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}