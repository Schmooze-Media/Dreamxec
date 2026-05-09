import axios, { AxiosError } from "axios";

/**
 * Axios instance
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Attach token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // adjust if needed

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Mentor Application Data Interface
 */
export interface MentorApplicationData {
  name: string;
  email: string;
  linkedin?: string;
  role: string;
  organization?: string;
  country: string;
  city?: string;
  stateProvince?: string;

  yearsOfExperience: number;
  expertiseAreas: string[];

  achievement: string;

  mentoringExperience: "Yes" | "No";
  mentoringDescription?: string;

  projectsOrResearch?: string;

  mentorshipIntent: string;
  scenarioResponse: string;

  mentorshipTools: string;

  monthlyCommitment: "2-3 hours" | "4-6 hours" | "6-10 hours" | "10+ hours";

  mentorshipFormat: string[];

  studentPreference: string[];

  portfolioLinks?: string;

  innovationImpactView: string;

  studentMistakeObservation: string;

  thirtyDayBuildPlan?: string;

  publicMentorFeature?: boolean;

  mentorReferral?: string;
}

/**
 * Submit Mentor Application (PUBLIC)
 */
export const submitMentorApplication = async (data: MentorApplicationData) => {
  try {
    console.log("Submitting mentor application with data:", data);
    const response = await api.post("/mentor", data);
    console.log("Mentor application submitted successfully:", response.data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message: string }>;
      console.log("ERROR RESPONSE:", axiosError.response?.data);
      throw new Error(
        axiosError.response?.data?.message ||
          "Failed to submit mentor application",
      );
    }

    throw new Error("Network error or server unavailable");
  }
};

/**
 * Get Mentor Application Status (ADMIN ONLY)
 */
export const getMentorApplicationStatus = async (applicationId: string) => {
  try {
    const response = await api.get(`/mentor/${applicationId}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message: string }>;

      throw new Error(
        axiosError.response?.data?.message || "Failed to fetch application",
      );
    }

    throw new Error("Network error or server unavailable");
  }
};
