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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
