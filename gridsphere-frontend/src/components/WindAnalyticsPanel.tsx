import { useEffect, useState } from "react";
import { getWindAnalytics, HistoryRange } from "../api/devices";
import { WindAnalytics } from "../types";

const RANGE_TABS: { key: HistoryRange; label: string }[] = [
  { key: "daily", label: "Day" },
  { key: "weekly", label: "Week" },
  { key: "monthly", label: "Month" },
];

export default function WindAnalyticsPanel({ deviceId }: { deviceId: number }) {
  const [range, setRange] = useState<HistoryRange>("weekly");
  const [data, setData] = useState<WindAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getWindAnalytics(deviceId, range)
      .then(setData)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load wind analytics"))
      .finally(() => setIsLoading(false));
  }, [deviceId, range]);

  // SAFETY CHECK: ensure data.rose exists before trying to map over it
  const maxCount = data && data.rose ? Math.max(1, ...data.rose.map((r) => r.count)) : 1;
  
  // SAFETY CHECK: ensure data.sampleCount exists before checking speed/direction
  const hasAnyData = data && data.rose && data.sampleCount && (data.sampleCount.speed > 0 || data.sampleCount.direction > 0);

  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="panel-header">
        <span className="panel-title">Wind Analytics</span>
        <div className="flex-row">
          {RANGE_TABS.map((t) => (
            <button
              key={t.key}
              className="btn-ghost"
              style={{
                borderColor: range === t.key ? "var(--brand-green)" : undefined,
                background: range === t.key ? "var(--brand-green)" : undefined,
                color: range === t.key ? "#fff" : undefined,
              }}
              onClick={() => setRange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="panel-body">
        {error && <div className="error-banner">{error}</div>}
        {isLoading && <div className="loading-text">Loading…</div>}

        {!isLoading && data && !hasAnyData && (
          <p className="muted" style={{ margin: 0 }}>
            No wind_speed or wind_direction sensor data in this range yet.
          </p>
        )}

        {!isLoading && hasAnyData && (
          <>
            <div className="readout-grid" style={{ marginBottom: 18 }}>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Average Speed</div>
                <div>
                  <span className="readout-value">{data!.avgSpeedMs ?? "—"}</span>
                  <span className="readout-unit">m/s</span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Gust (max)</div>
                <div>
                  <span className="readout-value">{data!.maxSpeedMs ?? "—"}</span>
                  <span className="readout-unit">m/s</span>
                </div>
              </div>
              <div className="readout-tile" style={{ cursor: "default" }}>
                <div className="readout-label">Dominant Direction</div>
                <div>
                  <span className="readout-value" style={{ fontSize: 20 }}>
                    {data!.dominantDirectionCompass ?? "—"}
                    {data!.dominantDirectionDeg !== null ? ` (${data!.dominantDirectionDeg}°)` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* SAFETY CHECK: double-check data.rose and data.sampleCount.direction before rendering chart */}
            {data && data.rose && data.sampleCount && data.sampleCount.direction > 0 && (
              <>
                <p className="section-title">Wind Rose</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                  {data.rose.map((sector) => (
                    <div key={sector.direction} style={{ flex: 1, textAlign: "center" }}>
                      <div
                        style={{
                          height: `${Math.max(4, (sector.count / maxCount) * 100)}px`,
                          background: sector.count > 0 ? "var(--brand-green)" : "var(--hairline)",
                          borderRadius: 4,
                          marginBottom: 6,
                        }}
                      />
                      <div style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 600 }}>{sector.direction}</div>
                      <div style={{ fontSize: 10, color: "var(--ink-dim)" }}>{sector.count}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}