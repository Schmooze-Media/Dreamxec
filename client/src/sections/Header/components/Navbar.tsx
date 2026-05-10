// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Logo } from "../../../components/Logo";
// import { MobileMenuButton } from "../../../components/MobileMenuButton";
// import { DesktopMenu } from "./DesktopMenu";
// import { NewsletterModal } from "../../../components/NewsletterModal";
// import type { UserRole } from "../../../types";

// interface NavbarProps {
//   currentUser?: { name: string; role?: UserRole; roles?: string[] } | null;
//   onLogin?: () => void;
//   onLogout?: () => void;
// }

// export const Navbar = ({ currentUser, onLogin, onLogout }: NavbarProps) => {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [newsletterOpen, setNewsletterOpen] = useState(false);
//   const navigate = useNavigate();

//   console.log(currentUser)

//   return (
//     <>
//       <NewsletterModal
//         isOpen={newsletterOpen}
//         onClose={() => setNewsletterOpen(false)}
//         source="navbar"
//       />
//       <nav className="flex items-center justify-between px-4 py-2">
//         {/* Logo */}
//         <Logo />

//         {/* Right side - Navigation and User Actions */}
//         <div className="flex items-center gap-6">
//           {/* Desktop Menu */}
//           <div className="hidden md:flex items-center gap-4">
//             <DesktopMenu currentUser={currentUser} onLogin={onLogin} />

//             {/* Newsletter CTA - Desktop */}
//             <button
//               onClick={() => setNewsletterOpen(true)}
//               className="text-dreamxec-navy hover:text-dreamxec-orange font-semibold text-sm transition-colors flex items-center gap-1"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//               </svg>
//               Updates
//             </button>
//           </div>

//           {/* User Actions */}
//           <div className="flex items-center gap-3">
//             {currentUser && (
//               <>
//                 {/* User Profile - Only for Students */}
//                 {currentUser.role === 'student' && (
//                   <button
//                     onClick={() => navigate('/profile')}
//                     className="hidden md:flex items-center gap-2 bg-dreamxec-beige border-2 border-dreamxec-navy rounded-xl px-3 py-2 shadow-md hover:bg-dreamxec-cream transition-all"
//                   >
//                     <div className="w-8 h-8 bg-dreamxec-orange border-2 border-dreamxec-navy rounded-full flex items-center justify-center">
//                       <span className="text-white font-bold text-sm">
//                         {currentUser.name.charAt(0).toUpperCase()}
//                       </span>
//                     </div>
//                     <div className="flex flex-col text-left">
//                       <span className="text-dreamxec-navy font-bold text-sm font-sans">
//                         {currentUser.name}
//                       </span>
//                       <span className="text-dreamxec-navy text-xs opacity-70 font-sans">
//                         Student
//                       </span>
//                     </div>
//                   </button>
//                 )}

//                 {/* Simple name display for donors/admins */}
//                 {currentUser.role !== 'student' && (
//                   <div className="hidden md:flex items-center gap-2 bg-dreamxec-beige border-2 border-dreamxec-navy rounded-xl px-3 py-2 shadow-md">
//                     <div className="w-8 h-8 bg-dreamxec-orange border-2 border-dreamxec-navy rounded-full flex items-center justify-center">
//                       <span className="text-white font-bold text-sm">
//                         {currentUser.name.charAt(0).toUpperCase()}
//                       </span>
//                     </div>
//                     <div className="flex flex-col text-left">
//                       <span className="text-dreamxec-navy font-bold text-sm font-sans">
//                         {currentUser.name}
//                       </span>
//                       <span className="text-dreamxec-navy text-xs opacity-70 font-sans">
//                         {currentUser.role === 'donor' ? 'Donor' : 'Admin'}
//                       </span>
//                     </div>
//                   </div>
//                 )}

//                 <button
//                   onClick={onLogout}
//                   className="bg-dreamxec-cream border-2 border-dreamxec-navy px-4 py-2 rounded-xl font-bold text-dreamxec-navy hover:bg-dreamxec-orange hover:text-white transition-colors font-display shadow-md"
//                 >
//                   Logout
//                 </button>
//               </>
//             )}

//             {/* Mobile Menu Button */}
//             <div className="md:hidden">
//               <MobileMenuButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Mobile Menu */}
//       {mobileMenuOpen && (
//         <div className="md:hidden bg-white border-t-2 border-dreamxec-navy shadow-lg rounded-b-2xl">
//           <div className="flex flex-col gap-3 p-4">
//             {currentUser ? (
//               <>
//                 {/* User Profile Card - Only for Students */}
//                 {currentUser.role === 'student' && (
//                   <button
//                     onClick={() => {
//                       navigate('/profile');
//                       setMobileMenuOpen(false);
//                     }}
//                     className="px-4 py-3 bg-dreamxec-beige border-3 border-dreamxec-navy rounded-lg mx-2 my-2 hover:bg-dreamxec-cream hover:shadow-pastel-card transition-all w-full text-left cursor-pointer"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 bg-dreamxec-orange border-2 border-dreamxec-navy rounded-full flex items-center justify-center">
//                         <span className="text-white font-bold text-sm">
//                           {currentUser.name.charAt(0).toUpperCase()}
//                         </span>
//                       </div>
//                       <div className="flex flex-col">
//                         <span className="text-dreamxec-navy font-bold text-sm font-sans">
//                           {currentUser.name}
//                         </span>
//                         <span className="text-dreamxec-navy text-xs opacity-70 font-sans">
//                           Student
//                         </span>
//                       </div>
//                     </div>
//                   </button>
//                 )}

//                 {/* User Info Display - For Donors/Admins (non-clickable) */}
//                 {currentUser.role !== 'student' && (
//                   <div className="px-4 py-3 bg-dreamxec-beige border-3 border-dreamxec-navy rounded-lg mx-2 my-2 w-full">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 bg-dreamxec-orange border-2 border-dreamxec-navy rounded-full flex items-center justify-center">
//                         <span className="text-white font-bold text-sm">
//                           {currentUser.name.charAt(0).toUpperCase()}
//                         </span>
//                       </div>
//                       <div className="flex flex-col">
//                         <span className="text-dreamxec-navy font-bold text-sm font-sans">
//                           {currentUser.name}
//                         </span>
//                         <span className="text-dreamxec-navy text-xs opacity-70 font-sans">
//                           {currentUser.role === 'donor' ? 'Donor' : 'Admin'}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Student Links */}
//                 {currentUser.role === 'student' && (
//                   <>
//                     <a
//                       href="/dashboard"
//                       className="text-left px-4 py-3 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
//                     >
//                       DASHBOARD
//                     </a>
//                     <a
//                       href="/campaigns"
//                       className="text-left px-4 py-3 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
//                     >
//                       CAMPAIGNS
//                     </a>
//                     <a
//                       href="/projects"
//                       className="text-left px-4 py-3 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
//                     >
//                       OPPORTUNITIES
//                     </a>
//                   </>
//                 )}

//                 {/* Admin Links */}
//                 {currentUser.role === 'admin' && (
//                   <>
//                     <a
//                       href="/admin"
//                       className="text-left px-4 py-3 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
//                     >
//                       ADMIN DASHBOARD
//                     </a>
//                     <a
//                       href="/campaigns"
//                       className="text-left px-4 py-3 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
//                     >
//                       CAMPAIGNS
//                     </a>
//                   </>
//                 )}

//                 {/* Donor Links */}
//                 {currentUser.role === 'donor' && (
//                   <>
//                     <a
//                       href="/donor/dashboard"
//                       className="text-left px-4 py-3 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
//                     >
//                       MY PROJECTS
//                     </a>
//                     <a
//                       href="/campaigns"
//                       className="text-left px-4 py-3 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
//                     >
//                       CAMPAIGNS
//                     </a>
//                   </>
//                 )}

//                 {/* Logout Button */}
//                 <button
//                   onClick={() => {
//                     onLogout?.();
//                     setMobileMenuOpen(false);
//                   }}
//                   className="mx-2 my-2 bg-dreamxec-orange text-white px-6 py-3 rounded-lg font-bold border-3 border-dreamxec-navy hover:bg-dreamxec-green transition-colors font-display shadow-pastel-saffron"
//                 >
//                   Logout
//                 </button>
//               </>
//             ) : (
//               <>
//                 {/* Guest Links */}
//                 <a
//                   href="/"
//                   className="text-left px-4 py-3 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
//                 >
//                   HOME
//                 </a>
//                 <a
//                   href="/about"
//                   className="text-left px-4 py-3 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
//                 >
//                   ABOUT US
//                 </a>
//                 <a
//                   href="/campaigns"
//                   className="text-left px-4 py-3 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
//                 >
//                   CAMPAIGNS
//                 </a>

//                 {/* Sign In Button for Mobile */}
//                 <button
//                   onClick={() => {
//                     onLogin?.();
//                     setMobileMenuOpen(false);
//                   }}
//                   className="mx-2 my-2 bg-dreamxec-orange text-white px-6 py-3 rounded-lg font-bold border-3 border-dreamxec-navy hover:bg-dreamxec-saffron transition-colors font-display shadow-pastel-saffron"
//                 >
//                   Sign In
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </>
//   );
// };
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../../../components/Logo";
import { MobileMenuButton } from "../../../components/MobileMenuButton";
import { DesktopMenu } from "./DesktopMenu";
import { NewsletterModal } from "../../../components/NewsletterModal";
import { getProfile } from "../../../services/profileService";
import type { UserRole } from "../../../types";

interface NavbarProps {
  currentUser?: {
    name: string;
    roles?: string[];
  } | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

// helper
const hasRole = (user: any, role: string) =>
  Array.isArray(user?.roles) && user.roles.some((r: string) => r.toUpperCase() === role.toUpperCase());

const getDisplayRole = (user: any) => {
  if (!user?.roles) return "User";
  const roles = user.roles.map((r: string) => r.toUpperCase());
  if (roles.includes("ADMIN")) return "Admin";
  if (roles.includes("DEAN_HEAD")) return "Dean";
  if (roles.includes("DEAN_ACADEMICS")) return "Dean of Academics";
  if (roles.includes("DEAN_STUDENT_WELFARE")) return "Dean of Student Welfare";
  if (roles.includes("FACULTY")) return "Faculty";
  if (roles.includes("STUDENT_PRESIDENT")) return "President";
  if (roles.includes("ALUMNI")) return "Alumni";
  if (roles.includes("MENTOR")) return "Mentor";
  if (roles.includes("PREMIUM_DONOR")) return "Premium Donor";
  if (roles.includes("DONOR")) return "Donor";
  if (roles.includes("STUDENT")) return "Student";
  return "User";
};

export const Navbar = ({ currentUser, onLogin, onLogout }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [completionPct, setCompletionPct] = useState<number | null>(null);

  const navigate = useNavigate();

  const isStudentType =
    currentUser &&
    (hasRole(currentUser, "STUDENT") ||
      hasRole(currentUser, "STUDENT_PRESIDENT"));

  // profile completion
  useEffect(() => {
    if (!currentUser) {
      setCompletionPct(null);
      return;
    }

    const showCompletion =
      hasRole(currentUser, "DONOR") ||
      hasRole(currentUser, "STUDENT") ||
      hasRole(currentUser, "STUDENT_PRESIDENT");

    if (!showCompletion) {
      setCompletionPct(null);
      return;
    }

    let cancelled = false;

    getProfile()
      .then((res) => {
        if (!cancelled && res.status === "success" && res.data) {
          setCompletionPct(res.data.completionPct);
        }
      })
      .catch(() => {
        if (!cancelled) setCompletionPct(null);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.roles]);

  return (
    <>
      <NewsletterModal
        isOpen={newsletterOpen}
        onClose={() => setNewsletterOpen(false)}
        source="navbar"
      />

      <nav className="flex items-center justify-between px-4 py-2">
        <Logo />

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4">
            <DesktopMenu currentUser={currentUser} onLogin={onLogin} />

            <button
              onClick={() => setNewsletterOpen(true)}
              className="text-dreamxec-navy hover:text-dreamxec-orange font-semibold text-sm flex items-center gap-1"
            >
              Updates
            </button>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <>
                {/* USER PROFILE BUBBLE */}
                <div
                  className="hidden md:flex items-center gap-2 bg-dreamxec-beige border-2 border-dreamxec-navy rounded-xl px-3 py-2 cursor-pointer"
                  onClick={() => {
                    if (isStudentType) {
                      navigate("/profile");
                    } else if (hasRole(currentUser, "DONOR") || hasRole(currentUser, "ALUMNI") || hasRole(currentUser, "MENTOR") || hasRole(currentUser, "FACULTY")) {
                      navigate("/profile/setup");
                    }
                  }}
                >
                  <div className="relative w-8 h-8">
                    <div className="w-8 h-8 bg-dreamxec-orange rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {completionPct !== null && completionPct < 100 && (
                      <span className="absolute -bottom-1 -right-1 text-[9px] bg-orange-500 text-white px-1 rounded-full">
                        {completionPct}%
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm">
                      {currentUser.name}
                    </span>
                    <span className="text-xs opacity-70">
                      {getDisplayRole(currentUser)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="bg-dreamxec-cream border-2 border-dreamxec-navy px-4 py-2 rounded-xl font-bold"
                >
                  Logout
                </button>
              </>
            )}

            <div className="md:hidden">
              <MobileMenuButton
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t-2 border-dreamxec-navy">
          <div className="flex flex-col gap-3 p-4">
            {currentUser ? (
              <>
                {/* USER PROFILE BUBBLE - MOBILE */}
                <div
                  className="flex items-center gap-2 bg-dreamxec-beige border-2 border-dreamxec-navy rounded-xl px-3 py-2 cursor-pointer mb-2"
                  onClick={() => {
                    if (isStudentType) {
                      navigate("/profile");
                    } else if (hasRole(currentUser, "DONOR") || hasRole(currentUser, "ALUMNI") || hasRole(currentUser, "MENTOR") || hasRole(currentUser, "FACULTY")) {
                      navigate("/profile/setup");
                    }
                    setMobileMenuOpen(false);
                  }}
                >
                  <div className="relative w-8 h-8">
                    <div className="w-8 h-8 bg-dreamxec-orange rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {completionPct !== null && completionPct < 100 && (
                      <span className="absolute -bottom-1 -right-1 text-[9px] bg-orange-500 text-white px-1 rounded-full">
                        {completionPct}%
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm">
                      {currentUser.name}
                    </span>
                    <span className="text-xs opacity-70">
                      {getDisplayRole(currentUser)}
                    </span>
                  </div>
                </div>

                {/* STUDENT */}
                {hasRole(currentUser, "STUDENT") && (
                  <>
                    <a href="/dashboard">DASHBOARD</a>
                    <a href="/campaigns">CAMPAIGNS</a>
                    <Link to="/clubs">CLUBS</Link>
                    <a href="/projects">OPPORTUNITIES</a>
                  </>
                )}

                {/* PRESIDENT */}
                {hasRole(currentUser, "STUDENT_PRESIDENT") && (
                  <>
                    <a href="/dashboard">DASHBOARD</a>
                    <a href="/campaigns">CAMPAIGNS</a>
                    <Link to="/clubs">CLUBS</Link>
                    <a href="/projects">OPPORTUNITIES</a>
                  </>
                )}

                {/* ADMIN */}
                {hasRole(currentUser, "ADMIN") && (
                  <>
                    <a href="/admin">ADMIN DASHBOARD</a>
                    <a href="/campaigns">CAMPAIGNS</a>
                  </>
                )}

                {/* DONOR */}
                {hasRole(currentUser, "DONOR") && (
                  <>
                    <a href="/donor/dashboard">MY PROJECTS</a>
                    <a href="/campaigns">CAMPAIGNS</a>
                    <Link to="/clubs">CLUBS</Link>
                  </>
                )}

                <button onClick={onLogout}>Logout</button>
              </>
            ) : (
              <>
                <a href="/">HOME</a>
                <a href="/campaigns">CAMPAIGNS</a>
                <Link to="/clubs">CLUBS</Link>

                <button onClick={onLogin}>Sign In</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
