import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VendorRequests from "./pages/VendorRequests";
import AllVendors from "./pages/AllVendors";
import VendorDetail from "./pages/VendorDetail";
import VendorEdit from "./pages/VendorEdit";
import VendorTypes from "./pages/VendorTypes";
import VendorFormBuilder from "./pages/VendorFormBuilder";
import VendorCharges from "./pages/VendorCharges";
import Agents from "./pages/Agents";
import AgentAttendance from "./pages/AgentAttendance";
import EmployeeAttendance from "./pages/EmployeeAttendance";
import AgentProfileDetail from "./pages/AgentProfileDetail";
import AgentPaymentDetails from "./pages/AgentPaymentDetails";
import EditRequests from "./pages/EditRequests";
import PaymentSettings from "./pages/PaymentSettings";
import PaymentManagement from "./pages/PaymentManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Admin Routes */}
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vendor-requests" element={<VendorRequests />} />
              <Route path="/vendors" element={<AllVendors />} />
              <Route path="/vendor/:id" element={<VendorDetail />} />
              <Route path="/vendor/:id/edit" element={<VendorEdit />} />
              <Route path="/vendor-types" element={<VendorTypes />} />
              <Route path="/vendor-form-builder" element={<VendorFormBuilder />} />
              <Route path="/vendor-charges" element={<VendorCharges />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/agent-attendance" element={<AgentAttendance />} />
              <Route path="/employee-attendance" element={<EmployeeAttendance />} />
              <Route path="/agent-profile/:id" element={<AgentProfileDetail />} />
              <Route path="/agent-payments/:agentId" element={<AgentPaymentDetails />} />
              <Route path="/edit-requests" element={<EditRequests />} />
              <Route path="/payment-settings" element={<PaymentSettings />} />
              <Route path="/payments" element={<PaymentManagement />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
