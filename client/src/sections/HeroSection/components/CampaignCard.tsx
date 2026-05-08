import { useNavigate } from "react-router-dom";
import type { HeroCampaign } from "../../../hooks/useHeroCampaigns";

type Props = {
  campaign: HeroCampaign;
};

const optimizeCloudinaryUrl = (url?: string, width = 600) => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  if (url.includes('f_auto') || url.includes('q_auto')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_fill/`);
};

export const CampaignCard = ({ campaign }: Props) => {
  const navigate = useNavigate();

  const progress = Math.min(Math.round((campaign.raised / campaign.goal) * 100), 100);

  return (
    <article
      className="w-full h-full bg-white flex flex-col transition-all duration-200 hover:translate-x-[-3px] hover:translate-y-[-3px]"
      style={{ border: '3px solid #003366', boxShadow: '6px 6px 0 #FF7F00' }}
    >
      {/* ── HEADING BLOCK ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-3 py-2"
        style={{ background: '#003366', borderBottom: '3px solid #003366' }}
      >
        {/* Left: wordmark-style label */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-black text-dreamxec-navy"
            style={{ background: '#FF7F00', border: '2px solid #FF7F00' }}
          >
            ★
          </span>
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
            DreamXec
          </span>
        </div>

        {/* Right: live badge */}
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white"
          style={{ border: '1.5px solid #FF7F00' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#FF7F00' }}
          />
          Live
        </span>
      </div>

      {/* Orange top stripe */}
      <div className="h-2 flex-shrink-0" style={{ background: '#FF7F00' }} />

      {/* Image */}
      <div className="h-40 sm:h-48 w-full flex-shrink-0 overflow-hidden bg-gray-100">
        <img
          src={optimizeCloudinaryUrl(campaign.image, 600)}
          alt={campaign.title}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/assets/dx-logo-2.png"; // Fallback
          }}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">

        {/* Category */}
        <div className="mb-2">
          <span
            className="inline-block px-2 py-1 text-[10px] font-black text-white uppercase tracking-widest"
            style={{ background: '#FF7F00', border: '2px solid #003366' }}
          >
            {campaign.category}
          </span>
        </div>

        {/* Club name */}
        {campaign.club?.name && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs leading-none">🏛️</span>
            <span className="text-[10px] font-black text-dreamxec-navy uppercase tracking-wide truncate">
              {campaign.club.name}
            </span>
          </div>
        )}

        {/* College */}
        {campaign.club?.college && (
          <p className="text-[10px] font-bold text-dreamxec-navy/50 uppercase tracking-wide truncate mb-2.5">
            {campaign.club.college}
          </p>
        )}

        {/* Title */}
        <h3 className="text-sm sm:text-base font-black text-dreamxec-navy uppercase tracking-tight leading-snug line-clamp-2 min-h-[2.5rem]">
          {campaign.title}
        </h3>

        {/* Push rest to bottom */}
        <div className="flex-1 min-h-[0.75rem]" />

        {/* Raised / goal */}
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs sm:text-sm font-black text-dreamxec-navy">
            ₹{campaign.raised.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-dreamxec-navy/50">
            of ₹{campaign.goal.toLocaleString()}
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-3 mb-4 overflow-hidden"
          style={{ border: '2px solid #003366', background: '#f3f4f6' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: '#FF7F00' }}
          />
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate(`/campaign/${campaign.id}`)}
          className="w-full py-2.5 text-xs sm:text-sm font-black text-white uppercase tracking-widest transition-all hover:opacity-90 active:translate-x-[2px] active:translate-y-[2px]"
          style={{
            background: '#003366',
            border: '2px solid #003366',
            boxShadow: '3px 3px 0 #FF7F00',
          }}
        >
          View Campaign →
        </button>
      </div>
    </article>
  );
};