import { useState } from "react";
import { Link } from "react-router-dom";
import { useDevices } from "../context/DeviceContext";
import AddDeviceModal from "../components/AddDeviceModal";

export default function Dashboard() {
  const { devices, isLoading, error, refresh } = useDevices();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Fleet Overview</p>
          <h1 className="page-title">Devices</h1>
        </div>
        <button className="btn-primary" style={{ width: "auto" }} onClick={() => setShowModal(true)}>
          + Register device
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {isLoading && devices.length === 0 && <div className="loading-text">Reading fleet status…</div>}

      {!isLoading && devices.length === 0 && (
        <div className="empty-state panel">
          <h3>No devices yet</h3>
          <p>Register your first weather station device to start seeing live readings.</p>
        </div>
      )}

      {devices.length > 0 && (
        <div className="device-grid">
          {devices.map((device) => (
            <Link key={device.id} to={`/devices/${device.id}`} className="device-card">
              <div className="device-card-top">
                <span className="status-label">
                  <span className={`status-led ${device.status === "active" ? "active" : "inactive"}`} />
                  {device.status}
                </span>
                <span className="device-uid">{device.deviceUid}</span>
              </div>
              <div className="device-name">{device.deviceName || device.deviceUid}</div>
              <div className="device-location">{device.locationName || "No location set"}</div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <AddDeviceModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
