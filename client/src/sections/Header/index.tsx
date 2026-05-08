import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import type { UserRole } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  currentUser?: { name: string; roles?: string[]; role?: UserRole } | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Header = ({ currentUser, onLogin, onLogout }: HeaderProps) => {
  const navigate = useNavigate();
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsScrolling(false), 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(timeout); };
  }, []);

  let authContext: ReturnType<typeof useAuth> | null = null;
  try { authContext = useAuth(); } catch {}

  const user = currentUser !== undefined ? currentUser : authContext?.user || null;
  const handleLogin = onLogin || (() => navigate('/auth'));
  const handleLogout = onLogout || authContext?.handleLogout || (() => {});

return (
    <header className="bg-transparent z-50 sticky top-0">
      <div className={`max-w-[1500px] mx-auto px-6 transition-all duration-300 ${
        isScrolling ? 'lg:px-16' : 'lg:px-6'
      }`}>
        <div className="bg-white border-2 border-dreamxec-navy rounded-2xl shadow-pastel-saffron my-2 relative overflow-hidden">
          
          {/* Scrolling tagline banner - desktop only */}
          <div
            className={`hidden lg:flex absolute inset-0 items-center justify-center z-10 transition-all duration-300 pointer-events-none ${
              isScrolling ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <p className="font-black uppercase tracking-[0.3em] text-dreamxec-navy text-sm">
              Research Karega India, Toh Badhega India
            </p>
          </div>

          {/* Normal navbar */}
          <div className={`transition-all duration-300 ${isScrolling ? 'lg:opacity-0' : 'opacity-100'}`}>
            <Navbar currentUser={user} onLogin={handleLogin} onLogout={handleLogout} />
          </div>

        </div>
      </div>
    </header>
  );
};