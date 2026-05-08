import React, { useState } from 'react';
import axios from 'axios';
import { usePermission } from '../../rbac/usePermission';
import { Permissions } from '../../rbac/permissions';

export default function FacultyVerificationCard() {
  const { can } = usePermission();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Hide component if they are already verified!
  if (can(Permissions.CAMPAIGN_REVIEW)) {
    return (
      <div className="p-4 bg-green-50 border-2 border-green-600 shadow-[4px_4px_0px_0px_#16a34a] flex items-center gap-3 max-w-md">
        <span className="text-2xl">🎓</span>
        <div>
          <h4 className="font-black text-green-800 uppercase tracking-wide">Verified Faculty</h4>
          <p className="text-sm text-green-700 font-bold">You have institutional campaign approval rights.</p>
        </div>
      </div>
    );
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/faculty-verification/send-otp`, { institutionalEmail: email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStep(2);
      setMessage({ type: 'success', text: 'OTP sent! Please check your institutional inbox.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send OTP.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/faculty-verification/verify-otp`, { institutionalEmail: email, otp }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Verification successful! Reloading your dashboard...' });
      
      // Reload the page after a brief pause to refresh the AuthContext and RBAC hooks
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Invalid OTP.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-none border-3 border-dreamxec-navy shadow-[6px_6px_0px_0px_#003366] max-w-md">
      <h2 className="text-xl font-black text-dreamxec-navy uppercase tracking-tight mb-2">
        Faculty Onboarding
      </h2>
      <p className="text-sm text-dreamxec-navy/70 mb-5 font-bold">
        Verify your institutional email (.edu or .ac.in) to unlock Campaign Approval rights.
      </p>

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-dreamxec-navy mb-1">
              Institutional Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. j.doe@college.edu"
              className="w-full p-3 bg-gray-50 border-2 border-dreamxec-navy font-bold text-sm focus:outline-none focus:border-dreamxec-orange"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 bg-dreamxec-orange text-white font-black uppercase tracking-widest text-sm border-2 border-dreamxec-navy shadow-[3px_3px_0px_0px_#003366] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-dreamxec-navy mb-1">
              Enter 6-Digit OTP
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full p-3 bg-gray-50 border-2 border-dreamxec-navy font-mono text-center tracking-widest text-lg focus:outline-none focus:border-dreamxec-orange"
            />
          </div>
          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full py-3 bg-dreamxec-green text-white font-black uppercase tracking-widest text-sm border-2 border-dreamxec-navy shadow-[3px_3px_0px_0px_#003366] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Identity'}
          </button>
          <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-dreamxec-navy/60 font-bold uppercase tracking-widest hover:text-dreamxec-orange">
            Change Email
          </button>
        </form>
      )}

      {message && (
        <div className={`mt-4 p-3 text-sm font-bold border-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}