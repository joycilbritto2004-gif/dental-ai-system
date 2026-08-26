import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Patient Phase Routes
import RecommendedDoctors from './pages/patient/RecommendedDoctors';
import DoctorProfile from './pages/patient/DoctorProfile';
import PatientPredictions from './pages/patient/PatientPredictions';
import ConsultationRequest from './pages/patient/ConsultationRequest';
import PatientPayments from './pages/patient/PatientPayments';
import PatientPaymentCheckout from './pages/patient/PatientPaymentCheckout';
import PatientConsultations from './pages/patient/PatientConsultations';

// Shared
import MessagesUI from './pages/shared/MessagesUI';

// Doctor Phase Routes
import DoctorConsultations from './pages/doctor/DoctorConsultations';
import DoctorConsultationWorkspace from './pages/doctor/DoctorConsultationWorkspace';
import DoctorPayments from './pages/doctor/DoctorPayments';

import './index.css';

// Layout wrapper for public pages with Navbar and Footer
const PublicLayout = () => (
  <div className="page-wrapper">
    <Navbar />
    <main className="main-content">
      <Outlet />
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes with Navbar */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Dashboard Routes with Sidebar */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard/patient" element={<PatientDashboard />} />
          <Route path="/dashboard/patient/doctors" element={<RecommendedDoctors />} />
          <Route path="/dashboard/patient/predictions" element={<PatientPredictions />} />
          <Route path="/dashboard/patient/doctor/:id" element={<DoctorProfile />} />
          <Route path="/dashboard/patient/consult-request/:id" element={<ConsultationRequest />} />
          <Route path="/dashboard/patient/consultations" element={<PatientConsultations />} />
          <Route path="/dashboard/patient/messages" element={<MessagesUI role="patient" />} />
          <Route path="/dashboard/patient/payments" element={<PatientPayments />} />
          <Route path="/dashboard/patient/payment/checkout" element={<PatientPaymentCheckout />} />
          
          <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
          <Route path="/dashboard/doctor/consultations" element={<DoctorConsultations />} />
          <Route path="/dashboard/doctor/consultation/:id" element={<DoctorConsultationWorkspace />} />
          <Route path="/dashboard/doctor/messages" element={<MessagesUI role="doctor" />} />
          <Route path="/dashboard/doctor/payments" element={<DoctorPayments />} />
          <Route path="/dashboard/doctor/history" element={<DoctorDashboard />} /> {/* Placeholder history */}

          <Route path="/dashboard/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
