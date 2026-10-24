import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import CreateRequestPage from './pages/CreateRequestPage';
import MatchedWorkersPage from './pages/MatchedWorkersPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';

function MainApp() {
  const { isAuthenticated, isCustomer, isWorker, isAdmin } = useAuth();
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState('landing');
  const [registrationRole, setRegistrationRole] = useState('CUSTOMER');
  const [pendingPage, setPendingPage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedJobRequestId, setSelectedJobRequestId] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const handleNavigate = (page) => {
    let destination = page;
    const customerPages = ['customer-dashboard', 'create-request', 'matched-workers'];

    if (customerPages.includes(page) && !isAuthenticated) {
      setPendingPage(page);
      destination = 'login';
    } else if (page === 'worker-dashboard' && !isAuthenticated) {
      setPendingPage(page);
      destination = 'login';
    } else if (page === 'admin-dashboard' && !isAuthenticated) {
      setPendingPage(page);
      destination = 'login';
    } else if (page === 'booking-details' && !isAuthenticated) {
      setPendingPage(page);
      destination = 'login';
    } else if (page === 'login' || page === 'register') {
      setPendingPage(null);
    } else if (customerPages.includes(page) && !isCustomer) {
      destination = isWorker ? 'worker-dashboard' : 'admin-dashboard';
    } else if (page === 'worker-dashboard' && !isWorker) {
      destination = isAdmin ? 'admin-dashboard' : 'customer-dashboard';
    } else if (page === 'admin-dashboard' && !isAdmin) {
      destination = isWorker ? 'worker-dashboard' : 'customer-dashboard';
    }

    if (destination !== 'register') {
      setRegistrationRole('CUSTOMER');
    }
    setCurrentPage(destination);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProfessionalRegistration = () => {
    setRegistrationRole('WORKER');
    handleNavigate('register');
  };

  const handleLoginSuccess = (loggedUser) => {
    const roleHome = loggedUser.role === 'ADMIN'
      ? 'admin-dashboard'
      : loggedUser.role === 'WORKER'
        ? 'worker-dashboard'
        : 'customer-dashboard';
    const customerPages = ['customer-dashboard', 'create-request', 'matched-workers'];
    const pendingRole = customerPages.includes(pendingPage)
      ? 'CUSTOMER'
      : pendingPage === 'worker-dashboard'
        ? 'WORKER'
        : pendingPage === 'admin-dashboard'
          ? 'ADMIN'
          : null;
    const canResumePendingPage = pendingPage
      && (!pendingRole || pendingRole === loggedUser.role);
    const destination = canResumePendingPage ? pendingPage : roleHome;
    setPendingPage(null);
    setRegistrationRole('CUSTOMER');
    setCurrentPage(destination);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegistrationSuccess = (newUser) => {
    setPendingPage(null);
    setRegistrationRole('CUSTOMER');
    setCurrentPage(newUser.role === 'WORKER' ? 'worker-dashboard' : 'customer-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (catSlug) => {
    setSelectedCategory(catSlug);
  };

  const handleSelectJobRequest = (reqId) => {
    setSelectedJobRequestId(reqId);
  };

  const handleSelectBooking = (bId) => {
    setSelectedBookingId(bId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar
        onNavigate={handleNavigate}
        currentPage={currentPage}
      />

      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onRegisterAsProfessional={handleProfessionalRegistration}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {currentPage === 'login' && (
          <LoginPage onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
        )}

        {currentPage === 'register' && (
          <RegisterPage
            onNavigate={handleNavigate}
            onRegistrationSuccess={handleRegistrationSuccess}
            initialRole={registrationRole}
          />
        )}

        {currentPage === 'customer-dashboard' && (
          <CustomerDashboard
            onNavigate={handleNavigate}
            onSelectJobRequest={handleSelectJobRequest}
            onSelectBooking={handleSelectBooking}
          />
        )}

        {currentPage === 'create-request' && (
          <CreateRequestPage
            onNavigate={handleNavigate}
            onSelectJobRequest={handleSelectJobRequest}
            preselectedCategory={selectedCategory}
          />
        )}

        {currentPage === 'matched-workers' && (
          <MatchedWorkersPage
            jobRequestId={selectedJobRequestId}
            onNavigate={handleNavigate}
            onSelectBooking={handleSelectBooking}
          />
        )}

        {currentPage === 'booking-details' && (
          <BookingDetailsPage
            bookingId={selectedBookingId}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'worker-dashboard' && (
          <WorkerDashboard
            onNavigate={handleNavigate}
            onSelectBooking={handleSelectBooking}
          />
        )}

        {currentPage === 'admin-dashboard' && (
          <AdminDashboard
            onNavigate={handleNavigate}
          />
        )}
      </main>

      <Footer
        onNavigate={handleNavigate}
        onRegisterAsProfessional={handleProfessionalRegistration}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
