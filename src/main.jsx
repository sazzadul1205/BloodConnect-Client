// React Imports
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from "react-router";

// Tanstack Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Styles
import './index.css'

// Frontend Pages
import Home from './Pages/Frontend/Home.jsx';

// Auth Pages
import Login from './Pages/auth/Login.jsx';
import Register from './Pages/auth/Register.jsx';
import ResetPassword from './Pages/auth/ResetPassword.jsx';
import ForgotPassword from './Pages/auth/ForgotPassword.jsx';
import AlreadyLoggedIn from './middleware/AlreadyLoggedIn.jsx';

// Auth Additional Pages
import Unauthorized from './Pages/auth/Unauthorized.jsx';
import TermsPrivacy from './Pages/auth/TermsPrivacy.jsx';
import RequireAuth from './middleware/RequireAuth.jsx';
import RequireRole from './middleware/RequireRole.jsx';

// Backend Layout
import Backend_Layout from './Pages/backend/Layout/Backend_Layout.jsx';
import UsersManagement from './Pages/backend/Admin/UsersManagement/UsersManagement.jsx';
import AuditLogs from './Pages/backend/Admin/AuditLogs/AuditLogs.jsx';
import BloodBanksManagement from './Pages/backend/Admin/BloodBanksManagement/BloodBanksManagement.jsx';
import SystemStatistics from './Pages/backend/Admin/SystemStatistics/SystemStatistics.jsx';
import AdminDashboard from './Pages/backend/Admin/AdminDashboard/AdminDashboard.jsx';
import AdminSettings from './Pages/backend/Admin/AdminSettings/AdminSettings.jsx';
import AdminProfile from './Pages/backend/Admin/AdminProfile/AdminProfile.jsx';
import DonorProfile from './Pages/backend/Donor/DonorProfile/DonorProfile.jsx';
import MyProfile from './Pages/backend/Donor/MyProfile/MyProfile.jsx';
import MedicalInformation from './Pages/backend/Donor/MedicalInformation/MedicalInformation.jsx';
import DonationHistory from './Pages/backend/Donor/DonationHistory/DonationHistory.jsx';
import BloodRequests from './Pages/backend/Donor/BloodRequests/BloodRequests.jsx';


// Create Query Client
const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Auth */}
          <Route element={<AlreadyLoggedIn />} >
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Auth Additional */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/TermsPrivacy" element={<TermsPrivacy />} />

          <Route element={<RequireAuth />} >

            {/* Donor Pages */}
            <Route element={<RequireRole allowedRoles={["donor", "admin", "super_admin"]} />} >
              <Route element={<Backend_Layout userType="donor" />}>

                <Route path="/donor/dashboard" element={<h1 className='text-black'>Donor Dashboard</h1>} />
                <Route path="/donor/profile" element={<DonorProfile />} />
                <Route path="/donor/my-profile" element={<MyProfile />} />
                <Route path="/donor/:donorId/medical" element={<MedicalInformation />} />
                <Route path="/donor/history" element={<DonationHistory />} />
                <Route path="/blood-requests" element={<BloodRequests />} />
              </Route>
            </Route>

            {/* Requester Pages */}
            <Route element={<RequireRole allowedRoles={["requester", "admin", "super_admin"]} />} >
              <Route element={<Backend_Layout userType="requester" />}>

                <Route path="/requester/dashboard" element={<h1 className='text-black'>Requester Dashboard</h1>} />
              </Route>
            </Route>

            {/* Hospital Pages */}
            <Route element={<RequireRole allowedRoles={["hospital", "admin", "super_admin"]} />} >
              <Route element={<Backend_Layout userType="hospital" />}>

                <Route path="/hospital/dashboard" element={<h1 className='text-black'>Hospital Dashboard</h1>} />
              </Route>
            </Route>

            {/* Blood Bank Pages */}
            <Route element={<RequireRole allowedRoles={["blood_bank", "admin", "super_admin"]} />} >
              <Route element={<Backend_Layout userType="blood_bank" />}>

                <Route path="/blood_bank/dashboard" element={<h1 className='text-black'>Blood Bank Dashboard</h1>} />
              </Route>
            </Route>

            {/* Admin Pages */}
            <Route element={<RequireRole allowedRoles={["admin", "super_admin"]} />} >
              <Route element={<Backend_Layout userType="admin" />}>

                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
                <Route path="/admin/users-management" element={<UsersManagement />} />
                <Route path="/admin/blood-banks-management" element={<BloodBanksManagement />} />
                <Route path="/admin/system-stats" element={<SystemStatistics />} />
                <Route path="/admin/profile" element={<AdminProfile />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>

            {/* Admin Pages */}
            <Route element={<RequireRole allowedRoles={["admin", "super_admin"]} />} >
              <Route element={<Backend_Layout userType="super_admin" />}>

                <Route path="/super_admin/dashboard" element={<AdminDashboard />} />
                <Route path="/super_admin/audit-logs" element={<AuditLogs />} />
                <Route path="/super_admin/users-management" element={<UsersManagement />} />
                <Route path="/super_admin/blood-banks-management" element={<BloodBanksManagement />} />
                <Route path="/super_admin/system-stats" element={<SystemStatistics />} />
                <Route path="/super_admin/profile" element={<AdminProfile />} />
                <Route path="/super_admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
