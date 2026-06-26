import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Bell,
  Pill,
  Calendar,
  TestTube,
  Stethoscope,
  Leaf,
  Plus,
  Clock,
  Check,
  X,
  Trash2,
  Edit2,
  ChevronRight,
  AlarmClock,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import HealthCard from '@/components/ui/HealthCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ReminderNotifications from '@/components/notifications/ReminderNotifications';

const reminderTypes = {
  medication: { icon: Pill, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Medication' },
  appointment: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Appointment' },
  lab_test: { icon: TestTube, color: 'text-violet-600', bg: 'bg-violet-100', label: 'Lab Test' },
  follow_up: { icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Follow-up' },
  lifestyle: { icon: Leaf, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Lifestyle' },
  custom: { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Custom' },
};

const frequencies = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'three_times_daily', label: 'Three Times Daily' },
  { value: 'weekly', label: 'Weekly' },
];

export default function Reminders() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState({
    type: 'medication',
    title: '',
    description: '',
    medication_name: '',
    dosage: '',
    frequency: 'daily',
    times: ['08:00'],
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
  });
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

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders', patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      return base44.entities.Reminder.filter(
        { patient_id: patient.id },
        '-created_date'
      );
    },
    enabled: !!patient?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Reminder.create({
        ...data,
        patient_id: patient.id,
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
      setShowCreateDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.Reminder.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
      setShowCreateDialog(false);
      setEditingReminder(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.Reminder.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      return base44.entities.Reminder.update(id, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
    },
  });

  const markDoseTakenMutation = useMutation({
    mutationFn: async ({ id, time }) => {
      const reminder = reminders.find(r => r.id === id);
      const today = format(new Date(), 'yyyy-MM-dd');
      const completionLog = reminder.completion_log || [];
      
      // Add new completion entry
      completionLog.push({
        date: today,
        time: time,
        status: 'taken'
      });

      return base44.entities.Reminder.update(id, { 
        completion_log: completionLog,
        last_taken: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reminders']);
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'medication',
      title: '',
      description: '',
      medication_name: '',
      dosage: '',
      frequency: 'daily',
      times: ['08:00'],
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
    });
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      title: formData.type === 'medication' 
        ? `Take ${formData.medication_name}`
        : formData.title,
    };

    if (editingReminder) {
      updateMutation.mutate({ id: editingReminder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitDisabled = () => {
    // Check if medication name or title is filled
    if (formData.type === 'medication' && !formData.medication_name) return true;
    if (formData.type !== 'medication' && !formData.title) return true;

    // Check if times match the frequency
    const requiredTimes = {
      twice_daily: 2,
      three_times_daily: 3
    };

    const required = requiredTimes[formData.frequency];
    if (required && formData.times.length < required) return true;

    // Check if at least one time is set
    if (formData.times.length === 0) return true;

    return createMutation.isPending || updateMutation.isPending;
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      type: reminder.type,
      title: reminder.title,
      description: reminder.description || '',
      medication_name: reminder.medication_name || '',
      dosage: reminder.dosage || '',
      frequency: reminder.frequency,
      times: reminder.times || ['08:00'],
      start_date: reminder.start_date || format(new Date(), 'yyyy-MM-dd'),
      end_date: reminder.end_date || '',
    });
    setShowCreateDialog(true);
  };

  const addTime = () => {
    setFormData({
      ...formData,
      times: [...formData.times, '12:00']
    });
  };

  const removeTime = (index) => {
    setFormData({
      ...formData,
      times: formData.times.filter((_, i) => i !== index)
    });
  };

  const updateTime = (index, value) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData({ ...formData, times: newTimes });
  };

  const activeReminders = reminders.filter(r => r.is_active);
  const inactiveReminders = reminders.filter(r => !r.is_active);

  // Get today's scheduled doses
  const getTodaysDoses = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const doses = [];

    activeReminders.forEach(reminder => {
      if (reminder.times && reminder.times.length > 0) {
        reminder.times.forEach(time => {
          // Check if this dose was already taken today
          const completionLog = reminder.completion_log || [];
          const takenToday = completionLog.some(
            log => log.date === today && log.time === time && log.status === 'taken'
          );

          doses.push({
            reminder,
            time,
            taken: takenToday
          });
        });
      }
    });

    // Sort by time
    return doses.sort((a, b) => a.time.localeCompare(b.time));
  };

  const todaysDoses = getTodaysDoses();

  const ReminderCard = ({ reminder }) => {
    const typeInfo = reminderTypes[reminder.type] || reminderTypes.custom;
    const Icon = typeInfo.icon;

    return (
      <HealthCard className={`${!reminder.is_active ? 'opacity-60' : ''}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${typeInfo.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{reminder.title}</h3>
                {reminder.dosage && (
                  <p className="text-sm text-slate-500">{reminder.dosage}</p>
                )}
              </div>
              <Switch
                checked={reminder.is_active}
                onCheckedChange={(checked) => 
                  toggleActiveMutation.mutate({ id: reminder.id, is_active: checked })
                }
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {reminder.times?.join(', ') || 'Not set'}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {reminder.frequency?.replace(/_/g, ' ')}
              </Badge>
            </div>

            {reminder.description && (
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{reminder.description}</p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(reminder)}
                className="text-slate-500"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate(reminder.id)}
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
  };

  return (
    <div className="pb-24 md:pb-8">
      <ReminderNotifications reminders={activeReminders} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reminders</h1>
            <p className="text-slate-500 mt-1">Never miss your medications or appointments</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setEditingReminder(null);
              setShowCreateDialog(true);
            }}
            className="bg-[#1464F4] hover:bg-[#0D4ED8]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
        </div>

        {/* Today's Doses */}
        {todaysDoses.length > 0 && (
          <HealthCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Today's Schedule</h2>
              <Badge variant="outline">
                {todaysDoses.filter(d => d.taken).length} of {todaysDoses.length} taken
              </Badge>
            </div>
            <div className="space-y-2">
              {todaysDoses.map((dose, idx) => {
                const typeInfo = reminderTypes[dose.reminder.type] || reminderTypes.custom;
                const Icon = typeInfo.icon;
                
                return (
                  <div
                    key={`${dose.reminder.id}-${dose.time}-${idx}`}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      dose.taken
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${typeInfo.color}`} />
                      </div>
                      <div>
                        <p className={`font-medium ${dose.taken ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                          {dose.reminder.title}
                        </p>
                        {dose.reminder.dosage && (
                          <p className="text-sm text-slate-500">{dose.reminder.dosage}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {dose.time}
                      </Badge>
                      {dose.taken ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm font-medium">Taken</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => markDoseTakenMutation.mutate({ 
                            id: dose.reminder.id, 
                            time: dose.time 
                          })}
                          disabled={markDoseTakenMutation.isPending}
                          className="bg-[#1464F4] hover:bg-[#0D4ED8]"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Mark Taken
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </HealthCard>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <HealthCard className="text-center p-4">
            <p className="text-3xl font-bold text-[#1464F4]">{activeReminders.length}</p>
            <p className="text-xs text-slate-500 mt-1">Active</p>
          </HealthCard>
          <HealthCard className="text-center p-4">
            <p className="text-3xl font-bold text-rose-600">
              {activeReminders.filter(r => r.type === 'medication').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Medications</p>
          </HealthCard>
          <HealthCard className="text-center p-4">
            <p className="text-3xl font-bold text-emerald-600">
              {activeReminders.filter(r => r.type !== 'medication').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Others</p>
          </HealthCard>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active">Active ({activeReminders.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveReminders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isLoading ? (
              <LoadingSpinner size="lg" text="Loading reminders..." />
            ) : activeReminders.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No active reminders"
                description="Create reminders for your medications, appointments, and more"
                action={() => {
                  resetForm();
                  setShowCreateDialog(true);
                }}
                actionLabel="Create Reminder"
              />
            ) : (
              <div className="space-y-3">
                {activeReminders.map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inactive">
            {inactiveReminders.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No inactive reminders"
                description="Paused reminders will appear here"
              />
            ) : (
              <div className="space-y-3">
                {inactiveReminders.map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingReminder ? 'Edit Reminder' : 'Create Reminder'}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
            {/* Type Selection */}
            <div>
              <Label className="mb-2 block">Reminder Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(reminderTypes).map(([key, val]) => {
                  const Icon = val.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setFormData({ ...formData, type: key })}
                      className={`p-3 rounded-xl border transition-all ${
                        formData.type === key
                          ? 'border-[#1464F4] bg-[#1464F4]/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${val.color}`} />
                      <p className="text-xs">{val.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Medication Fields */}
            {formData.type === 'medication' && (
              <>
                <div>
                  <Label className="mb-2 block">Medication Name</Label>
                  <Input
                    value={formData.medication_name}
                    onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                    placeholder="e.g., Metformin"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Dosage</Label>
                  <Input
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g., 500mg, 1 tablet"
                  />
                </div>
              </>
            )}

            {/* Other Types */}
            {formData.type !== 'medication' && (
              <div>
                <Label className="mb-2 block">Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Reminder title"
                />
              </div>
            )}

            <div>
              <Label className="mb-2 block">Description (optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            {/* Frequency */}
            <div>
              <Label className="mb-2 block">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Times */}
            <div>
              <Label className="mb-2 block">
                Times 
                {formData.frequency === 'twice_daily' && (
                  <span className="text-xs text-slate-500 ml-2">(At least 2 times required)</span>
                )}
                {formData.frequency === 'three_times_daily' && (
                  <span className="text-xs text-slate-500 ml-2">(At least 3 times required)</span>
                )}
              </Label>
              <div className="space-y-2">
                {formData.times.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => updateTime(index, e.target.value)}
                      className="flex-1"
                    />
                    {formData.times.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTime(index)}
                        className="text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTime}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Time
                </Button>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-2 block">Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-2 block">End Date (optional)</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitDisabled()}
              className="bg-[#1464F4] hover:bg-[#0D4ED8]"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingReminder ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}