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
import Unauthorized from './Pages/auth/Unauthorized.jsx';
import TermsPrivacy from './Pages/auth/TermsPrivacy.jsx';
import AlreadyLoggedIn from './middleware/AlreadyLoggedIn.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Auth */}
        <Route element={<AlreadyLoggedIn />} >
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/TermsPrivacy" element={<TermsPrivacy />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
