import React from "react";
import { useLocation } from "react-router-dom";
import { Shell } from "@/components/Shell";
import { DashboardPage } from "./DashboardPage";
import { LeadsPage } from "./LeadsPage";
import { OrdersPage } from "./OrdersPage";
import { ServicePage } from "./ServicePage";
import { ComplaintsPage } from "./ComplaintsPage";
import { InventoryPage } from "./InventoryPage";
import { LedgerPage } from "./LedgerPage";
import { MastersPage } from "./MastersPage";
import { VisitsPage } from "./VisitsPage";
import { useAppState } from "@/hooks/useAppState";
import { ShieldAlert } from "lucide-react";

const Index: React.FC = () => {
  const location = useLocation();
  const { hasReadPermission } = useAppState();

  const getModuleKey = (path: string) => {
    switch (path) {
      case "/":
        return "Leads";
      case "/orders":
        return "Orders";
      case "/service":
        return "Service";
      case "/complaints":
        return "Complaints";
      case "/inventory":
        return "Inventory";
      case "/ledger":
        return "Ledger";
      case "/masters":
        return "Masters";
      case "/dashboard":
        return "Dashboard";
      case "/visits":
        return "Visits";
      default:
        return "";
    }
  };

  const modKey = getModuleKey(location.pathname);
  const canRead = modKey ? hasReadPermission(modKey) : true;

  const renderActivePage = () => {
    if (!canRead) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 animate-scaleUp">
          <div className="h-16 w-16 bg-red-50 border border-red-100 text-red-700 rounded-2xl grid place-items-center shadow-sm">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-800">Access Denied</h1>
            <p className="text-slate-500 text-xs mt-1.5 max-w-xs">
              Your role does not have read access to the <strong>{modKey}</strong> module. Please contact your system administrator.
            </p>
          </div>
        </div>
      );
    }

    switch (location.pathname) {
      case "/":
        return <LeadsPage />;
      case "/orders":
        return <OrdersPage />;
      case "/service":
        return <ServicePage />;
      case "/complaints":
        return <ComplaintsPage />;
      case "/inventory":
        return <InventoryPage />;
      case "/ledger":
        return <LedgerPage />;
      case "/masters":
        return <MastersPage />;
      case "/dashboard":
        return <DashboardPage />;
      case "/visits":
        return <VisitsPage />;
      default:
        return <DashboardPage />; // fallback
    }
  };

  return (
    <Shell>
      {renderActivePage()}
    </Shell>
  );
};

export default Index;
