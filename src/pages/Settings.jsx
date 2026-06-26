import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Bell,
  Globe,
  Shield,
  Moon,
  Smartphone,
  LogOut,
  Trash2,
  Lock,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import HealthCard from '@/components/ui/HealthCard';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [preferences, setPreferences] = useState({
    notifications: true,
    emailNotifications: true,
    appointmentReminders: true,
    medicationReminders: true,
    language: 'en',
    theme: 'light'
  });

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
        setPreferences(prev => ({
          ...prev,
          language: patients[0].preferred_language || 'en',
          notifications: patients[0].health_permissions?.notifications ?? true
        }));
      }
    } catch (e) {}
  };

  const updatePreference = async (key, value) => {
    setPreferences({ ...preferences, [key]: value });
    
    if (patient && key === 'language') {
      await base44.entities.Patient.update(patient.id, {
        preferred_language: value
      });
    }
  };

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

        {/* Notifications */}
        <HealthCard className="mb-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#1464F4]" />
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-slate-500">Receive alerts on your device</p>
              </div>
              <Switch
                checked={preferences.notifications}
                onCheckedChange={(checked) => updatePreference('notifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-slate-500">Get updates via email</p>
              </div>
              <Switch
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Appointment Reminders</p>
                <p className="text-sm text-slate-500">24h before appointments</p>
              </div>
              <Switch
                checked={preferences.appointmentReminders}
                onCheckedChange={(checked) => updatePreference('appointmentReminders', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Medication Reminders</p>
                <p className="text-sm text-slate-500">Daily medication alerts</p>
              </div>
              <Switch
                checked={preferences.medicationReminders}
                onCheckedChange={(checked) => updatePreference('medicationReminders', checked)}
              />
            </div>
          </div>
        </HealthCard>

        {/* Language & Region */}
        <HealthCard className="mb-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#1464F4]" />
            Language & Region
          </h3>
          <div>
            <Label className="mb-2 block">Preferred Language</Label>
            <Select
              value={preferences.language}
              onValueChange={(value) => updatePreference('language', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="ar">🇦🇪 العربية</SelectItem>
                <SelectItem value="ru">🇷🇺 Русский</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </HealthCard>

        {/* Privacy & Security */}
        <HealthCard className="mb-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#1464F4]" />
            Privacy & Security
          </h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Mail className="w-4 h-4 mr-2" />
              Update Email
            </Button>
          </div>
        </HealthCard>

        {/* Account Actions */}
        <HealthCard>
          <h3 className="font-semibold mb-4">Account</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </HealthCard>
      </div>

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => base44.auth.logout()}
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}