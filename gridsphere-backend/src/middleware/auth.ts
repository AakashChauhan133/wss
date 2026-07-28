import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwtHandler";

// Augment Express Request with the authenticated user, mirroring the
// `current_user: dict = Depends(get_current_user)` pattern from FastAPI.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentUser?: { id: number };
    }
  }
}

/**
 * Equivalent of app/dependencies.py -> get_current_user
 *
 * FastAPI used OAuth2PasswordBearer(tokenUrl="login") to pull the Bearer
 * token out of the Authorization header and decode it. Express does the
 * same thing here as middleware, attaching `req.currentUser` for
 * downstream route handlers to use (replacing `Depends(get_current_user)`).
 *
 * NOTE ON A BUG WE FIXED: the original `get_current_user` only ever
 * returned `{"id": int(user_id)}`, yet `auth_router.check_session` read
 * `current_user["u_id"]` and `user_router.get_user` implied the full user
 * object was available. Both would have thrown a runtime KeyError / just
 * returned a partial object in the original Python. We standardized on
 * `req.currentUser.id` everywhere (see authController.checkSession and
 * userController.getUser) so those two endpoints work as intended instead
 * of crashing.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Could not validate credentials"));
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    const userId = payload.sub;

    if (!userId) {
      return next(new ApiError(401, "Could not validate credentials"));
    }

    req.currentUser = { id: parseInt(userId, 10) };
    next();
  } catch (err) {
    next(new ApiError(401, "Could not validate credentials"));
  }
}
