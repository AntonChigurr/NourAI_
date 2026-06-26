import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Stethoscope, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HealthCard from '@/components/ui/HealthCard';

export default function RegisterChoice() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-4">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Join NourAI</h1>
          <p className="text-slate-600">Choose how you'd like to register</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient Registration */}
          <HealthCard className="hover:border-[#1464F4]/50 transition-all cursor-pointer group">
            <Link to={createPageUrl('Onboarding')} className="block">
              <div className="text-center p-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <User className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Register as Patient</h2>
                <p className="text-slate-600 mb-6">
                  Book appointments, manage your health records, chat with AI health assistant, and track your medications
                </p>
                <ul className="space-y-2 text-sm text-slate-600 text-left mb-6">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Connect with verified doctors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>AI-powered health tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Manage medical records digitally</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Order medications online</span>
                  </li>
                </ul>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Continue as Patient
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Link>
          </HealthCard>

          {/* Doctor Registration */}
          <HealthCard className="hover:border-[#1464F4]/50 transition-all cursor-pointer group">
            <Link to={createPageUrl('DoctorRegistration')} className="block">
              <div className="text-center p-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1464F4] to-[#0D4ED8] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Register as Doctor</h2>
                <p className="text-slate-600 mb-6">
                  Join our network of verified healthcare professionals and provide online and in-clinic consultations
                </p>
                <ul className="space-y-2 text-sm text-slate-600 text-left mb-6">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-[#1464F4] mt-0.5 flex-shrink-0" />
                    <span>Manage your appointments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-[#1464F4] mt-0.5 flex-shrink-0" />
                    <span>Video consultations platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-[#1464F4] mt-0.5 flex-shrink-0" />
                    <span>Digital prescriptions & records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-[#1464F4] mt-0.5 flex-shrink-0" />
                    <span>Grow your practice online</span>
                  </li>
                </ul>
                <Button className="w-full bg-[#1464F4] hover:bg-[#0D4ED8]">
                  Continue as Doctor
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Link>
          </HealthCard>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          Already have an account?{' '}
          <button 
            onClick={() => base44.auth.redirectToLogin()}
            className="text-[#1464F4] font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}