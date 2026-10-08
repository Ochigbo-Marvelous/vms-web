import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import CreateOrgPage from "./pages/CreateOrgPage";
import JoinPage from "./pages/JoinPage";
import DeskHomePage from "./pages/DeskHomePage";
import PeoplePage from "./pages/PeoplePage";
import StaffVisitorsPage from "./pages/StaffVisitorsPage";
import GatePage from "./pages/GatePage";
import AuditPage from "./pages/AuditPage";
import { DeskShell } from "./desk/DeskShell";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/create" element={<CreateOrgPage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/join/:code" element={<JoinPage />} />
      <Route path="/desk" element={<Navigate to="/admin" replace />} />
      <Route path="/desk/people" element={<Navigate to="/admin/people" replace />} />

      <Route element={<DeskShell allow="admin" />}>
        <Route path="/admin" element={<DeskHomePage />} />
        <Route path="/admin/visitors" element={<StaffVisitorsPage />} />
        <Route path="/admin/audit" element={<AuditPage />} />
        <Route path="/admin/people" element={<PeoplePage />} />
        <Route path="/admin/gate" element={<Navigate to="/admin/audit" replace />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>

      <Route element={<DeskShell allow="staff" />}>
        <Route path="/staff" element={<StaffVisitorsPage />} />
      </Route>

      <Route element={<DeskShell allow="security" />}>
        <Route path="/gate" element={<GatePage />} />
      </Route>
    </Routes>
  );
}