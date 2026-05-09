import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Roles } from "./rbac/roles";
import FloatingDoodles from "./components/FloatingDoodles";
import { Header } from "./sections/Header";
import { Main } from "./components/Main";
import BrowseCampaigns from "./components/BrowseCampaigns";
import StudentDashboard from "./components/StudentDashboard";
import CreateCampaign from "./components/CreateCampaign";
import EditCampaign from "./components/EditCampaign";
import CreateCampaignDemo from "./components/CreateCampaignDemo";
import AdminDashboard from "./components/admin/AdminDashboard";
import AuthPage from "./components/AuthPage";
import UserProfile from "./components/UserProfile";
import DonorDashboard from "./components/DonorDashboard";
import CreateProject from "./components/CreateProject";
import DonorProjects from "./components/DonorProjects";
import BrowseProjects from "./components/BrowseProjects";
import EmailVerification from "./components/EmailVerification";
import CheckEmail from "./components/CheckEmail";
import CampaignDetails from "./components/CampaignDetails";
import type { Campaign, User, Project } from "./types";
import ReferClub from "./components/ReferClub";
import PresidentDashboard from "./components/president/PresidentDashboard";
import PresidentMembers from "./components/president/PresidentMembers";
import PresidentCampaigns from "./components/president/PresidentCampaigns";
import UploadMembers from "./components/president/UploadMembers";
import AddMemberManually from "./components/president/AddMemberManually";
import PresidentLayout from "./components/president/PresidentLayout";
import AdminClubReferrals from "./components/admin/AdminClubReferrals";
import AdminClubVerifications from "./components/admin/AdminClubVerifications";
import ClubDiscovery from "./components/ClubDiscovery";
import ClubDetails from "./components/ClubDetails";
import AuthCallback from "./components/AuthCallback";
import ProfileSetup from "./components/ProfileSetup";
import { trackPageView } from "./lib/analytics";
import {
  getDonorApplications,
  updateApplicationStatus,
} from "./services/applicationService";

// Import API services
import {
  login,
  register,
  logout as apiLogout,
  getCurrentUser,
  initiateGoogleAuth,
  handleGoogleCallback,
  initiateLinkedInAuth,
  handleLinkedInCallback,
  forgotPassword,
} from "./services/authService";
import {
  getPublicUserProjects,
  createUserProject,
  updateUserProject,
} from "./services/userProjectService";
import {
  getPublicDonorProjects,
  createDonorProject,
  getMyDonorProjects,
} from "./services/donorProjectService";
import {
  getAllProjects,
  verifyUserProject,
  verifyDonorProject,
} from "./services/adminService";
import {
  applyToProject,
  getMyApplications,
} from "./services/applicationService";
import {
  mapBackendRole,
  mapFrontendRole,
  mapUserProjectToCampaign,
  mapDonorProjectToProject,
} from "./services/mappers";
import StartAProject from "./sections/Pages/innovators/StartAProject";
import HowItWorksStudents from "./sections/Pages/innovators/HowItWorks";
import ProjectEligibility from "./sections/Pages/innovators/ProjectEligibility";
import ResourceCenter from "./sections/Pages/innovators/Resources";
import SuccessStories from "./sections/Pages/innovators/SuccessStories";
import FundInnovation from "./sections/Pages/supporters/FundInnovation";
import HowItWorksDonors from "./sections/Pages/supporters/HowItWorksD";
import WhyDonate from "./sections/Pages/supporters/WhyDonate";
import CorporateCSRPartnerships from "./sections/Pages/supporters/Corporate";
import AlumniGivingPrograms from "./sections/Pages/supporters/AlumniGiving";
import BecomeMentor from "./sections/Pages/supporters/BecomeMentor";
import PerfectStorm from "./sections/Pages/company/PerfectStorm";
import Careers from "./sections/Pages/company/Careers";
import ContactUs from "./sections/Pages/company/ContactUs";
import FAQ from "./sections/Pages/company/FAQ";
import PressMedia from "./sections/Pages/company/PressMedia";
import AboutUs from "./components/AboutUs";
import TermsAndConditions from "./sections/Pages/legal/TermsAndConditions";
import VerifyPresident from "./components/VerifyPresident";
import { LoaderProvider, useLoader } from "./context/LoaderContext";
import { AuthProvider } from "./context/AuthContext";
import LoadingAnimation from "./components/LoadingAnimation";
// Add these imports with the others
import AdminUsers from "./components/admin/AdminUser";
import AdminClubs from "./components/admin/AdminClubs";
import AdminFinancials from "./components/admin/AdminFinancials";
import AdminMilestones from "./components/admin/AdminMilestone";
import AdminStudentVerifications from "./components/admin/AdminStudentVerification";
import AdminAuditLogs from "./components/admin/AdminAuditLogs";
import AdminDonors from "./components/admin/AdminDonors";
import AdminApplications from "./components/admin/AdminApplications";
import apiRequest, { getToken } from "./services/api";
import AdminCampaigns from "./components/admin/AdminCampaigns";

type UserProjectsResponse = {
  userProjects: any;
  status: string;
  data: {
    userProjects: any;
    projects: Campaign[];
  };
};

// ─── Role helpers ──────────────────────────────────────────────────────────────

const getPrimaryRole = (user: User | null): string | null => {
  if (!user) return null;
  if (Array.isArray((user as any).roles)) return (user as any).roles[0] ?? null;
  return (user as any).role ?? null;
};

const hasRole = (user: User | null, role: string): boolean => {
  if (!user) return false;
  if (Array.isArray((user as any).roles))
    return (user as any).roles.includes(role);
  return (user as any).role === role;
};

// ─── Reusable restricted-access UI ────────────────────────────────────────────

const AccessRestricted = ({
  message,
  showLogin,
  onLogin,
}: {
  message: string;
  showLogin?: boolean;
  onLogin?: () => void;
}) => (
  <div className="min-h-screen flex items-center justify-center bg-dreamxec-cream">
    <div className="card-pastel-offwhite rounded-xl border-5 border-dreamxec-navy shadow-pastel-card p-12 text-center max-w-md">
      <div className="card-tricolor-tag"></div>
      <div className="text-dreamxec-navy text-xl font-sans mt-4">
        <p>{message}</p>
        {showLogin && onLogin && (
          <button
            onClick={onLogin}
            className="mt-8 px-8 py-3 bg-dreamxec-orange text-white font-bold rounded-xl hover:bg-dreamxec-saffron transition-colors shadow-lg"
          >
            Log in
          </button>
        )}
      </div>
    </div>
  </div>
);

const SimpleRestricted = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-dreamxec-cream">
    <p className="text-dreamxec-navy text-xl font-bold">{message}</p>
  </div>
);

// ─── Main App Content Component ────────────────────────────────────────────────

function AppContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [_isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [userApplications, setUserApplications] = useState<string[]>([]);
  const [_showCheckEmail, setShowCheckEmail] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const { showLoader, hideLoader } = useLoader();
  const navigate = useNavigate();
  const location = useLocation();

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasLoadedUserRef = useRef(false);

  useEffect(() => {
    const initialize = async () => {
      setTimeout(() => {
        setIsInitialLoading(false);
      }, 2500);
    };
    initialize();
  }, []);

  // NOTE: OAuth callback handling (/auth/callback?token=...) is delegated
  // entirely to the AuthCallback component. No duplicate useEffect needed here.

  // Load user from token on mount
  useEffect(() => {
    if (hasLoadedUserRef.current) return;
    hasLoadedUserRef.current = true;

    const loadUser = async () => {
      if (!getToken()) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        if (response.data?.user) {
          const userData: User = {
            id: response.data.user.id,
            email: response.data.user.email,
            roles: response.data.user.roles || ["USER"],
            emailVerified: response.data.user.emailVerified || false,
            clubIds: response.data.user?.clubIds || [],
            createdAt: response.data.user.createdAt || new Date().toISOString(),
            updatedAt: response.data.user.updatedAt || new Date().toISOString(),
            isClubPresident: response.data.user?.isClubPresident || false,
            isClubMember: response.data.user?.isClubMember || false,
            clubVerified: response.data.user?.clubVerified || false,
            name: response.data.user.name,
            studentVerified: response.data.user?.studentVerified,
            accountStatus: response.data.user?.accountStatus || "ACTIVE",
            profileComplete: response.data.user?.profileComplete ?? false,
          };
          console.log("✅ User loaded from token:", userData);
          setUser(userData);
        }
      } catch (error: any) {
        if (error?.response?.status === 401) {
          setUser(null);
        } else {
          console.error("Unexpected /auth/me error:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  // Load public campaigns and projects
  useEffect(() => {
    const loadData = async () => {
      try {
        const campaignsResponse = await getPublicUserProjects();
        if (campaignsResponse.data?.userProjects) {
          const mappedCampaigns = campaignsResponse.data.userProjects.map(
            mapUserProjectToCampaign,
          );
          setCampaigns(mappedCampaigns);
        }

        const projectsResponse = await getPublicDonorProjects();
        if (projectsResponse.data?.donorProjects) {
          const mappedProjects = projectsResponse.data.donorProjects.map(
            mapDonorProjectToProject,
          );
          setProjects(mappedProjects);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  // Load ALL projects for admin users
  useEffect(() => {
    const loadAdminData = async () => {
      if (hasRole(user, "admin")) {
        try {
          console.log("📊 Loading all projects for admin...");
          const response = await getAllProjects();
          console.log("📦 Admin projects response:", response);

          if (response.data?.userProjects?.data) {
            setCampaigns(response.data.userProjects.data);
          }

          if (response.data?.donorProjects?.data) {
            setProjects(response.data.donorProjects.data);
          }
        } catch (error) {
          console.error("Failed to load admin data:", error);
        }
      }
    };

    loadAdminData();
  }, [getPrimaryRole(user)]);

  // Load user-specific data for donors only
  useEffect(() => {
    const loadUserData = async () => {
      if (hasRole(user, "donor")) {
        try {
          console.log("💼 Loading donor projects...");
          const response = await getMyDonorProjects();
          if (response.data?.donorProjects) {
            const mappedProjects = response.data.donorProjects.map(
              mapDonorProjectToProject,
            );
            setProjects(mappedProjects);
          }
        } catch (error) {
          console.error("Failed to load donor projects:", error);
        }
      }
    };

    loadUserData();
  }, [getPrimaryRole(user), user?.id]);

  // Load user applications for students
  useEffect(() => {
    const loadUserApplications = async () => {
      if (hasRole(user, "student")) {
        try {
          console.log("📝 Loading user applications for student:", user!.name);
          const response = await getMyApplications();
          if (response.success === true && response.data?.applications) {
            const appliedProjectIds = response.data.applications.map(
              (app: any) => app.donorProjectId,
            );
            setUserApplications(appliedProjectIds);
          } else {
            setUserApplications([]);
          }
        } catch (error) {
          console.error("Failed to load user applications:", error);
          setUserApplications([]);
        }
      } else {
        setUserApplications([]);
      }
    };

    loadUserApplications();
  }, [getPrimaryRole(user), user?.id]);

  // ✅ Campaign filters
  const approvedCampaigns = campaigns.filter(
    (c) => c.status?.toLowerCase() === "approved",
  );

  const pendingCampaigns = campaigns.filter(
    (c) => c.status?.toLowerCase() === "pending",
  );

  useEffect(() => {
    if (!user?.id) return;

    const fetchUserCampaigns = async () => {
      try {
        setLoadingCampaigns(true);

        const res = await apiRequest<UserProjectsResponse>(
          "/user-projects/my",
          { method: "GET" },
        );

        const projects = res?.data?.userProjects;
        console.log(projects);
        if (!Array.isArray(projects)) {
          console.error("Invalid /user-projects response shape:", res?.data);
          setUserCampaigns([]);
          return;
        }

        setUserCampaigns(projects);
      } catch (error) {
        console.error("Failed to fetch user campaigns", error);
        setUserCampaigns([]);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchUserCampaigns();
  }, [user?.id]);

  // ✅ Project filters
  const donorProjects = projects.filter((p) => p.createdBy === user?.id);

  const approvedProjects = projects.filter(
    (p) => p.status?.toLowerCase() === "approved",
  );

  const pendingProjects = projects.filter(
    (p) => p.status?.toLowerCase() === "pending",
  );

  const handleCreateCampaign = async (data: {
    title: string;
    description: string;
    clubId: string;
    goalAmount: number;
    bannerFile: File | null;
    mediaFiles: File[];
    presentationDeckUrl: string;
    campaignType: "INDIVIDUAL" | "TEAM";
    teamMembers?: {
      name: string;
      role: string;
      image?: File | null;
    }[];
    faqs?: {
      question: string;
      answer: string;
    }[];
    youtubeUrl?: string;
    milestones: {
      title: string;
      durationDays: number;
      budget: string | number;
      description?: string;
    }[];
  }) => {
    showLoader();

    try {
      console.log("🚀 Creating Campaign...");

      const formData = new FormData();

      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("clubId", data.clubId);
      formData.append("goalAmount", data.goalAmount.toString());

      if (data.presentationDeckUrl) {
        formData.append("presentationDeckUrl", data.presentationDeckUrl);
      }

      formData.append("campaignType", data.campaignType);

      if (data.youtubeUrl) {
        formData.append("youtubeUrl", data.youtubeUrl);
      }

      if (data.faqs?.length) {
        formData.append("faqs", JSON.stringify(data.faqs));
      }

      const cleanMilestones = data.milestones.map((m) => ({
        title: m.title,
        durationDays: Number(m.durationDays),
        budget: Number(m.budget),
        description: m.description || null,
      }));

      formData.append("milestones", JSON.stringify(cleanMilestones));

      if (data.campaignType === "TEAM" && data.teamMembers?.length) {
        const teamData = data.teamMembers.map((m) => ({
          name: m.name,
          role: m.role,
        }));

        formData.append("teamMembers", JSON.stringify(teamData));

        data.teamMembers.forEach((member) => {
          if (member.image) {
            formData.append("teamImages", member.image);
          }
        });
      }

      if (data.bannerFile) {
        formData.append("bannerFile", data.bannerFile);
      }

      if (data.mediaFiles?.length) {
        data.mediaFiles.forEach((file) => {
          formData.append("mediaFiles", file);
        });
      }

      const response = await createUserProject(formData);

      if (response.data?.userProject) {
        const newCampaign = mapUserProjectToCampaign(response.data.userProject);
        setCampaigns((prev) => [...prev, newCampaign]);
        console.log("✅ Campaign created:", newCampaign);
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      console.error("❌ Campaign creation failed:", error);
      throw error;
    } finally {
      hideLoader();
    }
  };

  const handleApproveCampaign = async (id: string) => {
    showLoader();
    try {
      console.log("✅ Approving campaign:", id);
      await verifyUserProject(id, { status: "APPROVED" });

      setCampaigns(
        campaigns.map((c) =>
          c.id === id ? { ...c, status: "approved" as const } : c,
        ),
      );
      console.log("✅ Campaign approved successfully");
    } catch (error) {
      console.error("Failed to approve campaign:", error);
      alert("Failed to approve campaign. Please try again.");
    } finally {
      hideLoader();
    }
  };

  const handleRejectCampaign = async (id: string, reason: string) => {
    showLoader();
    try {
      console.log("❌ Rejecting campaign:", id, "Reason:", reason);
      await verifyUserProject(id, { status: "REJECTED", reason });

      setCampaigns(
        campaigns.map((c) =>
          c.id === id
            ? { ...c, status: "rejected" as const, rejectionReason: reason }
            : c,
        ),
      );
      console.log("❌ Campaign rejected successfully");
    } catch (error) {
      console.error("Failed to reject campaign:", error);
      alert("Failed to reject campaign. Please try again.");
    } finally {
      hideLoader();
    }
  };

  const handleApproveProject = async (id: string) => {
    showLoader();
    try {
      console.log("✅ Approving donor project:", id);
      await verifyDonorProject(id, { status: "APPROVED" });

      setProjects(
        projects.map((p) =>
          p.id === id ? { ...p, status: "APPROVED" as const } : p,
        ),
      );
      console.log("✅ Donor project approved successfully");
    } catch (error) {
      console.error("Failed to approve donor project:", error);
      alert("Failed to approve donor project. Please try again.");
    } finally {
      hideLoader();
    }
  };

  const handleRejectProject = async (id: string, reason: string) => {
    showLoader();
    try {
      console.log("❌ Rejecting donor project:", id, "Reason:", reason);
      await verifyDonorProject(id, { status: "REJECTED", reason });

      setProjects(
        projects.map((p) =>
          p.id === id
            ? { ...p, status: "REJECTED" as const, rejectionReason: reason }
            : p,
        ),
      );
      console.log("❌ Donor project rejected successfully");
    } catch (error) {
      console.error("Failed to reject donor project:", error);
      alert("Failed to reject donor project. Please try again.");
    } finally {
      hideLoader();
    }
  };

  const handleLogin = async (
    email: string,
    password: string,
    _role: "student" | "donor",
  ) => {
    showLoader();
    setIsSubmitting(true);
    try {
      const response = await login({ email, password });

      if (response.data?.user) {
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          role: mapBackendRole(response.data.user.roles),
          emailVerified: response.data.user?.emailVerified || false,
          clubIds: response.data.user?.clubIds || [],
          createdAt: response.data.user.createdAt || new Date().toISOString(),
          updatedAt: response.data.user.updatedAt || new Date().toISOString(),
          isClubPresident: response.data.user?.isClubPresident || false,
          isClubMember: response.data.user?.isClubMember || false,
          clubVerified: response.data.user?.clubVerified || false,
          name: response.data.user.name,
          studentVerified: response.data.user?.studentVerified,
          accountStatus: response.data.user?.accountStatus || "ACTIVE",
          profileComplete: response.data.user?.profileComplete ?? false,
        };

        setUser(userData);
        console.log("✅ Login successful, user set in context:", userData);

        if (userData.profileComplete === false) {
          navigate("/profile/setup");
          return;
        }

        const primaryRole = getPrimaryRole(userData);
        if (primaryRole === "student") {
          navigate("/dashboard");
        } else if (primaryRole === "donor") {
          navigate("/donor/dashboard");
        } else if (primaryRole === "admin") {
          navigate("/admin");
        } else if (primaryRole === "STUDENT_PRESIDENT") {
          navigate("/president");
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      hideLoader();
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (
    name: string,
    email: string,
    password: string,
    role: "student" | "donor",
    institution?: string,
  ) => {
    showLoader();
    setIsSubmitting(true);
    try {
      const response = await register({
        name,
        email,
        password,
        role: mapFrontendRole(role),
        organizationName: institution,
      });

      if (response.message && response.message.includes("verification email")) {
        setSignupEmail(email);
        setShowCheckEmail(true);
        navigate("/check-email");
      } else if (response.data?.user) {
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          role: mapBackendRole(response.data.user.roles),
          emailVerified: response.data.user.emailVerified || false,
          clubIds: response.data.user?.clubIds || [],
          createdAt: response.data.user.createdAt || new Date().toISOString(),
          updatedAt: response.data.user.updatedAt || new Date().toISOString(),
          isClubPresident: response.data.user?.isClubPresident || false,
          isClubMember: response.data.user?.isClubMember || false,
          clubVerified: response.data.user?.clubVerified || false,
          name: response.data.user.name,
          studentVerified: response.data.user?.studentVerified,
          accountStatus: response.data.user?.accountStatus || "ACTIVE",
          profileComplete: response.data.user?.profileComplete ?? false,
        };

        setUser(userData);

        if (hasRole(userData, "donor") && userData.profileComplete === false) {
          navigate("/profile/setup");
          return;
        }

        const origin = (location.state as any)?.from;
        if (origin) {
          navigate(origin);
          return;
        }

        const primaryRole = getPrimaryRole(userData);
        if (primaryRole === "student") {
          navigate("/dashboard");
        } else if (primaryRole === "donor") {
          navigate("/donor/dashboard");
        } else if (primaryRole === "admin") {
          navigate("/admin");
        }
      }
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    } finally {
      hideLoader();
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async (role: "student" | "donor") => {
    showLoader();
    setIsSubmitting(true);
    try {
      const backendRole = mapFrontendRole(role);
      initiateGoogleAuth(backendRole);
    } catch (error) {
      console.error("Google auth error:", error);
      throw new Error("Google authentication failed");
    } finally {
      hideLoader();
      setIsSubmitting(false);
    }
  };

  const handleLinkedInAuth = async (role: "student" | "donor") => {
    showLoader();
    setIsSubmitting(true);
    try {
      const backendRole = role === "student" ? "USER" : "DONOR";
      initiateLinkedInAuth(backendRole);
    } catch (error) {
      console.error("LinkedIn auth error:", error);
      throw new Error("LinkedIn authentication failed");
    } finally {
      hideLoader();
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await forgotPassword(email);
    } catch (error) {
      console.error("Forgot password error:", error);
      throw new Error("Failed to send password reset email");
    }
  };

  const handleEmailVerificationSuccess = (backendUser: any) => {
    const userData: User = {
      id: backendUser.id,
      email: backendUser.email,
      role: mapBackendRole(backendUser.role),
      emailVerified: backendUser.emailVerified || false,
      clubIds: backendUser?.clubIds || [],
      createdAt: backendUser.createdAt || new Date().toISOString(),
      updatedAt: backendUser.updatedAt || new Date().toISOString(),
      isClubPresident: backendUser?.isClubPresident || false,
      isClubMember: backendUser?.isClubMember || false,
      clubVerified: backendUser?.clubVerified || false,
      name: backendUser.name,
      studentVerified: backendUser?.studentVerified,
      accountStatus: backendUser?.accountStatus || "ACTIVE",
      profileComplete: backendUser?.profileComplete ?? false,
    };
    setUser(userData);
  };

  const handleLoginClick = () => {
    navigate("/auth");
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
    navigate("/");
  };

  const handleDonate = async (campaignId: string, amount: number) => {
    showLoader();
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/donations/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            projectId: campaignId,
            amount,
          }),
        },
      );

      const data = await res.json();

      const options = {
        key: data.key,
        amount: data.amount,
        currency: "INR",
        name: "DreamXec",
        description: "Campaign Donation",
        order_id: data.orderId,
        handler: async (response: any) => {
          await fetch(`${import.meta.env.VITE_API_URL}/donations/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              projectId: campaignId,
            }),
          });
          hideLoader();
          toast.success("🎉 Donation successful!");
        },
        theme: { color: "#0B9C2C" },
      };

      // @ts-ignore
      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
      hideLoader();
      toast.error("❌ Donation failed");
    }
  };

  const handleCreateProject = async (data: {
    title: string;
    companyName: string;
    description: string;
    skillsRequired: string[];
    startDate: Date;
    endDate: Date;
  }) => {
    showLoader();
    try {
      const diffTime = Math.abs(
        data.endDate.getTime() - data.startDate.getTime(),
      );
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const months = Math.ceil(diffDays / 30);
      const timeline = `${months} month${months > 1 ? "s" : ""}`;

      const projectData: any = {
        title: data.title,
        description: data.description,
        organization: data.companyName,
        skillsRequired: data.skillsRequired,
        timeline,
        totalBudget: 10000,
      };

      const response = await createDonorProject(projectData);

      if (response.data?.donorProject) {
        const newProject = mapDonorProjectToProject(response.data.donorProject);
        setProjects([...projects, newProject]);
        console.log("✅ Project created:", newProject);
        navigate("/donor/projects");
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      hideLoader();
      throw error;
    }
  };

  const handleApplyToProject = async (
    projectId: string,
    coverLetter: string,
    skills: string[],
  ) => {
    if (!user) throw new Error("Please log in to apply");
    if (userApplications.includes(projectId))
      throw new Error("You have already applied to this project");

    try {
      const response = await applyToProject({
        donorProjectId: projectId,
        coverLetter,
        skills,
      });

      if (response.data?.application) {
        setUserApplications([...userApplications, projectId]);
      }
    } catch (error) {
      console.error("Failed to apply to project:", error);
      throw error;
    }
  };

  const handleUpdateApplicationStatus = (
    _projectId: string,
    _applicationId: string,
    _status: "accepted" | "rejected",
  ) => {
    console.log("Application status update triggered - handled by component");
  };

  const handleUpdateBankDetails = async (bankDetails: any) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("✅ Bank details updated successfully");
    } catch (error) {
      console.error("Failed to update bank details:", error);
      throw new Error("Failed to update bank details");
    }
  };

  // ─── Derived booleans (use hasRole / getPrimaryRole everywhere) ──────────────

  const isStudent = hasRole(user, "STUDENT");
  const isStudentPresident = hasRole(user, "STUDENT_PRESIDENT");
  const isStudentOrPresident = isStudent || isStudentPresident;
  const isDonor = hasRole(user, "DONOR");
  const isAdmin = hasRole(user, "ADMIN");

  // ─── Shared header props ────────────────────────────────────────────────────

  const headerProps = {
    currentUser: user,
    onLogin: handleLoginClick,
    onLogout: handleLogout,
  };

  // ─── Admin guard wrapper ────────────────────────────────────────────────────

  const AdminRoute = ({ children }: { children: React.ReactNode }) =>
    isAdmin ? (
      <>
        <Header {...headerProps} />
        {children}
      </>
    ) : (
      <SimpleRestricted message="Access Restricted" />
    );

  return (
    <div className="text-dreamxec-navy font-sans">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#fff",
            color: "#333",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
          },
        }}
        containerStyle={{ top: 50, right: 20 }}
      />

      <FloatingDoodles count={8} />

      <div className="relative caret-transparent z-10">
        <div className="caret-transparent">
          <div
            role="region"
            aria-label="top of page"
            className="caret-transparent h-0 pointer-events-none text-nowrap overflow-hidden"
          >
            <span className="caret-transparent hidden text-nowrap">
              top of page
            </span>
          </div>
          <div className="relative caret-transparent min-h-full mx-auto top-0">
            <div className="caret-transparent">
              <div className="caret-transparent">
                <div className="caret-transparent grid grid-cols-[1fr] grid-rows-[1fr] h-full">
                  <div className="relative self-stretch caret-transparent grid col-end-2 col-start-1 row-end-2 row-start-1 grid-cols-[minmax(0px,1fr)] grid-rows-[1fr] justify-self-stretch">
                    <div className="caret-transparent">
                      <div className="relative caret-transparent grid grid-cols-[minmax(0px,1fr)] grid-rows-[1fr] overflow-clip">
                        <div className="relative box-border caret-transparent grid grid-cols-[minmax(0px,1fr)] grid-rows-[auto] pointer-events-none">
                          <div className="pointer-events-auto">
                            <Routes>
                              {/* OAuth Callback — MUST be first */}
                              <Route
                                path="/auth/callback"
                                element={<AuthCallback />}
                              />

                              {/* Homepage */}
                              <Route
                                path="/"
                                element={
                                  isInitialLoading ? (
                                    <LoadingAnimation
                                      fullScreen={true}
                                      showDarkModeToggle={false}
                                    />
                                  ) : (
                                    <>
                                      <Header {...headerProps} />
                                      <Main />
                                    </>
                                  )
                                }
                              />

                              {/* Browse Campaigns */}
                              <Route
                                path="/campaigns"
                                element={
                                  <>
                                    <Header {...headerProps} />
                                    <BrowseCampaigns
                                      campaigns={approvedCampaigns}
                                      onViewCampaign={(id) =>
                                        navigate(`/campaign/${id}`)
                                      }
                                    />
                                  </>
                                }
                              />

                              {/* Campaign Detail */}
                              <Route
                                path="/campaign/:id"
                                element={
                                  <>
                                    <Header {...headerProps} />
                                    <CampaignDetails
                                      currentUser={user}
                                      campaigns={approvedCampaigns}
                                      onDonate={handleDonate}
                                    />
                                  </>
                                }
                              />

                              <Route
                                path="/refer-club"
                                element={<ReferClub />}
                              />

                              {/* Student Dashboard */}
                              <Route
                                path="/dashboard"
                                element={
                                  isStudentOrPresident ? (
                                    <>
                                      <Header {...headerProps} />
                                      <StudentDashboard
                                        studentName={user!.name || "User"}
                                        campaigns={userCampaigns}
                                        onCreateCampaign={() =>
                                          navigate("/create")
                                        }
                                        onViewCampaign={(id) =>
                                          navigate(`/campaign/${id}`)
                                        }
                                        isClubPresident={isStudentPresident}
                                        isClubMember={user!.isClubMember}
                                        clubVerified={isStudentPresident}
                                        user={user!}
                                        studentVerified={user!.studentVerified}
                                      />
                                    </>
                                  ) : (
                                    <AccessRestricted
                                      message="Every journey begins with the right role. Log in as a student to access your DreamXec dashboard."
                                      showLogin
                                      onLogin={() => navigate("/auth")}
                                    />
                                  )
                                }
                              />

                              {/* Create Campaign */}
                              <Route
                                path="/create"
                                element={
                                  isStudentOrPresident ? (
                                    <>
                                      <Header {...headerProps} />
                                      <CreateCampaign
                                        onBack={() => navigate("/dashboard")}
                                        onSubmit={handleCreateCampaign}
                                      />
                                    </>
                                  ) : (
                                    <AccessRestricted message="Please log in as a student to create campaigns." />
                                  )
                                }
                              />

                              <Route
                                path="/create-demo-campaign"
                                element={
                                  <>
                                    <Header {...headerProps} />
                                    <CreateCampaignDemo
                                      onBack={() => navigate("/dashboard")}
                                    />
                                  </>
                                }
                              />

                              {/* Edit Campaign */}
                              <Route
                                path="/campaign/:id/edit"
                                element={<EditCampaign />}
                              />

                              {/* Admin Dashboard */}
                              <Route
                                path="/admin"
                                element={
                                  isAdmin ? (
                                    <>
                                      <Header {...headerProps} />
                                      <AdminDashboard />
                                    </>
                                  ) : (
                                    <AccessRestricted message="Please log in as an admin to access the admin dashboard." />
                                  )
                                }
                              />

                              <Route
                                path="/admin/referrals"
                                element={
                                  <AdminRoute>
                                    <AdminClubReferrals />
                                  </AdminRoute>
                                }
                              />

                              <Route
                                path="/admin/club-referrals"
                                element={
                                  <AdminRoute>
                                    <AdminClubReferrals />
                                  </AdminRoute>
                                }
                              />

                              <Route
                                path="/admin/verifications"
                                element={
                                  <AdminRoute>
                                    <AdminClubVerifications />
                                  </AdminRoute>
                                }
                              />

                              <Route
                                path="/admin/club-verifications"
                                element={
                                  <AdminRoute>
                                    <AdminClubVerifications />
                                  </AdminRoute>
                                }
                              />

                              <Route
                                path="/admin/financials"
                                element={
                                  <AdminRoute>
                                    <AdminFinancials />
                                  </AdminRoute>
                                }
                              />

                              <Route
                                path="/admin/milestones"
                                element={
                                  <AdminRoute>
                                    <AdminMilestones />
                                  </AdminRoute>
                                }
                              />

                              <Route
                                path="/admin/student-verifications"
                                element={
                                  <AdminRoute>
                                    <AdminStudentVerifications />
                                  </AdminRoute>
                                }
                              />

                              <Route
                                path="/admin/audit-logs"
                                element={
                                  <AdminRoute>
                                    <AdminAuditLogs />
                                  </AdminRoute>
                                }
                              />

                              <Route
                                path="/admin/donors"
                                element={
                                  <AdminRoute>
                                    <AdminDonors />
                                  </AdminRoute>
                                }
                              />

                              <Route
                                path="/admin/applications"
                                element={
                                  <AdminRoute>
                                    <AdminApplications />
                                  </AdminRoute>
                                }
                              />

                              <Route
                                path="/admin/campaigns"
                                element={
                                  <AdminRoute>
                                    <AdminCampaigns />
                                  </AdminRoute>
                                }
                              />

                              <Route
                                path="/admin/users"
                                element={
                                  <AdminRoute>
                                    <AdminUsers />
                                  </AdminRoute>
                                }
                              />

                              <Route
                                path="/admin/clubs"
                                element={
                                  <AdminRoute>
                                    <AdminClubs />
                                  </AdminRoute>
                                }
                              />

                              {/* Auth Page */}
                              <Route
                                path="/auth"
                                element={
                                  !user ? (
                                    <AuthPage
                                      onLogin={handleLogin}
                                      onSignup={handleSignup}
                                      onGoogleAuth={handleGoogleAuth}
                                      onLinkedInAuth={handleLinkedInAuth}
                                      onForgotPassword={handleForgotPassword}
                                      currentUser={user}
                                      onHeaderLogin={handleLoginClick}
                                      onLogout={handleLogout}
                                    />
                                  ) : (
                                    <Navigate to="/" />
                                  )
                                }
                              />

                              {/* Login alias */}
                              <Route
                                path="/login"
                                element={
                                  <AuthPage
                                    onLogin={handleLogin}
                                    onSignup={handleSignup}
                                    onGoogleAuth={handleGoogleAuth}
                                    onLinkedInAuth={handleLinkedInAuth}
                                    onForgotPassword={handleForgotPassword}
                                    currentUser={user}
                                    onHeaderLogin={handleLoginClick}
                                    onLogout={handleLogout}
                                  />
                                }
                              />

                              {/* Profile Setup */}
                              <Route
                                path="/profile/setup"
                                element={<ProfileSetup />}
                              />

                              {/* Check Email */}
                              <Route
                                path="/check-email"
                                element={
                                  <CheckEmail
                                    email={signupEmail}
                                    onBackToLogin={() => {
                                      setShowCheckEmail(false);
                                      navigate("/auth");
                                    }}
                                  />
                                }
                              />

                              {/* Email Verification */}
                              <Route
                                path="/verify-email/:token"
                                element={
                                  <EmailVerification
                                    onVerificationSuccess={
                                      handleEmailVerificationSuccess
                                    }
                                  />
                                }
                              />

                              {/* User Profile */}
                              <Route
                                path="/profile"
                                element={
                                  user ? (
                                    <UserProfile
                                      user={user}
                                      onUpdateBankDetails={
                                        handleUpdateBankDetails
                                      }
                                      onBack={() => navigate(-1)}
                                    />
                                  ) : (
                                    <div className="min-h-screen flex items-center justify-center bg-dreamxec-cream">
                                      <div className="card-pastel-offwhite rounded-xl border-5 border-dreamxec-navy shadow-pastel-card p-12 text-center max-w-md">
                                        <div className="card-tricolor-tag"></div>
                                        <p className="text-dreamxec-navy text-xl font-sans mt-4">
                                          Please log in to access your profile.
                                        </p>
                                        <button
                                          onClick={handleLoginClick}
                                          className="mt-6 px-6 py-3 bg-dreamxec-orange text-white rounded-lg border-2 border-dreamxec-navy font-bold font-display hover:scale-105 transition-transform shadow-pastel-saffron"
                                        >
                                          Sign In
                                        </button>
                                      </div>
                                    </div>
                                  )
                                }
                              />

                              {/* Donor Dashboard */}
                              <Route
                                path="/donor/dashboard"
                                element={
                                  isDonor ? (
                                    <>
                                      <Header {...headerProps} />
                                      <DonorDashboard
                                        donorName={user!.name || "Donor"}
                                        projectsCount={donorProjects.length}
                                        profileComplete={
                                          (user as any).profileComplete
                                        }
                                        userRoles={(user as any).roles ?? []}
                                        onCreateProject={() =>
                                          navigate("/donor/create")
                                        }
                                        onViewProjects={() =>
                                          navigate("/donor/projects")
                                        }
                                        getDonorApplications={
                                          getDonorApplications
                                        }
                                        updateApplicationStatus={
                                          updateApplicationStatus
                                        }
                                        getDonationSummary={async () => ({})}
                                      />
                                    </>
                                  ) : (
                                    <AccessRestricted message="Please log in as a donor to access the donor dashboard." />
                                  )
                                }
                              />

                              {/* Clubs */}
                              <Route
                                path="/clubs"
                                element={
                                  <>
                                    <Header {...headerProps} />
                                    <ClubDiscovery />
                                  </>
                                }
                              />

                              <Route
                                path="/clubs/:id"
                                element={
                                  <>
                                    <Header {...headerProps} />
                                    <ClubDetails />
                                  </>
                                }
                              />

                              {/* Create Donor Project */}
                              <Route
                                path="/donor/create"
                                element={
                                  isDonor ? (
                                    <>
                                      <Header {...headerProps} />
                                      <CreateProject
                                        onBack={() =>
                                          navigate("/donor/dashboard")
                                        }
                                        onSubmit={handleCreateProject}
                                      />
                                    </>
                                  ) : (
                                    <AccessRestricted message="Please log in as a donor to create projects." />
                                  )
                                }
                              />

                              {/* Donor Projects */}
                              <Route
                                path="/donor/projects"
                                element={
                                  isDonor ? (
                                    <>
                                      <Header {...headerProps} />
                                      <DonorProjects
                                        projects={donorProjects}
                                        onCreateProject={() =>
                                          navigate("/donor/create")
                                        }
                                        onBack={() =>
                                          navigate("/donor/dashboard")
                                        }
                                        onUpdateApplicationStatus={
                                          handleUpdateApplicationStatus
                                        }
                                      />
                                    </>
                                  ) : (
                                    <AccessRestricted message="Please log in as a donor to view your projects." />
                                  )
                                }
                              />

                              {/* Browse Projects — students only */}
                              <Route
                                path="/projects"
                                element={
                                  isStudentOrPresident ? (
                                    <>
                                      <Header {...headerProps} />
                                      <BrowseProjects
                                        projects={approvedProjects}
                                        currentUserId={user?.id}
                                        onApply={handleApplyToProject}
                                        userApplications={userApplications}
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <Header {...headerProps} />
                                      <AccessRestricted message="Please log in as a student to browse projects." />
                                    </>
                                  )
                                }
                              />

                              {/* About Us */}
                              <Route
                                path="/about"
                                element={
                                  <>
                                    <Header {...headerProps} />
                                    <AboutUs />
                                  </>
                                }
                              />

                              {/* Verify President */}
                              <Route
                                path="/verify-president"
                                element={
                                  <>
                                    <Header {...headerProps} />
                                    <VerifyPresident />
                                  </>
                                }
                              />

                              {/* President Dashboard */}
                              <Route
                                path="/president"
                                element={
                                  <>
                                    <Header {...headerProps} />
                                    <PresidentLayout>
                                      <PresidentDashboard />
                                    </PresidentLayout>
                                  </>
                                }
                              />

                              <Route
                                path="/president/members"
                                element={
                                  <>
                                    <Header {...headerProps} />
                                    <PresidentLayout>
                                      <PresidentMembers
                                        clubId={user?.clubIds?.[0] || ""}
                                        currentUserId={user?.id || ""}
                                      />
                                    </PresidentLayout>
                                  </>
                                }
                              />

                              <Route
                                path="/president/campaigns"
                                element={
                                  <>
                                    <Header {...headerProps} />
                                    <PresidentLayout>
                                      <PresidentCampaigns
                                        clubId={user?.clubIds?.[0] || ""}
                                      />
                                    </PresidentLayout>
                                  </>
                                }
                              />

                              <Route
                                path="/president/upload-members"
                                element={
                                  <>
                                    <Header {...headerProps} />
                                    <PresidentLayout>
                                      <UploadMembers />
                                    </PresidentLayout>
                                  </>
                                }
                              />

                              <Route
                                path="/president/add-member"
                                element={
                                  <>
                                    <Header {...headerProps} />
                                    <PresidentLayout>
                                      <AddMemberManually
                                        clubId={user?.clubIds?.[0] || ""}
                                      />
                                    </PresidentLayout>
                                  </>
                                }
                              />

                              {/* Footer / content page routes */}
                              <Route
                                path="/start-project"
                                element={<StartAProject />}
                              />
                              <Route
                                path="/how-it-works/students"
                                element={<HowItWorksStudents />}
                              />
                              <Route
                                path="/eligibility"
                                element={<ProjectEligibility />}
                              />
                              <Route
                                path="/resources"
                                element={<ResourceCenter />}
                              />
                              <Route
                                path="/success-stories"
                                element={<SuccessStories />}
                              />
                              <Route
                                path="/fund-innovation"
                                element={<FundInnovation />}
                              />
                              <Route
                                path="/how-it-works/donors"
                                element={<HowItWorksDonors />}
                              />
                              <Route
                                path="/why-donate"
                                element={<WhyDonate />}
                              />
                              <Route
                                path="/corporate-partnerships"
                                element={<CorporateCSRPartnerships />}
                              />
                              <Route
                                path="/alumni-giving"
                                element={<AlumniGivingPrograms />}
                              />
                              <Route
                                path="/become-mentor"
                                element={<BecomeMentor />}
                              />
                              <Route
                                path="/perfect-storm"
                                element={<PerfectStorm />}
                              />
                              <Route path="/careers" element={<Careers />} />
                              <Route path="/contact" element={<ContactUs />} />
                              <Route path="/faq" element={<FAQ />} />
                              <Route path="/press" element={<PressMedia />} />
                              <Route
                                path="/terms-And-Conditions"
                                element={<TermsAndConditions />}
                              />
                            </Routes>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            role="region"
            aria-label="bottom of page"
            className="caret-transparent h-0 pointer-events-none text-nowrap overflow-hidden"
          >
            <span className="caret-transparent hidden text-nowrap">
              bottom of page
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component with Router
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <LoaderProvider>
          <AppContent />
        </LoaderProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
