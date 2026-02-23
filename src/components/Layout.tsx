import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User, Car, LayoutDashboard, LogOut, MessageSquare } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: 'passenger' | 'driver' | 'admin' | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, onNavigate, currentPage }) => {
  const isWhatsApp = currentPage === 'whatsapp';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {!isWhatsApp && (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
                <div className="bg-emerald-600 p-2 rounded-lg">
                  <Shield className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-emerald-900">KekeLink</span>
              </div>

              <div className="hidden md:flex items-center gap-6">
                {userRole ? (
                  <>
                    <button 
                      onClick={() => onNavigate('dashboard')}
                      className={`flex items-center gap-2 text-sm font-medium ${currentPage === 'dashboard' ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`}
                    >
                      <LayoutDashboard size={18} /> Dashboard
                    </button>
                    <button 
                      onClick={onLogout}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => onNavigate('login')} className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors">Get Started</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating AI Assistant Button */}
      {userRole && (
        <button className="fixed bottom-6 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:scale-110 z-50">
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
};
