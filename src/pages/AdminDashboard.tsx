import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Map, Shield, Users, AlertTriangle, BarChart3, Landmark, Search, Filter, Info } from 'lucide-react';

export const AdminDashboard = () => {
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [sosAlerts, setSosAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/reports/hotspots')
      .then(res => res.json())
      .then(data => setHotspots(data));

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'sos_alert') {
        setSosAlerts(prev => [data, ...prev].slice(0, 5));
      }
    };

    return () => ws.close();
  }, []);

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
              <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-ping"></div> High Risk
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                Safe Zone
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
            {hotspots.map((h, i) => (
              <div 
                key={i}
                className={`absolute w-12 h-12 rounded-full blur-xl animate-pulse ${h.risk_level === 'high' ? 'bg-red-500/30' : 'bg-yellow-500/20'}`}
                style={{ 
                  top: `${20 + (i * 15) % 60}%`, 
                  left: `${20 + (i * 25) % 60}%` 
                }}
              ></div>
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
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-red-600">
            <AlertTriangle /> LIVE SOS TRIAGE
          </h3>
          <div className="space-y-4">
            {sosAlerts.map((sos, i) => (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={`sos-${i}`} 
                className="p-4 rounded-2xl border-2 border-red-500 bg-red-50 animate-pulse"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
                    CRITICAL SOS
                  </span>
                  <span className="text-[10px] text-red-600 font-bold">JUST NOW</span>
                </div>
                <p className="text-sm font-bold text-slate-900">User ID: {sos.userId}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Map size={10} /> {sos.location}
                </p>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 bg-red-600 text-white py-2 rounded-xl text-xs font-bold shadow-lg shadow-red-100">
                    Dispatch
                  </button>
                  <button className="flex-1 bg-white border border-red-200 text-red-600 py-2 rounded-xl text-xs font-bold">
                    Call
                  </button>
                </div>
              </motion.div>
            ))}

            {hotspots.length > 0 ? hotspots.map((sos, i) => (
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
                {sos.risk_level === 'high' && (
                  <button className="w-full mt-3 bg-red-600 text-white py-2 rounded-xl text-xs font-bold shadow-lg shadow-red-100">
                    Dispatch Emergency Team
                  </button>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400">
                <Info size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No recent reports</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
