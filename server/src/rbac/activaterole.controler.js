const prisma = require("../config/prisma");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const mentorService = require("../api/mentor/mentor.service");
const {
  validateMentorApplication,
} = require("../api/mentor/mentor.validation");

// ─────────────────────────────────────────────────────────────────
// POST /api/users/activate-role
// ─────────────────────────────────────────────────────────────────

// ── Normalize institution string (Gap 4 backend logic) ──
function normalizeInstitution(raw) {
  return (raw ?? "")
    .toLowerCase()
    .replace(/[-.\"]/g, "")
    .trim();
}

// ── Eligibility check — pure function, easy to unit test ──
function checkAlumniEligibility(donor) {
  const currentYear = new Date().getFullYear();

  const normalizedInstitution = normalizeInstitution(donor.institution);
  const hasInstitution = normalizedInstitution.length > 0;

  const hasGraduated =
    typeof donor.graduationYear === "number" &&
    Number.isInteger(donor.graduationYear) &&
    donor.graduationYear < currentYear;

  return {
    isEligible: hasInstitution && hasGraduated,
    reasons: {
      hasInstitution,
      hasGraduated,
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// CONTROLLER
// ─────────────────────────────────────────────────────────────────
exports.activateRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  const { id } = req.user;
  // ── Validate requested role ──
  // ALUMNI  → self-activatable (instant upgrade, eligibility check required)
  // MENTOR  → application-gated (creates MentorApplication, requires admin approval)
  const ACTIVATABLE_ROLES = ["ALUMNI", "MENTOR"];

  if (!role || !ACTIVATABLE_ROLES.includes(role)) {
    return next(
      new AppError(
        `Invalid role. Supported roles for activation: ${ACTIVATABLE_ROLES.join(", ")}`,
        400,
      ),
    );
  }

  // ════════════════════════════════════════════════════════════════
  // PATH 1: ALUMNI (self-activation — instant upgrade)
  // ════════════════════════════════════════════════════════════════
  if (role === "ALUMNI") {
    console.log(req.user);
    // Only DONOR can activate ALUMNI ──
    if (!req.user.roles?.includes("DONOR") && req.user.role !== "DONOR") {
      return next(
        new AppError(
          "Only donors can activate the Alumni role. Please ensure you are logged in as a donor.",
          403,
        ),
      );
    }

    const donor = await prisma.donor.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        institution: true,
        graduationYear: true,
        openToConnect: true,
      },
    });
    console.log(donor);
    if (!donor) {
      return next(new AppError("Donor profile not found.", 404));
    }

    // Already ALUMNI? ── Check the User model's roles array
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { roles: true },
    });
    if (existingUser?.roles?.includes("ALUMNI")) {
      return res.status(200).json({
        status: "success",
        message: "Your Alumni role is already active.",
        data: { roles: existingUser.roles },
      });
    }

    // Run eligibility check ──
    const { isEligible, reasons } = checkAlumniEligibility(donor);

    if (!isEligible) {
      const missing = [];
      if (!reasons.hasInstitution) missing.push("institution name");
      if (!reasons.hasGraduated)
        missing.push("a valid graduation year (must be a past year)");

      return next(
        new AppError(
          `You are not eligible for Alumni status. Please complete your profile with: ${missing.join(" and ")}.`,
          422,
        ),
      );
    }

    // Upgrade: add ALUMNI to user.roles + mark donor verified ──
    const [updatedUser, updatedDonor] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { roles: { push: "ALUMNI" } },
        select: { id: true, roles: true },
      }),
      prisma.donor.update({
        where: { id },
        data: {
          verified: true,
          openToConnect: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          institution: true,
          graduationYear: true,
        },
      }),
    ]);

    return res.status(200).json({
      status: "success",
      message:
        "Alumni role activated successfully! Welcome to the Alumni network.",
      data: {
        roles: updatedUser.roles,
        profile: updatedDonor,
        redirectTo: "/donor/dashboard",
      },
    });
  }

  // ════════════════════════════════════════════════════════════════
  // PATH 2: MENTOR (application-gated — creates MentorApplication)
  // ════════════════════════════════════════════════════════════════
  if (role === "MENTOR") {
    // Any authenticated user can apply to be a mentor ──
    // (USER, DONOR, ALUMNI, STUDENT_PRESIDENT — all eligible to apply)
    // Existing MENTORs and ADMINs are excluded as they don't need to apply.
    if (req.user.role === "MENTOR") {
      return res.status(200).json({
        status: "success",
        message: "You already have an active Mentor role.",
        data: { role: "MENTOR" },
      });
    }

    if (req.user.role === "ADMIN") {
      return next(
        new AppError("Admins cannot apply for the Mentor role.", 403),
      );
    }

    // Check if a pending/reviewed/approved application already exists for this email ──
    const existingApplication = await prisma.mentorApplication.findFirst({
      where: { email: req.user.email },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    if (existingApplication) {
      // Approved → tell them to contact admin to activate the role
      if (existingApplication.status === "APPROVED") {
        return res.status(200).json({
          status: "success",
          message:
            "Your mentor application has been approved! Please contact the admin to complete your role activation.",
          data: {
            applicationId: existingApplication.id,
            applicationStatus: existingApplication.status,
          },
        });
      }

      // Rejected → allow re-application (fall through to create a new one)
      // Any other status (PENDING, REVIEWED) → block duplicate submission
      if (existingApplication.status !== "REJECTED") {
        return res.status(200).json({
          status: "success",
          message: `Your mentor application is currently under review (status: ${existingApplication.status}). We will notify you once a decision is made.`,
          data: {
            applicationId: existingApplication.id,
            applicationStatus: existingApplication.status,
            submittedAt: existingApplication.createdAt,
          },
        });
      }
    }

    // Validate the full mentor application form submitted in req.body ──
    // The frontend must send the complete MentorshipLeadForm payload alongside { role: "MENTOR" }
    // We strip the `role` field so it doesn't conflict with mentor validation schema's `role` field
    // (which refers to the applicant's professional title, e.g. "Software Engineer")
    // const { role: _stripped, ...mentorFormData } = req.body;
    const { role, application } = req.body;

    const applicationPayload = {
      ...application,
      name: application?.name || req.user.name,
      email: req.user.email,
    };

    // Run the same Zod validation used by the public POST /api/mentor endpoint ──
    const { error, value } = validateMentorApplication(applicationPayload);

    if (error) {
      return next(
        new AppError(
          error.message ||
            error.details?.[0]?.message ||
            "Mentor application validation failed",
          400,
        ),
      );
    }

    // Create the MentorApplication record via the shared mentor service ──
    const mentorApplication =
      await mentorService.createMentorApplication(value);

    return res.status(201).json({
      status: "success",
      message:
        "Your mentor application has been submitted successfully! Our team will review it and get back to you within 5-7 business days.",
      data: {
        applicationId: mentorApplication.id,
        applicationStatus: mentorApplication.status, // "PENDING"
        email: mentorApplication.email,
        submittedAt: mentorApplication.createdAt,
        // Role is NOT upgraded yet — stays as req.user.role until admin approves
        currentRole: req.user.role,
        redirectTo: "/mentor/application-submitted",
      },
    });
  }
});
