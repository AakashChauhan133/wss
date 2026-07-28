import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminStats, SystemStats } from "../api/admin";

export default function AdminOverview() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => setError(err?.response?.data?.detail || "Could not load stats"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Admin</p>
          <h1 className="page-title">Overview</h1>
        </div>
        <div className="flex-row">
          <Link className="btn-secondary" to="/admin/devices">
            Manage Devices
          </Link>
          <Link className="btn-secondary" to="/admin/users">
            Manage Users
          </Link>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {isLoading && <div className="loading-text">Loading stats…</div>}

      {stats && (
        <div className="stats-grid">
          <div className="panel">
            <p className="section-title">Users</p>
            <p>Total: {stats.users.total}</p>
            <p>Active: {stats.users.active}</p>
            <p>New (24h): {stats.users.newLast24h}</p>
          </div>
          <div className="panel">
            <p className="section-title">Devices</p>
            <p>Total: {stats.devices.total}</p>
            <p>Online: {stats.devices.online}</p>
            <p>New (24h): {stats.devices.newLast24h}</p>
          </div>
          <div className="panel">
            <p className="section-title">Readings</p>
            <p>Total: {stats.readings.total}</p>
            <p>Last 24h: {stats.readings.last24h}</p>
          </div>
          <div className="panel">
            <p className="section-title">Other</p>
            <p>Sensors installed: {stats.sensors.installed}</p>
            <p>Crops: {stats.crops}</p>
            <p>Subscriptions: {stats.subscriptions}</p>
          </div>
        </div>
      )}
    </div>
  );
}