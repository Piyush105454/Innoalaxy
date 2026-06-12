import { Routes, Route } from "react-router-dom";
import { AuditPage } from "./pages/AuditPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { Home } from "./pages/Home";
import { OnboardingModal } from "./components/OnboardingModal";

export default function App() {
  return (
    <>
      <OnboardingModal />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/audit/*" element={<AuditPage />} />
        <Route path="/dashboard/*" element={<DashboardPage />} />
        <Route path="/admin/*" element={<AdminDashboardPage />} />
      </Routes>
    </>
  );
}
