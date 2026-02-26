import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Map as MapIcon, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart2,
  Download,
  Brain
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [driverStats, setDriverStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, driverRes] = await Promise.all([
          fetch('/api/admin/safety-analytics'),
          fetch('/api/admin/driver-stats')
        ]);
        
        if (analyticsRes.ok && driverRes.ok) {
          const analyticsData = await analyticsRes.json();
          const driverData = await driverRes.json();
          setAnalytics(analyticsData);
          setDriverStats(driverData);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Safety Intelligence...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Safety Command Center</h1>
              <p className="text-xs text-slate-500 font-medium">KekeLink AI Safety Monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'reports' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Safety Reports
              </button>
            </nav>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                LIVE MONITORING ACTIVE
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Clock size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Safety Reports', value: analytics?.totalReports || 0, icon: Activity, color: 'emerald', trend: '+12%' },
            { label: 'High Risk Incidents', value: analytics?.reportsByRisk?.find((r: any) => r.risk_level === 'high')?.count || 0, icon: AlertTriangle, color: 'red', trend: '-5%' },
            { label: 'Active Drivers', value: driverStats.length, icon: Users, color: 'blue', trend: '+8%' },
            { label: 'Avg Safety Score', value: '94.2%', icon: CheckCircle, color: 'indigo', trend: '+2.4%' },
          ].map((stat, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx} 
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  <stat.icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stat.trend}
                  {stat.trend.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
              </div>
              <h3 className="text-slate-500 text-sm font-medium mb-1">{stat.label}</h3>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Reports by Category */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-slate-900">Safety Incidents by Category</h2>
              <select className="text-xs font-bold bg-slate-50 border-none rounded-lg px-3 py-1.5 outline-none">
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.reportsByCategory || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-8">Risk Distribution</h2>
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.reportsByRisk || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="risk_level"
                  >
                    {analytics?.reportsByRisk?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900">{analytics?.totalReports || 0}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Reports</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {analytics?.reportsByRisk?.map((risk: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-xs font-medium text-slate-600 capitalize">{risk.risk_level}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">{risk.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Driver Behavior Patterns */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Driver Performance & Behavior</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Driver</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Trips</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Safety Score</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">High Risk</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {driverStats.map((driver, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                            <img src={`https://picsum.photos/seed/${driver.id}/100/100`} alt="" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{driver.name}</p>
                            <p className="text-[10px] text-slate-400">{driver.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm font-medium text-slate-600">{driver.total_trips}</td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (driver.avg_safety_score || 0) > 90 ? 'bg-emerald-500' : 
                                (driver.avg_safety_score || 0) > 70 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${driver.avg_safety_score || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-900">{Math.round(driver.avg_safety_score || 0)}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                          driver.high_risk_reports > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {driver.high_risk_reports} REPORTS
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Active</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Route Risk Assessments */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Route Risk Assessments</h2>
            </div>
            <div className="p-8 space-y-6">
              {analytics?.routeRisk?.map((route: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <MapIcon size={18} className="text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{route.route_name}</h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{route.feedback_count} DRIVER REVIEWS</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg shadow-sm">
                      <TrendingUp size={14} className={route.avg_rating > 4 ? 'text-emerald-500' : 'text-amber-500'} />
                      <span className="text-xs font-bold text-slate-900">{route.avg_rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  {route.concerns && (
                    <div className="flex flex-wrap gap-2">
                      {route.concerns.split(',').slice(0, 3).map((concern: string, cIdx: number) => (
                        <span key={cIdx} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-medium text-slate-600">
                          {concern.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <Clock size={12} />
                        LAST UPDATED: 2H AGO
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                      route.avg_rating > 4 ? 'bg-emerald-100 text-emerald-700' : 
                      route.avg_rating > 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {route.avg_rating > 4 ? 'LOW RISK' : route.avg_rating > 3 ? 'MEDIUM RISK' : 'HIGH RISK'}
                    </span>
                  </div>
                </div>
              ))}
              
              {(!analytics?.routeRisk || analytics.routeRisk.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <MapIcon size={32} className="text-slate-200" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">No route feedback data available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Reports Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Safety Analysis Reports</h2>
                <p className="text-slate-500 font-medium">AI-generated insights and behavioral patterns</p>
              </div>
              <button 
                onClick={() => {
                  setIsGeneratingReport(true);
                  setTimeout(() => setIsGeneratingReport(false), 2000);
                }}
                disabled={isGeneratingReport}
                className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
              >
                {isGeneratingReport ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain size={20} />
                    Generate AI Safety Audit
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* AI Incident Classification */}
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                      <AlertTriangle size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">AI Incident Classification</h3>
                  </div>
                  <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-lg text-slate-500 uppercase">Recent High Risk</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {analytics?.recentAnomalies?.map((anomaly: any, idx: number) => (
                    <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${anomaly.risk_level === 'high' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                          <span className="text-sm font-bold text-slate-900">{anomaly.category}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(anomaly.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        Reported at <span className="font-bold text-slate-900">{anomaly.location}</span>. 
                        AI classified this as <span className="text-red-600 font-bold">{anomaly.risk_level} risk</span> requiring immediate attention.
                      </p>
                      <div className="flex items-center gap-2">
                        <button className="text-[10px] font-bold text-emerald-600 hover:underline">View Full Context</button>
                        <span className="text-slate-300">•</span>
                        <button className="text-[10px] font-bold text-slate-500 hover:underline">Mark as Resolved</button>
                      </div>
                    </div>
                  ))}
                  {(!analytics?.recentAnomalies || analytics.recentAnomalies.length === 0) && (
                    <div className="p-12 text-center">
                      <p className="text-slate-400 text-sm font-medium">No high-risk incidents reported recently.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Driver Behavior Trends */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Brain size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Behavioral Trends</h3>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Risk Indicators</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Sudden Braking', value: '14%', trend: 'up', color: 'red' },
                        { label: 'Route Deviation', value: '8%', trend: 'down', color: 'emerald' },
                        { label: 'Night Driving', value: '22%', trend: 'up', color: 'amber' },
                        { label: 'Speeding', value: '5%', trend: 'down', color: 'emerald' },
                      ].map((trend, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-700">{trend.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{trend.value}</span>
                            {trend.trend === 'up' ? (
                              <ArrowUpRight size={14} className="text-red-500" />
                            ) : (
                              <ArrowDownRight size={14} className="text-emerald-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                      <CheckCircle size={16} />
                      <span className="text-xs font-bold uppercase">AI Insight</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Overall driver safety scores have improved by <span className="font-bold">4.2%</span> this week. 
                      Route adherence is at an all-time high of <span className="font-bold">96.5%</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Risk Matrix */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <MapIcon size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Route Risk Assessment Matrix</h3>
                </div>
                <button className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                  <Download size={14} /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Route Name</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Risk Level</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Report Density</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Primary Concerns</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase">Action Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {analytics?.routeRisk?.map((route: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-4">
                          <p className="text-sm font-bold text-slate-900">{route.route_name}</p>
                          <p className="text-[10px] text-slate-400">{route.feedback_count} data points</p>
                        </td>
                        <td className="px-8 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                            route.avg_rating > 4 ? 'bg-emerald-50 text-emerald-600' : 
                            route.avg_rating > 3 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {route.avg_rating > 4 ? 'LOW' : route.avg_rating > 3 ? 'MEDIUM' : 'HIGH'}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${route.feedback_count > 10 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(route.feedback_count * 5, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-slate-900">{route.feedback_count}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex flex-wrap gap-1">
                            {route.concerns?.split(',').slice(0, 2).map((c: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-medium text-slate-600">
                                {c.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${route.avg_rating > 3 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              {route.avg_rating > 3 ? 'Monitored' : 'Review Required'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
