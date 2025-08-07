import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { InventoryView } from "./InventoryView";
import { AlertsView } from "./AlertsView";
import { AnalyticsView } from "./AnalyticsView";
import { ExpiringItemsView } from "./ExpiringItemsView";
import { SuppliersView } from "./SuppliersView";
import { DashboardOverview } from "./DashboardOverview";
import { PredictiveAnalytics } from "./PredictiveAnalytics";
import { BarcodeScanner } from "./BarcodeScanner";
import { useState, useEffect } from "react";

interface DashboardProps {
  activeView: string;
}

export function Dashboard({ activeView }: DashboardProps) {
  const [showScanner, setShowScanner] = useState(false);

  // Handle scanner view activation
  useEffect(() => {
    if (activeView === 'scanner') {
      setShowScanner(true);
    }
  }, [activeView]);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'inventory':
        return <InventoryView />;
      case 'scanner':
        return <InventoryView />;
      case 'alerts':
        return <AlertsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'predictive':
        return <PredictiveAnalytics />;
      case 'expiring':
        return <ExpiringItemsView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'orders':
        return <div className="text-center py-12 text-gray-500">Purchase Orders view coming soon...</div>;
      case 'settings':
        return <div className="text-center py-12 text-gray-500">Settings view coming soon...</div>;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="space-y-6">
      {renderView()}
      <BarcodeScanner 
        isOpen={showScanner} 
        onClose={() => setShowScanner(false)} 
      />
    </div>
  );
}
