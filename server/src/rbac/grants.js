const GRANTS = {
  // ─────────────────────────────────────────────
  // USER
  // Basic student permissions
  // ─────────────────────────────────────────────
  USER: [
    "viewCampaigns", // browse all active campaigns
    "viewDonorProjects", // browse donor-created projects
    "applyToDonorProject", // submit application to a donor project
    "createCampaign", // create a fundraising campaign
    "manageCampaign", // edit/update own campaign
    "submitMilestone", // submit milestone proof
    "viewProfile", // view own profile
    "editProfile", // update own profile fields
    "postComment", // comment on campaigns
    "joinClub", // send join request to a club
  ],

  // ─────────────────────────────────────────────
  // DONOR
  // Everything USER can do + donor-specific actions
  // ─────────────────────────────────────────────
  DONOR: [
    "donateToCampaign", // make a donation to a campaign
    "createDonorProject", // post a donor-funded opportunity
    "manageDonorProject", // edit/close own donor project
    "viewDonationHistory", // see own donation records
    "wishlistCampaign", // save campaigns to wishlist
    "viewDonorDashboard", // access donor dashboard
    "manageBankAccount", // add/update bank account details
  ],

  // ─────────────────────────────────────────────
  // ALUMNI
  // Explicitly defined alumni-only grants.
  // Inherits all DONOR grants via inheritance.js
  // ─────────────────────────────────────────────
  ALUMNI: [
    "endorseCampaign", // endorse/vouch for a student campaign
    "bypassOpportunityGate", // access exclusive alumni opportunities without extra checks
    "viewAlumniDashboard", // access extended alumni dashboard widgets
    "viewAlumniDirectory", // browse other alumni profiles
  ],

  // ─────────────────────────────────────────────
  // MENTOR
  // Standalone role — no inheritance chain.
  // Only has what is explicitly listed here.
  // ─────────────────────────────────────────────
  MENTOR: [
    "manageMentorship", // create/manage mentorship sessions
    "viewMenteeProfiles", // view profiles of assigned mentees
    "acceptMenteeRequest", // accept or decline mentee requests
    "scheduleMentorSession", // schedule 1:1 or group sessions
    "viewMentorDashboard", // access mentorship sidebar + dashboard
    "postMentorUpdate", // post updates/resources for mentees
  ],

  // ─────────────────────────────────────────────
  // STUDENT_PRESIDENT
  // Inherits USER grants + club management rights
  // ─────────────────────────────────────────────
  STUDENT_PRESIDENT: [
    "manageClub", // edit club details, manage members
    "approveJoinRequest", // approve/reject club join requests
    "createClubCampaign", // launch a campaign under a club
    "viewClubDashboard", // access club president dashboard
    "removeClubMember", // remove a member from the club
  ],

  // ─────────────────────────────────────────────
  // ADMIN
  // Standalone — full platform control
  // ─────────────────────────────────────────────
  ADMIN: [
    "manageUsers", // view, block, suspend any user
    "manageAllCampaigns", // approve/reject/freeze any campaign
    "manageAllDonorProjects", // approve/reject donor projects
    "manageMilestones", // review and approve milestone submissions
    "manageMentorApplications", // approve/reject mentor applications
    "manageAlumniStatus", // grant/revoke alumni role
    "viewAuditLogs", // access full audit trail
    "writeAdminNotes", // add internal notes on any entity
    "manageClubs", // oversee all clubs
    "manageWithdrawals", // approve fund withdrawal requests
    "manageBankVerification", // verify/reject bank accounts
    "viewAdminDashboard", // access admin control panel
  ],
};

module.exports = { GRANTS };
