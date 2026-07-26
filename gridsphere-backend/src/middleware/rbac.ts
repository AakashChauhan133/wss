import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";

/**
 * Role-based access control middleware.
 *
 * Must run AFTER requireAuth (needs req.currentUser.id to already be set).
 * Looks up the user's role and rejects the request with 403 if it isn't
 * in the allowed list.
 *
 * The app is currently user-facing only, so every protected route is
 * wired up as `requireAuth, requireRole("user")`. There is no admin UI or
 * admin-only route yet - this middleware exists so that adding one later
 * is a one-line change (e.g. `requireRole("admin")` on a new router)
 * instead of a schema/migration change.
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.currentUser?.id;
      if (!userId) {
        return next(new ApiError(401, "Could not validate credentials"));
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return next(new ApiError(401, "Could not validate credentials"));
      }

      if (!allowedRoles.includes(user.role)) {
        return next(new ApiError(403, "You do not have permission to perform this action"));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
