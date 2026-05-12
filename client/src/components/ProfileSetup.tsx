import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile } from "../services/profileService";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import FacultyVerificationCard from "./profile/FacultyVerificationCard";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
type Role = "USER" | "STUDENT" | "DONOR" | "FACULTY" | "ADMIN" | "ALUMNI" | "MENTOR";
type Gender = "MALE" | "FEMALE" | "OTHER";
type YearOfStudy = "FIRST" | "SECOND" | "THIRD" | "FINAL";
type Occupation = "SALARIED" | "BUSINESS" | "PROFESSIONAL" | "OTHER";

/* ─────────────────────────────────────────
   REUSABLE STYLED INPUT (consistent neo-brutalist look)
───────────────────────────────────────── */
const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-black text-[#003366] uppercase tracking-widest">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full px-3 py-2.5 text-sm font-medium text-[#003366] bg-white focus:outline-none transition-all border-[3px] border-[#003366] shadow-[3px_3px_0_#FF7F00] disabled:opacity-60 disabled:cursor-not-allowed";
const selectCls = inputCls + " cursor-pointer";

/* ─────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────── */
const StepIndicator = ({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) => (
  <div className="flex items-center justify-between mb-8">
    {steps.map((label, i) => (
      <div key={i} className="flex items-center flex-1">
        <div className="flex flex-col items-center">
          <div
            className="w-8 h-8 flex items-center justify-center text-sm font-black transition-all"
            style={{
              border: "3px solid #003366",
              background:
                i < current ? "#0B9C2C" : i === current ? "#FF7F00" : "#fff",
              color: i <= current ? "#fff" : "#003366",
              boxShadow: i === current ? "3px 3px 0 #003366" : "none",
            }}
          >
            {i < current ? "✓" : i + 1}
          </div>
          <span
            className="text-[10px] font-bold text-[#003366] mt-1 text-center hidden sm:block"
            style={{ maxWidth: 64 }}
          >
            {label}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div
            className="flex-1 h-0.5 mx-2"
            style={{
              background: i < current ? "#0B9C2C" : "#003366",
              opacity: 0.3,
            }}
          />
        )}
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   PROFILE COMPLETION BAR
───────────────────────────────────────── */
const CompletionBar = ({ pct }: { pct: number }) => (
  <div className="mb-6">
    <div className="flex justify-between items-center mb-1.5">
      <span className="text-xs font-black text-[#003366] uppercase tracking-widest">
        Profile Completion
      </span>
      <span
        className="text-sm font-black"
        style={{ color: pct >= 80 ? "#0B9C2C" : "#FF7F00" }}
      >
        {pct}%
      </span>
    </div>
    <div className="w-full h-3 bg-gray-100 border-2 border-[#003366] overflow-hidden">
      <div
        className="h-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: pct >= 80 ? "#0B9C2C" : "#FF7F00",
        }}
      />
    </div>
  </div>
);

/* ─────────────────────────────────────────
   SKILLS TAG INPUT
───────────────────────────────────────── */
const SkillsInput = ({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (s: string[]) => void;
}) => {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !skills.includes(v)) onChange([...skills, v]);
    setInput("");
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          className={inputCls + " flex-1"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a skill and press Enter"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2.5 font-black text-white text-sm uppercase tracking-wide"
          style={{ background: "#003366", border: "3px solid #003366" }}
        >
          +
        </button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {skills.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-white"
              style={{ background: "#003366", border: "2px solid #003366" }}
            >
              {s}
              <button
                type="button"
                onClick={() => onChange(skills.filter((x) => x !== s))}
                className="hover:text-red-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   CATEGORY CHECKBOXES (Donor)
───────────────────────────────────────── */
const DONATION_CATEGORIES = [
  "Education",
  "Health",
  "Climate",
  "Technology",
  "Arts",
  "Sports",
  "Community",
];
const CategoryPicker = ({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (c: string[]) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {DONATION_CATEGORIES.map((cat) => {
      const active = selected.includes(cat);
      return (
        <button
          key={cat}
          type="button"
          onClick={() =>
            onChange(
              active ? selected.filter((c) => c !== cat) : [...selected, cat],
            )
          }
          className="px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-all"
          style={{
            border: "2px solid #003366",
            background: active ? "#003366" : "#fff",
            color: active ? "#fff" : "#003366",
            boxShadow: active ? "2px 2px 0 #FF7F00" : "none",
          }}
        >
          {cat}
        </button>
      );
    })}
  </div>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Derive initial role from AuthContext immediately (no API wait) ──
  const getInitialRole = (): Role => {
    if (!user) return "USER";
    const roles = (user as any).roles || [(user as any).role];
    const upperRoles = roles.map((r: string) => r?.toUpperCase());
    if (upperRoles.includes("DONOR")) return "DONOR";
    if (upperRoles.includes("FACULTY")) return "FACULTY";
    if (upperRoles.includes("ALUMNI")) return "ALUMNI";
    return "USER";
  };

  // "USER" is unselected placeholder only when user has no resolved role yet
  const [role, setRole] = useState<Role>(getInitialRole);
  const [roleChosen, setRoleChosen] = useState<boolean>(() => {
    // A logged-in user always has at least USER/student — treat as already chosen
    return !!user;
  });
  const [step, setStep] = useState(0);
  const [completionPct, setCompletionPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isAlumniEligible, setIsAlumniEligible] = useState(false);
  const [isMentorEligible, setIsMentorEligible] = useState(false);
  const [showActivationCards, setShowActivationCards] = useState(false);
  const [showFacultyVerification, setShowFacultyVerification] = useState(false);
  const [activatingAlumni, setActivatingAlumni] = useState(false);
  const [isRoleLocked, setIsRoleLocked] = useState(false);

  // ── Student form state ──
  // Pre-fill name from auth context (entered at signup)
  const [sName, setSName] = useState(role !== "DONOR" ? user?.name || "" : "");
  const [sPhone, setSPhone] = useState("");
  const [sCountryCode, setSCountryCode] = useState("+91");
  const [sGender, setSGender] = useState<Gender | "">("");
  const [sDob, setSDob] = useState("");
  const [sCollege, setSCollege] = useState("");
  const [sYear, setSYear] = useState<YearOfStudy | "">("");
  const [sYearOfGraduation, setSYearOfGraduation] = useState("");
  const [sAddress, setSAddress] = useState("");
  const [sInstagram, setSInstagram] = useState("");
  const [sFacebook, setSFacebook] = useState("");
  const [sTwitter, setSTwitter] = useState("");
  const [sReddit, setSReddit] = useState("");
  const [sBio, setSBio] = useState("");
  const [sSkills, setSSkills] = useState<string[]>([]);
  const [sProjectTitle, setSProjectTitle] = useState("");
  const [sFunding, setSFunding] = useState("");
  const [sPortfolio, setSPortfolio] = useState("");
  const [sGithub, setSGithub] = useState("");
  const [sLinkedin, setSLinkedin] = useState("");

  // ── Donor form state ──
  // Pre-fill name from auth context (entered at signup)
  const [dName, setDName] = useState(role === "DONOR" ? user?.name || "" : "");
  const [dPhone, setDPhone] = useState("");
  const [dCountryCode, setDCountryCode] = useState("+91");
  const [dGender, setDGender] = useState<Gender | "">("");
  const [dDob, setDDob] = useState("");
  const [dPan, setDPan] = useState("");
  const [dEducation, setDEducation] = useState("");
  const [dOccupation, setDOccupation] = useState<Occupation | "">("");
  const [dAddress, setDAddress] = useState("");
  const [dInstagram, setDInstagram] = useState("");
  const [dFacebook, setDFacebook] = useState("");
  const [dTwitter, setDTwitter] = useState("");
  const [dReddit, setDReddit] = useState("");
  const [dBio, setDBio] = useState("");
  const [dCategories, setDCategories] = useState<string[]>([]);
  const [dAnonymous, setDAnonymous] = useState(false);
  const [dInstitution, setDInstitution] = useState("");
  const [dGradYear, setDGradYear] = useState("");
  const [dExpertiseSkills, setDExpertiseSkills] = useState<string[]>([]);
  const [dOpenToConnect, setDOpenToConnect] = useState(false);

  // ── Load current profile (enrich with saved data) ──
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getProfile();
        if (res.status === "success" && res.data) {
          const { profile, completionPct: pct, role: r } = res.data;

          // ── Guard: redirect away if profile is already complete ──
          if (profile.profileComplete === true) {
            const resolvedRole = (r as string)?.toUpperCase();
            if (resolvedRole === "DONOR") navigate("/donor/dashboard");
            else if (resolvedRole === "FACULTY") navigate("/dashboard");
            else navigate("/dashboard");
            return;
          }

          // Determine the form role based on the user's role array
          const p = profile as any;
          const rolesArray = p.roles || [(r as string)?.toUpperCase()];
          const upperRoles = rolesArray.map((r: string) => r?.toUpperCase());

          let apiRole: Role = "USER";
          if (upperRoles.includes("DONOR")) apiRole = "DONOR";
          else if (upperRoles.includes("FACULTY")) apiRole = "FACULTY";
          else if (upperRoles.includes("ALUMNI")) apiRole = "ALUMNI";

          setRole(apiRole);
          // Any authenticated user has a role — mark as chosen
          setRoleChosen(true);
          setCompletionPct(pct);
          if (p.phone) {
            setIsRoleLocked(true);
          } else if (p.googleId || p.linkedinId) {
            // OAuth first-time setup: unlock role picker
            setIsRoleLocked(false);
          } else {
            // Email/Password first-time setup: lock role picker
            setIsRoleLocked(true);
          }
          // Use the normalized apiRole for branching (not the raw `r` which may vary in case)
          if (apiRole === "DONOR") {
            // Use saved name OR fall back to the name from signup
            setDName(p.name || user?.name || "");
            setDPhone(p.phone || "");
            setDCountryCode(p.countryCode || "+91");
            setDGender(p.gender || "");
            setDDob(p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "");
            setDPan(p.panNumber || "");
            setDEducation(p.education || "");
            setDOccupation(p.occupation || "");
            setDAddress(p.address || "");
            setDInstagram(p.instagram || "");
            setDFacebook(p.facebook || "");
            setDTwitter(p.twitterX || "");
            setDReddit(p.reddit || "");
            setDBio(p.bio || "");
            setDCategories(p.donationCategories || []);
            setDAnonymous(p.anonymousDonation || false);
            setDInstitution(p.institution || "");
            setDGradYear(p.graduationYear ? String(p.graduationYear) : "");
            setDExpertiseSkills(p.expertiseSkills || []);
            setDOpenToConnect(p.openToConnect || false);
          } else {
            setSName(p.name || user?.name || "");
            setSPhone(p.phone || "");
            setSCountryCode(p.countryCode || "+91");
            setSGender(p.gender || "");
            setSDob(p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "");
            setSCollege(p.college || "");
            setSYear(p.yearOfStudy || "");
            setSYearOfGraduation(p.yearOfGraduation ? String(p.yearOfGraduation) : "");
            setSAddress(p.address || "");
            setSInstagram(p.instagram || "");
            setSFacebook(p.facebook || "");
            setSTwitter(p.twitterX || "");
            setSReddit(p.reddit || "");
            setSBio(p.bio || "");
            setSSkills(p.skills || []);
            setSProjectTitle(p.projectTitle || "");
            setSFunding(
              p.fundingRequired != null ? String(p.fundingRequired) : "",
            );
            setSPortfolio(p.portfolioUrl || "");
            setSGithub(p.githubUrl || "");
            setSLinkedin(p.linkedinUrl || "");
          }
        }
      } catch (err: any) {
        console.error("Failed to load profile:", err);
        // Non-fatal: user can still fill in the form.
        // Role was already set from AuthContext, so the header is correct.
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Validation helpers ──
  const validatePhone = (p: string) => /^[0-9]{10}$/.test(p.trim());
  const validatePan = (p: string) => /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(p.trim());
  const validateDob = (d: string) => {
    if (!d) return false;
    const dob = new Date(d);
    const ageMs = Date.now() - dob.getTime();
    return ageMs / (1000 * 60 * 60 * 24 * 365.25) >= 13;
  };
  console.log(user);
  // ── Step config ──
  const studentSteps = [
    "Basic Info",
    "Academic",
    "Social & Bio",
    "Address & Links",
  ];
  const donorSteps = ["Personal", "PAN & Tax", "Other Details", "Social & Bio"];
  const steps = role === "DONOR" ? donorSteps : studentSteps;
  const isLast = step === steps.length - 1;

  // ── Build payload for current step ──
  const buildPayload = () => {
    if (role === "DONOR") {
      return (
        {
          0: {
            name: dName,
            phone: dPhone,
            countryCode: dCountryCode,
            gender: dGender || undefined,
            dateOfBirth: dDob || undefined,
          },
          1: {
            panNumber: dPan,
            institution: dInstitution,
            graduationYear: dGradYear ? parseInt(dGradYear) : undefined,
          },
          2: {
            education: dEducation,
            occupation: dOccupation || undefined,
            address: dAddress,
            expertiseSkills: dExpertiseSkills,
            openToConnect: dOpenToConnect,
          },
          3: {
            instagram: dInstagram,
            facebook: dFacebook,
            twitterX: dTwitter,
            reddit: dReddit,
            bio: dBio,
            donationCategories: dCategories,
            anonymousDonation: dAnonymous,
          },
        }[step] ?? {}
      );
    }
    return (
      {
        0: {
          name: sName,
          phone: sPhone,
          countryCode: sCountryCode,
          gender: sGender || undefined,
          dateOfBirth: sDob || undefined,
        },
        1: {
          college: sCollege,
          yearOfStudy: sYear || undefined,
          yearOfGraduation: sYearOfGraduation ? parseInt(sYearOfGraduation) : undefined,
          skills: sSkills,
          projectTitle: sProjectTitle,
          fundingRequired: sFunding ? parseFloat(sFunding) : undefined,
        },
        2: {
          instagram: sInstagram,
          facebook: sFacebook,
          twitterX: sTwitter,
          reddit: sReddit,
          bio: sBio,
        },
        3: {
          address: sAddress,
          portfolioUrl: sPortfolio,
          githubUrl: sGithub,
          linkedinUrl: sLinkedin,
        },
      }[step] ?? {}
    );
  };

  // ── Validate current step ──
  const validateStep = (): string => {
    if (role === "DONOR") {
      if (step === 0) {
        if (!dName.trim()) return "Full name is required.";
        if (!dPhone.trim()) return "Phone number is required.";
        if (!validatePhone(dPhone)) return "Phone must be exactly 10 digits.";
        if (dDob && !validateDob(dDob))
          return "You must be at least 13 years old.";
      }
      if (step === 1) {
        if (!dPan.trim()) return "PAN number is required.";
        if (!validatePan(dPan))
          return "Invalid PAN. Expected format: ABCDE1234F";
      }
      if (step === 2) {
        if (!dOccupation) return "Please select your occupation.";
      }
    } else {
      if (step === 0) {
        if (!sName.trim()) return "Full name is required.";
        if (!sPhone.trim()) return "Phone number is required.";
        if (!validatePhone(sPhone)) return "Phone must be exactly 10 digits.";
        if (sDob && !validateDob(sDob))
          return "You must be at least 13 years old.";
      }
      if (step === 1) {
        if (!sCollege.trim()) return "College/University name is required.";
        // Only require year of study for Students (USER)
        if (role === "USER" && !sYear) return "Please select your year of study.";
        if (role === "ALUMNI" && !sYearOfGraduation) return "Please enter your year of graduation.";
      }
    }
    return "";
  };
  // ── Role change — resets step to 0 so steps config recalculates ──
  const handleRoleChange = (newRole: Role | "") => {
    if (newRole !== "") {
      setRole(newRole as Role);
      setRoleChosen(true);
    }
    setStep(0);
    setError("");
  };
  // ── Save step ──
  const handleNext = async () => {
    // ── Mandatory role gate ──
    if (step === 0 && !roleChosen) {
      setError("Please select your role before continuing.");
      return;
    }
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setSaving(true);
    try {
      // On step 0, always include the chosen role so it gets persisted
      const payload = step === 0 ? { ...buildPayload(), role } : buildPayload();
      const res = await updateProfile(payload as any);
      if (res.data) {
        setCompletionPct(res.data.completionPct);
        // Capture eligibility flags from API response
        if (res.data.isAlumniEligible !== undefined) setIsAlumniEligible(res.data.isAlumniEligible);
        if (res.data.isMentorEligible !== undefined) setIsMentorEligible(res.data.isMentorEligible);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save. Please try again.");
      setSaving(false);
      return;
    }
    if (isLast) {
      setSuccessMsg("🎉 Profile setup complete!");
      if (role === "FACULTY") {
        setShowFacultyVerification(true);
      } else if (role === "DONOR" && (isAlumniEligible || isMentorEligible)) {
        setShowActivationCards(true);
      } else {
        setTimeout(
          () => { window.location.href = role === "DONOR" ? "/donor/dashboard" : "/dashboard"; },
          1500,
        );
      }
    } else {
      setStep((s) => s + 1);
    }
    setSaving(false);
  };

  const handleSkip = () => {
    if (isLast) {
      window.location.href = role === "DONOR" ? "/donor/dashboard" : "/dashboard";
    } else setStep((s) => s + 1);
  };

  // ── Activate Alumni handler ──
  const handleActivateAlumni = async () => {
    setActivatingAlumni(true);
    try {
      await axios.post(
        `${API_BASE}/users/activate-role`,
        { role: "ALUMNI" },
        { withCredentials: true, headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSuccessMsg("🎓 Alumni role activated! Welcome to the Alumni network.");
      setTimeout(() => navigate("/donor/dashboard"), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to activate Alumni role.");
    } finally {
      setActivatingAlumni(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#003366] border-t-[#FF7F00] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-black text-[#003366] uppercase tracking-widest text-sm">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // ── Faculty Verification Screen ──
  if (showFacultyVerification) {
    return (
      <div className="min-h-screen bg-[#FFFBF3] flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-2xl flex flex-col items-center">
          <FacultyVerificationCard />

          <button
            onClick={() => { window.location.href = "/dashboard"; }}
            className="mt-6 w-full max-w-md py-3 font-black text-sm uppercase tracking-wide text-[#003366]/50 bg-white text-center"
            style={{ border: "3px solid #003366", opacity: 0.6 }}
          >
            Skip — Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Activation Cards Screen (shown after final step for eligible donors) ──
  if (showActivationCards) {
    return (
      <div className="min-h-screen bg-[#FFFBF3] flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-[#003366] uppercase tracking-tight">
              🎉 Profile Complete!
            </h1>
            <p className="text-[#003366]/70 font-bold text-sm mt-2">
              You're eligible for additional roles — unlock new features!
            </p>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div
              className="mb-6 p-3 text-sm font-bold text-green-700 bg-green-50"
              style={{ border: "3px solid #0B9C2C", boxShadow: "3px 3px 0 #0B9C2C" }}
            >
              {successMsg}
            </div>
          )}
          {error && (
            <div
              className="mb-6 p-3 text-sm font-bold text-red-700 bg-red-50 flex items-start gap-2"
              style={{ border: "3px solid #dc2626", boxShadow: "3px 3px 0 #dc2626" }}
            >
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Alumni Activation Card */}
            {isAlumniEligible && (
              <div
                className="bg-white p-6"
                style={{ border: "4px solid #0B9C2C", boxShadow: "8px 8px 0 #003366" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: "#f0fdf4", border: "3px solid #0B9C2C" }}
                  >
                    🎓
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-black text-[#003366] uppercase tracking-tight">
                      Become an Alumni
                    </h2>
                    <p className="text-sm font-medium text-[#003366]/70 mt-1">
                      Your institution and graduation year qualify you for Alumni status.
                      Unlock verified badges, campaign endorsements, and free opportunity posting.
                    </p>
                    <button
                      onClick={handleActivateAlumni}
                      disabled={activatingAlumni}
                      className="mt-4 px-6 py-3 font-black text-white uppercase tracking-widest text-sm transition-all disabled:opacity-60"
                      style={{
                        background: "#0B9C2C",
                        border: "3px solid #003366",
                        boxShadow: "4px 4px 0 #003366",
                      }}
                    >
                      {activatingAlumni ? "⏳ Activating..." : "✓ Activate Alumni Now"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mentor Application Card */}
            {isMentorEligible && (
              <div
                className="bg-white p-6"
                style={{ border: "4px solid #FF7F00", boxShadow: "8px 8px 0 #003366" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: "#fff7ed", border: "3px solid #FF7F00" }}
                  >
                    🧑‍🏫
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-black text-[#003366] uppercase tracking-tight">
                      Apply as a Mentor
                    </h2>
                    <p className="text-sm font-medium text-[#003366]/70 mt-1">
                      Share your expertise and guide the next generation of student innovators.
                      Applications are reviewed within 5–7 business days.
                    </p>
                    <button
                      onClick={() => navigate("/donor/dashboard")}
                      className="mt-4 px-6 py-3 font-black text-white uppercase tracking-widest text-sm transition-all"
                      style={{
                        background: "#FF7F00",
                        border: "3px solid #003366",
                        boxShadow: "4px 4px 0 #003366",
                      }}
                    >
                      Start Application →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Skip to Dashboard */}
          <button
            onClick={() => navigate("/donor/dashboard")}
            className="mt-6 w-full py-3 font-black text-sm uppercase tracking-wide text-[#003366]/50 bg-white text-center"
            style={{ border: "3px solid #003366", opacity: 0.6 }}
          >
            Skip — Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF3] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-black text-[#003366] uppercase tracking-tight">
              📋 Profile
            </h1>
          </div>
          <p className="text-[#003366]/70 font-bold text-sm">
            {role === "DONOR"
              ? "Tell us about yourself to unlock full donor features"
              : "Complete your profile to start fundraising campaigns"}
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-white"
          style={{
            border: "4px solid #003366",
            boxShadow: "8px 8px 0 #FF7F00",
          }}
        >
          {/* Tricolor bar */}
          <div className="flex h-2">
            <div className="flex-1 bg-[#FF7F00]" />
            <div className="flex-1 bg-white border-y-2 border-[#003366]" />
            <div className="flex-1 bg-[#0B9C2C]" />
          </div>

          <div className="p-6 sm:p-8">
            <CompletionBar pct={completionPct} />
            <StepIndicator steps={steps} current={step} />

            {/* Success Message */}
            {successMsg && (
              <div
                className="mb-4 p-3 text-sm font-bold text-green-700 bg-green-50"
                style={{
                  border: "3px solid #0B9C2C",
                  boxShadow: "3px 3px 0 #0B9C2C",
                }}
              >
                {successMsg}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="mb-4 p-3 text-sm font-bold text-red-700 bg-red-50 flex items-start gap-2"
                style={{
                  border: "3px solid #dc2626",
                  boxShadow: "3px 3px 0 #dc2626",
                }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── STUDENT / FACULTY STEPS ── */}
            {role !== "DONOR" && (
              <div className="space-y-5">
                {step === 0 && (
                  <>
                    <Field label="I am a" required>
                      <select
                        className={selectCls}
                        value={roleChosen ? role : ""}
                        onChange={(e) =>
                          handleRoleChange(e.target.value as Role)
                        }
                        disabled={isRoleLocked}
                      >
                        <option value="" disabled>
                          — Select your role —
                        </option>
                        <option value="USER">🎓 Student</option>
                        <option value="DONOR">💼 Donor / Supporter</option>
                        <option value="FACULTY">🏫 Faculty / Professor</option>
                        <option value="ALUMNI">🎓 Alumni</option>
                      </select>
                    </Field>
                    <Field label="Full Name" required>
                      <input
                        className={inputCls}
                        value={sName}
                        onChange={(e) => setSName(e.target.value)}
                        placeholder="Sanskar Seth"
                      />
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Country Code">
                        <select
                          className={selectCls}
                          value={sCountryCode}
                          onChange={(e) => setSCountryCode(e.target.value)}
                        >
                          <option>+91</option>
                          <option>+1</option>
                          <option>+44</option>
                          <option>+61</option>
                          <option>+971</option>
                        </select>
                      </Field>
                      <div className="col-span-2">
                        <Field label="Phone Number" required>
                          <input
                            className={inputCls}
                            value={sPhone}
                            onChange={(e) => setSPhone(e.target.value)}
                            placeholder="9876543210"
                            maxLength={10}
                          />
                        </Field>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Gender">
                        <select
                          className={selectCls}
                          value={sGender}
                          onChange={(e) => setSGender(e.target.value as Gender)}
                        >
                          <option value="">Select gender</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </Field>
                      <Field label="Date of Birth">
                        <input
                          className={inputCls}
                          type="date"
                          value={sDob}
                          onChange={(e) => setSDob(e.target.value)}
                          max={new Date().toISOString().slice(0, 10)}
                        />
                      </Field>
                    </div>
                  </>
                )}
                {step === 1 && (
                  <>
                    <Field label={role === "FACULTY" ? "Institution / University" : role === "ALUMNI" ? "Alma Mater" : "College / University Name"} required>
                      <input
                        className={inputCls}
                        value={sCollege}
                        onChange={(e) => setSCollege(e.target.value)}
                        placeholder={role === "FACULTY" ? "e.g. Stanford University" : "e.g. IIT Madras"}
                      />
                    </Field>
                    {role === "USER" && (
                      <Field label="Year of Study" required>
                        <select
                          className={selectCls}
                          value={sYear}
                          onChange={(e) =>
                            setSYear(e.target.value as YearOfStudy)
                          }
                        >
                          <option value="">Select year</option>
                          <option value="FIRST">1st Year</option>
                          <option value="SECOND">2nd Year</option>
                          <option value="THIRD">3rd Year</option>
                          <option value="FINAL">Final Year</option>
                        </select>
                      </Field>
                    )}
                    {role === "ALUMNI" && (
                      <Field label="Year of Graduation" required>
                        <input
                          className={inputCls}
                          type="number"
                          value={sYearOfGraduation}
                          onChange={(e) => setSYearOfGraduation(e.target.value)}
                          placeholder="e.g. 2024"
                        />
                      </Field>
                    )}
                    <Field label="Skills / Interests">
                      <SkillsInput skills={sSkills} onChange={setSSkills} />
                    </Field>
                    <Field label="Project / Idea Title">
                      <input
                        className={inputCls}
                        value={sProjectTitle}
                        onChange={(e) => setSProjectTitle(e.target.value)}
                        placeholder="AI-powered study assistant"
                      />
                    </Field>
                    <Field label="Funding Requirement (₹)">
                      <input
                        className={inputCls}
                        type="number"
                        min="0"
                        value={sFunding}
                        onChange={(e) => setSFunding(e.target.value)}
                        placeholder="50000"
                      />
                    </Field>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Field label="Instagram">
                      <input
                        className={inputCls}
                        value={sInstagram}
                        onChange={(e) => setSInstagram(e.target.value)}
                        placeholder="https://instagram.com/yourhandle"
                      />
                    </Field>
                    <Field label="Facebook">
                      <input
                        className={inputCls}
                        value={sFacebook}
                        onChange={(e) => setSFacebook(e.target.value)}
                        placeholder="https://facebook.com/yourprofile"
                      />
                    </Field>
                    <Field label="X (Twitter)">
                      <input
                        className={inputCls}
                        value={sTwitter}
                        onChange={(e) => setSTwitter(e.target.value)}
                        placeholder="https://x.com/yourhandle"
                      />
                    </Field>
                    <Field label="Reddit">
                      <input
                        className={inputCls}
                        value={sReddit}
                        onChange={(e) => setSReddit(e.target.value)}
                        placeholder="https://reddit.com/u/yourhandle"
                      />
                    </Field>
                    <Field label="Bio">
                      <textarea
                        className={inputCls}
                        rows={4}
                        value={sBio}
                        onChange={(e) => setSBio(e.target.value)}
                        placeholder="Tell the world about yourself in a few sentences..."
                        maxLength={500}
                      />
                      <p className="text-right text-xs text-[#003366]/50 font-medium">
                        {sBio.length}/500
                      </p>
                    </Field>
                  </>
                )}
                {step === 3 && (
                  <>
                    <Field label="Current Address">
                      <textarea
                        className={inputCls}
                        rows={3}
                        value={sAddress}
                        onChange={(e) => setSAddress(e.target.value)}
                        placeholder="123 Main St, City, State, PIN"
                      />
                    </Field>
                    <Field label="Portfolio URL">
                      <input
                        className={inputCls}
                        value={sPortfolio}
                        onChange={(e) => setSPortfolio(e.target.value)}
                        placeholder="https://yourportfolio.com"
                      />
                    </Field>
                    <Field label="GitHub">
                      <input
                        className={inputCls}
                        value={sGithub}
                        onChange={(e) => setSGithub(e.target.value)}
                        placeholder="https://github.com/yourusername"
                      />
                    </Field>
                    <Field label="LinkedIn">
                      <input
                        className={inputCls}
                        value={sLinkedin}
                        onChange={(e) => setSLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </Field>
                  </>
                )}
              </div>
            )}

            {/* ── DONOR STEPS ── */}
            {role === "DONOR" && (
              <div className="space-y-5">
                {step === 0 && (
                  <>
                    <Field label="I am a" required>
                      <select
                        className={selectCls}
                        value={roleChosen ? role : ""}
                        onChange={(e) =>
                          handleRoleChange(e.target.value as Role)
                        }
                        disabled={isRoleLocked}
                      >
                        <option value="" disabled>
                          — Select your role —
                        </option>
                        <option value="USER">🎓 Student</option>
                        <option value="DONOR">💼 Donor / Supporter</option>
                        <option value="FACULTY">🏫 Faculty / Professor</option>
                        <option value="ALUMNI">🎓 Alumni</option>
                      </select>
                    </Field>
                    <Field label="Full Name" required>
                      <input
                        className={inputCls}
                        value={dName}
                        onChange={(e) => setDName(e.target.value)}
                        placeholder="Sanskar Seth"
                      />
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Country Code">
                        <select
                          className={selectCls}
                          value={dCountryCode}
                          onChange={(e) => setDCountryCode(e.target.value)}
                        >
                          <option>+91</option>
                          <option>+1</option>
                          <option>+44</option>
                          <option>+61</option>
                          <option>+971</option>
                        </select>
                      </Field>
                      <div className="col-span-2">
                        <Field label="Phone Number" required>
                          <input
                            className={inputCls}
                            value={dPhone}
                            onChange={(e) => setDPhone(e.target.value)}
                            placeholder="9876543210"
                            maxLength={10}
                          />
                        </Field>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Gender">
                        <select
                          className={selectCls}
                          value={dGender}
                          onChange={(e) => setDGender(e.target.value as Gender)}
                        >
                          <option value="">Select gender</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </Field>
                      <Field label="Date of Birth">
                        <input
                          className={inputCls}
                          type="date"
                          value={dDob}
                          onChange={(e) => setDDob(e.target.value)}
                          max={new Date().toISOString().slice(0, 10)}
                        />
                      </Field>
                    </div>
                  </>
                )}
                {step === 1 && (
                  <>
                    <div
                      className="p-4 bg-amber-50"
                      style={{ border: "2px dashed #FF7F00" }}
                    >
                      <p className="text-xs font-bold text-amber-800">
                        💡 PAN is required for tax-deductible donation receipts
                        (80G). Your data is encrypted and secure.
                      </p>
                    </div>
                    <Field label="PAN Number" required>
                      <input
                        className={inputCls}
                        value={dPan}
                        onChange={(e) => setDPan(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                      />
                      <p className="text-xs text-[#003366]/50 font-medium mt-1">
                        10-character alphanumeric (e.g. ABCDE1234F)
                      </p>
                    </Field>
                    <Field label="Alumni of (Institution / University)">
                      <input
                        className={inputCls}
                        value={dInstitution}
                        onChange={(e) => setDInstitution(e.target.value)}
                        placeholder="e.g. IIT Bombay, Delhi University"
                      />
                    </Field>
                    <Field label="Year of Graduation">
                      <select
                        className={selectCls}
                        value={dGradYear}
                        onChange={(e) => setDGradYear(e.target.value)}
                      >
                        <option value="">Select year</option>
                        {Array.from({ length: 45 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </Field>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Field label="Education">
                      <input
                        className={inputCls}
                        value={dEducation}
                        onChange={(e) => setDEducation(e.target.value)}
                        placeholder="Graduate / Post-Graduate / PhD"
                      />
                    </Field>
                    <Field label="Occupation" required>
                      <select
                        className={selectCls}
                        value={dOccupation}
                        onChange={(e) =>
                          setDOccupation(e.target.value as Occupation)
                        }
                      >
                        <option value="">Select occupation</option>
                        <option value="SALARIED">Salaried</option>
                        <option value="BUSINESS">Business</option>
                        <option value="PROFESSIONAL">Professional</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </Field>
                    <Field label="Areas of Expertise">
                      <SkillsInput
                        skills={dExpertiseSkills}
                        onChange={setDExpertiseSkills}
                      />
                    </Field>

                    <div className="flex items-center gap-3">
                      <input
                        id="openToConnect"
                        type="checkbox"
                        checked={dOpenToConnect}
                        onChange={(e) => setDOpenToConnect(e.target.checked)}
                        className="w-4 h-4 accent-[#003366]"
                      />
                      <label
                        htmlFor="openToConnect"
                        className="text-sm font-bold text-[#003366] cursor-pointer"
                      >
                        I am open to connecting with student innovators
                      </label>
                    </div>
                    <Field label="Residential Address">
                      <textarea
                        className={inputCls}
                        rows={3}
                        value={dAddress}
                        onChange={(e) => setDAddress(e.target.value)}
                        placeholder="123 Main Street, City, State, PIN"
                      />
                    </Field>
                  </>
                )}
                {step === 3 && (
                  <>
                    <Field label="Instagram">
                      <input
                        className={inputCls}
                        value={dInstagram}
                        onChange={(e) => setDInstagram(e.target.value)}
                        placeholder="https://instagram.com/yourhandle"
                      />
                    </Field>
                    <Field label="Facebook">
                      <input
                        className={inputCls}
                        value={dFacebook}
                        onChange={(e) => setDFacebook(e.target.value)}
                        placeholder="https://facebook.com/yourprofile"
                      />
                    </Field>
                    <Field label="X (Twitter)">
                      <input
                        className={inputCls}
                        value={dTwitter}
                        onChange={(e) => setDTwitter(e.target.value)}
                        placeholder="https://x.com/yourhandle"
                      />
                    </Field>
                    <Field label="Reddit">
                      <input
                        className={inputCls}
                        value={dReddit}
                        onChange={(e) => setDReddit(e.target.value)}
                        placeholder="https://reddit.com/u/yourhandle"
                      />
                    </Field>
                    <Field label="Bio">
                      <textarea
                        className={inputCls}
                        rows={4}
                        value={dBio}
                        onChange={(e) => setDBio(e.target.value)}
                        placeholder="A short description about yourself..."
                        maxLength={500}
                      />
                      <p className="text-right text-xs text-[#003366]/50 font-medium">
                        {dBio.length}/500
                      </p>
                    </Field>
                    <Field label="Preferred Donation Categories">
                      <CategoryPicker
                        selected={dCategories}
                        onChange={setDCategories}
                      />
                    </Field>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        id="anon"
                        type="checkbox"
                        checked={dAnonymous}
                        onChange={(e) => setDAnonymous(e.target.checked)}
                        className="w-4 h-4 accent-[#003366]"
                      />
                      <label
                        htmlFor="anon"
                        className="text-sm font-bold text-[#003366] cursor-pointer"
                      >
                        Prefer anonymous donations (name hidden from campaign
                        pages)
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-8 flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => {
                    setStep((s) => s - 1);
                    setError("");
                  }}
                  className="px-5 py-3 font-black text-sm uppercase tracking-wide text-[#003366] bg-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
                  style={{
                    border: "3px solid #003366",
                    boxShadow: "3px 3px 0 #003366",
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={saving}
                className="flex-1 py-3 font-black text-white uppercase tracking-widest text-sm transition-all disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, #0B9C2C 0%, #16a34a 100%)",
                  border: "3px solid #003366",
                  boxShadow: saving ? "none" : "5px 5px 0 #003366",
                }}
              >
                {saving
                  ? "⏳ Saving..."
                  : isLast
                    ? "🎉 Complete Setup"
                    : "Save & Continue →"}
              </button>
              {/* Skip is hidden on step 0 — role selection is mandatory */}
              {step > 0 && (
                <button
                  onClick={handleSkip}
                  className="px-5 py-3 font-black text-sm uppercase tracking-wide text-[#003366]/50 bg-white"
                  style={{ border: "3px solid #003366", opacity: 0.6 }}
                >
                  Skip
                </button>
              )}
            </div>

            {/* Tricolor footer */}
            <div className="mt-6 flex h-1">
              <div className="flex-1 bg-[#FF7F00]" />
              <div className="flex-1 bg-[#003366]" />
              <div className="flex-1 bg-[#0B9C2C]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
