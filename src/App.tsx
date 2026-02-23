import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { PassengerDashboard } from './pages/PassengerDashboard';
import { DriverDashboard } from './pages/DriverDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { WhatsAppOnboarding } from './components/WhatsAppOnboarding';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState<any>(null);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Landing onNavigate={setCurrentPage} />;
      case 'login':
        return <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
      case 'whatsapp':
        return <WhatsAppOnboarding onBack={() => setCurrentPage('home')} />;
      case 'dashboard':
        if (!user) return <Login onLogin={handleLogin} />;
        if (user.role === 'passenger') return <PassengerDashboard user={user} />;
        if (user.role === 'driver') return <DriverDashboard user={user} onUpdateUser={(updates: any) => setUser({...user, ...updates})} />;
        if (user.role === 'admin') return <AdminDashboard />;
        return <Landing onNavigate={setCurrentPage} />;
      default:
        return <Landing onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout 
      userRole={user?.role} 
      onLogout={handleLogout} 
      onNavigate={setCurrentPage}
      currentPage={currentPage}
    >
      {renderPage()}
    </Layout>
  );
}
