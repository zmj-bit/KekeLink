import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SOSAlertList } from '../components/SOSAlertList';
import { Map, Shield, Users, AlertTriangle, BarChart3, Landmark, Search, Filter, Info, MapPin } from 'lucide-react';

export const AdminDashboard = () => {
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [sosAlerts, setSosAlerts] = useState<any[]>([
    { userId: 102, location: 'Kano Central Market', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), status: 'pending' },
    { userId: 45, location: 'Bayero University Road', timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), status: 'pending' }
  ]);
  const [kekeLocations, setKekeLocations] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/reports/hotspots')
      .then(res => res.json())
      .then(data => setHotspots(data));

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'sos_alert') {
        setSosAlerts(prev => [{ ...data, status: 'pending' }, ...prev].slice(0, 10));
      }
      if (data.type === 'nearby_kekes') {
        setKekeLocations(data.locations);
      }
    };

    return () => ws.close();
  }, []);

  const handleDispatch = (id: string | number) => {
    setSosAlerts(prev => prev.map(sos => 
      (sos.userId === id || sos.id === id) ? { ...sos, status: 'dispatched' } : sos
    ));
    alert(`Emergency team dispatched to User ${id}`);
  };

  const handleCall = (id: string | number) => {
    alert(`Initiating secure call to User ${id}...`);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Enterprise Command Center</h1>
          <p className="text-slate-500">Monitoring Northern Nigeria Keke Operations</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600">
            <Filter size={18} /> Filter Region
          </button>
          <button className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-100">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Verified Drivers', value: '12,482', icon: <Users className="text-blue-600" />, change: '+450 this week' },
          { label: 'Active Trips', value: '3,102', icon: <Map className="text-emerald-600" />, change: 'Peak hours' },
          { label: 'Security Incidents', value: hotspots.length.toString(), icon: <AlertTriangle className="text-red-600" />, change: '-80% vs last month' },
          { label: 'Union Dues Collected', value: '₦8.4M', icon: <Landmark className="text-purple-600" />, change: 'Automated' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl">{stat.icon}</div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.change}</span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Risk Map Simulation */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Map className="text-emerald-600" /> Real-time Security Heatmap
            </h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div> High Risk
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div> Medium Risk
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Low Risk
              </span>
            </div>
          </div>
          <div className="aspect-video bg-slate-100 rounded-2xl relative overflow-hidden border border-slate-200">
            <img 
              src="https://picsum.photos/seed/map/1200/800" 
              alt="Map" 
              className="w-full h-full object-cover opacity-50 grayscale"
              referrerPolicy="no-referrer"
            />
            {/* Simulated Heatmap Dots based on real hotspots */}
            {hotspots.map((h, i) => {
              const riskColor = h.risk_level === 'high' ? 'bg-red-500' : h.risk_level === 'medium' ? 'bg-amber-500' : 'bg-blue-500';
              const riskIntensity = h.risk_level === 'high' ? 'opacity-40 blur-2xl scale-150' : h.risk_level === 'medium' ? 'opacity-30 blur-xl scale-125' : 'opacity-20 blur-lg';
              
              return (
                <React.Fragment key={i}>
                  {/* Heat Intensity Glow */}
                  <div 
                    className={`absolute w-16 h-16 rounded-full animate-pulse ${riskColor} ${riskIntensity}`}
                    style={{ 
                      top: `${20 + (i * 17) % 60}%`, 
                      left: `${15 + (i * 23) % 70}%` 
                    }}
                  />
                  {/* Risk Marker */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute z-20 group cursor-help"
                    style={{ 
                      top: `${20 + (i * 17) % 60}%`, 
                      left: `${15 + (i * 23) % 70}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className={`p-1.5 rounded-full shadow-lg border-2 border-white ${riskColor} text-white`}>
                      <AlertTriangle size={12} />
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg shadow-xl">
                      <p className="font-bold uppercase">{h.risk_level} RISK</p>
                      <p className="opacity-70">{h.location}</p>
                      <p className="opacity-70">{h.category} ({h.count} reports)</p>
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}

            {/* Real-time Keke Markers */}
            {kekeLocations.map((keke) => (
              <motion.div
                key={keke.driverId}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute z-10 group"
                style={{ 
                  top: `${40 + (keke.lat - 12.0022) * 2000}%`, 
                  left: `${50 + (keke.lng - 8.5920) * 2000}%` 
                }}
              >
                <div className="bg-emerald-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                  <Shield size={12} />
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg shadow-xl">
                  <p className="font-bold">{keke.name}</p>
                  <p className="opacity-70">{keke.kekeId}</p>
                </div>
              </motion.div>
            ))}
            
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/20 max-w-xs">
                <p className="text-xs font-bold text-slate-500 mb-2">HOTSPOT ALERT</p>
                {hotspots.length > 0 ? (
                  <>
                    <p className="text-sm font-bold text-slate-900">{hotspots[0].location}</p>
                    <p className="text-xs text-slate-600 mt-1">Detected {hotspots[0].category} ({hotspots[0].count} reports). Suggesting patrol deployment.</p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-slate-900">No active hotspots detected.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SOS Triage */}
        <div className="lg:col-span-1">
          <SOSAlertList 
            alerts={sosAlerts} 
            onDispatch={handleDispatch} 
            onCall={handleCall} 
          />
          
          {hotspots.length > 0 && (
            <div className="mt-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Recent Safety Reports</p>
              <div className="space-y-3">
                {hotspots.map((sos, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${sos.risk_level === 'high' ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sos.risk_level === 'high' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {sos.risk_level.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">Recent</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{sos.category}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Map size={10} /> {sos.location}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
