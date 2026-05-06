import { useState, useEffect } from "react";
import axios from "axios";
import { MentorshipLeadForm } from "./MentorshipLeadForm";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type MentorStatus = "PENDING" | "REVIEWED" | "APPROVED" | "REJECTED" | "HOLD";

interface MentorApplicationData {
  id: string;
  name: string;
  email: string;
  status: MentorStatus;
  score?: number | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  MentorStatus,
  {
    label: string;
    icon: string;
    bg: string;
    border: string;
    shadow: string;
    text: string;
  }
> = {
  PENDING: {
    label: "Application Under Review",
    icon: "⏳",
    bg: "#fff7ed",
    border: "#FF7F00",
    shadow: "#003366",
    text: "Your application has been received and is currently in our review queue. We'll get back to you within 5–7 business days.",
  },
  REVIEWED: {
    label: "Being Evaluated",
    icon: "🔍",
    bg: "#eff6ff",
    border: "#3b82f6",
    shadow: "#003366",
    text: "Our team is actively evaluating your application. You're one step closer — hang tight!",
  },
  APPROVED: {
    label: "Application Approved",
    icon: "✅",
    bg: "#f0fdf4",
    border: "#0B9C2C",
    shadow: "#003366",
    text: "Congratulations! Your mentor application has been approved. You now have access to mentee matching and session scheduling.",
  },
  REJECTED: {
    label: "Application Not Approved",
    icon: "❌",
    bg: "#fef2f2",
    border: "#dc2626",
    shadow: "#003366",
    text: "Unfortunately your application wasn't approved at this time. You're welcome to re-apply after 90 days.",
  },
  HOLD: {
    label: "Application On Hold",
    icon: "⏸️",
    bg: "#faf5ff",
    border: "#9333ea",
    shadow: "#003366",
    text: "Your application has been placed on hold while we gather more information. Our team may reach out to you shortly.",
  },
};

// ─── Sub-views ────────────────────────────────────────────────────────────────

const StatusView = ({
  application,
  onReapply,
}: {
  application: MentorApplicationData;
  onReapply: () => void;
}) => {
  const cfg = STATUS_CONFIG[application.status];
  const submittedDate = new Date(application.createdAt).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
  const updatedDate = new Date(application.updatedAt).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div className="space-y-5">
      {/* ── Status Card ── */}
      <div
        className="p-6 bg-white"
        style={{
          border: `4px solid ${cfg.border}`,
          boxShadow: `6px 6px 0 ${cfg.shadow}`,
        }}
      >
        {/* Tricolor bar */}
        <div className="flex h-1.5 mb-5 -mx-6 -mt-6">
          <div className="flex-1 bg-[#FF7F00]" />
          <div className="flex-1" style={{ background: cfg.border }} />
          <div className="flex-1 bg-[#0B9C2C]" />
        </div>

        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: cfg.bg, border: `3px solid ${cfg.border}` }}
          >
            {cfg.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="text-lg font-black text-[#003366] uppercase tracking-tight">
                {cfg.label}
              </h2>
              <span
                className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white"
                style={{ background: cfg.border, border: "2px solid #003366" }}
              >
                {application.status}
              </span>
            </div>
            <p className="text-sm font-medium text-[#003366]/70 leading-relaxed">
              {cfg.text}
            </p>
          </div>
        </div>
      </div>

      {/* ── Application Details ── */}
      <div
        className="bg-white p-5"
        style={{ border: "3px solid #003366", boxShadow: "5px 5px 0 #FF7F00" }}
      >
        <p className="text-[10px] font-black text-[#003366]/50 uppercase tracking-widest mb-4">
          Application Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-widest mb-0.5">
              Applicant
            </p>
            <p className="text-sm font-black text-[#003366]">
              {application.name}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-widest mb-0.5">
              Email
            </p>
            <p className="text-sm font-bold text-[#003366]">
              {application.email}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-widest mb-0.5">
              Submitted
            </p>
            <p className="text-sm font-bold text-[#003366]">{submittedDate}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-widest mb-0.5">
              Last Updated
            </p>
            <p className="text-sm font-bold text-[#003366]">{updatedDate}</p>
          </div>
          {application.score != null && (
            <div>
              <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-widest mb-0.5">
                Score
              </p>
              <p className="text-sm font-black text-[#003366]">
                {application.score} / 100
              </p>
            </div>
          )}
        </div>

        {/* Admin Notes — only show if present */}
        {application.adminNotes && (
          <div
            className="mt-4 p-3"
            style={{ background: "#fffbf3", border: "2px dashed #FF7F00" }}
          >
            <p className="text-[10px] font-black text-[#003366]/50 uppercase tracking-widest mb-1">
              📋 Reviewer Notes
            </p>
            <p className="text-sm font-medium text-[#003366]/80 leading-relaxed">
              {application.adminNotes}
            </p>
          </div>
        )}
      </div>

      {/* ── APPROVED: Next Steps ── */}
      {application.status === "APPROVED" && (
        <div
          className="p-5 bg-white"
          style={{
            border: "3px solid #0B9C2C",
            boxShadow: "5px 5px 0 #003366",
          }}
        >
          <p className="text-[10px] font-black text-[#003366]/50 uppercase tracking-widest mb-3">
            Next Steps
          </p>
          <div className="space-y-2">
            {[
              {
                icon: "🧑‍🎓",
                text: 'Visit "My Mentees" to view matched students',
              },
              {
                icon: "📅",
                text: 'Open "Sessions" to schedule your first call',
              },
              {
                icon: "📬",
                text: "Check your email for onboarding instructions",
              },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <p className="text-sm font-bold text-[#003366]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REJECTED: Re-apply CTA ── */}
      {application.status === "REJECTED" && (
        <div
          className="p-5 bg-white"
          style={{
            border: "3px solid #dc2626",
            boxShadow: "5px 5px 0 #003366",
          }}
        >
          <p className="text-[10px] font-black text-[#003366]/50 uppercase tracking-widest mb-2">
            What's Next?
          </p>
          <p className="text-sm font-medium text-[#003366]/70 mb-4">
            Take time to strengthen your profile — add more expertise, gather
            experience, and try again after 90 days.
          </p>
          <button
            onClick={onReapply}
            className="px-5 py-2.5 text-sm font-black text-white uppercase tracking-widest"
            style={{
              background: "#003366",
              border: "3px solid #003366",
              boxShadow: "3px 3px 0 #FF7F00",
            }}
          >
            Re-apply →
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MentorshipApplication = () => {
  const [application, setApplication] = useState<MentorApplicationData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); // for re-apply flow

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get<{
          success: boolean;
          data: MentorApplicationData;
        }>(`${API_BASE}/users/me/mentor-application`, {
          withCredentials: true,
        });
        setApplication(res.data.data);
      } catch {
        // 404 = no application filed yet → show form
        setApplication(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#003366] border-t-[#FF7F00] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-black text-[#003366] uppercase tracking-widest">
            Checking application status...
          </p>
        </div>
      </div>
    );
  }

  // ── No application / Re-apply flow → show form ──
  if (!application || showForm) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div
          className="p-5 bg-white"
          style={{
            border: "4px solid #003366",
            boxShadow: "6px 6px 0 #FF7F00",
          }}
        >
          <div className="flex h-1.5 mb-4 -mx-5 -mt-5">
            <div className="flex-1 bg-[#FF7F00]" />
            <div className="flex-1 bg-white border-y border-[#003366]" />
            <div className="flex-1 bg-[#0B9C2C]" />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧑‍🏫</span>
              <div>
                <h2 className="text-xl font-black text-[#003366] uppercase tracking-tight">
                  {showForm ? "Re-apply as Mentor" : "Mentor Application"}
                </h2>
                <p className="text-xs font-bold text-[#003366]/50 uppercase tracking-widest mt-0.5">
                  Apply to guide the next generation of student innovators
                </p>
              </div>
            </div>
            {showForm && (
              <button
                onClick={() => setShowForm(false)}
                className="text-xs font-black text-[#003366]/50 uppercase tracking-widest hover:text-[#003366] transition-colors"
              >
                ← Back to Status
              </button>
            )}
          </div>

          <div
            className="mt-4 p-3 bg-amber-50"
            style={{ border: "2px dashed #FF7F00" }}
          >
            <p className="text-xs font-bold text-amber-800">
              💡 Applications are reviewed within 5–7 business days. You'll be
              notified at your registered email once a decision is made.
            </p>
          </div>
        </div>

        {/* Form */}
        <MentorshipLeadForm />
      </div>
    );
  }

  // ── Has application → show status view ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="p-5 bg-white"
        style={{ border: "4px solid #003366", boxShadow: "6px 6px 0 #FF7F00" }}
      >
        <div className="flex h-1.5 mb-4 -mx-5 -mt-5">
          <div className="flex-1 bg-[#FF7F00]" />
          <div className="flex-1 bg-white border-y border-[#003366]" />
          <div className="flex-1 bg-[#0B9C2C]" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧑‍🏫</span>
          <div>
            <h2 className="text-xl font-black text-[#003366] uppercase tracking-tight">
              Mentorship
            </h2>
            <p className="text-xs font-bold text-[#003366]/50 uppercase tracking-widest mt-0.5">
              Track your mentor application status
            </p>
          </div>
        </div>
      </div>

      {/* Status view */}
      <StatusView
        application={application}
        onReapply={() => setShowForm(true)}
      />
    </div>
  );
};

export default MentorshipApplication;
