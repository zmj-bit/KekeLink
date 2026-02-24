import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Users, MapPin, Phone, ShieldCheck } from 'lucide-react';

interface SOSAlert {
  userId: string | number;
  location: string;
  timestamp: string;
  status: 'pending' | 'dispatched';
  tripData?: {
    driver: string;
    keke: string;
    origin: string;
    destination: string;
    progress: number;
  };
}

interface SOSAlertListProps {
  alerts: SOSAlert[];
  onDispatch: (id: string | number) => void;
  onCall: (id: string | number) => void;
}

export const SOSAlertList: React.FC<SOSAlertListProps> = ({ alerts, onDispatch, onCall }) => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-xl flex items-center gap-2 text-red-600">
          <AlertTriangle /> LIVE SOS TRIAGE
        </h3>
        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
          {alerts.filter(a => a.status === 'pending').length} ACTIVE
        </span>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
        <AnimatePresence mode="popLayout">
          {alerts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-slate-400"
            >
              <ShieldCheck size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-sm font-medium">All clear. No active SOS alerts.</p>
            </motion.div>
          ) : (
            alerts.map((sos, i) => (
              <motion.div 
                layout
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                key={sos.timestamp + sos.userId} 
                className={`p-5 rounded-2xl border-2 transition-all ${
                  sos.status === 'dispatched' 
                    ? 'border-emerald-100 bg-emerald-50/30 opacity-75' 
                    : 'border-red-500 bg-red-50 shadow-lg shadow-red-100'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sos.status === 'dispatched' ? 'bg-emerald-600' : 'bg-red-600'
                  } text-white`}>
                    {sos.status === 'dispatched' ? 'DISPATCHED' : 'CRITICAL SOS'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-100">
                    {new Date(sos.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                      <Users size={14} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Passenger ID</p>
                      <p className="text-sm font-bold text-slate-900">#USER-{sos.userId}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center mt-0.5">
                      <MapPin size={14} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Last Known Location</p>
                      <p className="text-sm font-bold text-slate-900">{sos.location}</p>
                    </div>
                  </div>
                </div>

                {sos.tripData && (
                  <div className="mt-4 p-3 bg-white/60 rounded-xl border border-red-100 text-[10px]">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-slate-700 uppercase tracking-wider">Active Trip Details</p>
                      <span className="text-red-600 font-bold">{sos.tripData.progress}% Progress</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-slate-600">
                      <div>
                        <p className="text-[8px] uppercase text-slate-400">Driver</p>
                        <p className="font-bold text-slate-900 truncate">{sos.tripData.driver}</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase text-slate-400">Keke ID</p>
                        <p className="font-bold text-slate-900">{sos.tripData.keke}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[8px] uppercase text-slate-400">Route</p>
                        <p className="truncate font-medium text-slate-800">{sos.tripData.origin} → {sos.tripData.destination}</p>
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${sos.tripData.progress}%` }}
                        className="bg-red-500 h-full" 
                      />
                    </div>
                  </div>
                )}
                
                {sos.status !== 'dispatched' && (
                  <div className="flex gap-2 mt-5">
                    <button 
                      onClick={() => onDispatch(sos.userId)}
                      className="flex-1 bg-red-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={14} /> Dispatch Team
                    </button>
                    <button 
                      onClick={() => onCall(sos.userId)}
                      className="bg-white border-2 border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center"
                    >
                      <Phone size={14} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
