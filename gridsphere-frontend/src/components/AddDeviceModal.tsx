import { FormEvent, useState } from "react";
import { createDevice, DeviceCreatePayload } from "../api/devices";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddDeviceModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<DeviceCreatePayload>({
    device_uid: "",
    device_name: "",
    location_name: "",
    frequency: 5,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createDevice(form);
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not register device");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <p className="section-title">Register Device</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Device UID *</label>
          <input
            required
            placeholder="esp32-001"
            value={form.device_uid}
            onChange={(e) => setForm({ ...form, device_uid: e.target.value })}
          />
        </div>

        <div className="field">
          <label>Display name</label>
          <input
            placeholder="North Field Hub"
            value={form.device_name}
            onChange={(e) => setForm({ ...form, device_name: e.target.value })}
          />
        </div>

        <div className="field">
          <label>Location name</label>
          <input
            placeholder="North Field"
            value={form.location_name}
            onChange={(e) => setForm({ ...form, location_name: e.target.value })}
          />
        </div>

        <div className="field">
          <label>Reporting frequency (minutes)</label>
          <input
            type="number"
            min={1}
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: parseInt(e.target.value, 10) || 5 })}
          />
        </div>

        <div className="flex-row" style={{ marginTop: 20 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <div className="spacer" />
          <button type="submit" className="btn-primary" style={{ width: "auto" }} disabled={isSubmitting}>
            {isSubmitting ? "Registering…" : "Register device"}
          </button>
        </div>
      </form>
    </div>
  );
}
