// Pages/backend/Requester/Layout/Requester_Layout.jsx

import React, { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router";
import {
  FiHome,
  FiSettings,
  FiMail,
  FiLogOut,
  FiMaximize,
  FiMinimize,
  FiChevronLeft,
  FiChevronRight,
  FiPlusCircle,
  FiList,
  FiClipboard,
  FiMapPin,
} from "react-icons/fi";
import { FaHeartbeat } from "react-icons/fa";
import useAuth from "../../../../hooks/useAuth";
import ThemeToggle from "../../../Frontend/layout/ThemeToggle";

const Requester_Layout = () => {
  // Get current user and logout function from auth hook
  const { user, logout } = useAuth();

  // State for fullscreen, sidebar collapse, and mobile menu visibility
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Function to toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Detect fullscreen changes and update state
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  // Navigation links and their icons
  const navigation = [
    { name: "Dashboard", path: "/donor/dashboard", icon: FiHome },
    { name: "Create Request", path: "/donor/create-request", icon: FiPlusCircle },
    { name: "My Requests", path: "/donor/my-requests", icon: FiList },
    { name: "Request Details", path: "/donor/request-details", icon: FiClipboard },
    { name: "Blood Banks", path: "/donor/blood-banks", icon: FiMapPin },
    { name: "Settings", path: "/donor/settings", icon: FiSettings },
  ];

  return (
    <div className="flex flex-col lg:flex-row bg-base-200 min-h-screen">

      {/* ================= Desktop Sidebar ================= */}
      <aside
        className={`
          hidden lg:flex flex-col bg-base-100 border-r border-base-300
          ${isCollapsed ? "w-20" : "w-72"} transition-all duration-300 shadow-lg
        `}
      >
        {/* Logo and Collapse Button */}
        <div className="h-16 px-4 border-b border-red-500 flex items-center gap-3">
          <div className="bg-error/10 p-2 rounded-xl">
            <FaHeartbeat className="text-error text-xl" />
          </div>
          {/* Show name only if not collapsed */}
          {!isCollapsed && <h1 className="text-xl font-bold">BloodConnect</h1>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto btn btn-ghost btn-sm"
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <ul className="flex-1 p-3 space-y-1">
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

        {/* Logout Button */}
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
          {/* Prevent clicks inside the sidebar from closing it */}
          <aside
            className="fixed inset-y-0 left-0 w-72 bg-base-100 p-4 flex flex-col shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Logo + Close Button */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl flex items-center gap-3 font-bold"><FaHeartbeat className="text-error text-xl" /> BloodConnect</h1>
              <button onClick={() => setMobileMenuOpen(false)} className="btn btn-ghost btn-sm">
                <FiChevronLeft />
              </button>
            </div>

            {/* Mobile Navigation Links */}
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

            {/* Logout Button for Mobile */}
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

      {/* ================= Main Content Area ================= */}
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
              Welcome back,   <span className="text-error ml-2">
                Requester : {user?.profile?.fullName || "User"}
              </span>
            </h2>
          </div>

          {/* Navbar Buttons */}
          <div className="flex items-center gap-4">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="btn btn-ghost btn-circle hover:bg-base-200"
            >
              {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
            </button>

            {/* Mail Button */}
            <button className="btn btn-ghost btn-circle hover:bg-base-200">
              <FiMail size={18} />
            </button>

            {/* Avatar */}
            <div className="avatar">
              <div className="w-9 rounded-full bg-error text-white flex items-center justify-center font-semibold shadow">
                {user?.profile?.fullName.charAt(0) || "U"}
              </div>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-6 flex-1">
          <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-6 min-h-[75vh]">
            <Outlet /> {/* React Router Outlet for nested routes */}
          </div>
        </div>
      </div>

      {/* ================= Mobile Bottom Dock ================= */}
      <div className="lg:hidden fixed bottom-0 w-full bg-base-100 border-t border-base-300 flex justify-around py-2 shadow-lg z-40">
        {/* Show first 5 navigation links as dock buttons */}
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

export default Requester_Layout;