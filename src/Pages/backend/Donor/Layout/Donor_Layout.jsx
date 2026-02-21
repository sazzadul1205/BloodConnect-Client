import React, { useEffect, useState } from "react";
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
  FiUser,
  FiActivity,
  FiSliders,
  FiClock,
  FiDroplet,
} from "react-icons/fi";
import { FaHeartbeat } from "react-icons/fa";
import useAuth from "../../../../hooks/useAuth";
import ThemeToggle from "../../../Frontend/layout/ThemeToggle";

const DashboardLayout = () => {
  const { user, logout } = useAuth();

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // FullScreen Toggle
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const navigation = [
    { name: "Dashboard", path: "/donor/dashboard", icon: FiHome },
    { name: "Profile", path: "/donor/profile", icon: FiUser },
    { name: "Medical Info", path: "/donor/medical-info", icon: FiActivity },
    { name: "Preferences", path: "/donor/preferences", icon: FiSliders },
    { name: "Donation History", path: "/donor/donation-history", icon: FiClock },
    { name: "Blood Requests", path: "/donor/blood-requests", icon: FiDroplet },
    { name: "Events", path: "/donor/events", icon: FiCalendar },
    { name: "Settings", path: "/donor/settings", icon: FiSettings },
  ];
  return (
    <div className="flex bg-base-200 min-h-screen">

      {/* SIDEBAR */}
      <aside
        className={`${isCollapsed ? "w-20" : "w-72"
          } bg-base-100 border-r border-base-300 flex flex-col transition-all duration-300 shadow-lg`}
      >
        {/* Logo + Collapse Button */}
        <div className="h-16 px-4 border-b border-base-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-error/10 p-2 rounded-xl">
              <FaHeartbeat className="text-error text-xl" />
            </div>

            {!isCollapsed && (
              <h1 className="text-xl font-bold tracking-wide">
                BloodConnect
              </h1>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ul className="p-3 flex-1 space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? "justify-center" : "gap-3"
                  } px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? "bg-error text-white shadow-md"
                    : "hover:bg-base-200 text-base-content"
                  }`
                }
              >
                <item.icon size={18} />
                {!isCollapsed && (
                  <span className="font-medium">
                    {item.name}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Logout */}
        <div className="p-3 border-t border-base-300">
          <button
            onClick={logout}
            className={`flex items-center cursor-pointer ${isCollapsed ? "justify-center" : "gap-3"
              } w-full px-4 py-3 rounded-xl hover:bg-error hover:text-white transition-all duration-200`}
          >
            <FiLogOut size={18} />
            {!isCollapsed && (
              <span className="font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">

        {/* Top Navbar */}
        <div className="navbar bg-base-100 border-b border-base-300 px-2 h-16">
          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn btn-ghost btn-sm hidden lg:flex"
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>

          {/* Profile */}
          <div className="flex-1 pl-3">
            <h2 className="text-lg font-semibold tracking-wide">
              Welcome back,
              <span className="text-error ml-2">
                Donor : {user?.profile?.fullName || "User"}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-4">

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="btn btn-ghost btn-circle hover:bg-base-200"
            >
              {isFullscreen ? (
                <FiMinimize size={18} />
              ) : (
                <FiMaximize size={18} />
              )}
            </button>

            {/* Mail */}
            <button className="btn btn-ghost btn-circle hover:bg-base-200">
              <FiMail size={18} />
            </button>

            {/* Avatar */}
            <div className="avatar">
              <div className="w-9 rounded-full bg-error text-white flex items-center justify-center font-semibold shadow">
                {user?.profile?.fullName.charAt(0) || "U"}
              </div>
            </div>

            <ThemeToggle />
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6 flex-1">
          <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-8 min-h-[75vh]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;