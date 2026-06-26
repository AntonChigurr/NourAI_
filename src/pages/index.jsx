import Layout from "./Layout.jsx";

import Home from "./Home";

import DrNourChat from "./DrNourChat";

import DoctorSearch from "./DoctorSearch";

import DoctorProfile from "./DoctorProfile";

import Appointments from "./Appointments";

import VideoConsultation from "./VideoConsultation";

import MedicalRecords from "./MedicalRecords";

import Pharmacy from "./Pharmacy";

import MentalHealth from "./MentalHealth";

import Reminders from "./Reminders";

import DoctorDashboard from "./DoctorDashboard";

import DoctorPrescriptions from "./DoctorPrescriptions";

import AdminDashboard from "./AdminDashboard";

import AdminDoctorVerification from "./AdminDoctorVerification";

import Onboarding from "./Onboarding";

import DoctorRegistration from "./DoctorRegistration";

import DoctorPatients from "./DoctorPatients";

import DoctorAppointments from "./DoctorAppointments";

import AdminPharmacies from "./AdminPharmacies";

import AdminInsurance from "./AdminInsurance";

import Profile from "./Profile";

import Settings from "./Settings";

import RegisterChoice from "./RegisterChoice";

import PatientPrescriptions from "./PatientPrescriptions";

import PatientInsurance from "./PatientInsurance";

import HealthAnalytics from "./HealthAnalytics";

import PharmacyDetail from "./PharmacyDetail";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    DrNourChat: DrNourChat,
    
    DoctorSearch: DoctorSearch,
    
    DoctorProfile: DoctorProfile,
    
    Appointments: Appointments,
    
    VideoConsultation: VideoConsultation,
    
    MedicalRecords: MedicalRecords,
    
    Pharmacy: Pharmacy,
    
    MentalHealth: MentalHealth,
    
    Reminders: Reminders,
    
    DoctorDashboard: DoctorDashboard,
    
    DoctorPrescriptions: DoctorPrescriptions,
    
    AdminDashboard: AdminDashboard,
    
    AdminDoctorVerification: AdminDoctorVerification,
    
    Onboarding: Onboarding,
    
    DoctorRegistration: DoctorRegistration,
    
    DoctorPatients: DoctorPatients,
    
    DoctorAppointments: DoctorAppointments,
    
    AdminPharmacies: AdminPharmacies,
    
    AdminInsurance: AdminInsurance,
    
    Profile: Profile,
    
    Settings: Settings,
    
    RegisterChoice: RegisterChoice,
    
    PatientPrescriptions: PatientPrescriptions,
    
    PatientInsurance: PatientInsurance,
    
    HealthAnalytics: HealthAnalytics,
    
    PharmacyDetail: PharmacyDetail,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/DrNourChat" element={<DrNourChat />} />
                
                <Route path="/DoctorSearch" element={<DoctorSearch />} />
                
                <Route path="/DoctorProfile" element={<DoctorProfile />} />
                
                <Route path="/Appointments" element={<Appointments />} />
                
                <Route path="/VideoConsultation" element={<VideoConsultation />} />
                
                <Route path="/MedicalRecords" element={<MedicalRecords />} />
                
                <Route path="/Pharmacy" element={<Pharmacy />} />
                
                <Route path="/MentalHealth" element={<MentalHealth />} />
                
                <Route path="/Reminders" element={<Reminders />} />
                
                <Route path="/DoctorDashboard" element={<DoctorDashboard />} />
                
                <Route path="/DoctorPrescriptions" element={<DoctorPrescriptions />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/AdminDoctorVerification" element={<AdminDoctorVerification />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/DoctorRegistration" element={<DoctorRegistration />} />
                
                <Route path="/DoctorPatients" element={<DoctorPatients />} />
                
                <Route path="/DoctorAppointments" element={<DoctorAppointments />} />
                
                <Route path="/AdminPharmacies" element={<AdminPharmacies />} />
                
                <Route path="/AdminInsurance" element={<AdminInsurance />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/RegisterChoice" element={<RegisterChoice />} />
                
                <Route path="/PatientPrescriptions" element={<PatientPrescriptions />} />
                
                <Route path="/PatientInsurance" element={<PatientInsurance />} />
                
                <Route path="/HealthAnalytics" element={<HealthAnalytics />} />
                
                <Route path="/PharmacyDetail" element={<PharmacyDetail />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}