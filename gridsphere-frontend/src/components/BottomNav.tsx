import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HomeIcon, DevicesIcon, ProfileIcon } from "./icons";

/**
 * Mirrors the mobile app's bottom tab bar, but only includes tabs that
 * have a real backend route behind them:
 *   - Home     -> live field conditions for the selected device
 *   - Devices  -> device list / register / sensors / history
 *   - Profile  -> account info + logout
 *
 * The mobile app also has "Protection" (fungal/pest risk), "Soil"
 * (spray timing + soil parameters), and "Alerts" (threshold config) tabs.
 * None of those have a corresponding API route in the current backend
 * (no disease/pest model, no forecast integration, no soil-nutrient
 * model, no alerts/notifications model) so they are intentionally left
 * out here rather than linking to empty pages.
 */
export default function BottomNav() {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) return null;
  if (location.pathname === "/login" || location.pathname === "/register") return null;

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
        <HomeIcon />
        Home
      </NavLink>
      <NavLink to="/devices" className={({ isActive }) => (isActive ? "active" : "")}>
        <DevicesIcon />
        Devices
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>
        <ProfileIcon />
        Profile
      </NavLink>
    </nav>
  );
}
