import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { RoleInitialization } from "./components/RoleInitialization";
import { MobileMenu } from "./components/MobileMenu";
import { useState } from "react";

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <Authenticated>
        <RoleInitialization />
        <MobileMenu activeView={activeView} onViewChange={setActiveView} />
        <div className="flex h-screen">
          <div className="hidden lg:block">
            <Sidebar activeView={activeView} onViewChange={setActiveView} />
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              <Dashboard activeView={activeView} />
            </main>
          </div>
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">MedStock Pro</h1>
                <p className="text-gray-600">Advanced Medical Supply Inventory Management</p>
              </div>
              <SignInForm />
            </div>
          </div>
        </div>
      </Unauthenticated>
      
      <Toaster position="top-right" />
    </div>
  );
}
