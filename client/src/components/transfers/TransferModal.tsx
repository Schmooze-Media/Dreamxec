import React, { useState } from 'react';
import transferService from '../../services/transferService';
import { Campaign, User } from '../../types';

interface TransferModalProps {
  campaign: Campaign;
  onClose: () => void;
  onSuccess: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ campaign, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [targetUser, setTargetUser] = useState<{ email: string; maskedName: string; sameClub: boolean } | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [initiating, setInitiating] = useState(false);

  const handleLookup = async () => {
    console.log('[TransferModal] handleLookup called with email:', email);
    if (!email) return;
    setLookupLoading(true);
    setError(null);
    try {
      console.log('[TransferModal] Calling transferService.lookupUser...');
      const result = await transferService.lookupUser(email, campaign.id);
      console.log('[TransferModal] Lookup success, result:', result);
      if (result.eligible) {
        setTargetUser({ email, maskedName: result.maskedName, sameClub: result.sameClub });
      } else {
        setError(result.message || 'User is not eligible for transfer');
      }
    } catch (err: any) {
      console.error('[TransferModal] Lookup error:', err);
      setError(err.message || 'Failed to lookup user');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleInitiate = async () => {
    if (!targetUser) return;
    setInitiating(true);
    setError(null);
    try {
      await transferService.initiateTransfer(campaign.id, targetUser.email, note);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate transfer');
    } finally {
      setInitiating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dreamxec-navy/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md bg-white p-6 sm:p-8 transform transition-all animate-in zoom-in-95 duration-300"
        style={{ border: '4px solid #003366', boxShadow: '12px 12px 0 #FF7F00' }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-dreamxec-navy uppercase tracking-tight">Transfer Ownership</h2>
            <p className="text-[10px] font-bold text-dreamxec-orange uppercase tracking-widest mt-1">Governance Workflow Phase 1</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center bg-dreamxec-navy text-white font-black text-2xl hover:bg-dreamxec-orange transition-colors"
            style={{ border: '3px solid #003366' }}
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {!targetUser ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-dreamxec-navy uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-dreamxec-orange" />
                  Target Owner Email
                </label>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="enter.email@example.com"
                    className="flex-1 px-4 py-3 text-sm font-bold text-dreamxec-navy bg-amber-50 focus:outline-none focus:bg-white transition-colors"
                    style={{ border: '3px solid #003366' }}
                  />
                  <button
                    onClick={handleLookup}
                    disabled={lookupLoading || !email}
                    className="px-6 py-3 bg-dreamxec-navy text-white font-black uppercase tracking-widest text-xs disabled:opacity-50 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[0px] active:translate-y-[0px]"
                    style={{ border: '3px solid #003366', boxShadow: '4px 4px 0 #FF7F00' }}
                  >
                    {lookupLoading ? '...' : 'Check'}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-600 flex items-start gap-3">
                  <span className="text-red-600 font-black text-sm">!</span>
                  <p className="text-red-600 text-[10px] font-black uppercase tracking-tight leading-tight">{error}</p>
                </div>
              )}
              
              <div className="p-4 bg-blue-50 border-2 border-dashed border-dreamxec-navy/30">
                <p className="text-[10px] text-dreamxec-navy/70 font-bold leading-relaxed uppercase">
                  * Rules: Target must be an ACTIVE user and belong to <span className="text-dreamxec-navy font-black">{campaign.club?.name || 'the same club'}</span>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-5 bg-green-50 border-3 border-dreamxec-green relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-dreamxec-green/10 flex items-center justify-center -rotate-12 translate-x-4 -translate-y-4">
                  <span className="text-dreamxec-green text-3xl opacity-20">✓</span>
                </div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] font-black text-dreamxec-green uppercase tracking-widest">Eligible Target Found</p>
                      {targetUser.sameClub && (
                        <span className="px-1.5 py-0.5 bg-dreamxec-green text-white text-[8px] font-black uppercase tracking-widest">Club Member</span>
                      )}
                    </div>
                    <p className="text-xl font-black text-dreamxec-navy uppercase tracking-tighter">{targetUser.maskedName}</p>
                    <p className="text-[10px] font-bold text-dreamxec-navy/50">{targetUser.email}</p>
                  </div>
                  <button 
                    onClick={() => setTargetUser(null)} 
                    className="px-2 py-1 bg-white text-[10px] font-black text-dreamxec-navy uppercase tracking-widest border-2 border-dreamxec-navy shadow-[2px_2px_0_#003366] hover:bg-amber-50"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-dreamxec-navy uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-dreamxec-navy" />
                  Request Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Explain why you are transferring this campaign..."
                  className="w-full h-32 px-4 py-3 text-sm font-bold text-dreamxec-navy bg-amber-50 focus:outline-none focus:bg-white transition-colors resize-none"
                  style={{ border: '3px solid #003366' }}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-600">
                  <p className="text-red-600 text-[10px] font-black uppercase">{error}</p>
                </div>
              )}

              <button
                onClick={handleInitiate}
                disabled={initiating}
                className="w-full py-4 bg-dreamxec-orange text-white font-black uppercase tracking-widest text-sm transition-all hover:opacity-90 active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50"
                style={{ border: '3px solid #003366', boxShadow: '6px 6px 0 #003366' }}
              >
                {initiating ? 'Processing Governance Request...' : 'Send Transfer Request'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default TransferModal;
