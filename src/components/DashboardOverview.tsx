import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Clock,
  ShoppingCart,
  Activity,
  Users
} from "lucide-react";
import { toast } from "sonner";

export function DashboardOverview() {
  const dashboardStats = useQuery(api.dashboard.getDashboardStats);
  const initializeSampleData = useMutation(api.sampleData.initializeSampleData);

  const handleInitializeData = async () => {
    try {
      const result = await initializeSampleData({});
      toast.success(result);
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize sample data");
    }
  };

  if (!dashboardStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { overview, recentAlerts, recentMovements } = dashboardStats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">Welcome to MedStock Pro - Your medical inventory at a glance</p>
        </div>
        <button
          onClick={handleInitializeData}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Initialize Sample Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Supplies</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{overview.totalSupplies}</p>
              <p className="text-sm text-blue-600 mt-1">Active items</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Stock</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{overview.criticalStockCount}</p>
              <p className="text-sm text-red-600 mt-1">Need immediate attention</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{overview.lowStockCount}</p>
              <p className="text-sm text-yellow-600 mt-1">Below minimum levels</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
              <p className="text-3xl font-bold text-green-600 mt-2">${overview.totalValue.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">Current worth</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expiring Items</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{overview.expiringItemsCount}</p>
              <p className="text-sm text-gray-500 mt-1">Next 30 days</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{overview.pendingOrdersCount}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting delivery</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Status</p>
              <p className="text-2xl font-bold text-green-600 mt-2">Operational</p>
              <p className="text-sm text-gray-500 mt-1">All systems running</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
          </div>
          <div className="p-6">
            {recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {recentAlerts.slice(0, 5).map((alert) => (
                  <div key={alert._id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'high' ? 'bg-orange-500' :
                      alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {alert.supplyName} • {new Date(alert._creationTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent alerts</p>
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Stock Movements</h3>
          </div>
          <div className="p-6">
            {recentMovements.length > 0 ? (
              <div className="space-y-4">
                {recentMovements.slice(0, 5).map((movement) => (
                  <div key={movement._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        movement.movementType === 'in' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Package className={`w-4 h-4 ${
                          movement.movementType === 'in' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{movement.supplyName}</p>
                        <p className="text-xs text-gray-500">
                          {movement.reason} • {movement.userName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        movement.movementType === 'in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.movementType === 'in' ? '+' : '-'}{movement.quantity}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(movement._creationTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent movements</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
