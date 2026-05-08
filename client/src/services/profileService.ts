import apiRequest from "./api";

export interface StudentProfileData {
  name?: string;
  phone?: string;
  countryCode?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  college?: string;
  yearOfStudy?: "FIRST" | "SECOND" | "THIRD" | "FINAL";
  address?: string;
  instagram?: string;
  facebook?: string;
  twitterX?: string;
  reddit?: string;
  bio?: string;
  profilePicture?: string;
  skills?: string[];
  projectTitle?: string;
  fundingRequired?: number;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export interface DonorProfileData {
  name?: string;
  phone?: string;
  countryCode?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  panNumber?: string;
  education?: string;
  occupation?: "SALARIED" | "BUSINESS" | "PROFESSIONAL" | "OTHER";
  address?: string;
  instagram?: string;
  facebook?: string;
  twitterX?: string;
  reddit?: string;
  bio?: string;
  profilePicture?: string;
  donationCategories?: string[];
  anonymousDonation?: boolean;
  // Alumni / Mentor eligibility fields (Gap 4 & Gap 8)
  institution?: string;
  graduationYear?: number;
  expertiseSkills?: string[];
  openToConnect?: boolean;
}

// Frontend reads these flags — it never computes eligibility itself (Gap 9).
export interface EligibilityResult {
  isAlumniEligible: boolean; // institution filled AND graduationYear < currentYear
  isMentorEligible: boolean; // openToConnect === true (surfaces sidebar only, not role grant)
}

export interface ProfileResponse {
  profile: (StudentProfileData | DonorProfileData) & {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
    profileComplete: boolean;
    createdAt: string;
    updatedAt: string;
  };
  completionPct: number;
  role: string;

  isAlumniEligible?: boolean;
  isMentorEligible?: boolean;
}

export const getProfile = async () => {
  return apiRequest<ProfileResponse>("/profile/me", { method: "GET" });
};

export const updateProfile = async (
  data: StudentProfileData | DonorProfileData,
) => {
  return apiRequest<ProfileResponse>("/profile/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export interface ProfilePictureResponse {
  profilePicture: string;
  profile: ProfileResponse["profile"];
}

export const uploadProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append("profileImage", file);

  return apiRequest<ProfilePictureResponse>("/profile/picture", {
    method: "POST",
    body: formData,
  });
};

// Add the API call
export interface activateroleResponse {
  status: string;
  message: string;
  data: {
    role: "ALUMNI" | "MENTOR";
    redirectTo: string;
  };
}

export const activaterole = async (role: "ALUMNI") => {
  return apiRequest<activateroleResponse>("/users/activate-role", {
    method: "POST",
    body: JSON.stringify({ role }),
  });
};
export const suppressUpgradeCard = async () => {
  return apiRequest("/users/suppress-upgrade-card", { method: "PATCH" });
};

export interface ProfilePictureResponse {
    profilePicture: string;
    profile: ProfileResponse['profile'];
}

