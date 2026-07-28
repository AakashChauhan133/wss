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
 * "admin" is always allowed, regardless of the list passed in - admins
 * should be able to do everything a "user" can, plus admin-only routes.
 * Without this, every route wired as requireRole("user") (the vast
 * majority of the API) 403s for admin accounts, since "admin" !== "user".
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

      if (user.role !== "admin" && !allowedRoles.includes(user.role)) {
        return next(new ApiError(403, "You do not have permission to perform this action"));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}