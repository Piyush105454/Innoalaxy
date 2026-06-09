import { AuditPage } from "./pages/AuditPage";
import { DashboardPage } from "./pages/DashboardPage";
import { Home } from "./pages/Home";

export default function App() {
  const path = window.location.pathname;
  if (path.startsWith("/audit")) return <AuditPage />;
  if (path.startsWith("/dashboard")) return <DashboardPage />;
  return <Home />;
}

