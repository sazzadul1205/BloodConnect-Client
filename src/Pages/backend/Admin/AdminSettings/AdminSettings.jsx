// Pages/backend/Admin/AdminSettings/AdminSettings.jsx

// React
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FiSettings,
  FiShield,
  FiBell,
  FiDatabase,
  FiMonitor,
  FiSave,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiGlobe,
  FiMail,
  FiUsers,
  FiPhone,
  FiLock,
  FiAlertCircle,
} from "react-icons/fi";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";

// Default settings configuration
const defaultSettings = {
  general: {
    organizationName: "BloodConnect",
    supportEmail: "support@bloodconnect.org",
    supportPhone: "",
    website: "",
    defaultPageSize: 10,
    maintenanceMode: false,
    autoApproveBanks: false,
    allowPublicRegistration: true,
  },
  security: {
    sessionTimeoutMinutes: 60,
    require2FAForAdmins: true,
    allowUnknownDevices: false,
    allowedIpRanges: "",
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireSpecialChar: true,
    requireNumber: true,
    requireUppercase: true,
  },
  notifications: {
    emailAlerts: true,
    lowInventoryAlerts: true,
    newUserAlerts: true,
    newRequestAlerts: true,
    weeklySummaryReport: true,
    monthlyReport: true,
    alertThreshold: 10,
  },
  dataPolicy: {
    auditLogRetentionDays: 90,
    exportFormat: "csv",
    includeSensitiveFieldsInExport: false,
    dataBackupEnabled: true,
    backupFrequency: "daily",
  },
  appearance: {
    dashboardRefreshSeconds: 60,
    compactTables: false,
    showAnimations: true,
    defaultTheme: "light",
  },
};

const AdminSettings = () => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // State management
  const [settings, setSettings] = useState(defaultSettings);
  const [activeSection, setActiveSection] = useState("general");

  // 🔹 Fetch Admin Settings
  const {
    data: settingsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    },
  });

  // Update local state when API data loads
  useEffect(() => {
    if (!settingsData) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings((prev) => ({
      general: { ...prev.general, ...(settingsData.general || {}) },
      security: { ...prev.security, ...(settingsData.security || {}) },
      notifications: {
        ...prev.notifications,
        ...(settingsData.notifications || {}),
      },
      dataPolicy: { ...prev.dataPolicy, ...(settingsData.dataPolicy || {}) },
      appearance: { ...prev.appearance, ...(settingsData.appearance || {}) },
    }));
  }, [settingsData]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      return axiosInstance.patch("/admin/settings", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: async () => {
      await Swal.fire({
        title: "Settings Saved",
        text: "Admin settings have been updated successfully.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
      refetch();
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Save Failed",
        text: err?.response?.data?.error || "Unable to save settings.",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    },
  });

  // Update specific setting field
  const updateSection = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Calculate total enabled toggles for stats
  const totalEnabledToggles = useMemo(() => {
    const groups = [
      settings.general,
      settings.security,
      settings.notifications,
      settings.dataPolicy,
      settings.appearance,
    ];

    return groups.reduce((sum, group) => {
      return (
        sum +
        Object.values(group).filter((value) => typeof value === "boolean" && value)
          .length
      );
    }, 0);
  }, [settings]);

  // Handle reset to defaults
  const handleReset = () => {
    Swal.fire({
      title: "Reset Settings?",
      text: "This will restore settings to default values in the form.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Reset",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        confirmButton: "btn btn-sm btn-warning",
        cancelButton: "btn btn-sm",
      },
      buttonsStyling: false,
    }).then((result) => {
      if (!result.isConfirmed) return;
      setSettings(defaultSettings);
    });
  };

  // Handle save settings
  const handleSave = async () => {
    await saveMutation.mutateAsync({
      general: settings.general,
      security: settings.security,
      notifications: settings.notifications,
      dataPolicy: settings.dataPolicy,
      appearance: settings.appearance,
    });
  };

  // Section tabs configuration
  const sections = [
    { id: "general", label: "General", icon: FiSettings, color: "text-error" },
    { id: "security", label: "Security", icon: FiShield, color: "text-primary" },
    { id: "notifications", label: "Notifications", icon: FiBell, color: "text-warning" },
    { id: "dataPolicy", label: "Data & Audit", icon: FiDatabase, color: "text-success" },
    { id: "appearance", label: "Appearance", icon: FiMonitor, color: "text-info" },
  ];

  // Loading state
  if (isLoading) return <BloodLoader />;

  // Error state
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header Section with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        {/* Header copy: communicates context and purpose of admin settings dashboard. */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {/* Visual identity icon for admin settings system. */}
            <FiSettings className="text-error" />
            Admin Settings
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Configure system behavior, security policies, notifications, and
            dashboard preferences.
          </p>
        </div>

        {/* Action Buttons: reset and save utilities. */}
        <div className="flex gap-2">
          {/* Reset Button: restores settings to default values. */}
          <button
            onClick={handleReset}
            className="btn btn-outline btn-sm gap-2"
          >
            <FiRefreshCw size={16} />
            Reset
          </button>

          {/* Save Button: persists current settings to backend. */}
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="btn btn-error btn-sm gap-2"
          >
            <FiSave size={16} />
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </motion.div>

      {/* Stats Cards with Staggered Fade In */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1 // Each card fades in sequentially with 0.1s delay
            }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Card 1: Active Toggles - number of enabled configuration switches. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-error">
            <FiCheckCircle size={24} />
          </div>
          <p className="stat-title">Active Toggles</p>
          <p className="stat-value text-3xl">{totalEnabledToggles}</p>
          <p className="stat-desc">Enabled configuration switches</p>
        </motion.div>

        {/* Card 2: Session Timeout - current session duration setting. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-info">
            <FiClock size={24} />
          </div>
          <p className="stat-title">Session Timeout</p>
          <p className="stat-value text-3xl">
            {settings.security.sessionTimeoutMinutes}
          </p>
          <p className="stat-desc">Minutes</p>
        </motion.div>

        {/* Card 3: Log Retention - audit log storage duration. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-success">
            <FiCalendar size={24} />
          </div>
          <p className="stat-title">Log Retention</p>
          <p className="stat-value text-3xl">
            {settings.dataPolicy.auditLogRetentionDays}
          </p>
          <p className="stat-desc">Days</p>
        </motion.div>
      </motion.div>

      {/* Section Tabs with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-2"
      >
        {/* Tab navigation: switches between different setting categories. */}
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`btn btn-sm gap-2 ${isActive
                  ? 'btn-error text-white'
                  : 'btn-ghost'
                  }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : section.color} />
                {section.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Settings Sections - Only active section is rendered */}
      <div className="grid grid-cols-1 gap-6">
        {/* General Section */}
        {activeSection === "general" && (
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-6"
          >
            {/* Section header with icon and title */}
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiSettings className="text-error" />
              General Settings
            </h3>

            {/* Two-column layout for general settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left column - text inputs */}
              <div className="space-y-5">
                {/* Organization Name: primary platform identifier. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Organization Name</span>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={settings.general.organizationName}
                    onChange={(e) =>
                      updateSection("general", "organizationName", e.target.value)
                    }
                  />
                </div>

                {/* Support Email: primary contact email for support. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Support Email</span>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 " size={16} />
                    <input
                      type="email"
                      className="input input-bordered w-full pl-10"
                      value={settings.general.supportEmail}
                      onChange={(e) =>
                        updateSection("general", "supportEmail", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Support Phone: contact number for phone support. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Support Phone</span>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={16} />
                    <input
                      type="tel"
                      className="input input-bordered w-full pl-10"
                      value={settings.general.supportPhone}
                      onChange={(e) =>
                        updateSection("general", "supportPhone", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Website: organization website URL. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Website</span>
                  <div className="relative">
                    <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={16} />
                    <input
                      type="url"
                      className="input input-bordered w-full pl-10"
                      value={settings.general.website}
                      onChange={(e) =>
                        updateSection("general", "website", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Right column - selects and toggles */}
              <div className="space-y-5">
                {/* Default Page Size: pagination preference. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Default Page Size</span>
                  <select
                    className="select select-bordered w-full"
                    value={settings.general.defaultPageSize}
                    onChange={(e) =>
                      updateSection("general", "defaultPageSize", Number(e.target.value))
                    }
                  >
                    <option value={5}>5 items per page</option>
                    <option value={10}>10 items per page</option>
                    <option value={20}>20 items per page</option>
                    <option value={50}>50 items per page</option>
                    <option value={100}>100 items per page</option>
                  </select>
                </div>

                {/* Maintenance Mode: puts system in read-only state. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiAlertCircle className="text-warning" size={20} />
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-xs text-base-content/60">Users cannot access system</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-warning"
                    checked={settings.general.maintenanceMode}
                    onChange={(e) =>
                      updateSection("general", "maintenanceMode", e.target.checked)
                    }
                  />
                </div>

                {/* Auto-Approve Blood Banks: automatic verification for new banks. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiCheckCircle className="text-success" size={20} />
                    <div>
                      <p className="font-medium">Auto-Approve Blood Banks</p>
                      <p className="text-xs text-base-content/60">Bypass manual verification</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={settings.general.autoApproveBanks}
                    onChange={(e) =>
                      updateSection("general", "autoApproveBanks", e.target.checked)
                    }
                  />
                </div>

                {/* Allow Public Registration: enables user self-registration. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiUsers className="text-info" size={20} />
                    <div>
                      <p className="font-medium">Allow Public Registration</p>
                      <p className="text-xs text-base-content/60">Users can create accounts</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-info"
                    checked={settings.general.allowPublicRegistration}
                    onChange={(e) =>
                      updateSection("general", "allowPublicRegistration", e.target.checked)
                    }
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Security Section */}
        {activeSection === "security" && (
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-6"
          >
            {/* Section header with icon and title */}
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiShield className="text-primary" />
              Security Settings
            </h3>

            {/* Two-column layout for security settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left column - numeric inputs */}
              <div className="space-y-5">
                {/* Session Timeout: minutes until auto-logout. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Session Timeout (minutes)</span>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    className="input input-bordered w-full"
                    value={settings.security.sessionTimeoutMinutes}
                    onChange={(e) =>
                      updateSection(
                        "security",
                        "sessionTimeoutMinutes",
                        Number(e.target.value) || 60
                      )
                    }
                  />
                  <span className="label-text-alt text-base-content/50 mt-1">
                    Automatically log out after inactivity
                  </span>
                </div>

                {/* Max Login Attempts: failed attempts before lockout. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Max Login Attempts</span>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    className="input input-bordered w-full"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) =>
                      updateSection(
                        "security",
                        "maxLoginAttempts",
                        Number(e.target.value) || 5
                      )
                    }
                  />
                  <span className="label-text-alt text-base-content/50 mt-1">
                    Lock account after failed attempts
                  </span>
                </div>

                {/* Password Minimum Length: security requirement. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Password Minimum Length</span>
                  <input
                    type="number"
                    min={6}
                    max={20}
                    className="input input-bordered w-full"
                    value={settings.security.passwordMinLength}
                    onChange={(e) =>
                      updateSection(
                        "security",
                        "passwordMinLength",
                        Number(e.target.value) || 8
                      )
                    }
                  />
                </div>

                {/* Allowed IP Ranges: restrict access by IP. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Allowed IP Ranges</span>
                  <textarea
                    className="textarea textarea-bordered w-full h-24"
                    placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                    value={settings.security.allowedIpRanges}
                    onChange={(e) =>
                      updateSection("security", "allowedIpRanges", e.target.value)
                    }
                  />
                  <span className="label-text-alt text-base-content/50 mt-1">
                    One CIDR range per line (leave empty to allow all)
                  </span>
                </div>
              </div>

              {/* Right column - security toggles */}
              <div className="space-y-4">
                {/* Require 2FA for Admins: two-factor authentication. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiLock className="text-primary" size={20} />
                    <div>
                      <p className="font-medium">Require 2FA for Admins</p>
                      <p className="text-xs text-base-content/60">Additional security layer</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.security.require2FAForAdmins}
                    onChange={(e) =>
                      updateSection("security", "require2FAForAdmins", e.target.checked)
                    }
                  />
                </div>

                {/* Allow Unknown Devices: risky but flexible. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiAlertCircle className="text-warning" size={20} />
                    <div>
                      <p className="font-medium">Allow Unknown Devices</p>
                      <p className="text-xs text-base-content/60">May increase security risk</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-warning"
                    checked={settings.security.allowUnknownDevices}
                    onChange={(e) =>
                      updateSection("security", "allowUnknownDevices", e.target.checked)
                    }
                  />
                </div>

                {/* Password complexity requirements */}
                <div className="p-4 bg-base-200 rounded-lg space-y-3">
                  <p className="font-medium flex items-center gap-2">
                    <FiLock className="text-primary" size={16} />
                    Password Requirements
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Require Special Character (!@#$%)</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success toggle-sm"
                      checked={settings.security.requireSpecialChar}
                      onChange={(e) =>
                        updateSection("security", "requireSpecialChar", e.target.checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Require Number (0-9)</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success toggle-sm"
                      checked={settings.security.requireNumber}
                      onChange={(e) =>
                        updateSection("security", "requireNumber", e.target.checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Require Uppercase (A-Z)</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success toggle-sm"
                      checked={settings.security.requireUppercase}
                      onChange={(e) =>
                        updateSection("security", "requireUppercase", e.target.checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Notifications Section */}
        {activeSection === "notifications" && (
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-6"
          >
            {/* Section header with icon and title */}
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiBell className="text-warning" />
              Notification Settings
            </h3>

            {/* Two-column layout for notification settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left column - alert toggles */}
              <div className="space-y-4">
                {/* Email Alerts: system notifications via email. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiMail className="text-info" size={20} />
                    <div>
                      <p className="font-medium">Email Alerts</p>
                      <p className="text-xs text-base-content/60">Send notifications via email</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-info"
                    checked={settings.notifications.emailAlerts}
                    onChange={(e) =>
                      updateSection("notifications", "emailAlerts", e.target.checked)
                    }
                  />
                </div>

                {/* Low Inventory Alerts: notify when stock runs low. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiAlertCircle className="text-warning" size={20} />
                    <div>
                      <p className="font-medium">Low Inventory Alerts</p>
                      <p className="text-xs text-base-content/60">Alert for low blood stock</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-warning"
                    checked={settings.notifications.lowInventoryAlerts}
                    onChange={(e) =>
                      updateSection("notifications", "lowInventoryAlerts", e.target.checked)
                    }
                  />
                </div>

                {/* New User Alerts: notify on user registration. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiUsers className="text-success" size={20} />
                    <div>
                      <p className="font-medium">New User Alerts</p>
                      <p className="text-xs text-base-content/60">Alert for new registrations</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={settings.notifications.newUserAlerts}
                    onChange={(e) =>
                      updateSection("notifications", "newUserAlerts", e.target.checked)
                    }
                  />
                </div>

                {/* New Request Alerts: notify on blood requests. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiBell className="text-secondary" size={20} />
                    <div>
                      <p className="font-medium">New Request Alerts</p>
                      <p className="text-xs text-base-content/60">Alert for blood requests</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-secondary"
                    checked={settings.notifications.newRequestAlerts}
                    onChange={(e) =>
                      updateSection("notifications", "newRequestAlerts", e.target.checked)
                    }
                  />
                </div>
              </div>

              {/* Right column - reports and threshold */}
              <div className="space-y-4">
                {/* Weekly Summary Report: periodic digest. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiCalendar className="text-primary" size={20} />
                    <div>
                      <p className="font-medium">Weekly Summary Report</p>
                      <p className="text-xs text-base-content/60">Weekly activity digest</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.notifications.weeklySummaryReport}
                    onChange={(e) =>
                      updateSection("notifications", "weeklySummaryReport", e.target.checked)
                    }
                  />
                </div>

                {/* Monthly Report: comprehensive monthly stats. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiCalendar className="text-accent" size={20} />
                    <div>
                      <p className="font-medium">Monthly Report</p>
                      <p className="text-xs text-base-content/60">Monthly statistics</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-accent"
                    checked={settings.notifications.monthlyReport}
                    onChange={(e) =>
                      updateSection("notifications", "monthlyReport", e.target.checked)
                    }
                  />
                </div>

                {/* Alert Threshold: minimum units before alert. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Alert Threshold (units)</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className="input input-bordered w-full"
                    value={settings.notifications.alertThreshold}
                    onChange={(e) =>
                      updateSection(
                        "notifications",
                        "alertThreshold",
                        Number(e.target.value) || 10
                      )
                    }
                  />
                  <span className="label-text-alt text-base-content/50 mt-1">
                    Minimum units before low inventory alert
                  </span>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Data Policy Section */}
        {activeSection === "dataPolicy" && (
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-6"
          >
            {/* Section header with icon and title */}
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiDatabase className="text-success" />
              Data & Audit Settings
            </h3>

            {/* Two-column layout for data policy settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left column - numeric inputs and selects */}
              <div className="space-y-5">
                {/* Audit Log Retention: days to keep logs. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Audit Log Retention (days)</span>
                  <input
                    type="number"
                    min={30}
                    max={3650}
                    className="input input-bordered w-full"
                    value={settings.dataPolicy.auditLogRetentionDays}
                    onChange={(e) =>
                      updateSection(
                        "dataPolicy",
                        "auditLogRetentionDays",
                        Number(e.target.value) || 90
                      )
                    }
                  />
                  <span className="label-text-alt text-base-content/50 mt-1">
                    How long to keep audit logs (30-3650 days)
                  </span>
                </div>

                {/* Default Export Format: CSV, JSON, etc. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Default Export Format</span>
                  <select
                    className="select select-bordered w-full"
                    value={settings.dataPolicy.exportFormat}
                    onChange={(e) =>
                      updateSection("dataPolicy", "exportFormat", e.target.value)
                    }
                  >
                    <option value="csv">CSV (Comma Separated Values)</option>
                    <option value="json">JSON (JavaScript Object Notation)</option>
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="pdf">PDF (Portable Document Format)</option>
                  </select>
                </div>

                {/* Backup Frequency: how often to backup data. */}
                <div className="form-control w-full">
                  <span className="label-text font-medium mb-1">Backup Frequency</span>
                  <select
                    className="select select-bordered w-full"
                    value={settings.dataPolicy.backupFrequency}
                    onChange={(e) =>
                      updateSection("dataPolicy", "backupFrequency", e.target.value)
                    }
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Right column - data policy toggles */}
              <div className="space-y-4">
                {/* Include Sensitive Fields: privacy consideration. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiAlertCircle className="text-error" size={20} />
                    <div>
                      <p className="font-medium">Include Sensitive Fields</p>
                      <p className="text-xs text-base-content/60">In exports (may include PII)</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-error"
                    checked={settings.dataPolicy.includeSensitiveFieldsInExport}
                    onChange={(e) =>
                      updateSection(
                        "dataPolicy",
                        "includeSensitiveFieldsInExport",
                        e.target.checked
                      )
                    }
                  />
                </div>

                {/* Data Backup Enabled: automatic backup system. */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiDatabase className="text-success" size={20} />
                    <div>
                      <p className="font-medium">Data Backup Enabled</p>
                      <p className="text-xs text-base-content/60">Automatic system backups</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={settings.dataPolicy.dataBackupEnabled}
                    onChange={(e) =>
                      updateSection(
                        "dataPolicy",
                        "dataBackupEnabled",
                        e.target.checked
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Appearance Section */}
        {activeSection === "appearance" && (
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-6"
          >
            {/* Section header with icon and title */}
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiMonitor className="text-info" />
              Appearance Settings
            </h3>

            {/* Three-column layout for appearance settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dashboard Refresh: auto-refresh interval. */}
              <div className="form-control w-full">
                <span className="label-text font-medium mb-1">Dashboard Refresh (seconds)</span>
                <input
                  type="number"
                  min={10}
                  max={600}
                  className="input input-bordered w-full"
                  value={settings.appearance.dashboardRefreshSeconds}
                  onChange={(e) =>
                    updateSection(
                      "appearance",
                      "dashboardRefreshSeconds",
                      Number(e.target.value) || 60
                    )
                  }
                />
                <span className="label-text-alt text-base-content/50 mt-1">
                  Auto-refresh interval
                </span>
              </div>

              {/* Default Theme: light/dark/system preference. */}
              <div className="form-control w-full">
                <span className="label-text font-medium mb-1">Default Theme</span>
                <select
                  className="select select-bordered w-full"
                  value={settings.appearance.defaultTheme}
                  onChange={(e) =>
                    updateSection("appearance", "defaultTheme", e.target.value)
                  }
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              {/* Compact Tables: denser table display. */}
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg h-fit">
                <div>
                  <p className="font-medium">Compact Tables</p>
                  <p className="text-xs text-base-content/60">Show more rows per view</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-info"
                  checked={settings.appearance.compactTables}
                  onChange={(e) =>
                    updateSection("appearance", "compactTables", e.target.checked)
                  }
                />
              </div>

              {/* Show Animations: UI animation toggle. */}
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg h-fit">
                <div>
                  <p className="font-medium">Show Animations</p>
                  <p className="text-xs text-base-content/60">Enable motion effects</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-success"
                  checked={settings.appearance.showAnimations}
                  onChange={(e) =>
                    updateSection("appearance", "showAnimations", e.target.checked)
                  }
                />
              </div>
            </div>
          </motion.section>
        )}
      </div>

      {/* Mobile Save Button - FAB for small screens */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="lg:hidden fixed bottom-6 right-6 z-10"
      >
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="btn btn-error btn-circle shadow-xl w-14 h-14"
          data-tip="Save Settings"
        >
          {saveMutation.isPending ? (
            <span className="loading loading-spinner loading-md"></span>
          ) : (
            <FiSave size={24} />
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default AdminSettings;