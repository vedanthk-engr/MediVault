import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Settings,
  Calendar,
  BarChart3,
  Scan,
  Brain
} from "lucide-react";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'scanner', label: 'Barcode Scanner', icon: Scan },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'predictive', label: 'AI Insights', icon: Brain },
  { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
  { id: 'expiring', label: 'Expiring Items', icon: Calendar },
  { id: 'suppliers', label: 'Suppliers', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">MedStock</h2>
            <p className="text-xs text-gray-500">Inventory System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.label}</span>
                  {item.id === 'predictive' && (
                    <span className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                      AI
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-900">Need Help?</p>
          <p className="text-xs text-blue-700 mt-1">Contact support for assistance</p>
        </div>
      </div>
    </div>
  );
}
