// Pages/backend/Common/Layout/Backend_Layout.jsx

// React
import { Outlet, NavLink } from "react-router";
import React, { useState, useEffect } from "react";

// Icons
import {
  FiHome,
  FiSettings,
  FiCalendar,
  FiLogOut,
  FiMaximize,
  FiMinimize,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiClipboard,
  FiUser,
  FiActivity,
  FiClock,
  FiDroplet,
  FiMapPin,
  FiPlusCircle,
  FiList,
  FiBarChart2,
  FiMenu,
  FiX,
  FiMail,
  FiPlus,
} from "react-icons/fi";
import { FaHeartbeat } from "react-icons/fa";

// Hooks
import useAuth from "../../../hooks/useAuth";

// ThemeToggle
import ThemeToggle from "../../Frontend/layout/ThemeToggle";
import MessagesDrawer from "./components/MessagesDrawer";

// Navigation configurations for different user types
const navigationConfig = {
  donor: [
    { name: "Dashboard", path: "/donor/dashboard", icon: FiHome },
    { name: "Donor Profile", path: "/donor/profile", icon: FiUser },
    { name: "My Profile", path: "/donor/my-profile", icon: FiUser },
    { name: "Medical Info", path: "/donor/:donorId/medical", icon: FiActivity },
    { name: "Donation History", path: "/donor/history", icon: FiClock },
    { name: "Blood Requests", path: "/blood-requests", icon: FiDroplet },
    { name: "Donation Events", path: "/donation-events", icon: FiCalendar },
    { name: "Settings", path: "/donor/settings", icon: FiSettings },
  ],

  hospital: [
    { name: "Dashboard", path: "/hospital/dashboard", icon: FiHome },
    { name: "Blood Banks", path: "/hospital/blood-banks", icon: FiMapPin },
    { name: "Create Request", path: "/hospital/create-request", icon: FiPlusCircle },
    { name: "My Requests", path: "/hospital/my-requests", icon: FiList },
    { name: "Donor Search", path: "/hospital/donor-search", icon: FiUser },
    { name: "Events", path: "/hospital/events", icon: FiCalendar },
    { name: "Settings", path: "/hospital/settings", icon: FiSettings },
  ],

  requester: [
    { name: "Dashboard", path: "/requester/dashboard", icon: FiHome },
    { name: "Create Request", path: "/requester/create-request", icon: FiPlusCircle },
    { name: "My Requests", path: "/requester/my-requests", icon: FiList },
    { name: "Blood Banks", path: "/requester/blood-banks", icon: FiMapPin },
    { name: "Settings", path: "/requester/settings", icon: FiSettings },
  ],

  blood_bank: [
    { name: "Bank Profile", path: "/blood_bank/bank-profile", icon: FiHome },
    { name: "Inventory Management", path: "/blood_bank/inventory-management", icon: FiClipboard },
    { name: "Events Management", path: "/blood_bank/events-management", icon: FiCalendar },
    { name: "Staff Dashboard", path: "/blood_bank/staff-dashboard", icon: FiUsers },
    { name: "Settings", path: "/blood_bank/settings", icon: FiSettings },
  ],

  admin: [
    { name: "Admin Dashboard", path: "/admin/dashboard", icon: FiHome },
    { name: "My Profile", path: "/admin/profile", icon: FiUser },
    { name: "Users Management", path: "/admin/users-management", icon: FiUsers },
    { name: "Audit Logs", path: "/admin/audit-logs", icon: FiClipboard },
    { name: "System Stats", path: "/admin/system-stats", icon: FiBarChart2 },
    { name: "Blood Banks Management", path: "/admin/blood-banks-management", icon: FiMapPin },
    { name: "Settings", path: "/admin/settings", icon: FiSettings },
  ],

  super_admin: [
    { name: "Admin Dashboard", path: "/super_admin/dashboard", icon: FiHome },
    { name: "My Profile", path: "/super_admin/profile", icon: FiUser },
    { name: "Users Management", path: "/super_admin/users-management", icon: FiUsers },
    { name: "Audit Logs", path: "/super_admin/audit-logs", icon: FiClipboard },
    { name: "System Stats", path: "/super_admin/system-stats", icon: FiBarChart2 },
    { name: "Blood Banks Management", path: "/super_admin/blood-banks-management", icon: FiMapPin },
    { name: "Settings", path: "/super_admin/settings", icon: FiSettings },
  ],
};

// Center dock configuration based on user role
const centerDockConfig = {
  donor: {
    path: "/donor/profile",
    icon: FiUser,
    label: "Profile"
  },
  hospital: {
    path: "/hospital/profile",
    icon: FiUser,
    label: "Profile"
  },
  requester: {
    path: "/requester/create-request",
    icon: FiPlus,
    label: "Create Request"
  },
  blood_bank: {
    path: "/blood_bank/profile",
    icon: FiUser,
    label: "Profile"
  },
  admin: {
    path: "/admin/profile",
    icon: FiUser,
    label: "Profile"
  },
  super_admin: {
    path: "/super_admin/profile",
    icon: FiUser,
    label: "Profile"
  },
};

const Backend_Layout = ({ userType }) => {
  const { user, logout } = useAuth();

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [messagesDrawerOpen, setMessagesDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("home");

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get navigation items based on user type
  const navigation = navigationConfig[userType] || navigationConfig.donor;
  const currentUserId = user?._id || user?.userId || user?.id || user?.uid;
  const resolvedNavigation = navigation.map((item) => ({
    ...item,
    path:
      item.path?.includes(":donorId") && currentUserId
        ? item.path.replace(":donorId", currentUserId)
        : item.path,
  }));

  // Get center dock config for current user type
  const centerDock = centerDockConfig[userType] || centerDockConfig.donor;

  // Format user type for display (capitalize and handle special cases)
  const formatUserType = (type) => {
    if (!type) return "User";

    switch (type) {
      case "blood_bank":
        return "Blood Bank";
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "donor":
        return "Donor";
      case "hospital":
        return "Hospital";
      case "requester":
        return "Requester";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

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

  return (
    <div className="flex h-screen overflow-hidden bg-base-200">
      {/* ================= Desktop Sidebar (lg and above) ================= */}
      {!isMobile && (
        <aside
          className={`hidden lg:flex flex-col bg-base-100 border-r border-base-300 h-screen fixed left-0 top-0
            ${isCollapsed ? "w-20" : "w-72"} transition-all duration-300 shadow-lg z-30`}
        >
          {/* Logo + Collapse */}
          <div className="h-16 px-4 border-b border-red-500 flex items-center gap-3 shrink-0">
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

          {/* Sidebar Links - Scrollable */}
          <div className={`flex-1 ${isCollapsed ? "overflow-visible" : "overflow-y-auto"}`}>
            <ul className="p-3 space-y-1">
              {resolvedNavigation.map((item) => (
                <li key={item.name} className={isCollapsed ? "overflow-visible" : ""}>
                  <NavLink
                    to={item.path}
                    title={isCollapsed ? item.name : ""}
                    data-tip={isCollapsed ? item.name : ""}
                    className={({ isActive }) =>
                      `flex items-center ${isCollapsed ? "justify-center tooltip tooltip-right z-80 [&:before]:z-90 [&:after]:z-90" : "gap-3"} px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? "bg-error text-white shadow-md" : "hover:bg-base-200 text-base-content"
                      }`
                    }
                  >
                    <item.icon size={18} />
                    {!isCollapsed && <span className="font-medium">{item.name}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Logout - Fixed at bottom */}
          <div className="p-3 border-t border-red-500 shrink-0">
            <button
              onClick={logout}
              title={isCollapsed ? "Logout" : ""}
              data-tip={isCollapsed ? "Logout" : ""}
              className={`flex items-center w-full ${isCollapsed ? "justify-center tooltip tooltip-right z-80 [&:before]:z-90 [&:after]:z-90" : "gap-3"} px-4 py-3 rounded-xl hover:bg-error hover:text-white transition-all duration-200`}
            >
              <FiLogOut size={18} />
              {!isCollapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </aside>
      )}

      {/* ================= Mobile Sidebar Drawer ================= */}
      {isMobile && (
        <>
          {/* Drawer Overlay for Menu */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Menu Drawer Content - FIXED VERSION WITH SCROLLABLE CONTENT AND FIXED LOGOUT */}
          <aside
            className={`fixed inset-y-0 left-0 w-80 bg-base-100 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
          >
            {/* Drawer Header - Fixed at top */}
            <div className="h-16 px-4 border-b border-red-500 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-error/10 p-2 rounded-xl">
                  <FaHeartbeat className="text-error text-xl" />
                </div>
                <h1 className="text-xl font-bold tracking-wide">BloodConnect</h1>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* User Info in Drawer - Fixed below header */}
            <div className="p-4 border-b border-base-300 shrink-0">
              <div className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-12 rounded-full bg-error text-white flex items-center justify-center font-semibold text-lg shadow">
                    {user?.profile?.fullName?.charAt(0) || "U"}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user?.profile?.fullName || "User"}</p>
                  <p className="text-xs opacity-70">{formatUserType(userType)}</p>
                </div>
              </div>
            </div>

            {/* Scrollable Navigation Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4">
                <ul className="space-y-1">
                  {resolvedNavigation.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                            ? "bg-error text-white shadow-md"
                            : "hover:bg-base-200 text-base-content"
                          }`
                        }
                      >
                        <item.icon size={18} />
                        <span className="font-medium">{item.name}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>

                {/* Theme Toggle in Menu Drawer */}
                <div className="mt-6 pt-4 border-t border-base-300">
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="font-medium">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Button - Fixed at bottom */}
            <div className="p-4 border-t border-red-500 shrink-0 bg-base-100">
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-error hover:text-white transition-all duration-200"
              >
                <FiLogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </aside>

          {/* Messages Drawer */}
          <MessagesDrawer
            isOpen={messagesDrawerOpen}
            onClose={() => setMessagesDrawerOpen(false)}
            user={user}
          />
        </>
      )}

      {/* ================= Main Content Area ================= */}
      <div
        className="flex-1 flex flex-col h-screen overflow-y-auto"
        style={{
          marginLeft: !isMobile && isCollapsed ? '5rem' : !isMobile ? '18rem' : '0',
          transition: 'margin-left 300ms'
        }}
      >
        {/* ================= Desktop Navbar (hidden on mobile) ================= */}
        {!isMobile && (
          <div className="navbar bg-base-100 border-b border-base-300 px-2 h-16 flex justify-between lg:justify-end sticky top-0 z-20">
            <div className="flex-1 pl-3">
              <h2 className="text-lg font-semibold tracking-wide">
                Welcome back,{' '}
                <span className="text-error">
                  {formatUserType(userType)}: {user?.profile?.fullName || "User"}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={toggleFullscreen} className="btn btn-ghost btn-circle hover:bg-base-200">
                {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
              </button>

              {/* Use MessagesDropdown for desktop */}
              <MessagesDrawer user={user} isDesktop={true} />

              <div className="avatar">
                <div className="w-9 rounded-full bg-error text-white flex items-center justify-center font-semibold shadow">
                  {user?.profile?.fullName?.charAt(0) || "U"}
                </div>
              </div>

              <ThemeToggle />
            </div>
          </div>
        )}

        {/* Page Content - Scrolls with main container */}
        <div className={`flex-1 ${isMobile ? 'pb-24' : ''}`}>
          <div className="p-0 md:p-4">
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-0 md:p-4">
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      {/* ================= Mobile Dock (DaisyUI Dock) ================= */}
      {isMobile && (
        <div className="dock dock-lg z-30">
          {/* Left - Messages */}
          <button
            className={activeMobileTab === 'messages' ? 'dock-active' : ''}
            onClick={() => {
              setActiveMobileTab('messages');
              setMessagesDrawerOpen(true);
            }}
          >
            <div className="relative">
              <FiMail className="size-[1.2em]" />
              <span className="badge badge-xs badge-error absolute -top-1 -right-1">3</span>
            </div>
            <span className="dock-label">Messages</span>
          </button>

          {/* Center - Customizable by user role */}
          <NavLink
            to={centerDock.path}
            className={({ isActive }) => isActive ? 'dock-active' : ''}
            onClick={() => setActiveMobileTab('center')}
          >
            <centerDock.icon className="size-[1.2em]" />
            <span className="dock-label">{centerDock.label}</span>
          </NavLink>

          {/* Right - Menu */}
          <button
            className={activeMobileTab === 'menu' ? 'dock-active' : ''}
            onClick={() => {
              setActiveMobileTab('menu');
              setMobileMenuOpen(true);
            }}
          >
            <FiMenu className="size-[1.2em]" />
            <span className="dock-label">Menu</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Backend_Layout;