const Permissions = {
  // Campaign
  CAMPAIGN_VIEW:              "campaign:view",
  CAMPAIGN_CREATE:            "campaign:create",
  CAMPAIGN_OWN_EDIT:          "campaign:own:edit",
  CAMPAIGN_REVIEW:            "campaign:review",
  CAMPAIGN_APPROVE:           "campaign:approve",
  CAMPAIGN_FREEZE:            "campaign:freeze",
  CAMPAIGN_TRANSFER_INITIATE: "campaign:transfer:initiate",
  CAMPAIGN_TRANSFER_APPROVE:  "campaign:transfer:approve",
 
  // Milestone
  MILESTONE_SUBMIT:           "milestone:submit",
  MILESTONE_APPROVE:          "milestone:approve",
  MILESTONE_REJECT:           "milestone:reject",
 
  // Club
  CLUB_JOIN:                  "club:join",
  CLUB_MANAGE:                "club:manage",
  CLUB_MEMBER_MANAGE:         "club:member:manage",
  CLUB_VERIFY:                "club:verify",
 
  // Donor / Financial
  DONATION_MAKE:              "donation:make",
  DONOR_PROJECT_CREATE:       "donorproject:create",
  DONOR_PROJECT_APPS_VIEW:    "donorproject:applications:view",
  DONOR_PROJECT_APPLY:        "donorproject:apply",
  WISHLIST_MANAGE:            "wishlist:manage",
  ANALYTICS_VIEW:             "analytics:view",
 
  // Mentor
  MENTOR_APPLY:               "mentor:apply",
  SESSION_CREATE:             "session:create",
  STUDENT_GUIDE:              "student:guide",
  MENTOR_PROFILE_MANAGE:      "mentor:profile:manage",
 
  // Faculty / Admin
  ACADEMIC_MANAGE:            "academic:manage",
  WELFARE_MANAGE:             "student:welfare:manage",
  FACULTY_MANAGE:             "faculty:manage",
  FACULTY_APPROVE:            "faculty:approve",
  USER_MANAGE:                "user:manage",
  ROLE_ASSIGN:                "role:assign",
  AUDIT_VIEW:                 "audit:view",
 
  ALL:                        "*",
};
 
module.exports = { Permissions };