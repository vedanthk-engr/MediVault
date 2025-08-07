import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Filter,
  Eye
} from "lucide-react";
import { toast } from "sonner";

export function AlertsView() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const alerts = useQuery(api.alerts.getAlerts, {
    unreadOnly: showUnreadOnly || undefined,
    severity: selectedSeverity !== 'all' ? selectedSeverity as any : undefined,
  });

  const markAsRead = useMutation(api.alerts.markAlertAsRead);
  const resolveAlert = useMutation(api.alerts.resolveAlert);

  if (!alerts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAsRead({ alertId: alertId as any });
      toast.success("Alert marked as read");
    } catch (error) {
      toast.error("Failed to mark alert as read");
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert({ alertId: alertId as any });
      toast.success("Alert resolved");
    } catch (error) {
      toast.error("Failed to resolve alert");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5" />;
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <Clock className="w-5 h-5" />;
      default: return <Eye className="w-5 h-5" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return '📦';
      case 'expiring_soon': return '⏰';
      case 'expired': return '❌';
      case 'anomaly': return '🔍';
      case 'reorder_needed': return '🛒';
      default: return '⚠️';
    }
  };

  const unreadCount = alerts.filter(alert => !alert.isRead).length;
  const unresolvedCount = alerts.filter(alert => !alert.isResolved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="text-gray-600 mt-2">
            {unreadCount} unread • {unresolvedCount} unresolved
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Unread only</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Alerts ({alerts.length})
          </h3>
        </div>
        
        {alerts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className={`p-6 transition-colors ${
                  !alert.isRead ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                      {getSeverityIcon(alert.severity)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getTypeIcon(alert.type)}</span>
                      <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                      {!alert.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-2">{alert.message}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Supply: {alert.supplyName}</span>
                      <span>•</span>
                      <span>{new Date(alert._creationTime).toLocaleString()}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    {!alert.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(alert._id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Mark Read
                      </button>
                    )}
                    
                    {!alert.isResolved && (
                      <button
                        onClick={() => handleResolve(alert._id)}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Resolve
                      </button>
                    )}
                    
                    {alert.isResolved && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Resolved</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-500">
              {showUnreadOnly ? "All alerts have been read" : "Your inventory is running smoothly"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
