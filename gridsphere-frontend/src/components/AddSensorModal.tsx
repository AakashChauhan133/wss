import { FormEvent, useEffect, useState } from "react";
import { installDeviceSensor } from "../api/sensors";
import { SensorType } from "../types";

interface Props {
  deviceId: number;
  sensorTypes: SensorType[];
  onClose: () => void;
  onCreated: () => void;
}

export default function AddSensorModal({ deviceId, sensorTypes, onClose, onCreated }: Props) {
  const [sensorTypeId, setSensorTypeId] = useState<number | "">("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sensorTypes.length > 0 && sensorTypeId === "") {
      setSensorTypeId(sensorTypes[0].id);
    }
  }, [sensorTypes]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sensorTypeId === "") return;
    setError(null);
    setIsSubmitting(true);
    try {
      await installDeviceSensor({
        device_id: deviceId,
        sensor_type_id: sensorTypeId,
        sensor_label: label,
      });
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not install sensor");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <p className="section-title">Install Sensor</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Sensor type *</label>
          <select
            required
            value={sensorTypeId}
            onChange={(e) => setSensorTypeId(parseInt(e.target.value, 10))}
          >
            {sensorTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Label *</label>
          <input
            required
            placeholder="e.g. temp, humidity, wind_speed"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            Must match the query param the device sends to /readings/add
            (temp, humidity, light_intensity, pressure, wind_speed).
          </p>
        </div>

        <div className="flex-row" style={{ marginTop: 20 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <div className="spacer" />
          <button type="submit" className="btn-primary" style={{ width: "auto" }} disabled={isSubmitting}>
            {isSubmitting ? "Installing…" : "Install sensor"}
          </button>
        </div>
      </form>
    </div>
  );
}
