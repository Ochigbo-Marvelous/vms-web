import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import CreateOrgPage from "./pages/CreateOrgPage";
import JoinPage from "./pages/JoinPage";
import DeskHomePage from "./pages/DeskHomePage";
import PeoplePage from "./pages/PeoplePage";
import { DeskShell } from "./desk/DeskShell";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/create" element={<CreateOrgPage />} />
      <Route path="/join" element={<JoinPage />} />

      <Route element={<DeskShell />}>
        <Route path="/desk" element={<DeskHomePage />} />
        <Route path="/desk/people" element={<PeoplePage />} />
      </Route>
    </Routes>
  );
}