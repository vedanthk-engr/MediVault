import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  TrendingUp, 
  AlertTriangle, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  Package,
  Brain,
  Target
} from "lucide-react";

export function PredictiveAnalytics() {
  const reorderSuggestions = useQuery(api.inventory.getPredictiveReorderSuggestions);
  const inventoryAnalytics = useQuery(api.inventory.getInventoryAnalytics, {});

  if (!reorderSuggestions || !inventoryAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <TrendingUp className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const totalSuggestedCost = reorderSuggestions.reduce((sum, suggestion) => sum + suggestion.estimatedCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Predictive Analytics</h1>
          <p className="text-gray-600 mt-2">AI-driven insights and reorder recommendations</p>
        </div>
        <div className="flex items-center space-x-2 text-blue-600">
          <Brain className="w-5 h-5" />
          <span className="text-sm font-medium">AI Powered</span>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Turnover</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{inventoryAnalytics.turnoverRate}x</p>
              <p className="text-sm text-blue-600 mt-1">Annual rate</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Usage</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{inventoryAnalytics.averageDailyUsage}</p>
              <p className="text-sm text-green-600 mt-1">Units per day</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reorder Suggestions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{reorderSuggestions.length}</p>
              <p className="text-sm text-orange-600 mt-1">Items need attention</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suggested Orders Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${totalSuggestedCost.toLocaleString()}</p>
              <p className="text-sm text-purple-600 mt-1">Total estimated cost</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly Detection */}
      {inventoryAnalytics.anomalies.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Usage Anomalies Detected</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {inventoryAnalytics.anomalies.map((anomaly, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">{anomaly.type.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-sm text-orange-800 mt-1">{anomaly.message}</p>
                    <p className="text-xs text-orange-600 mt-2">
                      Threshold: {anomaly.threshold} units • Actual: {anomaly.value} units
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reorder Suggestions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Smart Reorder Suggestions</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Brain className="w-4 h-4" />
              <span>AI Generated</span>
            </div>
          </div>
        </div>
        
        {reorderSuggestions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {reorderSuggestions.map((suggestion) => (
              <div key={suggestion.supply._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">{suggestion.supply.name}</h4>
                      <p className="text-sm text-gray-600">SKU: {suggestion.supply.sku}</p>
                      <p className="text-sm text-gray-500">Supplier: {suggestion.supplier?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{suggestion.reason}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="font-semibold text-gray-900">{suggestion.currentStock}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Days Until Stockout</p>
                      <p className="font-semibold text-red-600">{suggestion.daysUntilStockout}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Suggested Quantity</p>
                      <p className="font-semibold text-gray-900">{suggestion.suggestedQuantity}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Estimated Cost</p>
                      <p className="font-semibold text-gray-900">${suggestion.estimatedCost.toLocaleString()}</p>
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center space-x-1 ${getUrgencyColor(suggestion.urgency)}`}>
                      {getUrgencyIcon(suggestion.urgency)}
                      <span className="capitalize">{suggestion.urgency}</span>
                    </div>
                    
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      Create Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reorder Suggestions</h3>
            <p className="text-gray-500">All supplies are adequately stocked based on current usage patterns</p>
          </div>
        )}
      </div>
    </div>
  );
}
