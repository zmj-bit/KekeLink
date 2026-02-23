import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Send, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface SafetyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

export const SafetyReportModal: React.FC<SafetyReportModalProps> = ({ isOpen, onClose, userId }) => {
  const [reportText, setReportText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reportText.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. AI Classification
      const classification = await geminiService.classifySafetyReport(reportText);
      
      // 2. Submit to Backend
      await fetch('/api/reports/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          type: 'safety_report',
          category: classification.category,
          risk_level: classification.risk_level,
          content: classification.summary,
          location: "Current Area" // In real app, use geolocation
        })
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setReportText('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Report error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-red-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle size={24} />
                <h2 className="text-xl font-bold">Report Safety Issue</h2>
              </div>
              <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Report Received</h3>
                  <p className="text-slate-500 mt-2">Thank you for keeping the community safe. Our AI has classified your report and updated the risk map.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-sm text-slate-600">Describe what you saw or the hazard you encountered. You can also record a voice note.</p>
                  
                  <textarea
                    className="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-red-500 outline-none resize-none text-sm"
                    placeholder="e.g. Suspicious Keke following us near Zoo Road..."
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                  />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRecording(!isRecording)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      <Mic size={18} /> {isRecording ? 'Recording...' : 'Voice Note'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !reportText.trim()}
                      className="flex-[2] bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Processing...' : <><Send size={18} /> Submit Report</>}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                    <Shield size={16} className="text-blue-600" />
                    <p className="text-[10px] text-blue-800 font-medium">Your report is analyzed by AI to alert other users and authorities instantly.</p>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
