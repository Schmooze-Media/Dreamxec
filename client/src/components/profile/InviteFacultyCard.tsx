import React, { useState } from 'react';
import axios from 'axios';
import { usePermission } from '../../rbac/usePermission';
import { Permissions } from '../../rbac/permissions';

export default function InviteFacultyCard() {
  const { can } = usePermission();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // If they don't have permission to vouch for faculty, hide this card entirely!
  if (!can(Permissions.FACULTY_APPROVE)) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      await axios.post(
        `${API_BASE}/faculty-verification/invite`,
        { facultyEmail: email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: `Magic link invitation sent to ${email}!` });
      setEmail(''); // Reset form
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send invite.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 border-3 border-dreamxec-navy shadow-[6px_6px_0px_0px_#FF7F00] max-w-md">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">✉️</span>
        <h2 className="text-xl font-black text-dreamxec-navy uppercase tracking-tight">
          Invite Faculty
        </h2>
      </div>
      
      <p className="text-sm text-dreamxec-navy/70 mb-5 font-bold">
        Send a secure Magic Link to a professor to officially grant them Campaign Approval rights.
      </p>

      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-dreamxec-navy mb-1">
            Faculty Institutional Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. dr.smith@college.edu"
            className="w-full p-3 bg-gray-50 border-2 border-dreamxec-navy rounded-lg text-sm font-bold focus:outline-none focus:border-dreamxec-orange"
          />
        </div>

        {message && (
          <div className={`p-3 text-sm font-bold border-2 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full py-3 bg-dreamxec-orange text-white font-black uppercase tracking-widest text-sm rounded-lg border-2 border-dreamxec-navy shadow-[3px_3px_0px_0px_#003366] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50"
        >
          {loading ? 'Sending Magic Link...' : 'Send Invitation'}
        </button>
      </form>
    </div>
  );
}
