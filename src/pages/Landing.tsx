import React from 'react';
import { motion } from 'motion/react';
import { Shield, Car, Users, Landmark, ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';

export const Landing = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6">
              Securing Northern Nigeria's Transport
            </span>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Your Daily Keke, <br />
              <span className="text-emerald-600">Digitally Secured.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-lg">
              KekeLink connects passengers, drivers, and government stakeholders to eliminate "One-Chance" crimes and formalize local transport.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => onNavigate('login')}
                className="bg-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-xl shadow-emerald-200"
              >
                Join KekeLink <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => onNavigate('whatsapp')}
                className="bg-white text-emerald-600 border-2 border-emerald-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-50 transition-all flex items-center gap-2"
              >
                <MessageCircle size={20} /> WhatsApp Onboarding
              </button>
            </div>
            <div className="mt-8 flex items-center gap-4 text-slate-500">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <img key={i} src={`https://picsum.photos/seed/user${i}/32/32`} className="w-8 h-8 rounded-full border-2 border-white" referrerPolicy="no-referrer" />
                ))}
              </div>
              <p className="text-sm">Join 10,000+ verified users. <button onClick={() => onNavigate('whatsapp')} className="text-emerald-600 font-bold hover:underline">Chat on WhatsApp</button></p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src="https://picsum.photos/seed/keke/800/600" 
                alt="Keke in Nigeria" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl z-20 max-w-xs border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Shield className="text-emerald-600 w-5 h-5" />
                </div>
                <span className="font-bold text-slate-900">Verified Driver</span>
              </div>
              <p className="text-sm text-slate-600">NIN-verified, face-matched, and union-certified for your safety.</p>
            </div>
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-400/20 blur-3xl rounded-full"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-900 py-24 px-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Three Sides. One Secure Platform.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We bridge the gap between informal transport and digital security infrastructure.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-8 h-8 text-emerald-400" />,
                title: "For Passengers",
                features: ["Real-time tracking", "SOS Emergency button", "Verified driver info", "Student discounts"]
              },
              {
                icon: <Car className="w-8 h-8 text-emerald-400" />,
                title: "For Drivers",
                features: ["Digital ID & NIN link", "Safety scoring", "Smart dispatching", "Fair corridor pricing"]
              },
              {
                icon: <Landmark className="w-8 h-8 text-emerald-400" />,
                title: "For Enterprise",
                features: ["Crime heatmaps", "Union dues automation", "Policy planning data", "Incident triage"]
              }
            ].map((card, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl hover:border-emerald-500/50 transition-all group">
                <div className="mb-6 group-hover:scale-110 transition-transform">{card.icon}</div>
                <h3 className="text-2xl font-bold mb-6">{card.title}</h3>
                <ul className="space-y-3">
                  {card.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-slate-400 text-sm">
                      <CheckCircle2 size={16} className="text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
