import { apiClient } from "./client";
import { Device, ForecastResult, Insights, AiAdvisory, WindAnalytics, RainAnalytics, ChatMessage } from "../types";

export interface DeviceCreatePayload {
  device_uid: string;
  device_name?: string;
  description?: string;
  frequency?: number;
  location_name?: string;
  latitude?: number;
  longitude?: number;
}

export async function listDevices(): Promise<Device[]> {
  const { data } = await apiClient.get<Device[]>("/devices/");
  return data;
}

export async function createDevice(payload: DeviceCreatePayload): Promise<Device> {
  const { data } = await apiClient.post<Device>("/devices/", payload);
  return data;
}

export async function getLiveData(deviceId: number) {
  const { data } = await apiClient.get(`/devices/${deviceId}/live-data`);
  return data.data;
}

export type HistoryRange = "daily" | "weekly" | "monthly";

export async function getDeviceHistory(deviceId: number, range: HistoryRange = "weekly") {
  const { data } = await apiClient.get(`/devices/${deviceId}/history`, { params: { range } });
  return data.data;
}

export async function getForecast(deviceId: number): Promise<ForecastResult> {
  const { data } = await apiClient.get(`/devices/${deviceId}/forecast`);
  return data.data;
}

export async function getInsights(deviceId: number): Promise<Insights> {
  const { data } = await apiClient.get(`/devices/${deviceId}/insights`);
  return data.data;
}

/**
 * AI-generated, crop-specific advisory (DeepSeek). Requires the device to
 * have a crop set (POST /devices/:id/crop) - throws 400 otherwise.
 * Cached server-side for up to an hour; pass refresh=true to force a new
 * (billed) generation.
 */
export async function getAdvisory(deviceId: number, refresh = false): Promise<AiAdvisory> {
  const { data } = await apiClient.get(`/devices/${deviceId}/advisory`, { params: refresh ? { refresh: true } : {} });
  return data.data;
}

/**
 * Downloads the CSV export for a device's history. Done via a blob fetch
 * (rather than a plain <a href>) because the endpoint requires the
 * Authorization header, which a bare link can't send.
 */
export async function downloadHistoryCsv(deviceId: number, range: HistoryRange): Promise<void> {
  const response = await apiClient.get(`/devices/${deviceId}/history/export`, {
    params: { range },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `device-${deviceId}-history-${range}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function getWindAnalytics(deviceId: number, range = "weekly"): Promise<WindAnalytics> {
  const { data } = await apiClient.get(`/devices/${deviceId}/wind-analytics`, { params: { range } });
  return data.data;
}

export async function getRainAnalytics(deviceId: number): Promise<RainAnalytics> {
  const { data } = await apiClient.get(`/devices/${deviceId}/rain-analytics`);
  return data.data;
}

export async function getChatHistory(deviceId: number): Promise<ChatMessage[]> {
  const { data } = await apiClient.get(`/devices/${deviceId}/chat`);
  return data.data;
}

export async function sendChatMessage(deviceId: number, message: string): Promise<string> {
  const { data } = await apiClient.post(`/devices/${deviceId}/chat`, { message });
  return data.data.reply;
}
