import { useEffect, useState } from "react";
import { getWindAnalytics, getRainAnalytics } from "../api/devices";
import { WindAnalytics, RainAnalytics } from "../types";

export default function WindRainAnalytics({ deviceId }: { deviceId: number }) {
  const [wind, setWind] = useState<WindAnalytics | null>(null);
  const [rain, setRain] = useState<RainAnalytics | null>(null);

  useEffect(() => {
    getWindAnalytics(deviceId).then(setWind).catch(() => setWind(null));
    getRainAnalytics(deviceId).then(setRain).catch(() => setRain(null));
  }, [deviceId]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Wind Analytics</span>
        </div>
        <div className="panel-body">
          {!wind || wind.averageSpeedMs === null ? (
            <p className="muted" style={{ margin: 0 }}>
              No wind data yet.
            </p>
          ) : (
            <>
              <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Average
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{wind.averageSpeedMs} m/s</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Max Gust
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{wind.maxGustMs} m/s</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Dominant
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{wind.dominantDirection ?? "—"}</div>
                </div>
              </div>
              {wind.windRose.map((w) => (
                <div key={w.direction} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 32, fontSize: 12 }}>{w.direction}</span>
                  <div style={{ flex: 1, height: 6, background: "var(--hairline)", borderRadius: 999 }}>
                    <div
                      style={{
                        width: `${(w.count / Math.max(...wind.windRose.map((r) => r.count))) * 100}%`,
                        height: "100%",
                        background: "var(--sky)",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>{w.avgSpeedMs} m/s</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Rain Analysis</span>
        </div>
        <div className="panel-body">
          {!rain || rain.weeklyMm === null ? (
            <p className="muted" style={{ margin: 0 }}>
              No rainfall data yet.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Today
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{rain.todayMm} mm</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  This Week
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{rain.weeklyMm} mm</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  This Month
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{rain.monthlyMm} mm</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Max Intensity
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{rain.maxIntensityMmPerHour ?? "—"} mm/h</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
