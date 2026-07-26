import { Request, Response } from "express";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import * as readingRepository from "../services/readingRepository";

function toFloatOrUndefined(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = parseFloat(v as string);
  return isNaN(n) ? undefined : n;
}

/**
 * GET /readings/add
 * Equivalent of app/routers/reading_router.py -> add_reading
 * IoT devices hit this via GET to log data; translates hardware payload
 * into the EAV-style sensor_readings table via active device_sensors.
 *
 * Extended sensor metrics beyond the original 5 (temp, humidity,
 * light_intensity, pressure, wind_speed): rainfall, soil_moisture,
 * soil_temp, solar_radiation, uv_index. These only get stored if the
 * device has a matching device_sensor installed (via POST /sensors/device)
 * with that exact label - same pattern as the original 5, no special-casing.
 *
 * Also accepts device-health telemetry as separate query params (battery,
 * is_solar_charging, signal_strength_dbm, firmware_version), which update
 * the Device row directly rather than being stored as sensor readings,
 * since they describe the device itself, not a field condition.
 *
 * FIX: the original endpoint never updated device.status/lastSeenAt on
 * ingestion, so "Device Online/Offline" and "Last Sync Time" could never
 * actually reflect reality. Every successful ingestion now marks the
 * device active and stamps lastSeenAt.
 */
export async function addReading(req: Request, res: Response): Promise<void> {
  const dId = parseInt(req.query.d_id as string, 10);
  const temp = toFloatOrUndefined(req.query.temp);
  const humidity = toFloatOrUndefined(req.query.humidity);
  const lightIntensity = toFloatOrUndefined(req.query.light_intensity);
  const pressure = toFloatOrUndefined(req.query.pressure);
  const windSpeed = toFloatOrUndefined(req.query.wind_speed);
  const rainfall = toFloatOrUndefined(req.query.rainfall);
  const soilMoisture = toFloatOrUndefined(req.query.soil_moisture);
  const soilTemp = toFloatOrUndefined(req.query.soil_temp);
  const solarRadiation = toFloatOrUndefined(req.query.solar_radiation);
  const uvIndex = toFloatOrUndefined(req.query.uv_index);
  const timestamp = req.query.timestamp as string | undefined;

  const batteryLevel = toFloatOrUndefined(req.query.battery);
  const signalStrengthDbm = toFloatOrUndefined(req.query.signal_strength_dbm);
  const firmwareVersion = req.query.firmware_version as string | undefined;
  const isSolarChargingRaw = req.query.is_solar_charging as string | undefined;
  const isSolarCharging =
    isSolarChargingRaw === undefined ? undefined : isSolarChargingRaw === "true" || isSolarChargingRaw === "1";

  let parsedTime: Date | null = null;
  if (timestamp) {
    const t = new Date(timestamp);
    if (!isNaN(t.getTime())) {
      parsedTime = t;
    }
  }
  if (!parsedTime) {
    parsedTime = new Date();
  }

  const activeSensors = await prisma.deviceSensor.findMany({
    where: { deviceId: dId, isActive: true },
  });

  const sensorMap: Record<string, number> = {};
  for (const sensor of activeSensors) {
    if (sensor.sensorLabel) {
      sensorMap[sensor.sensorLabel.toLowerCase()] = sensor.id;
    }
  }

  const readingsToInsert: { device_sensor_id: number; value: number; recorded_at: Date; quality_flag: string }[] = [];

  const appendIfExists = (label: string, value: number | undefined) => {
    if (value !== undefined && label in sensorMap) {
      readingsToInsert.push({
        device_sensor_id: sensorMap[label],
        value,
        recorded_at: parsedTime as Date,
        quality_flag: "GOOD",
      });
    }
  };

  appendIfExists("temp", temp);
  appendIfExists("humidity", humidity);
  appendIfExists("light_intensity", lightIntensity);
  appendIfExists("pressure", pressure);
  appendIfExists("wind_speed", windSpeed);
  appendIfExists("rainfall", rainfall);
  appendIfExists("soil_moisture", soilMoisture);
  appendIfExists("soil_temp", soilTemp);
  appendIfExists("solar_radiation", solarRadiation);
  appendIfExists("uv_index", uvIndex);

  if (readingsToInsert.length > 0) {
    await readingRepository.insertBulkReadings(readingsToInsert);
  }

  const deviceUpdate: Record<string, unknown> = {
    status: "active",
    lastSeenAt: parsedTime,
  };
  if (batteryLevel !== undefined) deviceUpdate.batteryLevel = batteryLevel;
  if (signalStrengthDbm !== undefined) deviceUpdate.signalStrengthDbm = Math.round(signalStrengthDbm);
  if (firmwareVersion !== undefined) deviceUpdate.firmwareVersion = firmwareVersion;
  if (isSolarCharging !== undefined) deviceUpdate.isSolarCharging = isSolarCharging;

  await prisma.device.updateMany({ where: { id: dId }, data: deviceUpdate });

  res.status(200).type("text/plain").send("Readings added successfully");
}

/**
 * GET /readings/:d_id/history
 * Equivalent of app/routers/reading_router.py -> get_device_history
 */
export async function getDeviceHistory(req: Request, res: Response): Promise<void> {
  const dId = parseInt(req.params.d_id, 10);
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const userId = req.currentUser!.id;

  const device = await prisma.device.findFirst({
    where: { id: dId, userAssociations: { some: { userId } } },
  });

  if (!device) {
    throw new ApiError(404, "Device not found or not authorized");
  }

  const readings = await prisma.sensorReading.findMany({
    where: { deviceSensor: { deviceId: dId } },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });

  res.status(200).json({ status: "success", data: readings });
}
