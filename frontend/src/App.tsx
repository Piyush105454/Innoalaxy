import { Routes, Route } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useAuditStore } from "./store/auditStore";
import { AuditPage } from "./pages/AuditPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { Home } from "./pages/Home";
import { OnboardingModal } from "./components/OnboardingModal";

function AuthStateListener() {
  const { userId } = useAuth();
  const reset = useAuditStore((s) => s.reset);
  const prevUserId = useRef(userId);

  useEffect(() => {
    if (prevUserId.current !== userId) {
      reset();
      prevUserId.current = userId;
    }
  }, [userId, reset]);

  return null;
}

export default function App() {
  return (
    <>
      <AuthStateListener />
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
