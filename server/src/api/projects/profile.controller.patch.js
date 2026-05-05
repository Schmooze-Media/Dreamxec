// ─────────────────────────────────────────────────────────────────
// PATCH for profile.controller.js → getMyProfile()
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// FULL updated getMyProfile for reference:
// ─────────────────────────────────────────────────────────────────

exports.getMyProfile = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  const isDonor = req.user.role === "DONOR" || req.user.role === "ALUMNI";

  let profile;

  if (isDonor) {
    profile = await prisma.donor.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        organizationName: true,
        verified: true,
        emailVerified: true,
        accountStatus: true,
        profilePicture: true,
        phone: true,
        countryCode: true,
        gender: true,
        dateOfBirth: true,
        panNumber: true,
        education: true,
        occupation: true,
        address: true,
        instagram: true,
        facebook: true,
        twitterX: true,
        reddit: true,
        bio: true,
        donationCategories: true,
        anonymousDonation: true,
        profileComplete: true,
        suppressUpgradeCard: true, // ← NEW: frontend reads this to show/hide upgrade card
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!profile) return next(new AppError("Donor profile not found", 404));

    const completionPct = calcDonorCompletion(profile);

    // Compute eligibility flags for the frontend ──
    const { isAlumniEligible, isMentorEligible } = computeEligibility(profile);

    return res.status(200).json({
      status: "success",
      data: {
        profile,
        completionPct,
        role: "DONOR",
        upgradeCard: {
          // Frontend shows the card only when:
          //  1. User hasn't dismissed it (suppressUpgradeCard = false)
          //  2. At least one upgrade path is available
          suppressed: profile.suppressUpgradeCard,
          isAlumniEligible,
          isMentorEligible,
        },
      },
    });
  }

  // Default: User (student / president / mentor / admin)
  profile = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      studentVerified: true,
      accountStatus: true,
      profilePicture: true,
      phone: true,
      countryCode: true,
      gender: true,
      dateOfBirth: true,
      college: true,
      yearOfStudy: true,
      address: true,
      instagram: true,
      facebook: true,
      twitterX: true,
      reddit: true,
      bio: true,
      skills: true,
      projectTitle: true,
      fundingRequired: true,
      portfolioUrl: true,
      githubUrl: true,
      linkedinUrl: true,
      profileComplete: true,
      suppressUpgradeCard: true, // ← NEW
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!profile) return next(new AppError("User profile not found", 404));

  const completionPct = calcStudentCompletion(profile);
  return res.status(200).json({
    status: "success",
    data: {
      profile,
      completionPct,
      role: profile.role,
      upgradeCard: {
        suppressed: profile.suppressUpgradeCard,
        // Students/presidents don't have alumni eligibility —
        // upgradeCard for them would point to Mentor application path
        isMentorEligible: true, // any USER/STUDENT_PRESIDENT can apply
      },
    },
  });
});
