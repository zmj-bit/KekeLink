import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Car, Landmark, Camera, Upload, ShieldCheck, MessageCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
  onNavigate: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [role, setRole] = useState<'passenger' | 'driver' | 'admin'>('passenger');
  const [step, setStep] = useState(1);
  const [isVerifyingNIN, setIsVerifyingNIN] = useState(false);
  const [ninVerified, setNinVerified] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    nin: '',
    address: '',
    dob: '',
    next_of_kin: '',
    student_id: '',
    student_expiry: '',
  });

  const handleVerifyNIN = async () => {
    if (!formData.nin) return;
    setIsVerifyingNIN(true);
    // Simulate API call to NIMC (National Identity Management Commission)
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsVerifyingNIN(false);
    setNinVerified(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'driver' && !ninVerified) {
      alert("Please verify your NIN before registering.");
      return;
    }
    // In a real app, we'd call the API here
    const mockUser = {
      id: Math.floor(Math.random() * 1000),
      role,
      name: formData.name || 'Guest User',
      phone: formData.phone || '08000000000',
      is_verified: role === 'passenger' ? true : ninVerified,
    };
    onLogin(mockUser);
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-emerald-600 p-8 text-white text-center">
          <h2 className="text-2xl font-bold">Welcome to KekeLink</h2>
          <p className="text-emerald-100 text-sm mt-2">Secure your journey, empower your business.</p>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 text-center">Choose your role</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'passenger', icon: <User />, label: 'Passenger' },
                  { id: 'driver', icon: <Car />, label: 'Driver' },
                  { id: 'admin', icon: <Landmark />, label: 'Admin' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setRole(item.id as any)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${role === item.id ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    {item.icon}
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setStep(2)}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all"
              >
                Continue
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              {role === 'driver' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <ShieldCheck size={18} />
                    <span className="text-sm font-bold">Security Verification</span>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="NIN Number"
                      className={`flex-1 px-4 py-3 rounded-xl border focus:ring-2 focus:ring-emerald-500 outline-none ${ninVerified ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                      value={formData.nin}
                      onChange={e => setFormData({...formData, nin: e.target.value})}
                      disabled={ninVerified}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyNIN}
                      disabled={isVerifyingNIN || ninVerified || !formData.nin}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${ninVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50'}`}
                    >
                      {isVerifyingNIN ? 'Verifying...' : ninVerified ? 'Verified ✓' : 'Verify NIN'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                      <Camera size={18} /> <span className="text-xs font-bold">Take Photo</span>
                    </button>
                    <button type="button" className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-all">
                      <Upload size={18} /> <span className="text-xs font-bold">Upload NIN</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {role === 'passenger' && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="is_student"
                    className="w-4 h-4 text-emerald-600 rounded"
                    onChange={(e) => {
                      if (e.target.checked) setFormData({...formData, student_id: 'PENDING'});
                      else setFormData({...formData, student_id: ''});
                    }}
                  />
                  <label htmlFor="is_student" className="text-sm text-slate-600">I am a student (Get 20% discount)</label>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  Register
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <div className="mt-8 text-center">
        <button 
          onClick={() => onNavigate('whatsapp')}
          className="text-emerald-600 font-bold flex items-center gap-2 mx-auto hover:underline"
        >
          <MessageCircle size={20} /> Need help? Chat with our AI Onboarding Assistant
        </button>
      </div>
    </div>
  );
};
