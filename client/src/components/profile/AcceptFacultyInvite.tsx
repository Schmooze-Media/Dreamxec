import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function AcceptFacultyInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // If no token in URL, this is an invalid page visit
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dreamxec-cream">
        <h1 className="text-2xl font-black text-red-600 uppercase tracking-tight">Invalid Invitation Link</h1>
      </div>
    );
  }

  const handleAccept = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const jwt = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      await axios.post(
        `${API_BASE}/faculty-verification/accept-invite`,
        { token },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      setMessage({ type: 'success', text: 'Success! You are now verified Faculty.' });
      setTimeout(() => navigate('/profile'), 2000); // Send them to their dashboard!
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to accept invitation.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dreamxec-cream px-4">
      <div className="bg-white p-8 max-w-lg w-full border-4 border-dreamxec-navy shadow-[8px_8px_0px_0px_#003366] text-center">
        <span className="text-6xl mb-4 block">🎓</span>
        <h1 className="text-3xl font-black text-dreamxec-navy uppercase tracking-tight mb-2">
          Faculty Invitation
        </h1>
        
        {!user ? (
          <div className="mt-6">
            <p className="text-sm font-bold text-dreamxec-navy/80 mb-6">
              You must be logged into DreamXec to accept this invitation. Please create an account or sign in with the email address this invitation was sent to.
            </p>
            <button 
              onClick={() => navigate('/auth')}
              className="px-8 py-3 bg-dreamxec-navy text-white font-black uppercase tracking-widest text-sm rounded-lg hover:bg-blue-900 transition-colors"
            >
              Log In / Sign Up
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-md font-bold text-dreamxec-navy mb-2">
              Welcome, {user.name}!
            </p>
            <p className="text-sm text-dreamxec-navy/70 mb-8 font-bold">
              Click below to accept your role as a Verified Faculty Member. You will gain the ability to officially approve student projects.
            </p>
            
            {message && (
              <div className={`mb-6 p-3 text-sm font-bold border-2 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {message.text}
              </div>
            )}

            {!message?.text.includes('Success') && (
              <button
                onClick={handleAccept}
                disabled={loading}
                className="w-full py-4 bg-dreamxec-green text-white font-black uppercase tracking-widest text-lg rounded-lg border-2 border-dreamxec-navy shadow-[4px_4px_0px_0px_#003366] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Accept Role'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
