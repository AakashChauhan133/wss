# GridSphere Frontend — Station Console

A React + TypeScript web app for the GridSphere Node.js API, restyled to
match the GridSphere mobile app: green instrument header, white field-data
cards, bottom tab navigation. Built for **field-operator users** — there is
currently no admin UI.

## RBAC
Routes are wrapped in `<ProtectedRoute allowedRoles={["user"]} />`
(`src/components/ProtectedRoute.tsx`). Right now `"user"` is the only role
in the system, matching the backend (self-registration always creates
`role: "user"` — see the Node API's `src/services/userRepository.ts`). The
backend enforces the same rule server-side via `requireRole("user")`
middleware, so this frontend guard is a UX nicety, not the security
boundary. Adding an admin section later just means passing a different
`allowedRoles` array to a new route, and adding a matching `requireRole`
on the backend.

## Pages actually built (all backed by real API routes)
- **/login**, **/register** — auth
- **/** (Home) — now organized into 4 in-page tabs instead of one long
  stacked scroll (see "UI revamp" below): **Conditions**, **Advisory**,
  **Insights**, **Forecast**. The device offline/inactive banner and
  Field Information card sit above the tabs since they're always
  relevant regardless of which tab is open.
- **/devices/:id/sensors/:sensorId/history** — per-sensor history, opened
  by clicking a Home readout tile. Day/Week/Month tabs, Max/Min/Average
  stat tiles, and a trend chart. "Day" = today since midnight, "Week" =
  rolling last 7 days, "Month" = the current calendar month to date (not a
  rolling 30-day window) - all computed server-side by `GET /devices/:id/history?range=...`.
- **/devices** — device list/grid, "Register device"
- **/devices/:id** — History (chart) + Sensors (install/activate/deactivate) tabs
- **/profile** — account info, role badge, logout, link to subscription plans
- **/plans** — subscription plans (real route, just wasn't in your screenshots)

## UI revamp: tabs instead of one stacked page
Home used to stack Field Information → Crop → Advisory → Forecast →
Insights → Field Conditions in a single long scroll. It's now:
- **Field Information** (always visible, above the tabs) — device
  identity/status, since that's relevant no matter what you're looking at
- **Conditions** tab — the live readout tiles (was "Field Conditions")
- **Advisory** tab — Crop selector + AI Advisory panel together, since
  picking a crop is what unlocks the advisory
- **Insights** tab — rule-based insights + derived metrics (dew point,
  heat index, VPD, ET0)
- **Forecast** tab — the 7-day forecast

Tab state is just local `useState` in `src/pages/Home.tsx` (no routing
needed) using the same `.tab-row`/`.tab-btn` styles already used on the
device detail page's History/Sensors tabs, so it's visually consistent
rather than a one-off pattern.

## Features added on top of the mobile-app redesign
- **Field Information** now shows battery/signal/firmware if the device
  reports them (new nullable backend fields - omitted entirely if absent,
  no fake defaults), plus reporting frequency.
- **Device status is now three states, not two**: "Online" (active),
  "Offline" (was active, stopped reporting within frequency×2 minutes -
  red banner), or "Not yet connected" (never sent a reading - neutral
  banner, since that's not the same situation as something breaking).
- **7-Day Forecast panel** on Home — free, keyless weather forecast
  (Open-Meteo) for the device's own location. Shown only if the device has
  latitude/longitude set.
- **Rule-Based Insights panel** on Home — dew point / heat index / VPD /
  evapotranspiration (ET0) computed from real data, plus simple threshold
  advisories (e.g. fungal-risk humidity+wind combination, spray-window
  wind limits, frost/heat-stress warnings). Explicitly labeled "not AI/ML"
  in the UI - these are fixed rules, not a trained model.
- **New metrics recognized on the Conditions tab**: wind direction (shown
  as degrees + compass label, e.g. "215° SW"), leaf wetness, soil
  temperature, PM1/PM2.5/PM10, CO2, TVOC - see
  `src/utils/metrics.tsx`. Purely a presentation-layer addition; ingestion
  was already fully dynamic, so these "just work" the moment a matching
  sensor is installed (`POST /sensors/device`) - no frontend code needed
  for the data to flow, only for it to look nice.
- **Export CSV** button on the per-sensor history page.

## Crop selection + AI Advisory (DeepSeek)
- **Crop selector** on Home (`src/components/CropSelector.tsx`) — toggle
  buttons for whatever crops exist (`GET /crops` drives the list - fully
  dynamic, not hardcoded to mango/apple, those are just the seed data).
  Selecting a crop calls `POST /devices/:id/crop`.
- **"+ Add crop"** in the same panel — type a name, hit Add. Calls
  `POST /crops` (idempotent server-side) and immediately selects the new
  crop on the current device. Crops are shared/global reference data, so
  anything added here is selectable by every user going forward - see the
  backend README for why that's intentional.
- **AI Advisory panel** (`src/components/AdvisoryPanel.tsx`) — appears
  once a crop is selected. Shows a plain-language summary, a precautions
  list, and pest/fungal disease risks with low/medium/high severity
  badges, all generated by DeepSeek from the device's real current
  conditions (see the backend README for exactly what's sent). Has a
  manual "Refresh" button since each generation is a real, billed API
  call — it isn't re-generated on every page load, just cached-and-shown
  (the panel says "(cached)" when showing a cached result).

## Screens from the mobile app that were intentionally NOT built
There's no backend route or data model behind these, so building the
screens would mean fake/mocked data. Rather than do that, they're left out:

| Mobile screen | Why it's missing |
|---|---|
| **Protection → Fungal Risk** | No disease-prediction model or route anywhere in the API |
| **Protection → Pest Activity** | Same — no pest-prediction model or route |
| **Soil Health → Spray Timing** | No weather-forecast integration; nothing computes spray windows |
| **Soil Health → Soil Parameters** | No soil-nutrient model (pH, EC, N/P/K, Ca, Mg, S, Iron aren't tracked anywhere) |
| **Alerts → Alert Configuration** | No alerts/notifications/threshold model or route |
| **Farmer Name** field on the device info card | Nothing links a device to an "owner display name" - only to the logged-in user's own account |
| **Leaf Wetness, Rainfall, Surf Temp, Surf Hum, Depth Temp, Depth Hum** on Home | The ingestion endpoint (`GET /readings/add`) only accepts `temp`, `humidity`, `light_intensity`, `pressure`, `wind_speed` as query params — there's no way to get data for these other metrics into the system |

If/when the backend grows routes for any of these (e.g. a `/protection`
router with disease-risk data, or a `/alerts` router with threshold
CRUD), the matching frontend page is a small addition following the same
pattern as the existing pages in `src/pages/`.

## Setup

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
```

`VITE_API_BASE_URL=/api` by default, proxied to `http://localhost:8000`
(the Node backend) via `vite.config.ts` during dev.

```bash
npm run build     # outputs static files to dist/
npm run preview   # serve the production build locally
```

## Architecture notes
- `src/context/AuthContext.tsx` — JWT/user session state
- `src/context/DeviceContext.tsx` — tracks the "currently selected device"
  (shown in the header dropdown), shared between Home and the header
- `src/components/AppHeader.tsx` — green top bar with device switcher + avatar
- `src/components/BottomNav.tsx` — bottom tab bar (only tabs with real routes)
- `src/api/*.ts` — one file per backend router group
- `src/index.css` — all design tokens (colors, radius, shadows) as CSS
  variables at the top; change them there to re-theme
