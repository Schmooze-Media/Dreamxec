import React, { useEffect, useState } from 'react';
import transferService, { CampaignTransfer } from '../../services/transferService';

interface TransferHistoryProps {
  campaignId: string;
}

const TransferHistory: React.FC<TransferHistoryProps> = ({ campaignId }) => {
  const [transfers, setTransfers] = useState<CampaignTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await transferService.getTransferHistory(campaignId);
        setTransfers(history);
      } catch (err) {
        console.error('Failed to fetch transfer history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [campaignId]);

  if (loading) return <div className="animate-pulse h-20 bg-gray-100 border-2 border-dreamxec-navy" />;

  if (transfers.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-dreamxec-navy/20">
        <p className="text-xs font-black text-dreamxec-navy/40 uppercase tracking-widest">No transfer history recorded</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600';
      case 'REJECTED':
      case 'TARGET_REJECTED': return 'text-red-600';
      case 'EXPIRED':
      case 'CANCELLED': return 'text-gray-500';
      default: return 'text-dreamxec-orange';
    }
  };

  return (
    <div className="space-y-4">
      {transfers.map((transfer) => (
        <div 
          key={transfer.id}
          className="p-5 bg-white flex flex-col sm:flex-row justify-between items-start gap-4 transition-all hover:translate-x-[2px]"
          style={{ border: '3px solid #003366', boxShadow: '6px 6px 0 #003366' }}
        >
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black text-dreamxec-navy/50 uppercase tracking-[0.2em]">
                {new Date(transfer.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
              <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border-2 ${getStatusColor(transfer.status).replace('text-', 'border-').replace('text-', 'bg-').replace('text-', 'text-')}`}>
                {transfer.status.replace(/_/g, ' ')}
              </span>
            </div>
            
            <p className="text-sm font-black text-dreamxec-navy uppercase tracking-tight">
              Transfer to {transfer.toUserId.slice(-8)}...
            </p>
            
            {transfer.rejectionReason && (
              <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-600">
                <p className="text-[10px] font-black text-red-600 uppercase mb-1">Rejection Reason</p>
                <p className="text-[11px] font-bold text-red-700 italic">"{transfer.rejectionReason}"</p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 sm:min-w-[120px]">
            <div className="text-right">
              <p className="text-[9px] font-black text-dreamxec-navy/40 uppercase">Initiated By</p>
              <p className="text-[10px] font-black text-dreamxec-navy uppercase">{transfer.initiatorRole?.replace(/_/g, ' ') || 'OWNER'}</p>
            </div>
            {transfer.status === 'COMPLETED' && (
              <div className="w-8 h-8 bg-dreamxec-green flex items-center justify-center rounded-full border-2 border-dreamxec-navy shadow-[2px_2px_0_#003366]">
                <span className="text-white text-xs font-black">✓</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransferHistory;
