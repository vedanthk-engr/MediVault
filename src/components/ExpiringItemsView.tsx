import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { 
  Calendar, 
  AlertTriangle, 
  Package, 
  DollarSign,
  Clock,
  Filter,
  Download,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

export function ExpiringItemsView() {
  const [daysAhead, setDaysAhead] = useState(30);
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);

  const expiringItems = useQuery(api.dashboard.getExpiringItems, { daysAhead });

  if (!expiringItems) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredItems = showExpiredOnly 
    ? expiringItems.filter(item => item.isExpired)
    : expiringItems;

  const expiredItems = expiringItems.filter(item => item.isExpired);
  const expiringCount = expiringItems.filter(item => !item.isExpired && item.daysUntilExpiration !== null && item.daysUntilExpiration <= 7).length;
  const totalValue = filteredItems.reduce((sum, item) => sum + item.value, 0);

  const getUrgencyColor = (daysUntilExpiration: number | null, isExpired: boolean) => {
    if (isExpired) return 'bg-red-100 text-red-800 border-red-200';
    if (daysUntilExpiration === null) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (daysUntilExpiration <= 3) return 'bg-red-100 text-red-800 border-red-200';
    if (daysUntilExpiration <= 7) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (daysUntilExpiration <= 14) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getUrgencyIcon = (daysUntilExpiration: number | null, isExpired: boolean) => {
    if (isExpired) return <AlertTriangle className="w-4 h-4" />;
    if (daysUntilExpiration === null) return <Package className="w-4 h-4" />;
    if (daysUntilExpiration <= 7) return <Clock className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expiring Items</h1>
          <p className="text-gray-600 mt-2">
            {expiredItems.length} expired • {expiringCount} expiring soon
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired Items</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{expiredItems.length}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{expiringCount}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value at Risk</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${totalValue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showExpiredOnly}
                onChange={(e) => setShowExpiredOnly(e.target.checked)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Expired items only</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 14 days</option>
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
              <option value={90}>Next 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Items ({filteredItems.length})
          </h3>
        </div>
        
        {filteredItems.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <div key={item._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.supply}</h4>
                      <p className="text-sm text-gray-600">Batch: {item.batchNumber}</p>
                      <p className="text-sm text-gray-500">Category: {item.category}</p>
                      <p className="text-sm text-gray-500">Location: {item.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{item.quantity} units</p>
                      <p className="text-sm text-gray-600">${item.value.toFixed(2)} value</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {item.expirationDate 
                          ? new Date(item.expirationDate).toLocaleDateString()
                          : 'No expiration'
                        }
                      </p>
                      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full border text-sm font-medium ${getUrgencyColor(item.daysUntilExpiration, item.isExpired)}`}>
                        {getUrgencyIcon(item.daysUntilExpiration, item.isExpired)}
                        <span>
                          {item.isExpired 
                            ? 'Expired' 
                            : item.daysUntilExpiration !== null 
                              ? `${item.daysUntilExpiration} days`
                              : 'No expiration'
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expiring items</h3>
            <p className="text-gray-500">
              {showExpiredOnly 
                ? "No expired items found" 
                : "All items are within safe expiration dates"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
