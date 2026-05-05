import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { StarDecoration } from "../icons";
import apiRequest from "../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type MentorStatus = "PENDING" | "REVIEWED" | "APPROVED" | "REJECTED";

interface MentorApplication {
  id: string;
  name: string;
  email: string;
  linkedin?: string;
  role: string;
  organization?: string;
  country: string;
  city?: string;
  yearsOfExperience: number;
  expertiseAreas: string[];
  achievement: string;
  mentoringExperience?: string;
  mentoringDescription?: string;
  projectsOrResearch?: string;
  mentorshipIntent: string;
  scenarioResponse: string;
  monthlyCommitment: string;
  mentorshipFormat: string[];
  studentPreference: string[];
  portfolioLinks?: string;
  innovationImpactView: string;
  studentMistakeObservation: string;
  thirtyDayBuildPlan?: string;
  publicMentorFeature: boolean;
  mentorReferral?: string;
  status: MentorStatus;
  score?: number;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────
const fetchApplication = (id: string) =>
  apiRequest<{ data: MentorApplication }>(`/admin/mentor-applications/${id}`, {
    method: "GET",
  });

const updateStatus = (id: string, status: MentorStatus, adminNotes?: string) =>
  apiRequest(`/admin/mentor-applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, adminNotes }),
  });

const scoreApplication = (id: string, score: number) =>
  apiRequest(`/admin/mentor-applications/${id}/score`, {
    method: "PATCH",
    body: JSON.stringify({ score }),
  });

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<
  MentorStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  PENDING: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-300",
    dot: "bg-yellow-400",
  },
  REVIEWED: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-300",
    dot: "bg-blue-500",
  },
  APPROVED: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-300",
    dot: "bg-green-500",
  },
  REJECTED: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-300",
    dot: "bg-red-500",
  },
};

// ─── Small reusable components ────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: MentorStatus }> = ({ status }) => {
  const cfg = STATUS_CFG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold uppercase border-2 shadow-sm ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

const Section: React.FC<{
  title: string;
  number: string;
  children: React.ReactNode;
}> = ({ title, number, children }) => (
  <div className="bg-white rounded-2xl border-2 border-dreamxec-navy/10 overflow-hidden shadow-sm">
    <div className="flex items-center gap-4 px-6 py-4 bg-dreamxec-cream border-b-2 border-dreamxec-navy/10">
      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-dreamxec-navy text-white text-xs font-black">
        {number}
      </div>
      <h3 className="font-bold text-dreamxec-navy font-display uppercase tracking-wide text-sm">
        {title}
      </h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const InfoGrid: React.FC<{
  items: { label: string; value: React.ReactNode }[];
}> = ({ items }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {items.map(({ label, value }) => (
      <div
        key={label}
        className="bg-dreamxec-cream/60 rounded-xl p-4 border border-dreamxec-navy/10"
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
          {label}
        </p>
        <p className="font-bold text-dreamxec-navy text-sm">{value || "—"}</p>
      </div>
    ))}
  </div>
);

const LongAnswer: React.FC<{ label: string; value?: string }> = ({
  label,
  value,
}) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
        {label}
      </p>
      <p className="text-sm text-gray-700 leading-relaxed bg-dreamxec-cream/50 rounded-xl p-4 border border-dreamxec-navy/10 whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
};

const TagList: React.FC<{ tags: string[]; accent?: string }> = ({
  tags,
  accent = "border-dreamxec-orange/50",
}) => (
  <div className="flex flex-wrap gap-2">
    {tags.map((tag, i) => (
      <span
        key={i}
        className={`px-3 py-1.5 text-xs font-bold bg-white border-2 ${accent} text-dreamxec-navy rounded-full shadow-sm`}
      >
        {tag}
      </span>
    ))}
  </div>
);

// ─── Score Meter ──────────────────────────────────────────────────────────────
const ScoreMeter: React.FC<{ score?: number }> = ({ score }) => {
  const pct = score ?? 0;
  const color = pct >= 80 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626";
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-dreamxec-navy">
            {score ?? "—"}
          </span>
        </div>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          Quality Score
        </p>
        <p className="text-sm font-bold mt-0.5" style={{ color }}>
          {score === undefined
            ? "Not scored yet"
            : score >= 80
              ? "High Quality ✓"
              : score >= 60
                ? "Moderate"
                : "Needs Review"}
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminMentorAppDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [app, setApp] = useState<MentorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Actions state
  const [notes, setNotes] = useState("");
  const [scoreInput, setScoreInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchApplication(id)
      .then((res) => {
        const data = (res as any).data;
        setApp(data);
        setNotes(data.adminNotes || "");
        setScoreInput(data.score?.toString() || "");
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleStatus = async (status: MentorStatus) => {
    if (!app) return;
    setSaving(true);
    try {
      await updateStatus(app.id, status, notes);
      setApp((prev) => (prev ? { ...prev, status, adminNotes: notes } : prev));
      showToast(`Status updated to ${status}`, "success");
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleScore = async () => {
    if (!app) return;
    const s = parseFloat(scoreInput);
    if (isNaN(s) || s < 0 || s > 100)
      return showToast("Score must be 0–100", "error");
    setScoring(true);
    try {
      await scoreApplication(app.id, s);
      setApp((prev) => (prev ? { ...prev, score: s } : prev));
      showToast("Score saved", "success");
    } catch {
      showToast("Failed to save score", "error");
    } finally {
      setScoring(false);
    }
  };

  // ── Loading / error states ──
  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-dreamxec-navy font-bold text-xl animate-pulse font-display">
            Loading application...
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !app) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-2xl font-bold text-dreamxec-navy font-display">
            Application not found.
          </p>
          <button
            onClick={() => navigate("/admin/mentor-applications")}
            className="px-6 py-3 rounded-xl bg-dreamxec-navy text-white font-bold text-sm hover:bg-dreamxec-navy/90 transition-colors"
          >
            ← Back to List
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="flex min-h-screen bg-transparent relative">
      <AdminSidebar />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[9999] px-5 py-3 rounded-xl font-bold text-white shadow-lg text-sm ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.type === "success" ? "✓ " : "✕ "}
          {toast.msg}
        </div>
      )}

      <div className="flex-1 px-6 lg:px-10 py-8 min-w-0">
        {/* ── Page Header ── */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate("/admin/mentor-applications")}
            className="flex items-center gap-2 text-sm font-bold text-dreamxec-navy/60 hover:text-dreamxec-navy transition-colors"
          >
            ← Back
          </button>
          <span className="text-dreamxec-navy/30">/</span>
          <span className="text-sm font-bold text-dreamxec-navy/60">
            Mentor Applications
          </span>
          <span className="text-dreamxec-navy/30">/</span>
          <span className="text-sm font-bold text-dreamxec-navy">
            {app.name}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-dreamxec-navy font-display flex items-center gap-3">
              Application Detail{" "}
              <StarDecoration
                className="w-8 h-8 hidden sm:block"
                color="#FF7F00"
              />
            </h1>
            <p className="text-gray-500 mt-1 font-mono text-sm">ID: {app.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={app.status} />
            <span className="text-xs font-bold text-gray-400">
              Submitted {formatDate(app.createdAt)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ══════════════════════════════
              LEFT / MAIN CONTENT
          ══════════════════════════════ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1 — Basic Info */}
            <Section title="Basic Information" number="1">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-dreamxec-navy flex items-center justify-center text-white text-2xl font-black font-display flex-shrink-0">
                  {app.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-dreamxec-navy font-display">
                    {app.name}
                  </h2>
                  <p className="text-gray-500 font-mono text-sm">{app.email}</p>
                  {app.linkedin && (
                    <a
                      href={app.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:underline mt-0.5 inline-block"
                    >
                      🔗 LinkedIn Profile
                    </a>
                  )}
                </div>
              </div>
              <InfoGrid
                items={[
                  { label: "Current Role", value: app.role },
                  { label: "Organization", value: app.organization },
                  {
                    label: "Location",
                    value: `${app.city ? app.city + ", " : ""}${app.country}`,
                  },
                  {
                    label: "Experience",
                    value: `${app.yearsOfExperience} years`,
                  },
                  { label: "Submitted", value: formatDate(app.createdAt) },
                  { label: "Last Updated", value: formatDate(app.updatedAt) },
                ]}
              />
            </Section>

            {/* Section 2 — Expertise */}
            <Section title="Area of Expertise" number="2">
              <TagList tags={app.expertiseAreas} />
            </Section>

            {/* Section 3 — Credibility */}
            <Section title="Credibility Check" number="3">
              <div className="space-y-5">
                <LongAnswer
                  label="Strongest Achievement"
                  value={app.achievement}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dreamxec-cream/60 rounded-xl p-4 border border-dreamxec-navy/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      Has Mentored Before
                    </p>
                    <p className="font-bold text-dreamxec-navy">
                      {app.mentoringExperience || "—"}
                    </p>
                  </div>
                </div>
                {app.mentoringDescription && (
                  <LongAnswer
                    label="Mentoring Experience Description"
                    value={app.mentoringDescription}
                  />
                )}
                <LongAnswer
                  label="Projects / Research / Companies"
                  value={app.projectsOrResearch}
                />
              </div>
            </Section>

            {/* Section 4 — Mentorship Intent */}
            <Section title="Mentorship Intent" number="4">
              <LongAnswer
                label="Why mentor at DreamXec?"
                value={app.mentorshipIntent}
              />
            </Section>

            {/* Section 5 — Scenario */}
            <Section title="Scenario Question" number="5">
              <div className="mb-3 p-4 rounded-xl bg-dreamxec-navy/5 border border-dreamxec-navy/10">
                <p className="text-xs font-bold text-dreamxec-navy/60 italic">
                  "How would you guide a student with no technical skills?"
                </p>
              </div>
              <LongAnswer label="Response" value={app.scenarioResponse} />
            </Section>

            {/* Section 6 — Commitment */}
            <Section title="Commitment" number="6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    Monthly Hours
                  </p>
                  <span className="inline-block px-4 py-2 bg-dreamxec-cream rounded-xl border-2 border-dreamxec-navy/20 font-bold text-dreamxec-navy text-sm">
                    {app.monthlyCommitment}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    Mentorship Format
                  </p>
                  <TagList
                    tags={app.mentorshipFormat}
                    accent="border-blue-200"
                  />
                </div>
              </div>
            </Section>

            {/* Section 7 — Student Impact */}
            <Section title="Student Impact" number="7">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Preferred Student Type
                </p>
                <TagList
                  tags={app.studentPreference}
                  accent="border-green-200"
                />
              </div>
            </Section>

            {/* Section 8 — Proof of Work */}
            {app.portfolioLinks && (
              <Section title="Proof of Work" number="8">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Portfolio / GitHub / Publications
                </p>
                <p className="text-sm text-blue-600 font-bold break-all">
                  {app.portfolioLinks}
                </p>
              </Section>
            )}

            {/* Section 9 — Values */}
            <Section title="Values Alignment" number="9">
              <LongAnswer
                label="What does 'innovation for impact' mean to you?"
                value={app.innovationImpactView}
              />
            </Section>

            {/* Section 10 — Final Filter */}
            <Section title="Final Filter" number="10">
              <div className="space-y-5">
                <LongAnswer
                  label="One mistake students make when building"
                  value={app.studentMistakeObservation}
                />
                {app.thirtyDayBuildPlan && (
                  <LongAnswer
                    label="What would you make them build in 30 days? (Elite)"
                    value={app.thirtyDayBuildPlan}
                  />
                )}
              </div>
            </Section>

            {/* Section 11 — Extra */}
            <Section title="Additional Info" number="11">
              <InfoGrid
                items={[
                  {
                    label: "Public Feature",
                    value: app.publicMentorFeature ? "✓ Yes" : "✗ No",
                  },
                  { label: "Referred Mentor", value: app.mentorReferral },
                ]}
              />
            </Section>
          </div>

          {/* ══════════════════════════════
              RIGHT / ADMIN PANEL
          ══════════════════════════════ */}
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-2xl border-2 border-dreamxec-navy/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-dreamxec-cream border-b-2 border-dreamxec-navy/10">
                <h3 className="font-bold text-dreamxec-navy font-display uppercase tracking-wide text-sm">
                  Quality Score
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <ScoreMeter score={app.score} />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    placeholder="0–100"
                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-dreamxec-navy/30 font-bold text-dreamxec-navy text-sm focus:outline-none focus:border-dreamxec-navy"
                  />
                  <button
                    onClick={handleScore}
                    disabled={scoring}
                    className="px-4 py-2.5 rounded-xl bg-dreamxec-navy text-white text-xs font-bold uppercase tracking-widest hover:bg-dreamxec-navy/90 transition-colors disabled:opacity-50"
                  >
                    {scoring ? "..." : "Save"}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Actions */}
            <div className="bg-white rounded-2xl border-2 border-dreamxec-navy/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-dreamxec-cream border-b-2 border-dreamxec-navy/10">
                <h3 className="font-bold text-dreamxec-navy font-display uppercase tracking-wide text-sm">
                  Review Decision
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Current status
                </p>
                <StatusBadge status={app.status} />

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleStatus("REVIEWED")}
                    disabled={saving || app.status === "REVIEWED"}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors disabled:opacity-40"
                  >
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={() => handleStatus("APPROVED")}
                    disabled={saving || app.status === "APPROVED"}
                    className="w-full py-3 rounded-xl bg-green-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors disabled:opacity-40"
                  >
                    {saving ? "Processing..." : "✓ Approve — Grant MENTOR Role"}
                  </button>
                  <button
                    onClick={() => handleStatus("REJECTED")}
                    disabled={saving || app.status === "REJECTED"}
                    className="w-full py-3 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-40"
                  >
                    ✕ Reject Application
                  </button>
                  <button
                    onClick={() => handleStatus("PENDING")}
                    disabled={saving || app.status === "PENDING"}
                    className="w-full py-3 rounded-xl border-2 border-dreamxec-navy/20 text-dreamxec-navy text-xs font-bold uppercase tracking-widest hover:border-dreamxec-navy transition-colors disabled:opacity-40"
                  >
                    Reset to Pending
                  </button>
                </div>

                {app.status === "APPROVED" && (
                  <div className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-xs font-bold text-green-700">
                      ✓ MENTOR role has been granted to this user's account
                      automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-white rounded-2xl border-2 border-dreamxec-navy/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-dreamxec-cream border-b-2 border-dreamxec-navy/10">
                <h3 className="font-bold text-dreamxec-navy font-display uppercase tracking-wide text-sm">
                  Admin Notes
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Internal only — not visible to applicant
                </p>
              </div>
              <div className="p-6 space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="Add internal review notes here..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-dreamxec-navy/20 focus:border-dreamxec-navy focus:outline-none text-sm text-gray-700 resize-none font-sans"
                />
                <button
                  onClick={() => handleStatus(app.status)}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-dreamxec-navy text-white text-xs font-bold uppercase tracking-widest hover:bg-dreamxec-navy/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Notes"}
                </button>
              </div>
            </div>

            {/* Quick Summary */}
            <div className="bg-white rounded-2xl border-2 border-dreamxec-navy/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-dreamxec-cream border-b-2 border-dreamxec-navy/10">
                <h3 className="font-bold text-dreamxec-navy font-display uppercase tracking-wide text-sm">
                  Quick Summary
                </h3>
              </div>
              <div className="p-6 space-y-3">
                {[
                  {
                    label: "Experience",
                    value: `${app.yearsOfExperience} years`,
                  },
                  { label: "Commitment", value: app.monthlyCommitment },
                  {
                    label: "Public Feature",
                    value: app.publicMentorFeature ? "Yes" : "No",
                  },
                  {
                    label: "Referred Someone",
                    value: app.mentorReferral ? "Yes" : "No",
                  },
                  {
                    label: "Has Portfolio",
                    value: app.portfolioLinks ? "Yes" : "No",
                  },
                  {
                    label: "Elite Question",
                    value: app.thirtyDayBuildPlan ? "Answered" : "Skipped",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {label}
                    </span>
                    <span className="text-xs font-bold text-dreamxec-navy">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
