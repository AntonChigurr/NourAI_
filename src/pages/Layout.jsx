
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import {
  Home,
  MessageCircle,
  Calendar,
  FileText,
  Pill,
  Heart,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Stethoscope,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const patients = await base44.entities.Patient.filter({ created_by: userData.email });
      if (patients[0]) setPatient(patients[0]);
    } catch (e) {
      // User not logged in
    }
  };

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  // Determine if this is a doctor portal page
  const isDoctorPortal = (currentPageName?.startsWith('Doctor') && currentPageName !== 'DoctorSearch' && currentPageName !== 'DoctorProfile') || currentPageName?.startsWith('Admin');
  const isOnboarding = currentPageName === 'Onboarding' || currentPageName === 'RegisterChoice';
  const isVideoCall = currentPageName === 'VideoConsultation';

  // Hide layout for video call
  if (isVideoCall) {
    return <>{children}</>;
  }

  // Patient navigation items
  const patientNavItems = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Dr. Nour', icon: MessageCircle, page: 'DrNourChat' },
    { name: 'Doctors', icon: Stethoscope, page: 'DoctorSearch' },
    { name: 'Appointments', icon: Calendar, page: 'Appointments' },
    { name: 'Records', icon: FileText, page: 'MedicalRecords' },
    { name: 'Analytics', icon: Activity, page: 'HealthAnalytics' },
    { name: 'Insurance', icon: Shield, page: 'PatientInsurance' },
    { name: 'Pharmacy', icon: Pill, page: 'Pharmacy' },
    { name: 'Mental Health', icon: Heart, page: 'MentalHealth' },
    { name: 'Reminders', icon: Bell, page: 'Reminders' },
  ];

  // Doctor navigation items
  const doctorNavItems = [
    { name: 'Dashboard', icon: Home, page: 'DoctorDashboard' },
    { name: 'Appointments', icon: Calendar, page: 'DoctorAppointments' },
    { name: 'Patients', icon: User, page: 'DoctorPatients' },
    { name: 'Prescriptions', icon: FileText, page: 'DoctorPrescriptions' },
  ];

  // Admin navigation items
  const adminNavItems = [
    { name: 'Dashboard', icon: Home, page: 'AdminDashboard' },
    { name: 'Doctor Verification', icon: Shield, page: 'AdminDoctorVerification' },
    { name: 'Pharmacies', icon: Pill, page: 'AdminPharmacies' },
    { name: 'Insurance', icon: FileText, page: 'AdminInsurance' },
  ];

  const navItems = currentPageName?.startsWith('Admin') 
    ? adminNavItems 
    : isDoctorPortal 
      ? doctorNavItems 
      : patientNavItems;

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#1464F4] to-[#0D4ED8] bg-clip-text text-transparent">
                NourAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#1464F4] text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {/* Portal Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                    {isDoctorPortal ? <Stethoscope className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    {currentPageName?.startsWith('Admin') ? 'Admin' : isDoctorPortal ? 'Doctor' : 'Patient'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Home')}>
                      <User className="w-4 h-4 mr-2" />
                      Patient Portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('DoctorDashboard')}>
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Doctor Portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('AdminDashboard')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-[#1464F4]/20">
                      <AvatarImage src={patient?.photo_url || user?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] text-white">
                        {user?.full_name?.charAt(0) || 'M'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Profile')}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Settings')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 py-4 px-4">
            <nav className="grid grid-cols-3 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#1464F4] text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
        <div className="flex items-center justify-around py-2 px-2">
          {patientNavItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-[#1464F4]'
                    : 'text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-2' : ''}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
