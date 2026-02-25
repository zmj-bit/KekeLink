import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Shield, TrendingUp, Map, Star, AlertCircle, Clock, UserCheck, Navigation, CheckCircle2, AlertTriangle, Bell, Info, X, Car, MapPin, MessageCircle } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { SafetyReportModal } from '../components/SafetyReportModal';

export const DriverDashboard = ({ user, onUpdateUser }: { user: any, onUpdateUser?: (updates: any) => void }) => {
  const [isOnShift, setIsOnShift] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showFacePrompt, setShowFacePrompt] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const activeTripRef = useRef(activeTrip);
  useEffect(() => {
    activeTripRef.current = activeTrip;
  }, [activeTrip]);
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
  const [shiftEarnings, setShiftEarnings] = useState(0);
  const [shiftTrips, setShiftTrips] = useState(0);
  const [showShiftSummary, setShowShiftSummary] = useState(false);
  const [tripHistory, setTripHistory] = useState<any[]>([]);
  const [passengerStatus, setPassengerStatus] = useState<string | null>(null);
  const [tripStartTime, setTripStartTime] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sosSent, setSosSent] = useState(false);
  const [nearbyPassengers, setNearbyPassengers] = useState<any[]>([]);
  const [nearbyKekes, setNearbyKekes] = useState<any[]>([]);
  const [detailedRoute, setDetailedRoute] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number }>({ lat: 12.0022, lng: 8.5920 });
  const [locationStatus, setLocationStatus] = useState<'active' | 'error' | 'requesting'>('requesting');
  const locationRef = useRef(currentLocation);
  const statusRef = useRef(locationStatus);

  useEffect(() => {
    locationRef.current = currentLocation;
  }, [currentLocation]);

  useEffect(() => {
    statusRef.current = locationStatus;
  }, [locationStatus]);

  const [shiftMetrics, setShiftMetrics] = useState({
    trips_completed: 145,
    anomalies_detected: 0,
    route_adherence: 0.98,
    incidents_reported: 0
  });
  const [isCoachingLoading, setIsCoachingLoading] = useState(false);
  const [showRouteFeedbackModal, setShowRouteFeedbackModal] = useState(false);
  const [routeIntelligence, setRouteIntelligence] = useState<any[]>([]);
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    comments: '',
    safety_concerns: '',
    traffic_level: 'moderate'
  });
  const [isAuthoritiesAlerted, setIsAuthoritiesAlerted] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchRouteIntelligence = async () => {
      try {
        const response = await fetch('/api/reports/route-intelligence');
        if (response.ok) {
          const data = await response.json();
          setRouteIntelligence(data);
        }
      } catch (error) {
        console.error("Error fetching route intelligence:", error);
      }
    };
    fetchRouteIntelligence();
  }, []);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('keke_trip_logs') || '[]');
    setTripHistory(history);
  }, []);

  const fetchSafetyCoaching = async (metrics: any) => {
    setIsCoachingLoading(true);
    try {
      const data = await geminiService.getSafetyCoaching(metrics);
      setSafetyData(data);
    } catch (error) {
      console.error("Error fetching safety coaching:", error);
    } finally {
      setIsCoachingLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSafetyCoaching(shiftMetrics);
    }, 2000); // Debounce coaching calls
    return () => clearTimeout(timeout);
  }, [shiftMetrics.trips_completed, shiftMetrics.anomalies_detected, shiftMetrics.incidents_reported, shiftMetrics.route_adherence]);

  useEffect(() => {
    if (activeTrip && tripProgress > 0) {
      geminiService.getDetailedRoute(activeTrip.origin, activeTrip.destination, currentLocation.lat, currentLocation.lng)
        .then(setDetailedRoute);
    } else {
      setDetailedRoute(null);
    }
  }, [activeTrip?.id, tripProgress > 0]);

  // Simulate passenger status updates during pickup phase
  useEffect(() => {
    let interval: any;
    if (activeTrip && tripProgress === 0) {
      const statuses = [
        'Passenger is walking to pickup point',
        'Passenger is 50m away',
        'Passenger is 10m away',
        'Passenger is ready at pickup point'
      ];
      let index = 0;
      setPassengerStatus(statuses[0]);
      
      interval = setInterval(() => {
        index++;
        if (index < statuses.length) {
          setPassengerStatus(statuses[index]);
        } else {
          clearInterval(interval);
        }
      }, 5000);
    } else if (!activeTrip || tripProgress > 0) {
      setPassengerStatus(null);
    }
    return () => clearInterval(interval);
  }, [activeTrip, tripProgress]);

  // Simulate periodic performance updates to trigger dynamic coaching
  useEffect(() => {
    if (isOnShift) {
      const interval = setInterval(() => {
        // Randomly fluctuate route adherence to simulate real-time performance
        setShiftMetrics(prev => ({
          ...prev,
          route_adherence: Math.max(0.7, Math.min(1, prev.route_adherence + (Math.random() - 0.5) * 0.1))
        }));
      }, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [isOnShift]);

  useEffect(() => {
    let interval: any;
    if (activeTrip && tripProgress > 0 && tripProgress < 100) {
      interval = setInterval(async () => {
        const tripData = {
          current_location: `${currentLocation.lat}, ${currentLocation.lng}`,
          destination: activeTrip.destination,
          speed: Math.floor(Math.random() * 40) + 10,
          time: new Date().toISOString(),
          progress: tripProgress
        };
        
        try {
          const result = await geminiService.detectTripAnomaly(tripData);
          if (result.is_anomaly) {
            setAnomalyWarning(result);
            setShiftMetrics(prev => ({ ...prev, anomalies_detected: prev.anomalies_detected + 1 }));
            
            if (result.risk_level === 'high' || result.should_alert_authorities) {
              setIsAuthoritiesAlerted(true);
              // In a real app, this would call a dedicated emergency API
              console.log("!!! ALERTING AUTHORITIES !!!", result.reason);
            }

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'anomaly_alert',
                userId: user.id,
                reason: result.reason,
                risk_level: result.risk_level,
                notifiedAuthorities: result.risk_level === 'high' ? ['Police', 'Keke Union Security'] : []
              }));
            }
          } else {
            setAnomalyWarning(null);
            setIsAuthoritiesAlerted(false);
          }
        } catch (error) {
          console.warn("Anomaly detection error (likely rate limit):", error);
        }
      }, 30000); // Increased interval to 30s
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
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isComponentMounted = true;
    let watchId: number | null = null;
    let fallbackInterval: any = null;
    let passengerSimulation: any = null;

    const connect = () => {
      if (!isComponentMounted || !isOnShift) return;
      
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (ws) ws.send(JSON.stringify({ type: 'auth', userId: user.id, role: 'driver' }));
        };

        ws.onerror = (error) => {
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
            if (data.type === 'sos_alert') {
              const tripInfo = data.tripData ? ` (Trip: ${data.tripData.origin} to ${data.tripData.destination})` : '';
              const authorities = data.notifiedAuthorities ? ` [Authorities Notified: ${data.notifiedAuthorities.join(', ')}]` : '';
              setAlerts(prev => [{
                category: 'EMERGENCY SOS',
                summary: `Driver ${data.userName || data.userId} needs immediate help at ${data.location}${tripInfo}${authorities}`,
                location: data.location,
                isSOS: true,
                priority: data.priority
              }, ...prev].slice(0, 3));
            }
            if (data.type === 'nearby_kekes') {
              setNearbyKekes(data.locations.filter((k: any) => k.driverId !== user.id));
            }
          } catch (e) {
            console.error("Failed to parse WS message", e);
          }
        };

        ws.onclose = () => {
          if (isComponentMounted && isOnShift) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };
      } catch (e) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    if (isOnShift) {
      connect();

      const sendLocation = (lat: number, lng: number) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ 
            type: 'location_update', 
            lat, 
            lng,
            name: user.name,
            kekeId: 'KL-2024-089', // Mock Keke ID
            status: statusRef.current === 'error' ? 'Offline' : (activeTripRef.current ? 'On Trip' : 'Available')
          }));
        }
      };

      if ("geolocation" in navigator) {
        setLocationStatus('requesting');
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            setLocationStatus('active');
            sendLocation(latitude, longitude);
          },
          (error) => {
            if (error.code === 1) {
              console.warn("Geolocation permission denied. Using fallback.");
            } else if (error.code === 2) {
              console.warn("Geolocation position unavailable. Using fallback.");
            } else if (error.code === 3) {
              console.warn("Geolocation timeout. Using fallback.");
            } else {
              console.warn("Geolocation issue:", error.message || "Unknown error", `(Code: ${error.code})`);
            }
            const fallbackLat = 12.0022;
            const fallbackLng = 8.5920;
            setCurrentLocation({ lat: fallbackLat, lng: fallbackLng });
            setLocationStatus('active');
            sendLocation(fallbackLat, fallbackLng);
          },
          { enableHighAccuracy: false, maximumAge: 30000, timeout: 15000 }
        );

        fallbackInterval = setInterval(() => {
          if (statusRef.current === 'active' || statusRef.current === 'error') {
            sendLocation(locationRef.current.lat, locationRef.current.lng);
          }
        }, 10000);
      } else {
        console.warn("Geolocation not supported, using fallback location.");
        const fallbackLat = 12.0022;
        const fallbackLng = 8.5920;
        setCurrentLocation({ lat: fallbackLat, lng: fallbackLng });
        setLocationStatus('active');
        sendLocation(fallbackLat, fallbackLng);
      }

      passengerSimulation = setInterval(() => {
        if (!activeTripRef.current) {
          const mockPassengers = [
            { id: 101, name: 'Zainab Aliyu', origin: 'Bayero University (Old Site)', destination: 'Sabon Gari Market', fare: 600, distance: '0.8km', type: 'Student', isRecommended: true },
            { id: 102, name: 'Musa Bello', origin: 'Kano State Library', destination: 'Zoo Road', fare: 450, distance: '1.2km', type: 'Regular', isRecommended: false },
            { id: 103, name: 'Aisha Umar', origin: 'Gidan Makama Museum', destination: 'Kofar Nassarawa', fare: 350, distance: '0.5km', type: 'Regular', isRecommended: false }
          ];
          setNearbyPassengers(mockPassengers);
        } else {
          setNearbyPassengers([]);
        }
      }, 5000);
    }

    return () => {
      isComponentMounted = false;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (passengerSimulation) clearInterval(passengerSimulation);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOnShift, user.id, user.name]);

  const startShift = () => {
    setShiftEarnings(0);
    setShiftTrips(0);
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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeTrip) return;
    
    const userMsg = { role: 'driver', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    const currentHistory = chatMessages.map(m => ({
      role: m.role === 'driver' ? 'user' as const : 'model' as const,
      parts: [{ text: m.text }]
    }));
    setChatInput('');
    
    // Simulate passenger response using AI
    try {
      const persona = `You are a passenger named ${activeTrip.passenger} in Kano, Nigeria. 
      A Keke driver named ${user.name} is messaging you. 
      You are currently ${activeTrip.id ? `on a trip to ${activeTrip.destination}` : `waiting for them to pick you up at ${activeTrip.origin}`}.
      Respond briefly and naturally in English with a touch of Hausa (e.g., Sannu, Na gode, Toh). 
      Be polite but direct. Keep responses under 25 words.`;

      const passengerReply = await geminiService.chatWithAssistant(
        currentInput, 
        persona,
        currentHistory
      );
      
      setTimeout(() => {
        setChatMessages(prev => [...prev, { 
          role: 'passenger', 
          text: passengerReply, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
      }, 1000);
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  const handleSOS = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const sosData = { 
        type: 'sos', 
        userId: user.id,
        userName: user.name,
        location: `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`,
        tripData: activeTrip ? {
          origin: activeTrip.origin,
          destination: activeTrip.destination,
          passenger: activeTrip.passenger,
          fare: activeTrip.fare,
          startTime: tripStartTime
        } : null,
        timestamp: new Date().toISOString(),
        isEmergency: true
      };
      
      wsRef.current.send(JSON.stringify(sosData));
      setSosSent(true);
      setTimeout(() => setSosSent(false), 5000);
    } else {
      alert("Connection lost. Please try calling emergency services directly.");
    }
  };

  const handleCompleteTrip = () => {
    setShowCompletionModal(true);
  };

  const confirmCompletion = async () => {
    if (passengerRating === 0) return alert("Please rate the passenger");
    
    const fare = activeTrip?.fare || 0;
    const endTime = new Date().toISOString();
    const distance = (Math.random() * 5 + 2).toFixed(2) + ' km';
    const safetyScore = safetyData.score;
    
    // Log trip metrics
    const tripLog = {
      tripId: activeTrip?.id,
      passenger: activeTrip?.passenger,
      startTime: tripStartTime,
      endTime: endTime,
      fare: fare,
      distance: distance,
      safetyScore: safetyScore,
      routeAdherence: shiftMetrics.route_adherence
    };
    
    console.log("Logging Trip Metrics:", tripLog);
    
    try {
      // 1. Save to backend
      await fetch('/api/trips/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: activeTrip?.id,
          end_lat: currentLocation.lat,
          end_lng: currentLocation.lng,
          fare: fare,
          distance: distance,
          safety_score: safetyScore
        })
      });

      // 2. Save to local storage for analysis (keep last 50 trips)
      const existingLogs = JSON.parse(localStorage.getItem('keke_trip_logs') || '[]');
      const updatedLogs = [tripLog, ...existingLogs].slice(0, 50);
      localStorage.setItem('keke_trip_logs', JSON.stringify(updatedLogs));
      setTripHistory(updatedLogs);

      setEarnings(prev => prev + fare);
      setShiftEarnings(prev => prev + fare);
      setShiftTrips(prev => prev + 1);
      setShiftMetrics(prev => ({ ...prev, trips_completed: prev.trips_completed + 1 }));
      setActiveTrip(null);
      setTripProgress(0);
      setRouteUpdate(null);
      setSelectedRoute(null);
      setAnomalyWarning(null);
      setShowCompletionModal(false);
      setPassengerRating(0);
      alert("Trip completed successfully! Metrics logged and earnings updated.");
    } catch (error) {
      console.error("Error completing trip:", error);
      alert("Failed to log trip metrics to server, but saved locally.");
      
      // Fallback: still update local state if backend fails
      const existingLogs = JSON.parse(localStorage.getItem('keke_trip_logs') || '[]');
      const updatedLogs = [tripLog, ...existingLogs].slice(0, 50);
      localStorage.setItem('keke_trip_logs', JSON.stringify(updatedLogs));
      
      setEarnings(prev => prev + fare);
      setShiftEarnings(prev => prev + fare);
      setShiftTrips(prev => prev + 1);
      setActiveTrip(null);
      setShowCompletionModal(false);
    }
  };
  const acceptTrip = async (passengerData?: any) => {
    setIsOptimizing(true);
    setTripProgress(0);
    setRouteUpdate(null);
    setSelectedRoute(null);
    setAnomalyWarning(null);
    try {
      // Use provided passenger data or default
      const trip = passengerData || {
        passenger: 'Zainab Aliyu',
        passengerId: 101,
        origin: 'Bayero University (Old Site)',
        destination: 'Sabon Gari Market',
        fare: 600
      };

      // 1. Start trip in backend
      const response = await fetch('/api/trips/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passenger_id: trip.passengerId,
          driver_id: user.id,
          keke_id: 1, // Mock Keke ID
          start_lat: 12.0022,
          start_lng: 8.5920
        })
      });
      
      const tripResult = await response.json();
      setActiveTrip({ ...trip, id: tripResult.id });
      setTripStartTime(new Date().toISOString());
      setNearbyPassengers([]);
      
      // 2. Get optimized routes from AI, passing route intelligence
      const result = await geminiService.optimizeRoute(trip.origin, trip.destination, routeIntelligence);
      setSuggestedRoutes(result.routes || []);
    } catch (error) {
      console.error("Trip start error:", error);
      alert("Failed to start trip. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const submitRouteFeedback = async () => {
    if (!activeTrip && !selectedRoute) return;
    
    try {
      await fetch('/api/reports/route-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: user.id,
          route_name: selectedRoute?.name || "Current Route",
          origin: activeTrip?.origin || "Unknown",
          destination: activeTrip?.destination || "Unknown",
          ...feedbackData
        })
      });
      
      alert("Thank you! Your feedback has been logged to improve AI routing and safety.");
      setShowRouteFeedbackModal(false);
      setFeedbackData({
        rating: 5,
        comments: '',
        safety_concerns: '',
        traffic_level: 'moderate'
      });
      
      // Refresh intelligence
      const response = await fetch('/api/reports/route-intelligence');
      if (response.ok) {
        const data = await response.json();
        setRouteIntelligence(data);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback.");
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
                {isAuthoritiesAlerted && (
                  <div className="mt-3 flex items-center gap-2 bg-white/20 p-2 rounded-xl border border-white/30">
                    <Shield size={16} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Authorities Notified</span>
                  </div>
                )}
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
        <div className="space-y-6">
          {/* Driver Profile Header */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                <img 
                  src={`https://picsum.photos/seed/${user.id}/200/200`} 
                  alt="Driver" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                  {user.face_verified ? (
                    <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <CheckCircle2 size={12} /> VERIFIED
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <Clock size={12} /> VERIFICATION PENDING
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">KekeLink Certified Driver</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end gap-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Shift Status</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isOnShift ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {isOnShift ? 'ONLINE' : 'OFFLINE'}
                  </span>
                  <button 
                    onClick={() => {
                      if (activeTrip) {
                        alert("Please complete your active trip before going offline.");
                        return;
                      }
                      setIsOnShift(!isOnShift);
                    }}
                    className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${isOnShift ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <motion.div 
                      animate={{ x: isOnShift ? 26 : 2 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
              </div>
              <div className="text-right border-l border-slate-100 pl-6">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Safety Rating</p>
                <div className="flex items-center gap-1 text-emerald-600 font-bold">
                  <Star size={16} fill="currentColor" />
                  <span className="text-xl">4.9</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
          {/* Main Stats */}
          <div className="md:col-span-2 space-y-6">
            {/* Nearby Keke Network Map */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Navigation size={18} className="text-emerald-600" /> Nearby Keke Network
                </h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full animate-pulse">
                  {nearbyKekes.length} OTHERS ONLINE
                </span>
                <div className="flex items-center gap-2 ml-2">
                  <div className={`w-2 h-2 rounded-full ${locationStatus === 'active' ? 'bg-emerald-500 animate-pulse' : locationStatus === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    GPS: {locationStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                  <div className={`w-2 h-2 rounded-full ${locationStatus === 'error' ? 'bg-slate-500' : activeTrip ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                  <span className="text-[10px] font-bold text-slate-700 uppercase">
                    Status: {locationStatus === 'error' ? 'Offline' : activeTrip ? 'On Trip' : 'Available'}
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
                
                {/* Route Visualization */}
                {detailedRoute && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <motion.path
                      d={`M ${50 + (currentLocation.lng - 8.5920) * 2000} ${40 + (currentLocation.lat - 12.0022) * 2000} ${detailedRoute.waypoints.map((w: any, i: number) => `L ${50 + (currentLocation.lng + w.lng_offset - 8.5920) * 2000} ${40 + (currentLocation.lat + w.lat_offset - 12.0022) * 2000}`).join(' ')}`}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                  </svg>
                )}

                {/* Waypoints */}
                {detailedRoute?.waypoints.map((wp: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.2 }}
                    className="absolute z-10"
                    style={{ 
                      top: `${40 + (currentLocation.lat + wp.lat_offset - 12.0022) * 2000}%`, 
                      left: `${50 + (currentLocation.lng + wp.lng_offset - 8.5920) * 2000}%` 
                    }}
                  >
                    <div className="relative group">
                      <div className={`p-1 rounded-full shadow-lg border-2 border-white ${
                        wp.traffic_level === 'heavy' ? 'bg-red-500' : wp.traffic_level === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}>
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      
                      {/* Waypoint Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-white p-2 rounded-xl shadow-2xl border border-slate-100 z-30">
                        <p className="text-[10px] font-bold text-slate-900">{wp.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Clock size={8} /> {wp.eta}
                          </span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                            wp.traffic_level === 'heavy' ? 'bg-red-100 text-red-600' : wp.traffic_level === 'moderate' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {wp.traffic_level}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Destination Marker */}
                {activeTrip && detailedRoute?.waypoints && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute z-10"
                    style={{ 
                      top: `${40 + (currentLocation.lat + detailedRoute.waypoints[detailedRoute.waypoints.length-1].lat_offset - 12.0022) * 2000}%`, 
                      left: `${50 + (currentLocation.lng + detailedRoute.waypoints[detailedRoute.waypoints.length-1].lng_offset - 8.5920) * 2000}%` 
                    }}
                  >
                    <div className="bg-red-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
                      <MapPin size={16} />
                    </div>
                  </motion.div>
                )}

                {/* Simulated Keke Markers */}
                {nearbyKekes.map((keke) => {
                  const status = keke.status || 'Available';
                  return (
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
                      <div className={`${status === 'On Trip' ? 'bg-blue-600' : status === 'Offline' ? 'bg-slate-400' : 'bg-emerald-600'} text-white p-2 rounded-full shadow-lg group-hover:scale-110 transition-transform`}>
                        <Car size={16} />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg shadow-xl z-20">
                        <div className="flex flex-col gap-0.5">
                          <p className="font-bold flex items-center gap-1">
                            {keke.name}
                            <span className={`text-[8px] px-1 rounded-sm uppercase ${status === 'On Trip' ? 'bg-blue-500' : status === 'Offline' ? 'bg-slate-500' : 'bg-emerald-500'}`}>
                              {status}
                            </span>
                          </p>
                          <p className="opacity-70">{keke.kekeId}</p>
                        </div>
                      </div>
                      {/* Status Label next to marker */}
                      <div className="absolute left-full ml-1 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border border-slate-200 px-1.5 py-0.5 rounded text-[8px] font-bold shadow-sm pointer-events-none">
                        <span className={status === 'On Trip' ? 'text-blue-600' : status === 'Offline' ? 'text-slate-500' : 'text-emerald-600'}>
                          {status}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Self Marker */}
                <div 
                  className="absolute z-20 group"
                  style={{ 
                    top: `${40 + (currentLocation.lat - 12.0022) * 2000}%`, 
                    left: `${50 + (currentLocation.lng - 8.5920) * 2000}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className={`w-5 h-5 ${locationStatus === 'error' ? 'bg-slate-400' : activeTrip ? 'bg-blue-600' : 'bg-emerald-500'} rounded-full border-2 border-white shadow-lg ring-4 ${locationStatus === 'error' ? 'ring-slate-400/20' : activeTrip ? 'ring-blue-500/20' : 'ring-emerald-500/20'} ${locationStatus !== 'error' ? 'animate-pulse' : ''} flex items-center justify-center`}>
                    <Car size={10} className="text-white" />
                  </div>
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 ${locationStatus === 'error' ? 'bg-slate-600' : activeTrip ? 'bg-blue-600' : 'bg-emerald-600'} text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap`}>
                    YOU ({locationStatus === 'error' ? 'OFFLINE' : activeTrip ? 'ON TRIP' : 'AVAILABLE'})
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Today's Earnings</p>
                <p className="text-3xl font-bold text-slate-900">₦{earnings.toLocaleString()}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <TrendingUp size={14} /> +12%
                  </div>
                  <span className="text-[8px] text-slate-400 uppercase font-bold">Auto-Logged</span>
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
                <h3 className="font-bold text-xl">{activeTrip ? 'Current Trip' : 'Nearby Passengers'}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="text-red-600 bg-red-50 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-red-100 transition-all"
                  >
                    <AlertTriangle size={14} /> Report
                  </button>
                  {!activeTrip && nearbyPassengers.length > 0 && (
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      {nearbyPassengers.length} REQUESTS
                    </span>
                  )}
                </div>
              </div>
              
              {activeTrip ? (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                      <img src="https://picsum.photos/seed/passenger/100/100" alt="Passenger" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="font-bold">{activeTrip.passenger}</p>
                      <p className="text-xs text-slate-500">Active Trip</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <button 
                      onClick={() => setIsChatOpen(true)}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                    >
                      <MessageCircle size={14} className="text-emerald-600" /> Chat with Passenger
                    </button>
                  </div>

                  {passengerStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <p className="text-xs font-bold text-blue-700">{passengerStatus}</p>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <p className="text-slate-600 font-medium">{activeTrip.origin}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <p className="text-slate-600 font-medium">{activeTrip.destination}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock size={16} className="text-blue-500" />
                      <p className="text-slate-600 font-medium">ETA: {detailedRoute?.total_eta || 'Calculating...'}</p>
                    </div>
                  </div>

                  {/* Detailed Route Info Panel */}
                  {detailedRoute && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 pt-6 border-t border-slate-200"
                    >
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                        <Navigation size={14} /> AI Route Waypoints
                      </h4>
                      <div className="space-y-4">
                        {detailedRoute.waypoints.map((wp: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 relative">
                            {idx < detailedRoute.waypoints.length - 1 && (
                              <div className="absolute left-1.5 top-4 bottom-0 w-0.5 bg-slate-100" />
                            )}
                            <div className={`w-3 h-3 rounded-full mt-1 border-2 border-white shadow-sm ${
                              wp.traffic_level === 'heavy' ? 'bg-red-500' : wp.traffic_level === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-slate-800">{wp.name}</p>
                                <span className="text-[10px] font-bold text-slate-500">{wp.eta}</span>
                              </div>
                              <p className={`text-[10px] uppercase font-bold mt-0.5 ${
                                wp.traffic_level === 'heavy' ? 'text-red-500' : wp.traffic_level === 'moderate' ? 'text-amber-500' : 'text-emerald-500'
                              }`}>
                                {wp.traffic_level} Traffic
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-700 flex items-center gap-2">
                          <Info size={12} /> {detailedRoute.traffic_summary}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {nearbyPassengers.length > 0 ? (
                    nearbyPassengers.map((passenger) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={passenger.id} 
                        className={`p-6 rounded-2xl border transition-all relative overflow-hidden ${
                          passenger.isRecommended 
                            ? 'bg-emerald-50/50 border-emerald-200 ring-1 ring-emerald-500/20' 
                            : 'bg-slate-50 border-slate-100 hover:border-emerald-200'
                        }`}
                      >
                        {passenger.isRecommended && (
                          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[8px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                            <Shield size={10} /> AI RECOMMENDED
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${passenger.isRecommended ? 'border-emerald-500' : 'border-slate-200'}`}>
                              <img src={`https://picsum.photos/seed/${passenger.id}/100/100`} alt="Passenger" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{passenger.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider">{passenger.type}</span>
                                <span className="text-[10px] text-slate-500 font-medium">{passenger.distance} away</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-emerald-600">₦{passenger.fare}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Est. Fare</p>
                          </div>
                        </div>
                        <div className="space-y-3 mb-6 relative">
                          <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-slate-200" />
                          <div className="flex items-center gap-3 text-sm relative z-10">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-white" />
                            <p className="text-slate-600 font-medium truncate">{passenger.origin}</p>
                          </div>
                          <div className="flex items-center gap-3 text-sm relative z-10">
                            <div className="w-2 h-2 rounded-full bg-red-500 ring-4 ring-white" />
                            <p className="text-slate-600 font-medium truncate">{passenger.destination}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => acceptTrip({
                              passenger: passenger.name,
                              passengerId: passenger.id,
                              origin: passenger.origin,
                              destination: passenger.destination,
                              fare: passenger.fare
                            })}
                            className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98]"
                          >
                            Accept Ride
                          </button>
                          <button 
                            onClick={() => setNearbyPassengers(prev => prev.filter(p => p.id !== passenger.id))}
                            className="px-4 py-3.5 bg-white text-slate-400 rounded-xl font-bold hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100"
                          >
                            Ignore
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Clock size={48} className="mx-auto text-slate-300 mb-4 animate-pulse" />
                      <p className="text-slate-500 font-medium">Waiting for nearby requests...</p>
                      <p className="text-xs text-slate-400 mt-1">Stay in high-demand areas to get more rides.</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTrip && (
                <div className="space-y-6 mt-6">
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
              )}

              {/* Trip History & Performance Analysis */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <TrendingUp size={20} className="text-emerald-600" /> Performance Analysis
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase">Last 50 Trips</p>
                </div>

                {tripHistory.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Clock size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No trip data available yet.</p>
                    <p className="text-[10px] text-slate-400 uppercase mt-1">Complete trips to see analysis</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tripHistory.map((trip, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx} 
                        className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-slate-900">{trip.passenger}</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                              {new Date(trip.endTime).toLocaleDateString()} • {new Date(trip.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600">₦{trip.fare}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{trip.distance}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Shield size={12} className={trip.safetyScore >= 90 ? "text-emerald-500" : "text-amber-500"} />
                              <span className="text-[10px] font-bold text-slate-700">Safety: {trip.safetyScore}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Navigation size={12} className="text-blue-500" />
                              <span className="text-[10px] font-bold text-slate-700">Adherence: {Math.round(trip.routeAdherence * 100)}%</span>
                            </div>
                          </div>
                          <div className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500">
                            ID: #{trip.tripId?.toString().slice(-4) || 'N/A'}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Shift Controls Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Car size={18} className="text-emerald-600" /> Shift Controls
                </h3>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${isOnShift ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isOnShift ? 'ONLINE' : 'OFFLINE'}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Online Status</p>
                    <p className="text-[10px] text-slate-500">Enable to receive trip requests</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (activeTrip) {
                        alert("Please complete your active trip before going offline.");
                        return;
                      }
                      setIsOnShift(!isOnShift);
                    }}
                    className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${isOnShift ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <motion.div 
                      animate={{ x: isOnShift ? 30 : 2 }}
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
                {!isOnShift && (
                  <button 
                    onClick={startShift}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    Go Online
                  </button>
                )}
                {isOnShift && !activeTrip && (
                  <button 
                    onClick={() => setIsOnShift(false)}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
                  >
                    End Shift
                  </button>
                )}
              </div>
            </div>

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

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold flex items-center gap-2 text-slate-900">
                  <Shield className="text-emerald-600" /> AI Safety Coaching
                </h3>
                {isCoachingLoading && <Clock size={14} className="animate-spin text-slate-400" />}
              </div>

              {/* Safety Score Gauge (Simplified) */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="45" 
                    fill="none" stroke="#f1f5f9" strokeWidth="8" 
                  />
                  <motion.circle 
                    cx="50" cy="50" r="45" 
                    fill="none" stroke={safetyData.score >= 90 ? "#10b981" : safetyData.score >= 70 ? "#f59e0b" : "#ef4444"} 
                    strokeWidth="8" 
                    strokeDasharray="283"
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * safetyData.score) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900">{safetyData.score}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Safety Index</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {isCoachingLoading ? (
                  <div className="py-4 text-center">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Analyzing Patterns...</p>
                  </div>
                ) : safetyData.tips.length > 0 ? (
                  safetyData.tips.map((tip: string, i: number) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i} 
                      className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors group"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 transition-colors">
                        <CheckCircle2 className="text-emerald-600 group-hover:text-white transition-colors" size={14} />
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{tip}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                    <AlertCircle className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
                    <p className="text-xs text-amber-800 leading-relaxed">{safetyData.summary}</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl mb-6 shadow-inner">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-widest">Shift Performance</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <p className="text-xl font-bold text-white">{shiftMetrics.trips_completed}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase">Trips</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <p className={`text-xl font-bold ${shiftMetrics.anomalies_detected > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {shiftMetrics.anomalies_detected}
                    </p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase">Anomalies</p>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 col-span-2 flex justify-between items-center">
                    <div>
                      <p className={`text-xl font-bold ${shiftMetrics.route_adherence < 0.9 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {Math.round(shiftMetrics.route_adherence * 100)}%
                      </p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase">Route Adherence</p>
                    </div>
                    <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full ${shiftMetrics.route_adherence < 0.9 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${shiftMetrics.route_adherence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => fetchSafetyCoaching(shiftMetrics)}
                disabled={isCoachingLoading}
                className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Refresh AI Coaching
              </button>
            </div>

            <button 
              onClick={() => setShowShiftSummary(true)}
              className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
            >
              <Clock size={20} /> End Shift
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Shift Summary Modal */}
      <AnimatePresence>
        {showShiftSummary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto mb-6 flex items-center justify-center">
                <TrendingUp className="text-emerald-600 w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Shift Summary</h2>
              <p className="text-slate-500 mb-6">Great work today! Here's how you did.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Shift Earnings</p>
                  <p className="text-2xl font-bold text-emerald-600">₦{shiftEarnings.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Trips Completed</p>
                  <p className="text-2xl font-bold text-slate-900">{shiftTrips}</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Safety Score maintained</span>
                  <span className="font-bold text-emerald-600">{safetyData.score}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Anomalies detected</span>
                  <span className={`font-bold ${shiftMetrics.anomalies_detected > 0 ? 'text-red-500' : 'text-slate-900'}`}>
                    {shiftMetrics.anomalies_detected}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Route Adherence</span>
                  <span className={`font-bold ${shiftMetrics.route_adherence < 0.9 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {Math.round(shiftMetrics.route_adherence * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Incidents Reported</span>
                  <span className="font-bold text-slate-900">{shiftMetrics.incidents_reported}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowShiftSummary(false);
                  setIsOnShift(false);
                }}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                Close & Go Offline
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Passenger Chat Modal */}
      <AnimatePresence>
        {isChatOpen && activeTrip && (
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
                    <img src={`https://picsum.photos/seed/${activeTrip.passenger}/100/100`} alt="Passenger" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="font-bold">{activeTrip.passenger}</p>
                    <p className="text-[10px] opacity-80 uppercase font-bold tracking-wider">Your Passenger</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
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
                    <p className="text-slate-500 text-sm">No messages yet. Say hello to {activeTrip.passenger}!</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: msg.role === 'driver' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    className={`flex ${msg.role === 'driver' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                      msg.role === 'driver' 
                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-[8px] mt-1 font-bold uppercase ${msg.role === 'driver' ? 'text-emerald-100' : 'text-slate-400'}`}>
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

      <SafetyReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        onSuccess={() => setShiftMetrics(prev => ({ ...prev, incidents_reported: prev.incidents_reported + 1 }))}
        userId={user.id} 
      />

      {/* Floating SOS Button */}
      {isOnShift && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSOS}
          className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-red-700 transition-colors border-4 border-white"
        >
          <AlertTriangle size={32} className="animate-pulse" />
          <span className="absolute -top-2 -right-2 bg-white text-red-600 text-[10px] font-black px-2 py-1 rounded-full shadow-sm border border-red-100">SOS</span>
        </motion.button>
      )}

      {/* Route Feedback Modal */}
      <AnimatePresence>
        {showRouteFeedbackModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-2">Route Feedback</h2>
              <p className="text-slate-500 mb-6 text-sm">Help us improve AI routing by sharing your experience on this route.</p>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Route Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button 
                        key={s}
                        onClick={() => setFeedbackData(prev => ({ ...prev, rating: s }))}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${
                          feedbackData.rating === s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Traffic Level</label>
                  <select 
                    value={feedbackData.traffic_level}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, traffic_level: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="heavy">Heavy</option>
                    <option value="gridlock">Gridlock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Safety Concerns</label>
                  <input 
                    type="text"
                    placeholder="e.g. Poor lighting, potholes, suspicious activity"
                    value={feedbackData.safety_concerns}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, safety_concerns: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">General Comments</label>
                  <textarea 
                    rows={3}
                    placeholder="Any other details..."
                    value={feedbackData.comments}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, comments: e.target.value }))}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowRouteFeedbackModal(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Skip
                </button>
                <button 
                  onClick={submitRouteFeedback}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                >
                  Submit Feedback
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
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-red-600/90 backdrop-blur-sm"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-red-600 animate-pulse" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">SOS ALERT SENT</h2>
              <p className="text-slate-600 mb-6">Nearby drivers, community leaders, and emergency services have been notified of your location and trip details.</p>
              <div className="flex items-center gap-2 justify-center text-emerald-600 font-bold">
                <CheckCircle2 size={20} />
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
              <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase">Trip Fare</p>
                  <p className="text-3xl font-bold text-emerald-600">₦{activeTrip.fare}</p>
                </div>
                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="truncate">{activeTrip.origin}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <p className="truncate">{activeTrip.destination}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-slate-600 font-medium mb-4">Rate your experience with {activeTrip.passenger}</p>
              
              <div className="flex justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setPassengerRating(star)}
                    className="p-1 transition-all hover:scale-125 active:scale-95"
                  >
                    <Star 
                      size={36} 
                      className={star <= passengerRating ? "text-yellow-400 fill-yellow-400 drop-shadow-sm" : "text-slate-200"} 
                    />
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowCompletionModal(false);
                    setShowRouteFeedbackModal(true);
                  }}
                  className="flex-1 py-4 rounded-2xl font-bold text-emerald-600 hover:bg-emerald-50 transition-all border border-emerald-200"
                >
                  Route Feedback
                </button>
                <button 
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmCompletion}
                  disabled={passengerRating === 0}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  Finalize Trip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
