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
  const SOS_DURATION = 10;
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [nearbyKekes, setNearbyKekes] = useState<any[]>([]);
  const [pendingRating, setPendingRating] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [driverStatus, setDriverStatus] = useState<string>('');
  const [useStudentDiscount, setUseStudentDiscount] = useState(false);
  const [isAiMonitoring, setIsAiMonitoring] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<any>(null);
  const [selectedKeke, setSelectedKeke] = useState<any>(null);
  const [showDriverProfile, setShowDriverProfile] = useState<any>(null);
  const [showTripConfirmation, setShowTripConfirmation] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const lastThresholdRef = useRef(0);

  const pushAlert = (alert: any) => {
    setAlerts(prev => {
      // Avoid duplicate alerts of the same summary within a short time
      if (prev.some(a => a.summary === alert.summary)) return prev;
      return [alert, ...prev].slice(0, 3);
    });
  };

  useEffect(() => {
    let interval: any;
    if (activeTrip && tripStatus === 'idle' && (driverStatus === 'Driver is approaching' || driverStatus === 'Driver is nearby')) {
      interval = setInterval(() => {
        setActiveTrip((prev: any) => {
          if (!prev) return null;
          const currentEta = parseInt(prev.eta);
          
          if (isNaN(currentEta) || prev.eta === 'Arrived') {
            setDriverStatus('Arrived');
            clearInterval(interval);
            return prev;
          }

          if (currentEta <= 1) {
            setDriverStatus('Driver is nearby');
            return { ...prev, eta: 'Arrived' };
          }
          
          return { ...prev, eta: `${currentEta - 1} mins` };
        });
      }, 6000);
    }
    return () => clearInterval(interval);
  }, [activeTrip, tripStatus, driverStatus]);

  useEffect(() => {
    let interval: any;
    if (tripStatus === 'started' && tripProgress < 100) {
      // Faster, smoother updates for animation
      interval = setInterval(() => {
        setTripProgress(prev => {
          const next = prev + 0.5; // Smaller increments for smoothness
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
      }, 500); // More frequent updates
    }
    return () => clearInterval(interval);
  }, [tripStatus, tripProgress, activeTrip]);

  useEffect(() => {
    // Trigger AI route updates every 15% progress
    const progressThreshold = Math.floor(tripProgress / 15);

    if (tripStatus === 'started' && activeTrip && progressThreshold > lastThresholdRef.current && tripProgress < 100) {
      lastThresholdRef.current = progressThreshold;
      geminiService.getRouteUpdate(activeTrip.origin, activeTrip.destination, Math.floor(tripProgress))
        .then(update => setRouteUpdate(update || null));
    }
    
    if (tripStatus !== 'started') {
      lastThresholdRef.current = 0;
    }
  }, [tripStatus, activeTrip, tripProgress]);

  useEffect(() => {
    if (tripStatus === 'idle' && activeTrip) {
      if (driverStatus === 'Driver is nearby') {
        geminiService.getProactiveAlert({ status: 'nearby', eta: activeTrip.eta })
          .then(alert => pushAlert({ ...alert, type: 'info', location: 'Nearby' }));
      } else if (driverStatus === 'Arrived') {
        pushAlert({
          type: 'success',
          category: 'Trip Update',
          summary: 'Your driver has arrived! Please check the Keke ID before boarding.',
          location: 'Pickup Point',
          priority: 'high'
        });
      }
    }
  }, [driverStatus, tripStatus, activeTrip?.id]);

  useEffect(() => {
    let interval: any;
    if (tripStatus === 'started' && activeTrip && tripProgress < 100) {
      interval = setInterval(async () => {
        setIsAiMonitoring(true);
        try {
          const tripData = {
            origin: activeTrip.origin,
            destination: activeTrip.destination,
            progress: tripProgress,
            current_location: "Kano City Corridor"
          };
          
          // Check for anomalies and general proactive updates
          const [anomaly, proactive] = await Promise.all([
            geminiService.detectTripAnomaly(tripData),
            geminiService.getProactiveAlert(tripData)
          ]);

          if (anomaly.is_anomaly) {
            pushAlert({
              type: 'warning',
              category: 'Route Anomaly',
              summary: anomaly.reason,
              location: 'Current Route',
              priority: anomaly.risk_level
            });
          } else if (proactive.priority !== 'low' || Math.random() > 0.7) {
            // Push proactive AI updates occasionally or if priority is high
            pushAlert({
              ...proactive,
              type: 'info',
              location: 'On Route'
            });
          }
        } catch (e) {
          console.warn("AI Monitoring Error:", e);
        } finally {
          setIsAiMonitoring(false);
        }
      }, 40000); // Every 40 seconds
    }
    return () => clearInterval(interval);
  }, [tripStatus, activeTrip?.id, tripProgress]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isComponentMounted = true;

    const connect = () => {
      if (!isComponentMounted) return;
      
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (ws) ws.send(JSON.stringify({ type: 'auth', userId: user.id, role: 'passenger' }));
        };

        ws.onerror = (error) => {
          // Suppress noise in dev environment if connection fails
          if (ws?.readyState !== WebSocket.CLOSED) {
            console.warn("WebSocket Connection Issue (Expected in some dev environments)");
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'safety_alert') {
              setAlerts(prev => [data, ...prev].slice(0, 3));
            }
            if (data.type === 'anomaly_alert') {
              pushAlert({
                type: 'warning',
                category: 'Driver Alert',
                summary: `Driver reported: ${data.reason}`,
                location: 'Current Trip',
                priority: data.risk_level
              });
            }
            if (data.type === 'nearby_kekes') {
              setNearbyKekes(data.locations);
              
              if (activeTrip && tripStatus === 'idle') {
                const driver = data.locations.find((k: any) => k.kekeId === activeTrip.keke);
                if (driver) {
                  const dist = Math.sqrt(
                    Math.pow(driver.lat - 12.0022, 2) + 
                    Math.pow(driver.lng - 8.5920, 2)
                  );
                  
                  if (dist < 0.0005) {
                    setDriverStatus('Arrived');
                    setActiveTrip((prev: any) => prev ? { ...prev, eta: 'Arrived' } : null);
                  } else if (dist < 0.002) {
                    setDriverStatus('Driver is nearby');
                    setActiveTrip((prev: any) => prev ? { ...prev, eta: '1 min' } : null);
                  } else {
                    setDriverStatus('Driver is approaching');
                    const estimatedMins = Math.max(2, Math.ceil(dist * 3000));
                    setActiveTrip((prev: any) => prev ? { ...prev, eta: `${estimatedMins} mins` } : null);
                  }
                }
              }
            }
          } catch (e) {
            console.error("Failed to parse WS message", e);
          }
        };

        ws.onclose = () => {
          if (isComponentMounted) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (e) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      isComponentMounted = false;
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      wsRef.current = null;
    };
  }, [user.id, activeTrip?.keke, tripStatus]);

  useEffect(() => {
    let timer: any;
    if (sosCountdown !== null && sosCountdown > 0) {
      timer = setInterval(() => {
        setSosCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (sosCountdown === 0) {
      confirmAndSendSOS();
      setSosCountdown(null);
    }
    return () => clearInterval(timer);
  }, [sosCountdown]);

  const handleSearch = async () => {
    if (!destination) return alert("Please enter a destination");
    
    // Step 1: Fetch pricing if not already available
    if (!pricingDetails) {
      setIsSearching(true);
      setTripStatus('pricing');
      try {
        const origin = "Current Location";
        const currentTime = new Date().toISOString();
        
        // Call AI for dynamic pricing
        const pricing = await geminiService.calculateDynamicPrice(origin, destination, currentTime, 'high');
        setPricingDetails(pricing);
      } catch (error) {
        console.error("Pricing error:", error);
        alert("Failed to calculate price. Please try again.");
      } finally {
        setIsSearching(false);
        setTripStatus('idle');
      }
      return;
    }

    // Step 2: If we have pricing, proceed to search for a driver (Confirmation)
    setIsSearching(true);
    setTripStatus('searching');
    
    try {
      const origin = "Current Location";
      
      // Simulate finding a driver
      setTimeout(() => {
        setIsSearching(false);
        setTripStatus('idle');
        setActiveTrip({
          driver: 'Musa Ibrahim',
          keke: 'KL-2024-089',
          eta: '3 mins',
          fare: useStudentDiscount ? Math.round(pricingDetails.total_fare * 0.8) : pricingDetails.total_fare,
          rating: 4.8,
          safetyScore: 96,
          origin,
          destination
        });
        setDriverStatus('Driver is approaching');
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
    setDriverStatus('');
  };

  const handleSOS = () => {
    setSosCountdown(SOS_DURATION);
  };

  const confirmAndSendSOS = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const sosData = { 
        type: 'sos', 
        location: 'Current GPS Location',
        tripData: activeTrip ? {
          driver: activeTrip.driver,
          keke: activeTrip.keke,
          origin: activeTrip.origin,
          destination: activeTrip.destination,
          progress: tripProgress
        } : null,
        timestamp: new Date().toISOString()
      };
      
      wsRef.current.send(JSON.stringify(sosData));
      setSosSent(true);
      setTimeout(() => setSosSent(false), 5000);
    } else {
      alert("Connection lost. Please try calling emergency services directly.");
    }
  };

  const handleSendMessage = async () => {
    const target = chatTarget || (activeTrip ? { name: activeTrip.driver, kekeId: activeTrip.keke, destination: activeTrip.destination } : null);
    if (!chatInput.trim() || !target) return;
    
    const userMsg = { role: 'user', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    const currentHistory = chatMessages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.text }]
    }));
    setChatInput('');
    
    // Simulate driver response using AI
    try {
      const persona = `You are a Keke driver named ${target.name} in Kano, Nigeria. 
      You are speaking to your passenger. 
      ${activeTrip ? `You are currently on a trip to ${target.destination}.` : `You are currently available near your Keke (ID: ${target.kekeId}).`}
      Respond briefly, professionally, and naturally in English with a touch of Hausa (e.g., Sannu, Na gode, Toh, Ba damuwa). 
      Be helpful and polite. Keep responses under 30 words.`;

      const driverReply = await geminiService.chatWithAssistant(
        currentInput, 
        persona,
        currentHistory
      );
      
      setTimeout(() => {
        setChatMessages(prev => [...prev, { 
          role: 'driver', 
          text: driverReply, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
      }, 1000);
    } catch (error) {
      console.error("Chat error:", error);
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
        handleShareSMS();
      });
    } else {
      handleShareSMS();
    }
  };

  const handleShareSMS = () => {
    if (!activeTrip) return;
    const message = `I'm on a KekeLink trip! Driver: ${activeTrip.driver}, Keke ID: ${activeTrip.keke}. Destination: ${activeTrip.destination}. Track me on KekeLink.`;
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  const submitRating = () => {
    if (ratingValue === 0) return alert("Please select a rating");
    // In a real app, we'd send this to the backend
    console.log(`Submitted ${ratingValue} stars for ${pendingRating.driver} with feedback: ${feedback}`);
    setPendingRating(null);
    setRatingValue(0);
    setHoverRating(0);
    setFeedback('');
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
              
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingValue(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star 
                      size={40} 
                      className={(hoverRating || ratingValue) >= star ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} 
                    />
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <textarea
                  placeholder="Tell us about your trip experience (optional)..."
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
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

      {/* Driver Chat Modal */}
      <AnimatePresence>
        {isChatOpen && (chatTarget || activeTrip) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[80vh] sm:h-[600px]"
            >
              {/* Chat Header */}
              <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                    <img src={`https://picsum.photos/seed/${chatTarget?.id || 'driver'}/100/100`} alt="Driver" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="font-bold">{chatTarget?.name || activeTrip?.driver}</p>
                    <p className="text-[10px] opacity-80 uppercase font-bold tracking-wider">Your Keke Driver</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsChatOpen(false);
                    setChatTarget(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 text-sm">No messages yet. Say hello to {chatTarget?.name || activeTrip?.driver}!</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-[8px] mt-1 font-bold uppercase ${msg.role === 'user' ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <Navigation size={20} className="rotate-90" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trip Confirmation Modal */}
      <AnimatePresence>
        {showTripConfirmation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-8"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="text-emerald-600" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Confirm Request</h2>
                <p className="text-slate-500 text-sm mt-2">Are you sure you want to request a trip with {showTripConfirmation.name}?</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Destination</span>
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{destination}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Keke ID</span>
                  <span className="text-xs font-mono font-bold text-slate-900">{showTripConfirmation.kekeId}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowTripConfirmation(null)}
                  className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setKekeId(showTripConfirmation.kekeId);
                    setShowTripConfirmation(null);
                    setSelectedKeke(null);
                    handleSearch();
                  }}
                  className="py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS Countdown Overlay */}
      <AnimatePresence>
        {sosCountdown !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <AlertTriangle className="text-red-600" size={48} />
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#fee2e2"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="4"
                    strokeDasharray="282.7"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: 282.7 * (1 - (sosCountdown || 0) / SOS_DURATION) }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-red-600">
                  {sosCountdown}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Emergency SOS</h2>
              <p className="text-slate-600 mb-8 text-sm">Sending emergency alert in {sosCountdown} seconds. Authorities and nearby drivers will be notified.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    confirmAndSendSOS();
                    setSosCountdown(null);
                  }}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-700 transition-all"
                >
                  Send Now
                </button>
                <button 
                  onClick={() => setSosCountdown(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel (Accidental)
                </button>
              </div>
            </div>
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
              className={`${
                alert.type === 'warning' ? 'bg-amber-500' : 
                alert.type === 'success' ? 'bg-emerald-600' : 
                alert.type === 'info' ? 'bg-blue-600' : 
                'bg-red-600'
              } text-white p-4 rounded-2xl shadow-lg flex items-center justify-between border border-white/10`}
            >
              <div className="flex items-center gap-3">
                {alert.type === 'warning' ? <AlertTriangle size={20} /> : 
                 alert.type === 'success' ? <CheckCircle size={20} /> :
                 alert.type === 'info' ? <Info size={20} /> :
                 <Bell className="animate-bounce" size={20} />}
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-80 tracking-wider">{alert.category || 'Safety Alert'}</p>
                  <p className="text-sm font-medium">{alert.summary} {alert.location ? `at ${alert.location}` : ''}</p>
                </div>
              </div>
              <button onClick={() => setAlerts(prev => prev.filter((_, i) => i !== idx))} className="text-white/60 hover:text-white p-1">
                <X size={18} />
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
                <Navigation size={18} className="text-emerald-600" /> Nearby Keke Network
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[8px] font-bold text-slate-500 uppercase">On Trip</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Offline</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full animate-pulse ml-2">
                  {nearbyKekes.length} ACTIVE
                </span>
              </div>
            </div>
            <div className="aspect-video bg-slate-100 rounded-2xl relative overflow-hidden border border-slate-200">
              <img 
                src="https://picsum.photos/seed/kanomap/1200/800" 
                alt="Map" 
                className="w-full h-full object-cover opacity-40 grayscale"
                referrerPolicy="no-referrer"
              />
                {/* Simulated Keke Markers */}
                {nearbyKekes.map((keke) => {
                  const status = keke.status || 'Available';
                  return (
                    <motion.div
                      key={keke.driverId}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.2, zIndex: 40 }}
                      className="absolute cursor-pointer group"
                      style={{ 
                        top: `${40 + (keke.lat - 12.0022) * 2000}%`, 
                        left: `${50 + (keke.lng - 8.5920) * 2000}%` 
                      }}
                      onClick={() => setSelectedKeke(keke)}
                    >
                      <div className={`relative ${
                        status === 'On Trip' ? 'bg-blue-600 ring-4 ring-blue-500/20' : 
                        status === 'Offline' ? 'bg-slate-400 grayscale' : 
                        'bg-emerald-600 ring-4 ring-emerald-500/20'
                      } text-white p-2.5 rounded-2xl shadow-xl transition-all duration-300`}>
                        <Car size={18} className={status === 'Available' ? 'animate-bounce' : ''} />
                        
                        {/* Status Indicator Dot */}
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          status === 'On Trip' ? 'bg-blue-400' : 
                          status === 'Offline' ? 'bg-slate-300' : 
                          'bg-emerald-400'
                        }`} />
                      </div>

                      {/* Status Text Label */}
                      <div className="mt-1.5 text-center">
                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-sm border border-white/20 whitespace-nowrap ${
                          status === 'On Trip' ? 'bg-blue-600 text-white' : 
                          status === 'Offline' ? 'bg-slate-500 text-white' : 
                          'bg-emerald-600 text-white'
                        }`}>
                          {status}
                        </span>
                      </div>
                      
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-[10px] px-3 py-2 rounded-xl shadow-2xl z-50">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{keke.name}</p>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-md uppercase font-black ${
                              status === 'On Trip' ? 'bg-blue-500' : 
                              status === 'Offline' ? 'bg-slate-700' : 
                              'bg-emerald-500'
                            }`}>
                              {status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <p className="opacity-70 font-mono">{keke.kekeId}</p>
                            <div className="flex items-center gap-0.5 text-yellow-400">
                              <Star size={8} fill="currentColor" />
                              <span className="font-bold">4.8</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                      </div>
                    </motion.div>
                  );
                })}

                <AnimatePresence>
                  {selectedKeke && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 z-30 border border-slate-100"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keke Info Card</span>
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                            <img src={`https://picsum.photos/seed/${selectedKeke.driverId}/200/200`} alt="Driver" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-slate-900">{selectedKeke.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-500 font-mono">{selectedKeke.kekeId}</p>
                              <div className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                                selectedKeke.status === 'On Trip' ? 'bg-blue-100 text-blue-600' : 
                                selectedKeke.status === 'Offline' ? 'bg-slate-100 text-slate-600' : 
                                'bg-emerald-100 text-emerald-600'
                              }`}>
                                {selectedKeke.status || 'Available'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedKeke(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                          <X size={20} className="text-slate-400" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                          <div className="flex items-center justify-center gap-1 text-yellow-500 mb-0.5">
                            <Star size={12} fill="currentColor" />
                            <span className="text-xs font-bold">4.8</span>
                          </div>
                          <p className="text-[8px] text-slate-400 uppercase font-bold">Rating</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                          <div className="flex items-center justify-center gap-1 text-emerald-600 mb-0.5">
                            <Shield size={12} />
                            <span className="text-xs font-bold">96%</span>
                          </div>
                          <p className="text-[8px] text-slate-400 uppercase font-bold">Safety</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                          <div className="flex items-center justify-center gap-1 text-blue-600 mb-0.5">
                            <Clock size={12} />
                            <span className="text-xs font-bold">2m</span>
                          </div>
                          <p className="text-[8px] text-slate-400 uppercase font-bold">Away</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDriverProfile(selectedKeke);
                          }}
                          className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                          <Info size={16} /> View Profile
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatTarget({
                              name: selectedKeke.name,
                              id: selectedKeke.driverId,
                              kekeId: selectedKeke.kekeId
                            });
                            setIsChatOpen(true);
                          }}
                          className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                        >
                          <MessageCircle size={20} />
                        </button>
                      </div>

                      <div className="mt-3">
                        <button 
                          disabled={selectedKeke.status === 'On Trip' || selectedKeke.status === 'Offline'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!destination) {
                              alert("Please enter a destination first!");
                              document.querySelector('input[placeholder="Enter destination..."]')?.scrollIntoView({ behavior: 'smooth' });
                              return;
                            }
                            setShowTripConfirmation(selectedKeke);
                          }}
                          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                        >
                          <Car size={18} />
                          {selectedKeke.status === 'On Trip' ? 'Currently Busy' : 'Request Trip'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              
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
                  onChange={e => {
                    setDestination(e.target.value);
                    setPricingDetails(null);
                  }}
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
                    <span>Multiplier: x{pricingDetails.demand_multiplier}</span>
                    <span className="font-bold">Total: ₦{useStudentDiscount ? Math.round(pricingDetails.total_fare * 0.8) : pricingDetails.total_fare}</span>
                  </div>
                  {useStudentDiscount && (
                    <div className="mt-1 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <GraduationCap size={12} /> 20% Student Discount Applied
                    </div>
                  )}
                </motion.div>
              )}

              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${useStudentDiscount ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Student Discount</p>
                    <p className="text-[10px] text-slate-500">Apply 20% off with valid ID</p>
                  </div>
                </div>
                <button 
                  onClick={() => setUseStudentDiscount(!useStudentDiscount)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${useStudentDiscount ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <motion.div 
                    animate={{ x: useStudentDiscount ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                {tripStatus === 'pricing' ? 'AI Pricing...' : 
                 tripStatus === 'searching' ? 'Finding Driver...' : 
                 pricingDetails ? 'Confirm & Find Keke' : 'Get Estimated Fare'}
              </button>
            </div>
          </div>

          {activeTrip && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-lg border-2 border-emerald-100 overflow-hidden"
            >
              {driverStatus && tripStatus !== 'started' && (
                <div className={`py-3 px-6 text-center font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 ${
                  driverStatus === 'Arrived' ? 'bg-emerald-600 text-white' :
                  driverStatus === 'Driver is nearby' ? 'bg-blue-600 text-white animate-pulse' : 
                  'bg-amber-500 text-white'
                }`}>
                  {driverStatus === 'Arrived' ? <CheckCircle size={18} /> : <Clock size={18} />}
                  {driverStatus}
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden">
                    <img src="https://picsum.photos/seed/driver/200/200" alt="Driver" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">{activeTrip.driver}</h3>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Shield size={14} className="text-emerald-600" /> Verified Driver • {activeTrip.rating} ★
                        </p>
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center gap-1 shadow-sm">
                          <Shield size={10} /> {activeTrip.safetyScore} Safety Score
                        </span>
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

              {/* Real-time Trip Map */}
              <div className="aspect-video bg-slate-100 rounded-2xl relative overflow-hidden border border-slate-200 mb-6">
                <img 
                  src="https://picsum.photos/seed/tripmap/1200/800" 
                  alt="Trip Map" 
                  className="w-full h-full object-cover opacity-40 grayscale"
                  referrerPolicy="no-referrer"
                />
                
                {/* Route Path */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                  <motion.path
                    d="M 40 120 Q 150 40 260 120"
                    stroke="#cbd5e1"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    className="opacity-50"
                  />
                  <motion.path
                    d="M 40 120 Q 150 40 260 120"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: tripProgress / 100 }}
                  />
                </svg>

                {/* Origin Marker */}
                <div className="absolute top-[120px] left-[40px] -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="w-3 h-3 bg-slate-400 rounded-full border-2 border-white shadow-sm mb-1"></div>
                  <p className="text-[8px] font-bold text-slate-500 bg-white/80 px-1 rounded uppercase">Pickup</p>
                </div>

                {/* Destination Marker */}
                <div className="absolute top-[120px] left-[260px] -translate-x-1/2 -translate-y-1/2 text-center">
                  <MapPin size={16} className="text-red-500 mb-1" />
                  <p className="text-[8px] font-bold text-red-600 bg-white/80 px-1 rounded uppercase">Dropoff</p>
                </div>

                {/* Keke Marker */}
                {tripStatus === 'started' && (
                  <motion.div
                    className="absolute z-10"
                    style={{ 
                      offsetPath: "path('M 40 120 Q 150 40 260 120')",
                      offsetRotate: "auto"
                    }}
                    animate={{ 
                      offsetDistance: `${tripProgress}%`
                    }}
                  >
                    <div className="bg-emerald-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white -translate-x-1/2 -translate-y-1/2">
                      <Car size={14} />
                    </div>
                  </motion.div>
                )}
              </div>

              {tripStatus === 'started' && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">Trip Progress</p>
                      {isAiMonitoring && (
                        <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-600 animate-pulse">
                          <Shield size={8} /> AI MONITORING ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-emerald-600">{Math.floor(tripProgress)}%</p>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className="bg-emerald-600 h-full relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${tripProgress}%` }}
                      transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
                    </motion.div>
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

              <div className="flex flex-col gap-3">
                {tripStatus !== 'started' ? (
                  <button 
                    onClick={startTrip}
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                  >
                    <Navigation size={20} /> Start Trip
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="w-full bg-emerald-50 text-emerald-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-emerald-100">
                      <Clock size={20} className="animate-spin" /> Trip in Progress
                    </div>
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleShareSMS}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      <Share2 size={20} /> Share Details via SMS
                    </motion.button>
                    <motion.button 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setIsChatOpen(true)}
                      className="w-full bg-white text-slate-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all border-2 border-slate-100"
                    >
                      <MessageCircle size={20} className="text-emerald-600" /> Chat with {activeTrip.driver}
                    </motion.button>
                  </div>
                )}
              </div>
                
              <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleSOS}
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-lg shadow-red-200 animate-pulse"
                  >
                    <AlertTriangle size={24} /> SEND EMERGENCY SOS
                  </button>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={handleShareTrip}
                      className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-200"
                    >
                      <Share2 size={18} /> Share Trip
                    </button>
                    <button 
                      onClick={() => setIsReportModalOpen(true)}
                      className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-200"
                    >
                      <Shield size={18} /> Report Issue
                    </button>
                  </div>
                </div>
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

      {/* Driver Profile Modal */}
      <AnimatePresence>
        {showDriverProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="relative h-32 bg-emerald-600">
                <button 
                  onClick={() => setShowDriverProfile(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="px-8 pb-8 -mt-12">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl">
                    <img 
                      src={`https://picsum.photos/seed/${showDriverProfile.driverId}/200/200`} 
                      alt="Driver" 
                      className="w-full h-full object-cover rounded-2xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl border-4 border-white shadow-lg">
                    <CheckCircle size={16} />
                  </div>
                </div>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{showDriverProfile.name}</h2>
                    <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">KekeLink Certified Driver</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-500 font-bold text-lg">
                      <Star size={20} fill="currentColor" />
                      <span>4.8</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Average Rating</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Keke ID</p>
                    <p className="font-mono font-bold text-slate-900">{showDriverProfile.kekeId}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Verification</p>
                    <p className="text-emerald-600 font-bold flex items-center gap-1">
                      <Shield size={14} /> Verified
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Safety First</p>
                      <p className="text-xs text-emerald-700">This driver has completed 500+ safe trips.</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (!destination) {
                        alert("Please enter a destination first!");
                        setShowDriverProfile(null);
                        document.querySelector('input[placeholder="Enter destination..."]')?.scrollIntoView({ behavior: 'smooth' });
                        return;
                      }
                      setShowTripConfirmation(showDriverProfile);
                      setShowDriverProfile(null);
                    }}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    <Car size={20} /> Request Trip
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
