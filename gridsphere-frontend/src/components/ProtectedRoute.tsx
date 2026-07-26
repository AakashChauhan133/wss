import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  /**
   * Roles allowed to view the nested routes. Defaults to ["user"] since
   * this app is currently built for field-operator users only - there is
   * no admin UI yet. Passing e.g. ["admin"] on a future route is all
   * that's needed to gate an admin-only page once one exists; the
   * backend enforces the same check server-side via requireRole (see
   * the Node API's src/middleware/rbac.ts), so this is a UX guard, not
   * the security boundary.
   */
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles = ["user"] }: Props) {
  const { token, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-text">Loading console…</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
