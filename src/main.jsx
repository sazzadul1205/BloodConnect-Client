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
import UsersManagement from './Pages/backend/Admin/UsersManagement.jsx';

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

                <Route path="/admin/dashboard" element={<h1 className='text-black'>Blood Bank Dashboard</h1>} />
                <Route path="/admin/users-management" element={<UsersManagement />} />
              </Route>
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
