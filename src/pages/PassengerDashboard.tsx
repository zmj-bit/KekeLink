import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Shield, AlertTriangle, Share2, MessageCircle, GraduationCap, Navigation, Info, Bell, CheckCircle, Car, Clock, Star, X } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { SafetyReportModal } from '../components/SafetyReportModal';

export const PassengerDashboard = ({ user }: { user: any }) => {
  const [destination, setDestination] = useState('');
  const [kekeId, setKekeId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [pricingDetails, setPricingDetails] = useState<any>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [tripStatus, setTripStatus] = useState<'idle' | 'pricing' | 'searching' | 'started'>('idle');
  const [tripProgress, setTripProgress] = useState(0);
  const [routeUpdate, setRouteUpdate] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [sosSent, setSosSent] = useState(false);
  const [nearbyKekes, setNearbyKekes] = useState<any[]>([]);
  const [pendingRating, setPendingRating] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let interval: any;
    if (tripStatus === 'started' && tripProgress < 100) {
      interval = setInterval(() => {
        setTripProgress(prev => {
          const next = prev + 2;
          if (next >= 100) {
            setPendingRating(activeTrip);
            setTripStatus('idle');
            setActiveTrip(null);
            setPricingDetails(null);
            setRouteUpdate(null);
            return 100;
          }
          return next;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [tripStatus, tripProgress, activeTrip]);

  useEffect(() => {
    if (tripStatus === 'started' && activeTrip && tripProgress > 0 && tripProgress % 20 === 0 && tripProgress < 100) {
      geminiService.getRouteUpdate(activeTrip.origin, activeTrip.destination, tripProgress)
        .then(update => setRouteUpdate(update || null));
    }
  }, [tripStatus, activeTrip, tripProgress]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', userId: user.id, role: 'passenger' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'safety_alert') {
        setAlerts(prev => [data, ...prev].slice(0, 3));
      }
      if (data.type === 'nearby_kekes') {
        setNearbyKekes(data.locations);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [user.id]);

  const handleSearch = async () => {
    if (!destination) return alert("Please enter a destination");
    setIsSearching(true);
    setPricingDetails(null);
    setActiveTrip(null);
    setTripStatus('pricing');
    
    try {
      // Use current location and specific time from request context
      const origin = "Current Location";
      const currentTime = "2026-02-23T14:18:16-08:00";
      
      // Call AI for dynamic pricing
      const pricing = await geminiService.calculateDynamicPrice(origin, destination, currentTime, 'high');
      setPricingDetails(pricing);
      
      setTripStatus('searching');

      setTimeout(() => {
        setIsSearching(false);
        setTripStatus('idle');
        setActiveTrip({
          driver: 'Musa Ibrahim',
          keke: 'KL-2024-089',
          eta: '3 mins',
          fare: user.student_id ? Math.round(pricing.total_fare * 0.8) : pricing.total_fare,
          rating: 4.8,
          safetyScore: 96,
          origin,
          destination
        });
      }, 2000);
    } catch (error) {
      console.error("Search error:", error);
      setIsSearching(false);
      setTripStatus('idle');
    }
  };

  const startTrip = () => {
    setTripStatus('started');
    setTripProgress(0);
    setRouteUpdate(null);
  };

  const handleSOS = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'sos', 
        location: 'Current GPS Location' // In a real app, we'd get actual coordinates
      }));
      setSosSent(true);
      setTimeout(() => setSosSent(false), 5000);
    } else {
      alert("Connection lost. Please try calling emergency services directly.");
    }
  };

  const handleShareTrip = () => {
    if (!activeTrip) return;
    const message = `I'm on a KekeLink trip! Driver: ${activeTrip.driver}, Keke ID: ${activeTrip.keke}. Destination: ${activeTrip.destination}. Track me on KekeLink.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'KekeLink Trip Details',
        text: message,
        url: window.location.origin
      }).catch(() => {
        window.location.href = `sms:?body=${encodeURIComponent(message)}`;
      });
    } else {
      window.location.href = `sms:?body=${encodeURIComponent(message)}`;
    }
  };

  const submitRating = () => {
    if (ratingValue === 0) return alert("Please select a rating");
    // In a real app, we'd send this to the backend
    console.log(`Submitted ${ratingValue} stars for ${pendingRating.driver}`);
    setPendingRating(null);
    setRatingValue(0);
    alert("Thank you for your feedback! Your rating helps keep KekeLink safe.");
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Driver Rating Modal */}
      <AnimatePresence>
        {pendingRating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-emerald-100 mx-auto mb-6 flex items-center justify-center overflow-hidden">
                <img src="https://picsum.photos/seed/driver/200/200" alt="Driver" referrerPolicy="no-referrer" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Rate your trip with {pendingRating.driver}</h2>
              <p className="text-slate-500 mb-8">How was your experience? Your feedback helps us maintain high safety standards.</p>
              
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingValue(star)}
                    onMouseEnter={() => ratingValue === 0 && setRatingValue(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star 
                      size={40} 
                      className={star <= ratingValue ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} 
                    />
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setPendingRating(null)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Skip
                </button>
                <button 
                  onClick={submitRating}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  Submit Rating
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Confirmation Overlay */}
      <AnimatePresence>
        {sosSent && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-red-600/90 backdrop-blur-sm"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-red-600 animate-pulse" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">SOS ALERT SENT</h2>
              <p className="text-slate-600 mb-6">Nearby drivers, community leaders, and emergency services have been notified of your location.</p>
              <div className="flex items-center gap-2 justify-center text-emerald-600 font-bold">
                <CheckCircle size={20} />
                <span>Tracking Active</span>
              </div>
              <button 
                onClick={() => setSosSent(false)}
                className="mt-8 w-full py-3 bg-slate-900 text-white rounded-xl font-bold"
              >
                I am safe now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, idx) => (
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              key={idx} 
              className="bg-red-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Bell className="animate-bounce" size={20} />
                <div>
                  <p className="text-xs font-bold uppercase">Safety Alert: {alert.category}</p>
                  <p className="text-sm">{alert.summary} at {alert.location}</p>
                </div>
              </div>
              <button onClick={() => setAlerts(prev => prev.filter((_, i) => i !== idx))} className="text-white/60 hover:text-white">
                <Info size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Action Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Nearby Keke Map */}
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Navigation size={18} className="text-emerald-600" /> Nearby Available Kekes
              </h3>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full animate-pulse">
                {nearbyKekes.length} ONLINE
              </span>
            </div>
            <div className="aspect-video bg-slate-100 rounded-2xl relative overflow-hidden border border-slate-200">
              <img 
                src="https://picsum.photos/seed/kanomap/1200/800" 
                alt="Map" 
                className="w-full h-full object-cover opacity-40 grayscale"
                referrerPolicy="no-referrer"
              />
              {/* Simulated Keke Markers */}
              {nearbyKekes.map((keke, i) => (
                <motion.div
                  key={keke.driverId}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute cursor-pointer group"
                  style={{ 
                    top: `${40 + (keke.lat - 12.0022) * 2000}%`, 
                    left: `${50 + (keke.lng - 8.5920) * 2000}%` 
                  }}
                >
                  <div className="bg-emerald-600 text-white p-2 rounded-full shadow-lg group-hover:bg-emerald-700 transition-colors">
                    <Car size={16} />
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg shadow-xl">
                    <p className="font-bold">{keke.name}</p>
                    <p className="opacity-70">{keke.kekeId}</p>
                  </div>
                </motion.div>
              ))}
              
              {/* User Marker */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg ring-4 ring-blue-500/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Where are you going?</h2>
              <button 
                onClick={() => setIsReportModalOpen(true)}
                className="text-red-600 bg-red-50 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-red-100 transition-all"
              >
                <AlertTriangle size={14} /> Report Hazard
              </button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Enter destination..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Enter Keke Unique Number (e.g. KL-001)"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={kekeId}
                  onChange={e => setKekeId(e.target.value)}
                />
              </div>
              
              {pricingDetails && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100"
                >
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                    <Info size={16} /> AI Fair Pricing Breakdown
                  </div>
                  <p className="text-xs text-emerald-700">{pricingDetails.explanation}</p>
                  <div className="flex justify-between mt-2 text-xs font-medium text-emerald-900">
                    <span>Base: ₦{pricingDetails.base_fare}</span>
                    <span>Demand: x{pricingDetails.demand_multiplier}</span>
                  </div>
                </motion.div>
              )}

              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                {tripStatus === 'pricing' ? 'AI Pricing...' : tripStatus === 'searching' ? 'Finding Driver...' : 'Find Secure Keke'}
              </button>
            </div>
          </div>

          {activeTrip && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl shadow-lg border-2 border-emerald-100"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden">
                    <img src="https://picsum.photos/seed/driver/200/200" alt="Driver" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{activeTrip.driver}</h3>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Shield size={14} className="text-emerald-600" /> Verified Driver • {activeTrip.rating} ★
                      </p>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-1.5 py-0.5 rounded-md">
                        <Shield size={10} /> Safety Score: {activeTrip.safetyScore}/100
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">Keke ID</p>
                  <p className="text-lg font-bold text-emerald-600">{activeTrip.keke}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 font-bold uppercase">Estimated Fare</p>
                  <p className="text-xl font-bold">₦{activeTrip.fare}</p>
                  {user.student_id && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">STUDENT DISCOUNT</span>}
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs text-slate-500 font-bold uppercase">ETA</p>
                  <p className="text-xl font-bold">{activeTrip.eta}</p>
                </div>
              </div>

              {tripStatus === 'started' && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-slate-500 uppercase">Trip Progress</p>
                    <p className="text-xs font-bold text-emerald-600">{tripProgress}%</p>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-emerald-600 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${tripProgress}%` }}
                    />
                  </div>
                  {routeUpdate && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-emerald-100 rounded-xl flex items-start gap-2"
                    >
                      <Info size={14} className="text-emerald-600 mt-0.5" />
                      <p className="text-xs text-emerald-800 font-medium italic">"{routeUpdate}"</p>
                    </motion.div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                {tripStatus !== 'started' ? (
                  <button 
                    onClick={startTrip}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <Navigation size={18} /> Start Trip
                  </button>
                ) : (
                  <div className="flex-1 bg-emerald-50 text-emerald-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-emerald-100">
                    <Clock size={18} className="animate-spin" /> Trip in Progress
                  </div>
                )}
                <button 
                  onClick={handleShareTrip}
                  className="bg-slate-100 text-slate-600 p-3 rounded-xl hover:bg-slate-200 transition-all"
                >
                  <Share2 size={20} />
                </button>
                <button 
                  onClick={handleSOS}
                  className="bg-red-100 text-red-600 p-3 rounded-xl hover:bg-red-200 transition-all"
                >
                  <AlertTriangle size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="text-emerald-400" /> AI Safety Assistant
            </h3>
            <p className="text-sm text-slate-400 mb-4">"Ina kwana! I'm monitoring your trip. Type 'help' or send a voice note if you feel unsafe."</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ask anything..."
                className="flex-1 bg-slate-800 border-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button className="bg-emerald-600 p-2 rounded-xl">
                <Navigation size={16} className="rotate-90" />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <GraduationCap className="text-emerald-600" /> Student Benefits
            </h3>
            <p className="text-xs text-slate-500 mb-4">Students get 20% off all rides. Ensure your ID is valid and NIN is linked.</p>
            <button className="w-full py-2 border-2 border-emerald-600 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all">
              Verify Student ID
            </button>
          </div>

          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
            <h3 className="font-bold text-emerald-900 mb-2">WhatsApp Support</h3>
            <p className="text-xs text-emerald-700 mb-4">Chat with us directly on WhatsApp for instant onboarding help.</p>
            <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <MessageCircle size={18} /> Open WhatsApp
            </button>
          </div>
        </div>
      </div>

      <SafetyReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        userId={user.id} 
      />

      {/* Permanent Floating SOS Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleSOS}
        className="fixed bottom-8 right-8 w-16 h-16 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 border-4 border-white"
      >
        <AlertTriangle size={32} />
      </motion.button>
    </div>
  );
};
