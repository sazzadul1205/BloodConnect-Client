// React Imports
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from "react-router";

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

// Donor Pages
import Donor_Layout from './Pages/backend/Donor/Layout/Donor_Layout.jsx';

// Requester Pages
import Requester_Layout from './Pages/backend/Requester/Layout/Requester_Layout.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
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
          <Route element={<RequireRole allowedRoles={["donor", "admin"]} />} >
            <Route element={<Donor_Layout />}>

              <Route path="/donor/dashboard" element={<h1 className='text-black'>Donor Dashboard</h1>} />
            </Route>
          </Route>

          {/* Requester Pages */}
          <Route element={<RequireRole allowedRoles={["requester", "admin"]} />} >
            <Route element={<Requester_Layout />}>

              <Route path="/requester/dashboard" element={<h1 className='text-black'>Requester Dashboard</h1>} />
            </Route>
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
