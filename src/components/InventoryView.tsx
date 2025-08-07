import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Eye,
  X
} from "lucide-react";
import { toast } from "sonner";

export function InventoryView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<string | null>(null);
  const [showAddSupply, setShowAddSupply] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);

  const supplies = useQuery(api.supplies.listSupplies, {
    searchTerm: searchTerm || undefined,
    lowStockOnly: showLowStockOnly,
  });

  const supplyDetails = useQuery(
    api.supplies.getSupplyDetails,
    selectedSupply ? { supplyId: selectedSupply as any } : "skip"
  );

  const categories = useQuery(api.categories.listCategories);
  const suppliers = useQuery(api.suppliers.listSuppliers);

  if (!supplies || !categories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'low': return <Clock className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">Track and manage your medical supplies</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowAddBatch(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock</span>
          </button>
          <button 
            onClick={() => setShowAddSupply(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supply</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search supplies by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Low stock only</span>
            </label>
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Supplies ({supplies.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {supplies.map((supply) => (
                <div
                  key={supply._id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedSupply(supply._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{supply.name}</h4>
                          <p className="text-sm text-gray-600">SKU: {supply.sku}</p>
                          <p className="text-sm text-gray-500">{supply.category}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {supply.currentStock} {supply.unitOfMeasure}
                        </p>
                        <p className="text-sm text-gray-500">
                          Min: {supply.minimumStock}
                        </p>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center space-x-1 ${getStatusColor(supply.stockStatus)}`}>
                        {getStatusIcon(supply.stockStatus)}
                        <span className="capitalize">{supply.stockStatus}</span>
                      </div>

                      {supply.expiringQuantity > 0 && (
                        <div className="text-orange-600">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Supply Details Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Supply Details</h3>
          </div>
          <div className="p-6">
            {selectedSupply && supplyDetails ? (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{supplyDetails.supply.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">{supplyDetails.supply.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Current Stock</p>
                      <p className="font-semibold">{supplyDetails.analytics.currentStock}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Value</p>
                      <p className="font-semibold">${supplyDetails.analytics.totalValue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Daily Usage</p>
                      <p className="font-semibold">{supplyDetails.analytics.averageDailyUsage.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Days Until Stockout</p>
                      <p className="font-semibold">
                        {supplyDetails.analytics.daysUntilStockout || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Recent Batches</h5>
                  <div className="space-y-2">
                    {supplyDetails.batches.slice(0, 3).map((batch) => (
                      <div key={batch._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">Batch {batch.batchNumber}</p>
                          <p className="text-xs text-gray-500">
                            {batch.expirationDate 
                              ? `Expires ${new Date(batch.expirationDate).toLocaleDateString()}`
                              : 'No expiration'
                            }
                          </p>
                        </div>
                        <p className="text-sm font-semibold">{batch.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>View Full Details</span>
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Select a supply to view details
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Supply Modal */}
      {showAddSupply && (
        <AddSupplyModal 
          onClose={() => setShowAddSupply(false)}
          categories={categories || []}
          suppliers={suppliers || []}
        />
      )}

      {/* Add Batch Modal */}
      {showAddBatch && (
        <AddBatchModal 
          onClose={() => setShowAddBatch(false)}
          supplies={supplies || []}
        />
      )}
    </div>
  );
}

// Add Supply Modal Component
function AddSupplyModal({ onClose, categories, suppliers }: any) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    supplierId: "",
    sku: "",
    barcode: "",
    unitOfMeasure: "",
    unitCost: 0,
    minimumStock: 0,
    maximumStock: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    isControlledSubstance: false,
    requiresRefrigeration: false,
    shelfLifeDays: 0,
  });

  const createSupply = useMutation(api.supplies.createSupply);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSupply({
        ...formData,
        categoryId: formData.categoryId as any,
        supplierId: formData.supplierId as any,
        shelfLifeDays: formData.shelfLifeDays || undefined,
      });
      toast.success("Supply created successfully");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to create supply");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Add New Supply</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map((cat: any) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
              <select
                required
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((sup: any) => (
                  <option key={sup._id} value={sup._id}>{sup.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit of Measure</label>
              <input
                type="text"
                required
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., pieces, boxes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock</label>
              <input
                type="number"
                required
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Stock</label>
              <input
                type="number"
                required
                value={formData.maximumStock}
                onChange={(e) => setFormData({ ...formData, maximumStock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Point</label>
              <input
                type="number"
                required
                value={formData.reorderPoint}
                onChange={(e) => setFormData({ ...formData, reorderPoint: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Qty</label>
              <input
                type="number"
                required
                value={formData.reorderQuantity}
                onChange={(e) => setFormData({ ...formData, reorderQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Life (Days)</label>
            <input
              type="number"
              value={formData.shelfLifeDays}
              onChange={(e) => setFormData({ ...formData, shelfLifeDays: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Leave empty if no expiration"
            />
          </div>

          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isControlledSubstance}
                onChange={(e) => setFormData({ ...formData, isControlledSubstance: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Controlled Substance</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.requiresRefrigeration}
                onChange={(e) => setFormData({ ...formData, requiresRefrigeration: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Requires Refrigeration</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Supply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Batch Modal Component
function AddBatchModal({ onClose, supplies }: any) {
  const [formData, setFormData] = useState({
    supplyId: "",
    batchNumber: "",
    quantity: 0,
    expirationDate: "",
    cost: 0,
    location: "",
    notes: "",
  });

  const addInventoryBatch = useMutation(api.inventory.addInventoryBatch);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expirationTimestamp = formData.expirationDate 
        ? new Date(formData.expirationDate).getTime() 
        : undefined;

      await addInventoryBatch({
        supplyId: formData.supplyId as any,
        batchNumber: formData.batchNumber,
        quantity: formData.quantity,
        expirationDate: expirationTimestamp,
        cost: formData.cost,
        location: formData.location,
        notes: formData.notes || undefined,
      });
      toast.success("Inventory batch added successfully");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to add inventory batch");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Add Inventory Batch</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supply</label>
            <select
              required
              value={formData.supplyId}
              onChange={(e) => setFormData({ ...formData, supplyId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Supply</option>
              {supplies.map((supply: any) => (
                <option key={supply._id} value={supply._id}>{supply.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
              <input
                type="text"
                required
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost per Unit ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Ward A, Pharmacy"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
            <input
              type="date"
              value={formData.expirationDate}
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
