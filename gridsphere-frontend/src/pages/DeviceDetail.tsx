import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getDeviceHistory, HistoryRange } from "../api/devices";
import { listDeviceSensors, listSensorTypes, updateDeviceSensor } from "../api/sensors";
import { DeviceSensor, SensorReading, SensorType } from "../types";
import AddSensorModal from "../components/AddSensorModal";

type Tab = "history" | "sensors";

const LINE_COLORS = ["#1F6E44", "#E0932E", "#2F86C9", "#D64545", "#9b7fc7"];

export default function DeviceDetail() {
  const { deviceId } = useParams();
  const id = parseInt(deviceId || "0", 10);

  const [tab, setTab] = useState<Tab>("history");
  const [sensors, setSensors] = useState<DeviceSensor[]>([]);
  const [sensorTypes, setSensorTypes] = useState<SensorType[]>([]);
  const [historyReadings, setHistoryReadings] = useState<SensorReading[]>([]);
  const [range, setRange] = useState<HistoryRange>("weekly");
  const [showAddSensor, setShowAddSensor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSensors() {
    try {
      const [deviceSensors, types] = await Promise.all([listDeviceSensors(id), listSensorTypes()]);
      setSensors(deviceSensors);
      setSensorTypes(types);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not load device data");
    }
  }

  useEffect(() => {
    loadSensors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (tab !== "history") return;
    getDeviceHistory(id, range)
      .then(setHistoryReadings)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load history"));
  }, [tab, range, id]);

  const sensorLabelById = useMemo(() => {
    const map = new Map<number, DeviceSensor>();
    sensors.forEach((s) => map.set(s.id, s));
    return map;
  }, [sensors]);

  // Pivot history readings into a wide time series for the chart:
  // [{ time, temp: 23.1, humidity: 60 }, ...]
  const chartData = useMemo(() => {
    const byTime = new Map<string, Record<string, number | string>>();
    for (const r of historyReadings) {
      const sensor = sensorLabelById.get(r.deviceSensorId);
      const label = sensor?.sensorLabel || `sensor_${r.deviceSensorId}`;
      const t = new Date(r.recordedAt).toLocaleString();
      if (!byTime.has(t)) byTime.set(t, { time: t });
      byTime.get(t)![label] = r.value;
    }
    return Array.from(byTime.values()).sort(
      (a, b) => new Date(a.time as string).getTime() - new Date(b.time as string).getTime()
    );
  }, [historyReadings, sensorLabelById]);

  const chartLabels = useMemo(() => {
    const labels = new Set<string>();
    sensors.forEach((s) => labels.add(s.sensorLabel));
    return Array.from(labels);
  }, [sensors]);

  async function toggleSensorActive(sensor: DeviceSensor) {
    try {
      await updateDeviceSensor(sensor.id, { is_active: !sensor.isActive });
      loadSensors();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not update sensor");
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">
            <Link to="/devices" className="muted" style={{ textDecoration: "none" }}>
              ← All devices
            </Link>
          </p>
          <h1 className="page-title">Device #{id}</h1>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="tab-row">
        <button className={`tab-btn ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
          History
        </button>
        <button className={`tab-btn ${tab === "sensors" ? "active" : ""}`} onClick={() => setTab("sensors")}>
          Sensors
        </button>
      </div>

      {tab === "history" && (
        <div className="panel" style={{ marginBottom: 32 }}>
          <div className="panel-header">
            <span className="panel-title">Historical Trend</span>
            <div className="flex-row">
              {(["daily", "weekly", "monthly"] as HistoryRange[]).map((r) => (
                <button
                  key={r}
                  className="btn-ghost"
                  style={{ borderColor: range === r ? "var(--sky)" : undefined, color: range === r ? "var(--ink)" : undefined }}
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-body">
            {chartData.length === 0 ? (
              <p className="muted">No readings in this range yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" />
                  <XAxis dataKey="time" stroke="var(--ink-dim)" fontSize={11} tick={{ fill: "var(--ink-dim)" }} />
                  <YAxis stroke="var(--ink-dim)" fontSize={11} tick={{ fill: "var(--ink-dim)" }} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--hairline)", fontSize: 12 }}
                    labelStyle={{ color: "var(--ink)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {chartLabels.map((label, idx) => (
                    <Line
                      key={label}
                      type="monotone"
                      dataKey={label}
                      stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                      dot={false}
                      strokeWidth={2}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {tab === "sensors" && (
        <div className="panel" style={{ marginBottom: 32 }}>
          <div className="panel-header">
            <span className="panel-title">Installed Sensors</span>
            <button className="btn-ghost" onClick={() => setShowAddSensor(true)}>
              + Install sensor
            </button>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Type</th>
                  <th>Calibration</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sensors.map((sensor) => {
                  const type = sensorTypes.find((t) => t.id === sensor.sensorTypeId);
                  return (
                    <tr key={sensor.id}>
                      <td>{sensor.sensorLabel}</td>
                      <td>{type?.name || sensor.sensorTypeId}</td>
                      <td>
                        ×{sensor.calibrationScale} +{sensor.calibrationOffset}
                      </td>
                      <td>
                        <span className={`pill ${sensor.isActive ? "on" : "off"}`}>
                          {sensor.isActive ? "active" : "inactive"}
                        </span>
                      </td>
                      <td>
                        <button className="btn-ghost" onClick={() => toggleSensorActive(sensor)}>
                          {sensor.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sensors.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted" style={{ padding: 20 }}>
                      No sensors installed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddSensor && (
        <AddSensorModal
          deviceId={id}
          sensorTypes={sensorTypes}
          onClose={() => setShowAddSensor(false)}
          onCreated={() => {
            setShowAddSensor(false);
            loadSensors();
          }}
        />
      )}
    </div>
  );
}
