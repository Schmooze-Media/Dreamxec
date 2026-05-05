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

const AlertIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);

const RejectIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RejectMentorModalProps {
  /** Display name of the applicant being rejected */
  applicantName: string;
  /** Called with the final reason string when admin confirms */
  onConfirm: (reason: string) => Promise<void>;
  /** Called when the modal is dismissed without action */
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_CHARS = 20;
const MAX_CHARS = 1000;

/** Quick-fill suggestion chips to help admins write faster */
const REASON_STARTERS = [
  "Insufficient years of experience for our current cohort.",
  "Expertise areas do not align with active student project needs.",
  "Application answers lack sufficient detail to assess fit.",
  "LinkedIn profile or portfolio links were not provided.",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function RejectMentorModal({
  applicantName,
  onConfirm,
  onClose,
}: RejectMentorModalProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
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

  // ── Derived state ──
  const charCount = reason.trim().length;
  const remaining = MIN_CHARS - charCount;
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;
  const showError = touched && !isValid;

  // Colour the counter as the user approaches the minimum
  const counterColour =
    charCount === 0
      ? "text-gray-400"
      : charCount < MIN_CHARS
        ? "text-red-500 font-bold"
        : charCount > MAX_CHARS
          ? "text-red-500 font-bold"
          : "text-green-600 font-bold";

  // ── Handlers ──
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value);
    setError(null);
    if (!touched && e.target.value.length > 0) setTouched(true);
  };

  const handleBlur = () => setTouched(true);

  const appendStarter = (text: string) => {
    setReason((prev) => {
      const base = prev.trim();
      return base ? `${base} ${text}` : text;
    });
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!isValid) return;

    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(reason.trim());
      // parent is responsible for closing the modal on success
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

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
        aria-labelledby="reject-modal-title"
      >
        {/* ── Header ── */}
        <div className="relative bg-red-600 px-6 pt-6 pb-5">
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={submitting}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all disabled:opacity-50"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>

          {/* Icon + title */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
              <RejectIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2
                id="reject-modal-title"
                className="text-xl font-bold text-white font-display leading-tight"
              >
                Reject Application
              </h2>
              <p className="text-red-100 text-sm mt-0.5 font-sans">
                {applicantName}
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 pt-5 pb-4 space-y-4">
          {/* Info callout */}
          <div className="flex gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl p-3.5 text-sm text-amber-800 font-sans">
            <AlertIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p>
              This reason will be <strong>emailed to the applicant</strong> and
              stored in{" "}
              <code className="text-xs bg-amber-100 px-1 py-0.5 rounded font-mono">
                adminNote
              </code>
              . The applicant may edit their application and resubmit.
            </p>
          </div>

          {/* Quick-fill chips */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Quick suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {REASON_STARTERS.map((s, i) => (
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
              htmlFor="reject-reason"
              className="block text-sm font-bold text-dreamxec-navy mb-1.5 font-display"
            >
              Rejection Reason
              <span className="text-red-500 ml-1">*</span>
            </label>

            <div
              className={`relative rounded-xl border-2 transition-all ${
                showError
                  ? "border-red-500 ring-2 ring-red-200"
                  : reason.length > 0 && isValid
                    ? "border-green-500 ring-2 ring-green-100"
                    : "border-dreamxec-navy/30 focus-within:border-dreamxec-orange focus-within:ring-2 focus-within:ring-dreamxec-orange/20"
              }`}
            >
              <textarea
                id="reject-reason"
                ref={textareaRef}
                value={reason}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={submitting}
                rows={5}
                maxLength={MAX_CHARS}
                placeholder={`Explain why this application is being rejected. Be specific so the applicant can improve their resubmission. (minimum ${MIN_CHARS} characters)`}
                className="w-full px-4 py-3 rounded-xl bg-transparent outline-none resize-none text-sm text-dreamxec-navy font-sans placeholder:text-gray-400 disabled:opacity-60"
              />

              {/* Character counter inside textarea */}
              <div
                className={`absolute bottom-2.5 right-3 text-xs pointer-events-none ${counterColour}`}
              >
                {charCount < MIN_CHARS
                  ? `${remaining} more needed`
                  : `${charCount} / ${MAX_CHARS}`}
              </div>
            </div>

            {/* Inline validation message */}
            {showError && (
              <p className="mt-1.5 text-xs text-red-600 font-bold font-sans flex items-center gap-1.5">
                <span className="inline-block w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                  !
                </span>
                {charCount === 0
                  ? "A rejection reason is required."
                  : charCount > MAX_CHARS
                    ? `Reason must be under ${MAX_CHARS} characters.`
                    : `At least ${MIN_CHARS} characters required (${remaining} more needed).`}
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
            disabled={!isValid || submitting}
            className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm border-2 border-red-700 shadow-md hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-display"
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
                Rejecting…
              </>
            ) : (
              <>
                <RejectIcon className="w-4 h-4" />
                Confirm Rejection
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
