import express, { Application } from "express";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import authRoutes from "./routes/authRoutes";
import deviceRoutes from "./routes/deviceRoutes";
import userRoutes from "./routes/userRoutes";
import readingRoutes from "./routes/readingRoutes";
import sensorRoutes from "./routes/sensorRoutes";
import subscriptionRoutes from "./routes/subscriptionRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

/**
 * Equivalent of app/main.py
 *
 * Router mounting mirrors the original exactly:
 *   app.include_router(auth_router.router, tags=["Authentication"])                 -> no prefix
 *   app.include_router(device_router.router, prefix="/devices", ...)
 *   app.include_router(user_router.router, prefix="/users", ...)
 *   app.include_router(reading_router.router, prefix="/readings", ...)
 *   app.include_router(sensor_router.router, prefix="/sensors", ...)
 *   app.include_router(subscription_router.router, prefix="/subscriptions", ...)
 *
 * NOTE: app/routers/plan_router.py existed in the source project but was
 * NEVER registered in app/main.py's include_router calls, so it was
 * unreachable there too. We preserve that exact behavior and do not mount
 * planRoutes here (the file is kept under src/routes/planRoutes.ts and
 * src/controllers/planController.ts for parity/reference only).
 */
export function createApp(): Application {
  const app = express();

  // Equivalent of CORSMiddleware(allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
  app.use(
    cors({
      origin: "*",
      credentials: true,
      methods: "*",
      allowedHeaders: "*",
    })
  );

  app.use(express.json());
  // Needed because /login uses OAuth2PasswordRequestForm (form-encoded) in the original.
  app.use(express.urlencoded({ extended: true }));

  // GET / -> health_check
  app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok", message: "GridSphere API v2 is running" });
  });

  // Swagger UI - interactive docs + "Try it out" for every route.
  // Spec source: src/config/openapi.yaml
  const openapiDocument = YAML.load(path.join(__dirname, "config", "openapi.yaml"));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument, {
    customSiteTitle: "GridSphere API Docs",
  }));
  // Raw spec, handy for importing into Postman/Insomnia
  app.get("/docs.json", (_req, res) => {
    res.status(200).json(openapiDocument);
  });

  app.use("/", authRoutes);
  app.use("/devices", deviceRoutes);
  app.use("/users", userRoutes);
  app.use("/readings", readingRoutes);
  app.use("/sensors", sensorRoutes);
  app.use("/subscriptions", subscriptionRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
