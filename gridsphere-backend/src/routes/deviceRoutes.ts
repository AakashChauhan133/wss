import { Router } from "express";
import * as deviceController from "../controllers/deviceController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Mirrors app.include_router(device_router.router, prefix="/devices", tags=["Devices"])
router.post("/", requireAuth, requireRole("user"), asyncHandler(deviceController.createDevice));
router.get("/", requireAuth, requireRole("user"), asyncHandler(deviceController.getMyDevices));
router.get("/:device_id/live-data", requireAuth, requireRole("user"), asyncHandler(deviceController.getLiveData));
router.get("/:device_id/history", requireAuth, requireRole("user"), asyncHandler(deviceController.getDeviceHistory));
router.get("/:device_id/industry", requireAuth, requireRole("user"), asyncHandler(deviceController.getIndustryType));
router.post("/:device_id/industry", requireAuth, requireRole("user"), asyncHandler(deviceController.updateIndustryType));
router.get("/:device_id/forecast", requireAuth, requireRole("user"), asyncHandler(deviceController.getForecast));
router.get("/:device_id/insights", requireAuth, requireRole("user"), asyncHandler(deviceController.getInsights));
router.get("/:device_id/history/export", requireAuth, requireRole("user"), asyncHandler(deviceController.exportHistoryCsv));

export default router;
