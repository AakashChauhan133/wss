/**
 * Derived metrics computed purely from temperature + humidity readings
 * you already collect. No external calls, no invented data - if a device
 * hasn't reported temp/humidity, these simply return null.
 *
 * Formulas used (all standard, widely-cited meteorological approximations):
 *  - Dew Point: Magnus-Tetens approximation
 *  - Heat Index: NOAA/Rothfusz regression (valid above ~27°C / 40% RH;
 *    below that range it isn't meaningful, so we just return the air
 *    temperature - "feels like" only diverges from actual temp in heat)
 *  - VPD (Vapor Pressure Deficit): saturation vapor pressure minus actual
 *    vapor pressure, in kPa - the standard agronomy figure for irrigation/
 *    disease-risk decisions
 */

export interface DerivedMetrics {
  dewPointC: number | null;
  heatIndexC: number | null;
  vpdKPa: number | null;
}

/** Saturation vapor pressure (kPa) at a given temperature (°C), Tetens formula. */
function saturationVaporPressureKPa(tempC: number): number {
  return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

export function calculateDewPointC(tempC: number, humidityPct: number): number {
  const a = 17.27;
  const b = 237.3;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidityPct / 100);
  return (b * alpha) / (a - alpha);
}

export function calculateHeatIndexC(tempC: number, humidityPct: number): number {
  // Rothfusz regression is defined in Fahrenheit.
  const tempF = tempC * (9 / 5) + 32;
  if (tempF < 80) {
    // Below this range the "feels like" effect is negligible - return actual temp.
    return tempC;
  }
  const T = tempF;
  const R = humidityPct;
  const hiF =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;
  return ((hiF - 32) * 5) / 9;
}

export function calculateVpdKPa(tempC: number, humidityPct: number): number {
  const svp = saturationVaporPressureKPa(tempC);
  const avp = svp * (humidityPct / 100);
  return svp - avp;
}

export function calculateDerivedMetrics(tempC: number | null, humidityPct: number | null): DerivedMetrics {
  if (tempC === null || humidityPct === null) {
    return { dewPointC: null, heatIndexC: null, vpdKPa: null };
  }
  return {
    dewPointC: Math.round(calculateDewPointC(tempC, humidityPct) * 10) / 10,
    heatIndexC: Math.round(calculateHeatIndexC(tempC, humidityPct) * 10) / 10,
    vpdKPa: Math.round(calculateVpdKPa(tempC, humidityPct) * 100) / 100,
  };
}
