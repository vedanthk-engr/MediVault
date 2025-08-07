import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  Scan, 
  Package, 
  Plus, 
  Minus, 
  Search,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BarcodeScanner({ isOpen, onClose }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [action, setAction] = useState<"lookup" | "receive" | "dispense">("lookup");
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const scanBarcode = useMutation(api.inventory.scanBarcode);

  if (!isOpen) return null;

  const handleScan = async () => {
    if (!barcode.trim()) {
      toast.error("Please enter a barcode");
      return;
    }

    if ((action === "receive" || action === "dispense") && !location.trim()) {
      toast.error("Please enter a location");
      return;
    }

    setIsScanning(true);
    try {
      const result = await scanBarcode({
        barcode: barcode.trim(),
        action,
        quantity: action !== "lookup" ? quantity : undefined,
        location: action !== "lookup" ? location : undefined,
      });
      
      setScanResult(result);
      
      if (action !== "lookup") {
        toast.success(`Successfully ${action === "receive" ? "received" : "dispensed"} ${quantity} units`);
      }
    } catch (error: any) {
      toast.error(error.message || "Scan failed");
      setScanResult(null);
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setBarcode("");
    setQuantity(1);
    setLocation("");
    setScanResult(null);
  };

  // Simulate barcode scanning with common medical supply barcodes
  const simulateScan = (sampleBarcode: string) => {
    setBarcode(sampleBarcode);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Scan className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Barcode Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Scan Action
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setAction("lookup")}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  action === "lookup"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Search className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Lookup</span>
              </button>
              <button
                onClick={() => setAction("receive")}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  action === "receive"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Plus className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Receive</span>
              </button>
              <button
                onClick={() => setAction("dispense")}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  action === "dispense"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Minus className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm font-medium">Dispense</span>
              </button>
            </div>
          </div>

          {/* Barcode Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Scan or enter barcode"
                onKeyPress={(e) => e.key === "Enter" && handleScan()}
              />
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isScanning ? "Scanning..." : "Scan"}
              </button>
            </div>
          </div>

          {/* Sample Barcodes for Demo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sample Barcodes (Demo)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => simulateScan("123456789012")}
                className="text-left p-2 text-sm bg-gray-50 rounded border hover:bg-gray-100"
              >
                123456789012 - Surgical Masks
              </button>
              <button
                onClick={() => simulateScan("234567890123")}
                className="text-left p-2 text-sm bg-gray-50 rounded border hover:bg-gray-100"
              >
                234567890123 - Nitrile Gloves
              </button>
              <button
                onClick={() => simulateScan("345678901234")}
                className="text-left p-2 text-sm bg-gray-50 rounded border hover:bg-gray-100"
              >
                345678901234 - Syringes 10ml
              </button>
              <button
                onClick={() => simulateScan("456789012345")}
                className="text-left p-2 text-sm bg-gray-50 rounded border hover:bg-gray-100"
              >
                456789012345 - Gauze Pads
              </button>
            </div>
          </div>

          {/* Quantity and Location (for receive/dispense) */}
          {action !== "lookup" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Ward A, Pharmacy"
                />
              </div>
            </div>
          )}

          {/* Scan Result */}
          {scanResult && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Scan Result</h4>
              </div>
              
              {scanResult.supply && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">{scanResult.supply.name}</h5>
                      <p className="text-sm text-gray-600">SKU: {scanResult.supply.sku}</p>
                    </div>
                  </div>

                  {action === "lookup" && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Current Stock</p>
                        <p className="font-semibold">{scanResult.currentStock} {scanResult.supply.unitOfMeasure}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Unit Cost</p>
                        <p className="font-semibold">${scanResult.supply.unitCost}</p>
                      </div>
                    </div>
                  )}

                  {action !== "lookup" && scanResult.success && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Previous Stock</p>
                        <p className="font-semibold">{scanResult.previousStock}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">New Stock</p>
                        <p className="font-semibold">{scanResult.newStock}</p>
                      </div>
                    </div>
                  )}

                  {scanResult.batches && scanResult.batches.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Recent Batches</p>
                      <div className="space-y-1">
                        {scanResult.batches.slice(0, 3).map((batch: any) => (
                          <div key={batch._id} className="flex justify-between text-sm">
                            <span>Batch {batch.batchNumber}</span>
                            <span>{batch.quantity} units</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
