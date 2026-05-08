import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import Pagination from "./Pagination";
import { StarDecoration } from "../icons";
import {
  getMentorApplications,
  getMentorApplicationStats,
  updateMentorApplicationStatus,
} from "../../services/adminService";
import RejectMentorModal from "./RejectMentorModal";
import HoldMentorModal from "./HoldMentorModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type MentorStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "REVIEWED";

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
  status: Exclude<MentorStatus, "ALL">;
  score?: number;
  createdAt: string;
  updatedAt: string;
}

interface MentorStats {
  PENDING?: number;
  APPROVED?: number;
  REJECTED?: number;
  REVIEWED?: number;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  User: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  Building: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  Clock: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  ExternalLink: () => (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  ),
  ChevronRight: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 5l7 7-7 7"
      />
    </svg>
  ),
  Search: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  Globe: () => (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
      />
    </svg>
  ),
  Briefcase: () => (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  Mentor: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Exclude<MentorStatus, "ALL">,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  APPROVED: {
    label: "Approved",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  REVIEWED: {
    label: "Reviewed",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
};

const FILTERS: { value: MentorStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: Exclude<MentorStatus, "ALL"> }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase border-2 shadow-sm ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const LIMIT = 15;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminMentorApps() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [stats, setStats] = useState<MentorStats>({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filter, setFilter] = useState<MentorStatus>("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rejectTarget, setRejectTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [holdTarget, setHoldTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ── Fetch stats (for badge count) ──
  useEffect(() => {
    (async () => {
      try {
        setStatsLoading(true);
        const res = await getMentorApplicationStats();
        const payload = (res as any)?.data ?? (res as any);
        setStats(payload ?? {});
      } catch {
        // non-fatal
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  // ── Fetch list whenever filter/page changes ──
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * LIMIT;
      const res = await getMentorApplications({
        status: filter === "ALL" ? undefined : filter,
        skip,
        take: LIMIT,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      // Resilient extraction
      const payload = res as any;
      let items: MentorApplication[] = [];
      let count = 0;

      if (Array.isArray(payload)) {
        items = payload;
        count = payload.length;
      } else if (Array.isArray(payload?.data)) {
        items = payload.data;
        count = payload.count ?? payload.total ?? payload.data.length;
      } else if (Array.isArray(payload?.data?.applications)) {
        items = payload.data.applications;
        count = payload.data.total ?? items.length;
      }

      setApplications(items);
      setTotal(count);
    } catch (err) {
      console.error("Mentor applications fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Reset page when filter changes
  const handleFilterChange = (f: MentorStatus) => {
    setFilter(f);
    setPage(1);
  };

  // ── Reject handler — called by modal with validated reason ──
  const handleReject = async (reason: string) => {
    await updateMentorApplicationStatus(rejectTarget!.id, "REJECTED", reason);
    setRejectTarget(null);
    fetchApplications();
  };

  // ── Hold handler — note is optional, applicant stays PENDING ──
  const handleHold = async (note: string) => {
    await updateMentorApplicationStatus(
      holdTarget!.id,
      "REVIEWED",
      note || undefined,
    );
    setHoldTarget(null);
    fetchApplications();
  };

  // ── Client-side search filter ──
  const displayed = applications.filter((app) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      app.name?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.organization?.toLowerCase().includes(q) ||
      app.role?.toLowerCase().includes(q) ||
      app.expertiseAreas?.some((e) => e.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(total / LIMIT);
  const pendingCount = stats.PENDING ?? 0;

  return (
    <div className="flex min-h-screen bg-transparent relative">
      <AdminSidebar />

      <div className="flex-1 relative min-h-screen w-full px-6 lg:px-10 py-8">
        {/* Decorative background */}
        <div className="absolute top-16 right-16 z-0 opacity-10 pointer-events-none">
          <StarDecoration className="w-32 h-32" color="#003366" />
        </div>
        <div className="absolute bottom-32 left-10 z-0 opacity-5 pointer-events-none">
          <StarDecoration className="w-48 h-48" color="#FF7F00" />
        </div>

        <div className="relative z-10 w-full">
          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-dreamxec-navy font-display flex items-center gap-3">
                Mentor Applications
                <StarDecoration
                  className="w-8 h-8 hidden sm:block"
                  color="#FF7F00"
                />
              </h1>
              <p className="text-gray-600 mt-2 font-sans text-lg">
                Review applicants and grant mentor access.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-auto">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Icons.Search />
              </span>
              <input
                type="text"
                placeholder="Search name, org, expertise…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-3 rounded-xl border-2 border-dreamxec-navy/20 w-full md:w-80 focus:ring-2 focus:ring-dreamxec-orange focus:border-dreamxec-orange bg-white shadow-sm font-sans text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* ── Stat chips ── */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              {
                label: "Pending Review",
                value: statsLoading ? "—" : pendingCount,
                color: "bg-amber-100 text-amber-800 border-amber-200",
              },
              {
                label: "Approved",
                value: statsLoading ? "—" : (stats.APPROVED ?? 0),
                color: "bg-green-100 text-green-800 border-green-200",
              },
              {
                label: "Rejected",
                value: statsLoading ? "—" : (stats.REJECTED ?? 0),
                color: "bg-red-100 text-red-800 border-red-200",
              },
              {
                label: "In Review",
                value: statsLoading ? "—" : (stats.REVIEWED ?? 0),
                color: "bg-blue-100 text-blue-800 border-blue-200",
              },
            ].map((chip) => (
              <div
                key={chip.label}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-bold text-sm ${chip.color} shadow-sm`}
              >
                <span className="text-lg leading-none">{chip.value}</span>
                <span className="font-medium text-xs opacity-80">
                  {chip.label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Filter tabs ── */}
          <div className="flex bg-white rounded-xl p-1.5 border-2 border-dreamxec-navy/20 shadow-sm w-full md:w-auto mb-6 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
                className={`relative px-5 py-2.5 rounded-lg font-bold text-xs tracking-wide transition-all whitespace-nowrap flex items-center gap-2 ${
                  filter === f.value
                    ? "bg-dreamxec-navy text-white shadow-md scale-105"
                    : "text-gray-500 hover:bg-dreamxec-navy/5 hover:text-dreamxec-navy"
                }`}
              >
                {f.label}
                {f.value === "PENDING" && pendingCount > 0 && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                      filter === "PENDING"
                        ? "bg-white text-dreamxec-navy"
                        : "bg-dreamxec-orange text-white"
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Table ── */}
          <div className="bg-white rounded-xl border-4 border-dreamxec-navy shadow-pastel-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-dreamxec-cream border-b-2 border-dreamxec-navy/20">
                  <tr>
                    <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">
                      Applicant
                    </th>
                    <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">
                      Institution
                    </th>
                    <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">
                      Expertise Areas
                    </th>
                    <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">
                      Submitted
                    </th>
                    <th className="p-5 font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">
                      Status
                    </th>
                    <th className="p-5 text-right font-bold tracking-wider font-display uppercase text-sm text-dreamxec-navy">
                      Review
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    // Skeleton rows
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-5">
                          <div className="h-4 bg-gray-200 rounded w-36 mb-2" />
                          <div className="h-3 bg-gray-100 rounded w-48" />
                        </td>
                        <td className="p-5">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                        </td>
                        <td className="p-5">
                          <div className="h-4 bg-gray-200 rounded w-48" />
                        </td>
                        <td className="p-5">
                          <div className="h-4 bg-gray-200 rounded w-24" />
                        </td>
                        <td className="p-5">
                          <div className="h-6 bg-gray-200 rounded-lg w-20" />
                        </td>
                        <td className="p-5 text-right">
                          <div className="h-8 bg-gray-200 rounded-lg w-20 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : displayed.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-5xl">🎓</span>
                          <h3 className="text-xl font-bold text-dreamxec-navy font-display">
                            No applications found
                          </h3>
                          <p className="text-gray-500 font-sans text-sm">
                            {search
                              ? `No results for "${search}"`
                              : `No ${filter === "ALL" ? "" : filter.toLowerCase()} applications yet.`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayed.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-dreamxec-cream/40 transition-colors cursor-pointer group"
                        onClick={() =>
                          navigate(`/admin/mentor-applications/${app.id}`)
                        }
                      >
                        {/* Applicant */}
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            {/* Avatar placeholder */}
                            <div className="w-9 h-9 rounded-full bg-dreamxec-navy/10 border-2 border-dreamxec-navy/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-dreamxec-navy font-bold text-sm font-display">
                                {app.name?.[0]?.toUpperCase() ?? "?"}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-dreamxec-navy font-display leading-tight">
                                {app.name}
                              </div>
                              <div className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                                {app.email}
                                {app.linkedin && (
                                  <a
                                    href={app.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-blue-500 hover:text-blue-700 transition-colors ml-1"
                                    title="LinkedIn"
                                  >
                                    <Icons.ExternalLink />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Institution */}
                        <td className="p-5">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-dreamxec-navy font-display">
                            <Icons.Building />
                            <span>{app.organization || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 font-sans mt-1">
                            <Icons.Briefcase />
                            <span>{app.role}</span>
                            {app.yearsOfExperience != null && (
                              <span className="text-gray-400 ml-1">
                                · {app.yearsOfExperience}y exp
                              </span>
                            )}
                          </div>
                          {(app.city || app.country) && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 font-sans mt-0.5">
                              <Icons.Globe />
                              <span>
                                {[app.city, app.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Expertise Areas */}
                        <td className="p-5 max-w-[260px]">
                          <div className="flex flex-wrap gap-1.5">
                            {app.expertiseAreas?.slice(0, 3).map((area, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-white border-2 border-dreamxec-orange/40 px-2.5 py-1 rounded-full text-dreamxec-navy font-bold shadow-sm whitespace-nowrap"
                              >
                                {area}
                              </span>
                            ))}
                            {(app.expertiseAreas?.length ?? 0) > 3 && (
                              <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                                +{app.expertiseAreas.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Submitted At */}
                        <td className="p-5">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-sans">
                            <Icons.Clock />
                            <span>{formatDate(app.createdAt)}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-5">
                          <StatusBadge status={app.status} />
                        </td>

                        {/* Actions */}
                        <td className="p-5 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {/* Reject — only shown for non-rejected apps */}
                            {app.status !== "REJECTED" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRejectTarget({
                                    id: app.id,
                                    name: app.name,
                                  });
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-700 bg-red-50 border-2 border-red-200 rounded-lg shadow-sm hover:bg-red-100 hover:border-red-400 transition-all"
                              >
                                Reject
                              </button>
                            )}
                            {/* Hold — only shown for PENDING apps */}
                            {app.status === "PENDING" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHoldTarget({ id: app.id, name: app.name });
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 border-2 border-amber-200 rounded-lg shadow-sm hover:bg-amber-100 hover:border-amber-400 transition-all"
                              >
                                Hold
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/admin/mentor-applications/${app.id}`,
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-dreamxec-navy bg-white border-2 border-dreamxec-navy/20 rounded-lg shadow-sm hover:bg-dreamxec-navy hover:text-white hover:border-dreamxec-navy transition-all group-hover:border-dreamxec-navy"
                            >
                              Review
                              <Icons.ChevronRight />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                setPage={setPage}
              />
            )}

            {/* Row count footer */}
            {!loading && displayed.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 font-sans">
                Showing {displayed.length} of {total} application
                {total !== 1 ? "s" : ""}
                {filter !== "ALL" && ` · filtered by ${filter.toLowerCase()}`}
                {search && ` · matching "${search}"`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Reject modal ── */}
      {rejectTarget && (
        <RejectMentorModal
          applicantName={rejectTarget.name}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}

      {/* ── Hold modal ── */}
      {holdTarget && (
        <HoldMentorModal
          applicantName={holdTarget.name}
          onConfirm={handleHold}
          onClose={() => setHoldTarget(null)}
        />
      )}
    </div>
  );
}
