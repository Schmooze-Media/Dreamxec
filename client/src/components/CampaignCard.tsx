import React from 'react';
import type { Campaign } from '../types';

// Cloudinary Optimizer (Fix for Issue #155)
const optimizeCloudinaryUrl = (url?: string, width = 400) => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  if (url.includes('f_auto') || url.includes('q_auto')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_fill/`);
};

interface CampaignCardProps {
  campaign: Campaign;
  href: string;
}

export default function CampaignCard({ campaign, href }: CampaignCardProps) {
  const currentAmount = campaign.currentAmount ?? 0;
  const goalAmount = campaign.goalAmount ?? 0;
  const progressPercentage = goalAmount > 0 ? Math.min((currentAmount / goalAmount) * 100, 100) : 0;
  const rating = campaign.rating ?? 5;

  return (
    <a 
      href={href} 
      className="block bg-white transition-all duration-200 hover:translate-x-[-4px] hover:translate-y-[-4px] group relative"
      style={{ border: '3px solid #003366', boxShadow: '6px 6px 0 #FF7F00', borderRadius: '16px' }}
    >
      {/* ── FACULTY APPROVED BADGE ── */}
      {campaign.facultyApproved && (
        <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full shadow-md z-10 flex items-center gap-1.5 border-2 border-blue-800 text-[10px] font-black uppercase tracking-widest">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          Verified
        </div>
      )}

      {/* ── IMAGE ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '196px',
          overflow: 'hidden',
          borderRadius: '13px 13px 0 0',
          borderBottom: '2.5px solid #111',
        }}
      >
        {campaign.imageUrl ? (
          <img
            src={optimizeCloudinaryUrl(campaign.imageUrl, 400)}
            alt={campaign.title}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = "/assets/dx-logo-2.png"; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            className="group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Image</span>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="p-4 sm:p-5">
        <h3 className="text-lg font-black text-dreamxec-navy uppercase leading-tight mb-2 line-clamp-2">
          {campaign.title}
        </h3>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-dreamxec-navy/60 uppercase tracking-wide bg-gray-100 px-2 py-1 rounded">
            {campaign.category}
          </span>
          <div className="flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="#FF7F00" stroke="#FF7F00" strokeWidth="2" className="w-4 h-4">
              <polygon points="12 2 15 8 22 9 17 14 18 21 12 18 6 21 7 14 2 9 9 8 12 2" />
            </svg>
            <span className="font-black text-dreamxec-navy text-sm">{rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-sm font-black text-dreamxec-navy mb-1">
            <span>₹{currentAmount.toLocaleString()}</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 overflow-hidden" style={{ border: '2px solid #003366' }}>
            <div
              className="h-full bg-dreamxec-green transition-all duration-700"
              style={{ width: `${Math.max(progressPercentage, 5)}%` }}
            />
          </div>
        </div>
      </div>
    </a>
  );
}