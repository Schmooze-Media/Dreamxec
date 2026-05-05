import React, { useState, useEffect, useRef } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────

const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const HoldIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HoldMentorModalProps {
  applicantName: string;
  /** Called with the internal note (may be empty string) when admin confirms */
  onConfirm: (note: string) => Promise<void>;
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHARS = 500;

const NOTE_STARTERS = [
  "Awaiting additional LinkedIn/portfolio verification.",
  "Need to cross-check expertise claims with team.",
  "Cohort is currently full — revisit next cycle.",
  "Application flagged for committee review.",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HoldMentorModal({
  applicantName,
  onConfirm,
  onClose,
}: HoldMentorModalProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on open
  useEffect(() => {
    const id = setTimeout(() => textareaRef.current?.focus(), 80);
    return () => clearTimeout(id);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submitting, onClose]);

  const charCount = note.length;
  const isOverLimit = charCount > MAX_CHARS;

  const appendStarter = (text: string) => {
    setNote((prev) => {
      const base = prev.trim();
      return base ? `${base} ${text}` : text;
    });
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (isOverLimit) return;
    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(note.trim());
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-4 border-dreamxec-navy overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hold-modal-title"
      >
        {/* ── Header ── */}
        <div className="relative bg-amber-500 px-6 pt-6 pb-5">
          <button
            onClick={onClose}
            disabled={submitting}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all disabled:opacity-50"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
              <HoldIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2
                id="hold-modal-title"
                className="text-xl font-bold text-white font-display leading-tight"
              >
                Put Application on Hold
              </h2>
              <p className="text-amber-100 text-sm mt-0.5 font-sans">
                {applicantName}
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 pt-5 pb-4 space-y-4">
          {/* Behaviour callout */}
          <div className="flex gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl p-3.5 text-sm text-amber-800 font-sans">
            <LockIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>
                <strong>Applicant sees:</strong> PENDING — no notification is
                sent.
              </p>
              <p>
                <strong>This note:</strong> internal only, never shown to the
                applicant.
              </p>
            </div>
          </div>

          {/* Quick-fill chips */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Quick notes
            </p>
            <div className="flex flex-wrap gap-2">
              {NOTE_STARTERS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => appendStarter(s)}
                  disabled={submitting}
                  className="text-[11px] px-3 py-1.5 rounded-lg border-2 border-dreamxec-navy/20 bg-gray-50 text-dreamxec-navy font-bold hover:border-dreamxec-orange hover:bg-dreamxec-orange/5 transition-all disabled:opacity-50 text-left leading-snug"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label
              htmlFor="hold-note"
              className="block text-sm font-bold text-dreamxec-navy mb-1.5 font-display"
            >
              Internal Note
              <span className="text-gray-400 font-normal ml-1.5 text-xs">
                (optional)
              </span>
            </label>

            <div
              className={`relative rounded-xl border-2 transition-all ${
                isOverLimit
                  ? "border-red-500 ring-2 ring-red-200"
                  : "border-dreamxec-navy/30 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200"
              }`}
            >
              <textarea
                id="hold-note"
                ref={textareaRef}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setError(null);
                }}
                disabled={submitting}
                rows={4}
                maxLength={MAX_CHARS + 50} // let them type slightly over so counter turns red visibly
                placeholder="Why is this being held? (only admins can see this)"
                className="w-full px-4 py-3 rounded-xl bg-transparent outline-none resize-none text-sm text-dreamxec-navy font-sans placeholder:text-gray-400 disabled:opacity-60"
              />

              {/* Character counter */}
              <div
                className={`absolute bottom-2.5 right-3 text-xs pointer-events-none ${
                  isOverLimit
                    ? "text-red-500 font-bold"
                    : charCount > MAX_CHARS * 0.85
                      ? "text-amber-500"
                      : "text-gray-400"
                }`}
              >
                {charCount} / {MAX_CHARS}
              </div>
            </div>

            {isOverLimit && (
              <p className="mt-1.5 text-xs text-red-600 font-bold font-sans">
                Note must be under {MAX_CHARS} characters (
                {charCount - MAX_CHARS} over limit).
              </p>
            )}
          </div>

          {/* API error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-sans font-bold">
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:border-dreamxec-navy hover:text-dreamxec-navy transition-all disabled:opacity-50 font-display"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isOverLimit || submitting}
            className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm border-2 border-amber-600 shadow-md hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-display"
          >
            {submitting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Holding…
              </>
            ) : (
              <>
                <HoldIcon className="w-4 h-4" />
                Confirm Hold
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
