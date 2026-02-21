// Pages/backend/Donor/Layout/Blood_Bank_Layout.jsx

import React, { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router";
import {
  FiHome,
  FiSettings,
  FiMail,
  FiCalendar,
  FiLogOut,
  FiMaximize,
  FiMinimize,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiClipboard,
} from "react-icons/fi";
import { FaHeartbeat } from "react-icons/fa";
import useAuth from "../../../../hooks/useAuth";
import ThemeToggle from "../../../Frontend/layout/ThemeToggle";

const Blood_Bank_Layout = () => {
  const { user, logout } = useAuth();

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Detect fullscreen changes
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  // Navigation links
  const navigation = [
    { name: "Bank Profile", path: "/hospital/bank-profile", icon: FiHome },
    { name: "Inventory Management", path: "/hospital/inventory-management", icon: FiClipboard },
    { name: "Events Management", path: "/hospital/events-management", icon: FiCalendar },
    { name: "Staff Dashboard", path: "/hospital/staff-dashboard", icon: FiUsers },
    { name: "Settings", path: "/hospital/settings", icon: FiSettings },
  ];

  return (
    <div className="flex flex-col lg:flex-row bg-base-200 min-h-screen">

      {/* ================= Desktop Sidebar ================= */}
      <aside
        className={`hidden lg:flex flex-col bg-base-100 border-r border-base-300
          ${isCollapsed ? "w-20" : "w-72"} transition-all duration-300 shadow-lg`}
      >
        {/* Logo + Collapse */}
        <div className="h-16 px-4 border-b border-red-500 flex items-center gap-3">
          <div className="bg-error/10 p-2 rounded-xl">
            <FaHeartbeat className="text-error text-xl" />
          </div>
          {!isCollapsed && <h1 className="text-xl font-bold tracking-wide">BloodConnect</h1>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto btn btn-ghost btn-sm"
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        {/* Sidebar Links */}
        <ul className="p-3 flex-1 space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? "bg-error text-white shadow-md" : "hover:bg-base-200 text-base-content"
                  }`
                }
              >
                <item.icon size={18} />
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Logout */}
        <div className="p-3 border-t border-red-500">
          <button
            onClick={logout}
            className={`flex items-center w-full ${isCollapsed ? "justify-center" : "gap-3"} px-4 py-3 rounded-xl hover:bg-error hover:text-white transition-all duration-200`}
          >
            <FiLogOut size={18} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ================= Mobile Sidebar Overlay ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside
            className="fixed inset-y-0 left-0 w-72 bg-base-100 p-4 flex flex-col shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-bold">BloodConnect</h1>
              <button onClick={() => setMobileMenuOpen(false)} className="btn btn-ghost btn-sm">
                <FiChevronLeft />
              </button>
            </div>

            <ul className="flex-1 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? "bg-error text-white shadow-md" : "hover:bg-base-200 text-base-content"
                      }`
                    }
                  >
                    <item.icon size={18} />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            <div>
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-error hover:text-white transition-all duration-200"
              >
                <FiLogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ================= Main Content ================= */}
      <div className="flex-1 flex flex-col">

        {/* Top Navbar */}
        <div className="navbar bg-base-100 border-b border-base-300 px-2 h-16 flex justify-between lg:justify-end">
          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="btn btn-ghost btn-circle"
            >
              <FiChevronRight size={24} />
            </button>
          </div>

          {/* Desktop Greeting */}
          <div className="flex-1 pl-3 hidden lg:block">
            <h2 className="text-lg font-semibold tracking-wide">
              Welcome back, <span className="text-error ml-2">Blood Bank : {user?.profile?.fullName || "User"}</span>
            </h2>
          </div>

          {/* Top Navbar Actions */}
          <div className="flex items-center gap-4">
            <button onClick={toggleFullscreen} className="btn btn-ghost btn-circle hover:bg-base-200">
              {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
            </button>

            <button className="btn btn-ghost btn-circle hover:bg-base-200">
              <FiMail size={18} />
            </button>

            <div className="avatar">
              <div className="w-9 rounded-full bg-error text-white flex items-center justify-center font-semibold shadow">
                {user?.profile?.fullName.charAt(0) || "U"}
              </div>
            </div>

            <ThemeToggle />
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-6 flex-1">
          <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-6 min-h-[75vh]">
            <Outlet />
          </div>
        </div>
      </div>

      {/* ================= Mobile Bottom Dock ================= */}
      <div className="lg:hidden fixed bottom-0 w-full bg-base-100 border-t border-base-300 flex justify-around py-2 shadow-lg z-40">
        {/* Show first 5 navigation items in dock */}
        {navigation.slice(0, 5).map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-xs transition-all duration-200 ${isActive ? "text-error" : "text-base-content"}`
            }
          >
            <item.icon size={22} />
            <span className="text-[0.65rem]">{item.name}</span>
          </NavLink>
        ))}
      </div>

    </div>
  );
};

export default Blood_Bank_Layout;