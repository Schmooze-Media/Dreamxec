// src/types/index.ts

export type AccountStatus = "ACTIVE" | "BLOCKED" | "SUSPENDED" | "UNDER_REVIEW";

export type ProjectStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "PAUSED"
  | "FROZEN"
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "paused"
  | "frozen";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/* =========================================================
   Club Types
========================================================= */

export interface Club {
  id: string;
  name: string;
  college: string;
  slug: string;
  verified: boolean;
}

/* =========================================================
   User & Roles
========================================================= */

export type UserRole =
  | "student"
  | "admin"
  | "donor"
  | "DONOR"
  | "STUDENT_PRESIDENT";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;

  accountStatus: AccountStatus;
  profileComplete: boolean;
  emailVerified: boolean;
  studentVerified: boolean;

  isClubPresident: boolean;
  isClubMember: boolean;
  clubVerified: boolean;

  clubIds: string[];

  profilePicture?: string;

  createdAt: string;
  updatedAt: string;
}

/* =========================================================
   Campaign Types (User Projects)
/* =========================================================
   Campaign Sub-Types
========================================================= */

export interface TeamMember {
  name: string;
  role: string;
  image?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

/* =========================================================
   Milestones
========================================================= */

export interface MilestoneSubmission {
  id: string;
  milestoneId: string;
  projectId: string;
  proofUrl?: string;
  mediaUrl?: string;
  notes?: string;
  version: number;
  reviewedAt?: string;
  adminFeedback?: string;
  createdAt: string;
}

export type MilestoneStatus = "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  durationDays: number;
  budget: number;
  order: number;
  status: MilestoneStatus;
  activatedAt?: string;
  dueDate?: string;
  approvedAt?: string;
  reminder3Sent?: boolean;
  reminder1Sent?: boolean;
  overdueSent?: boolean;
  ratingPenaltyDays?: number;
  submissions?: MilestoneSubmission[];
}

/* =========================================================
   Campaign Types (User Projects)
========================================================= */

export interface Campaign {
  id: string;
  title: string;
  clubId: string | null;
  club?: {
    id: string;
    name: string;
    college: string;
    slug: string;
  } | null;
  description: string;
  goalAmount: number;
  currentAmount: number;
  status: "approved" | "pending" | "rejected";
  createdAt: Date | string;
  rejectionReason?: string;
  reapprovalCount?: number;
  campaignType?: "INDIVIDUAL" | "TEAM";
  teamMembers?: TeamMember[];
  faqs?: FAQ[];
  rating?: number;
  youtubeUrl?: string;
  category?: string;
  imageUrl?: string;
  campaignMedia?: string[];
  presentationDeckUrl?: string | null;
  createdBy?: string | { id: string };
  userId?: string;
  slug?: string;
  facultyApproved?: boolean;
  facultyId?: string;
  facultyApprovedAt?: string;
  faculty?: {
    name: string;
  };
  milestones?: Milestone[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  studentVerified: boolean;
  isClubPresident: boolean;
  isClubMember: boolean;
  clubVerified: boolean;
  clubIds: string[];
  createdAt: string;
  updatedAt: string;
  approvedCampaigns?: Campaign[];
}

/* =========================================================
   Donor Project Types
========================================================= */

export interface Project {
  id: string;
  title: string;
  imageUrl?: string;
  description: string;
  organization?: string;
  companyName?: string;
  donor?: {
    id: string;
    name: string;
    email: string;
    organizationName: string;
  };
  createdBy?: string;
  interestedUsers?: Array<{ id: string; name: string; email: string }>;
  skillsRequired: string[];
  timeline: string | { startDate: Date | string; endDate: Date | string } | null;
  totalBudget?: number;
  allocatedFunds?: number;
  status: ProjectStatus;
  rejectionReason?: string;
  createdAt: string | Date;
  updatedAt?: string;
}

export interface ProjectApplication {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  coverLetter: string;
  skills: string[];
  status: "pending" | "accepted" | "rejected";
  rejectionReason?: string;
  appliedAt: Date;
}

/* =========================================================
   Student
========================================================= */

export interface Student {
  id: string;
  name: string;
  email: string;
  university: string;
  avatar?: string;
}

/* =========================================================
   Admin Specific Types
========================================================= */

export interface DashboardStats {
  kpi: {
    totalUsers: number;
    totalDonors: number;
    totalClubs: number;
    totalDonations: number;
    campaigns: {
      APPROVED: number;
      PENDING: number;
      REJECTED: number;
      PAUSED: number;
      FROZEN: number;
      total: number;
    };
    milestones?: {
      PENDING: number;
      SUBMITTED: number;
      APPROVED: number;
      REJECTED: number;
      total: number;
    };
    pendingApprovals: number;
    openTickets: number;
  };
  attention: {
    slaBreaches: number;
    frozenCampaigns: number;
    pendingMilestones: number;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  details?: any;
  createdAt: string;
}
