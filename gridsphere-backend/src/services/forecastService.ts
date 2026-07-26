import { ApiError } from "../utils/ApiError";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

export interface ForecastResult {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

/**
 * Fetches a forecast for a device's coordinates from Open-Meteo
 * (https://open-meteo.com) - a free weather API that requires no API key.
 * Only usable for devices that have latitude/longitude set (see
 * DeviceCreateSchema); if not set, callers should surface that instead of
 * guessing a location.
 *
 * NOTE: requires outbound network access to api.open-meteo.com. If your
 * deployment environment blocks external HTTP calls, this will fail -
 * that's expected, not a bug in this code.
 */
export async function getForecastForCoordinates(latitude: number, longitude: number): Promise<ForecastResult> {
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("hourly", "temperature_2m,precipitation_probability,wind_speed_10m");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    throw new ApiError(502, "Could not reach the weather forecast service");
  }

  if (!response.ok) {
    throw new ApiError(502, "Weather forecast service returned an error");
  }

  const data = (await response.json()) as ForecastResult;
  return data;
}
