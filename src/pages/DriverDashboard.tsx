import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Shield, TrendingUp, Map, Star, AlertCircle, Clock, UserCheck, Navigation, CheckCircle2, AlertTriangle, Bell, Info, X } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { SafetyReportModal } from '../components/SafetyReportModal';

export const DriverDashboard = ({ user, onUpdateUser }: { user: any, onUpdateUser?: (updates: any) => void }) => {
  const [isOnShift, setIsOnShift] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFacePrompt, setShowFacePrompt] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [suggestedRoutes, setSuggestedRoutes] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tripProgress, setTripProgress] = useState(0);
  const [routeUpdate, setRouteUpdate] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [anomalyWarning, setAnomalyWarning] = useState<any>(null);
  const [safetyData, setSafetyData] = useState<any>({ score: 98, tips: [], summary: 'Loading coaching...' });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [passengerRating, setPassengerRating] = useState(0);
  const [earnings, setEarnings] = useState(4500);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchSafetyCoaching = async () => {
      const stats = {
        trips_completed: 145,
        route_adherence: 0.96,
        incidents_reported: 0,
        verifications_successful: true,
        last_shift_duration: '8h'
      };
      try {
        const data = await geminiService.getSafetyCoaching(stats);
        setSafetyData(data);
      } catch (error) {
        console.error("Error fetching safety coaching:", error);
      }
    };
    fetchSafetyCoaching();
  }, []);

  useEffect(() => {
    let interval: any;
    if (activeTrip && tripProgress > 0 && tripProgress < 100) {
      interval = setInterval(async () => {
        const tripData = {
          current_location: "Kano City Center",
          destination: activeTrip.destination,
          speed: Math.floor(Math.random() * 40) + 10,
          time: new Date().toISOString(),
          progress: tripProgress
        };
        
        try {
          const result = await geminiService.detectTripAnomaly(tripData);
          if (result.is_anomaly) {
            setAnomalyWarning(result);
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'anomaly_alert',
                userId: user.id,
                reason: result.reason,
                risk_level: result.risk_level
              }));
            }
          } else {
            setAnomalyWarning(null);
          }
        } catch (error) {
          console.error("Anomaly detection error:", error);
        }
      }, 15000);
    }
    return () => clearInterval(interval);
  }, [activeTrip, tripProgress, user.id]);

  useEffect(() => {
    let interval: any;
    if (activeTrip && selectedRoute && tripProgress < 100) {
      interval = setInterval(async () => {
        setTripProgress(prev => {
          const next = prev + 5;
          if (next >= 100) return 100;
          return next;
        });
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTrip, tripProgress]);

  useEffect(() => {
    if (activeTrip && tripProgress > 0 && tripProgress % 20 === 0 && tripProgress < 100) {
      geminiService.getRouteUpdate(activeTrip.origin, activeTrip.destination, tripProgress)
        .then(update => setRouteUpdate(update || null));
    }
  }, [activeTrip, tripProgress]);

  useEffect(() => {
    if (isOnShift) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', userId: user.id, role: 'driver' }));
      };

      const locationInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          // Simulate random movement around Kano
          const lat = 12.0022 + (Math.random() - 0.5) * 0.01;
          const lng = 8.5920 + (Math.random() - 0.5) * 0.01;
          ws.send(JSON.stringify({ 
            type: 'location_update', 
            lat, 
            lng,
            name: user.name,
            kekeId: 'KL-2024-089' // Mock Keke ID
          }));
        }
      }, 3000);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'safety_alert') {
          setAlerts(prev => [data, ...prev].slice(0, 3));
        }
        if (data.type === 'sos_alert') {
          setAlerts(prev => [{
            category: 'EMERGENCY SOS',
            summary: `User ${data.userId} needs immediate help at ${data.location}`,
            location: data.location,
            isSOS: true
          }, ...prev].slice(0, 3));
        }
      };

      return () => {
        clearInterval(locationInterval);
        ws.close();
        wsRef.current = null;
      };
    }
  }, [isOnShift, user.id, user.name]);

  const startShift = () => {
    setShowFacePrompt(true);
  };

  const handleFaceVerify = async () => {
    setIsVerifying(true);
    try {
      // Simulate taking a photo with a placeholder base64
      const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      
      // Use extractIdInfo to simulate face-match as requested
      const result = await geminiService.extractIdInfo(dummyBase64, 'nin');
      
      if (onUpdateUser) {
        onUpdateUser({ 
          face_verified: true, 
          last_verification: new Date().toISOString(),
          verification_details: result 
        });
      }
      
      setFaceVerified(true);
      setIsOnShift(true);
      setShowFacePrompt(false);
    } catch (error) {
      console.error("Face verification failed:", error);
      alert("Face verification failed. Please try again in better lighting.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteTrip = () => {
    setShowCompletionModal(true);
  };

  const confirmCompletion = () => {
    if (passengerRating === 0) return alert("Please rate the passenger");
    
    setEarnings(prev => prev + (activeTrip?.fare || 0));
    setActiveTrip(null);
    setTripProgress(0);
    setRouteUpdate(null);
    setSelectedRoute(null);
    setAnomalyWarning(null);
    setShowCompletionModal(false);
    setPassengerRating(0);
    alert("Trip completed successfully! Earnings updated.");
  };
  const acceptTrip = async () => {
    setIsOptimizing(true);
    setTripProgress(0);
    setRouteUpdate(null);
    setSelectedRoute(null);
    setAnomalyWarning(null);
    try {
      // Simulate trip details
      const trip = {
        passenger: 'Zainab Aliyu',
        origin: 'Bayero University (Old Site)',
        destination: 'Sabon Gari Market',
        fare: 600
      };
      setActiveTrip(trip);
      
      // Get optimized routes from AI
      const result = await geminiService.optimizeRoute(trip.origin, trip.destination);
      setSuggestedRoutes(result.routes || []);
    } catch (error) {
      console.error("Route optimization error:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Anomaly Warning Overlay */}
      <AnimatePresence>
        {anomalyWarning && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
          >
            <div className={`p-4 rounded-2xl shadow-2xl flex items-start gap-4 border-2 ${
              anomalyWarning.risk_level === 'high' ? 'bg-red-600 border-red-400 text-white' : 'bg-yellow-50 border-yellow-200 text-yellow-900'
            }`}>
              <div className={`p-2 rounded-xl ${anomalyWarning.risk_level === 'high' ? 'bg-red-500' : 'bg-yellow-100'}`}>
                <AlertTriangle size={24} className={anomalyWarning.risk_level === 'high' ? 'text-white' : 'text-yellow-600'} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm uppercase tracking-wider mb-1">
                  AI Safety Warning: {anomalyWarning.risk_level} Risk
                </p>
                <p className="text-sm opacity-90">{anomalyWarning.reason}</p>
              </div>
              <button 
                onClick={() => setAnomalyWarning(null)}
                className="p-1 hover:bg-black/10 rounded-lg transition-colors"
              >
                <X size={20} />
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
              className={`${alert.isSOS ? 'bg-red-700 ring-4 ring-red-300' : 'bg-red-600'} text-white p-4 rounded-2xl shadow-lg flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <Bell className={alert.isSOS ? "animate-ping" : "animate-bounce"} size={20} />
                <div>
                  <p className="text-xs font-bold uppercase">{alert.isSOS ? '🚨 CRITICAL SOS' : `Safety Alert: ${alert.category}`}</p>
                  <p className="text-sm">{alert.summary}</p>
                </div>
              </div>
              <button onClick={() => setAlerts(prev => prev.filter((_, i) => i !== idx))} className="text-white/60 hover:text-white">
                <Info size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {!isOnShift ? (
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center border border-slate-100">
          <AnimatePresence mode="wait">
            {!showFacePrompt ? (
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserCheck className="text-emerald-600 w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Ready to start your shift?</h2>
                <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                  Please complete a quick face-match verification to ensure account security and start receiving trips.
                </p>
                <button 
                  onClick={startShift}
                  className="bg-emerald-600 text-white px-12 py-4 rounded-full font-bold text-lg hover:bg-emerald-700 transition-all flex items-center gap-3 mx-auto shadow-lg shadow-emerald-100"
                >
                  <Camera size={24} /> Get Started
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="w-48 h-48 bg-slate-100 rounded-3xl border-4 border-dashed border-slate-200 mx-auto mb-6 flex items-center justify-center relative overflow-hidden">
                  <Camera size={48} className="text-slate-300" />
                  {isVerifying && (
                    <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center">
                      <div className="w-full h-1 bg-emerald-500 absolute top-0 animate-[scan_2s_linear_infinite]"></div>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2">Face Verification</h2>
                <p className="text-slate-600 mb-8">Position your face within the frame and look directly at the camera.</p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => setShowFacePrompt(false)}
                    className="px-8 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleFaceVerify}
                    disabled={isVerifying}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isVerifying ? 'Verifying...' : 'Capture Photo'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Stats */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Today's Earnings</p>
                <p className="text-3xl font-bold text-slate-900">₦{earnings.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-2">
                  <TrendingUp size={14} /> +12% from yesterday
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Safety Score</p>
                <p className="text-3xl font-bold text-slate-900">{safetyData.score}/100</p>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <Star size={14} fill="currentColor" /> {safetyData.score >= 90 ? 'Top 5% in Kano' : 'Keep improving!'}
                  </div>
                  {user.face_verified && (
                    <div className="flex items-center gap-1 text-blue-600 text-[10px] font-bold">
                      <Shield size={12} /> Face Verified
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">{activeTrip ? 'Current Trip' : 'Active Trip Request'}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="text-red-600 bg-red-50 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-red-100 transition-all"
                  >
                    <AlertTriangle size={14} /> Report
                  </button>
                  {!activeTrip && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">NEW</span>}
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                    <img src="https://picsum.photos/seed/passenger/100/100" alt="Passenger" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="font-bold">{activeTrip ? activeTrip.passenger : 'Zainab Aliyu'}</p>
                    <p className="text-xs text-slate-500">Student • 0.8km away</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <p className="text-slate-600 font-medium">{activeTrip ? activeTrip.origin : 'Bayero University (Old Site)'}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <p className="text-slate-600 font-medium">{activeTrip ? activeTrip.destination : 'Sabon Gari Market'}</p>
                  </div>
                </div>
              </div>

              {activeTrip ? (
                <div className="space-y-6">
                  {/* Real-time Progress Bar */}
                  {tripProgress > 0 && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
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

                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                      <Navigation size={16} className="text-emerald-600" /> AI Suggested Routes
                    </h4>
                    {isOptimizing ? (
                      <div className="flex items-center gap-2 text-slate-400 text-sm animate-pulse">
                        <Clock size={16} /> Optimizing routes for speed and safety...
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {suggestedRoutes.map((route, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => !selectedRoute && setSelectedRoute(route)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                              selectedRoute?.name === route.name 
                                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' 
                                : 'border-slate-100 bg-white hover:border-emerald-200'
                            } ${selectedRoute && selectedRoute.name !== route.name ? 'opacity-50 grayscale' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-bold text-slate-900 group-hover:text-emerald-700">{route.name}</p>
                              <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full">{route.estimated_time}</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-2">{route.description}</p>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                              <Shield size={10} /> Safety: {route.safety_rating}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedRoute && tripProgress === 0 && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setTripProgress(1)}
                      className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                      Start Trip via {selectedRoute.name}
                    </motion.button>
                  )}

                  {tripProgress > 0 && (
                    <button 
                      onClick={handleCompleteTrip}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all"
                    >
                      Complete Trip
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex gap-4">
                  <button 
                    onClick={acceptTrip}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all"
                  >
                    Accept Trip (₦600)
                  </button>
                  <button className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all">
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-3xl">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Map className="text-emerald-400" /> Demand Hotspots
              </h3>
              <div className="space-y-4">
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <p className="text-xs font-bold text-emerald-400">HIGH DEMAND</p>
                  <p className="text-sm font-bold">Kano Central Mosque</p>
                  <p className="text-[10px] text-slate-500">Expected surge: ₦200 extra</p>
                </div>
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                  <p className="text-xs font-bold text-yellow-400">MODERATE</p>
                  <p className="text-sm font-bold">Aminu Kano Airport</p>
                </div>
              </div>
              <button className="w-full mt-4 py-2 bg-emerald-600 rounded-xl text-xs font-bold">Navigate to Hotspot</button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Shield className="text-emerald-600" /> Safety Coaching
              </h3>
              <div className="space-y-3 mb-4">
                {safetyData.tips.length > 0 ? (
                  safetyData.tips.map((tip: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-emerald-50 p-3 rounded-xl">
                      <CheckCircle2 className="text-emerald-600 mt-0.5 flex-shrink-0" size={16} />
                      <p className="text-xs text-emerald-800">{tip}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl">
                    <AlertCircle className="text-slate-400 mt-0.5" size={16} />
                    <p className="text-xs text-slate-600">{safetyData.summary}</p>
                  </div>
                )}
              </div>
              <button className="w-full py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                View Detailed Report
              </button>
            </div>

            <button 
              onClick={() => setIsOnShift(false)}
              className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
            >
              <Clock size={20} /> End Shift
            </button>
          </div>
        </div>
      )}

      <SafetyReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        userId={user.id} 
      />

      {/* Trip Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && activeTrip && (
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
                <img src="https://picsum.photos/seed/passenger/200/200" alt="Passenger" referrerPolicy="no-referrer" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Trip Summary</h2>
              <div className="bg-slate-50 p-4 rounded-2xl mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Fare</p>
                <p className="text-3xl font-bold text-emerald-600">₦{activeTrip.fare}</p>
              </div>
              
              <p className="text-slate-500 mb-4">How was your experience with {activeTrip.passenger}?</p>
              
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setPassengerRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star 
                      size={32} 
                      className={star <= passengerRating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} 
                    />
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={confirmCompletion}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  Confirm & Finish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
