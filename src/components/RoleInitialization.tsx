import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  Shield, 
  User, 
  Stethoscope, 
  UserCheck, 
  Settings,
  Eye
} from "lucide-react";
import { toast } from "sonner";

export function RoleInitialization() {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [department, setDepartment] = useState("");
  
  const userRole = useQuery(api.userRoles.getUserRole);
  const initializeRole = useMutation(api.userRoles.initializeUserRole);

  // If user already has a role, don't show this component
  if (userRole) {
    return null;
  }

  const roles = [
    {
      id: "admin",
      name: "Administrator",
      icon: Shield,
      description: "Full system access and user management",
      color: "bg-red-100 text-red-700 border-red-200"
    },
    {
      id: "manager",
      name: "Manager",
      icon: UserCheck,
      description: "Inventory management and reporting",
      color: "bg-blue-100 text-blue-700 border-blue-200"
    },
    {
      id: "pharmacist",
      name: "Pharmacist",
      icon: Stethoscope,
      description: "Medication management and dispensing",
      color: "bg-green-100 text-green-700 border-green-200"
    },
    {
      id: "nurse",
      name: "Nurse",
      icon: User,
      description: "Supply usage and basic inventory tasks",
      color: "bg-purple-100 text-purple-700 border-purple-200"
    },
    {
      id: "technician",
      name: "Technician",
      icon: Settings,
      description: "Equipment and supply maintenance",
      color: "bg-yellow-100 text-yellow-700 border-yellow-200"
    },
    {
      id: "viewer",
      name: "Viewer",
      icon: Eye,
      description: "Read-only access to inventory data",
      color: "bg-gray-100 text-gray-700 border-gray-200"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    try {
      await initializeRole({
        role: selectedRole as any,
        department: department || undefined,
      });
      toast.success("Role initialized successfully");
    } catch (error) {
      toast.error("Failed to initialize role");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Welcome to MedStock Pro</h3>
            <p className="text-gray-600 mt-2">Please select your role to get started</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Your Role
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedRole === role.id
                        ? role.color
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-6 h-6" />
                      <div>
                        <h4 className="font-semibold">{role.name}</h4>
                        <p className="text-sm opacity-75">{role.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department (Optional)
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Emergency, ICU, Pharmacy"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedRole}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Initialize Role & Continue
          </button>
        </form>
      </div>
    </div>
  );
}
