import { Link } from "react-router-dom";
import { can } from "../../../rbac/engine";
import { Permissions } from "../../../rbac/permissions";

interface DesktopMenuProps {
  currentUser?: any | null;
  onLogin?: () => void;
}

export const DesktopMenu = ({ currentUser, onLogin }: DesktopMenuProps) => {
  return (
    <nav className="flex items-center text-dreamxec-berkeley-blue gap-6">
      {/* Always show these links */}
      <a
        href="/"
        className="text-dreamxec-berkeley-blue font-bold text-lg hover:text-dreamxec-orange transition-colors font-display"
      >
        HOME
      </a>

      <a
        href="/campaigns"
        className="text-dreamxec-berkeley-blue font-bold text-lg hover:text-dreamxec-orange transition-colors font-display"
      >
        CAMPAIGNS
      </a>

      <Link
        to="/clubs"
        className="text-dreamxec-berkeley-blue font-bold text-lg hover:text-dreamxec-orange transition-colors font-display"
      >
        CLUBS
      </Link>



      {/* Role-specific links */}
      {can(currentUser?.roles || [], Permissions.DASHBOARD_STUDENT_VIEW) && !can(currentUser?.roles || [], Permissions.CLUB_MANAGE) && (
        <>
          <a
            href="/dashboard"
            className="text-dreamxec-navy font-bold text-lg hover:text-dreamxec-orange transition-colors font-display"
          >
            DASHBOARD
          </a>
          <a
            href="/projects"
            className="text-dreamxec-navy font-bold text-lg hover:text-dreamxec-orange transition-colors font-display"
          >
            OPPORTUNITIES
          </a>
        </>
      )}

      {can(currentUser?.roles || [], Permissions.CLUB_MANAGE) && (
        <>
          <a
            href="/dashboard"
            className="text-dreamxec-navy font-bold text-lg hover:text-dreamxec-orange transition-colors font-display"
          >
            DASHBOARD
          </a>
          <a
            href="/projects"
            className="text-dreamxec-navy font-bold text-lg hover:text-dreamxec-orange transition-colors font-display"
          >
            OPPORTUNITIES
          </a>
        </>
      )}

      {can(currentUser?.roles || [], Permissions.USER_MANAGE) && (
        <a
          href="/admin"
          className="text-dreamxec-navy font-bold text-lg hover:text-dreamxec-orange transition-colors font-display"
        >
          ADMIN
        </a>
      )}

      {can(currentUser?.roles || [], Permissions.DASHBOARD_DONOR_VIEW) && (
        <a
          href="/donor/dashboard"
          className="text-dreamxec-navy font-bold text-lg hover:text-dreamxec-orange transition-colors font-display"
        >
          DASHBOARD
        </a>
      )}

      {/* <a
        href="/about"
        className="text-dreamxec-berkeley-blue font-bold text-lg hover:text-dreamxec-orange transition-colors font-display"
      >
        ABOUT US
      </a> */}

      {/* Sign In Button for guests */}
      {!currentUser && (
        <button
          onClick={onLogin}
          className="bg-dreamxec-orange border-2 border-dreamxec-navy px-8 py-3 rounded-xl font-bold text-white hover:bg-dreamxec-saffron transition-colors font-display shadow-md text-lg"
        >
          Sign In
        </button>
      )}
    </nav>
  );
};
