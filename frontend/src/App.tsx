import { AuditPage } from "./pages/AuditPage";
import { DashboardPage } from "./pages/DashboardPage";
import { Home } from "./pages/Home";
import { OnboardingModal } from "./components/OnboardingModal";

export default function App() {
  const path = window.location.pathname;
  
  const renderPage = () => {
    if (path.startsWith("/audit")) return <AuditPage />;
    if (path.startsWith("/dashboard")) return <DashboardPage />;
    return <Home />;
  };

  return (
    <>
      {renderPage()}
      <OnboardingModal />
    </>
  );
}

