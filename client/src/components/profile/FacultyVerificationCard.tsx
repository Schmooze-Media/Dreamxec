import React, { useState } from 'react';
import axios from 'axios';
import { usePermission } from '../../rbac/usePermission';
import { Permissions } from '../../rbac/permissions';
import { useAuth } from '../../context/AuthContext';

export default function FacultyVerificationCard() {
  const { can } = usePermission();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [idCard, setIdCard] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Hide component if they are already verified!
  if (user?.facultyVerified) {
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

  // Show pending state if they have submitted but admin hasn't approved
  if (user?.facultyVerification?.status === 'PENDING') {
    return (
      <div className="p-4 bg-yellow-50 border-2 border-yellow-600 shadow-[4px_4px_0px_0px_#ca8a04] flex items-center gap-3 max-w-md">
        <span className="text-2xl">⏳</span>
        <div>
          <h4 className="font-black text-yellow-800 uppercase tracking-wide">Pending Approval</h4>
          <p className="text-sm text-yellow-700 font-bold">Your verification request is currently under review by an Admin.</p>
        </div>
      </div>
    );
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('institutionalEmail', email);
      if (idCard) {
        formData.append('idCard', idCard);
      }

      await axios.post(`${API_BASE}/faculty-verification/submit-request`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage({ type: 'success', text: 'Request submitted successfully! Reloading your dashboard...' });
      
      // Reload the page after a brief pause to refresh the AuthContext and RBAC hooks
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit request.' });
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
        Verify your institutional email (.edu or .ac.in) and ID card to unlock Campaign Approval rights.
      </p>

      <form onSubmit={handleSubmitRequest} className="space-y-4">
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
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-dreamxec-navy mb-1">
            Upload ID Card
          </label>
          <input
            type="file"
            required
            accept="image/*,.pdf"
            onChange={(e) => setIdCard(e.target.files?.[0] || null)}
            className="w-full p-2 bg-gray-50 border-2 border-dreamxec-navy font-bold text-sm focus:outline-none focus:border-dreamxec-orange file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-dreamxec-orange file:text-white file:font-black file:uppercase file:tracking-widest cursor-pointer"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email || !idCard}
          className="w-full py-3 bg-dreamxec-orange text-white font-black uppercase tracking-widest text-sm border-2 border-dreamxec-navy shadow-[3px_3px_0px_0px_#003366] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Request to Admin'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 text-sm font-bold border-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}