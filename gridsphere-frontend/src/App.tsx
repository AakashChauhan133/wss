import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DeviceProvider } from "./context/DeviceContext";
import AppHeader from "./components/AppHeader";
import BottomNav from "./components/BottomNav";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import DeviceDetail from "./pages/DeviceDetail";
import SensorHistory from "./pages/SensorHistory";
import Profile from "./pages/Profile";
import Plans from "./pages/Plans";
import Unauthorized from "./pages/Unauthorized";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DeviceProvider>
          <div className="app-shell">
            <AppHeader />
            <div style={{ flex: 1 }}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* RBAC: allowedRoles defaults to ["user"] - this app is
                    user-facing only for now. See ProtectedRoute.tsx and
                    the backend's requireRole middleware for the matching
                    server-side enforcement. */}
                <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/devices" element={<Dashboard />} />
                  <Route path="/devices/:deviceId" element={<DeviceDetail />} />
                  <Route path="/devices/:deviceId/sensors/:sensorId/history" element={<SensorHistory />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/plans" element={<Plans />} />
                </Route>
              </Routes>
            </div>
            <BottomNav />
          </div>
        </DeviceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
