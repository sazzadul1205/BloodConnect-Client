// Pages/backend/Admin/AdminSettings/AdminSettings.jsx

// React
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

// ==================== QUERY KEYS ====================

const queryKeys = {
  adminSettings: ['admin-settings'],
};

// ==================== CONSTANTS ====================

/**
 * Default settings configuration
 * Used as fallback when no settings are loaded from API
 */
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

/**
 * Section tabs configuration
 */
const sections = [
  { id: "general", label: "General", icon: FiSettings, color: "text-error" },
  { id: "security", label: "Security", icon: FiShield, color: "text-primary" },
  { id: "notifications", label: "Notifications", icon: FiBell, color: "text-warning" },
  { id: "dataPolicy", label: "Data & Audit", icon: FiDatabase, color: "text-success" },
  { id: "appearance", label: "Appearance", icon: FiMonitor, color: "text-info" },
];

// ==================== ANIMATION VARIANTS ====================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const sectionVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4
    }
  }
};

// ==================== MAIN COMPONENT ====================

/**
 * Admin Settings Component
 * Allows super admin to configure system-wide settings
 * 
 * @returns {JSX.Element} Admin settings page
 */
const AdminSettings = () => {
  const { axiosInstance } = useAxiosPublic();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [settings, setSettings] = useState(defaultSettings);
  const [activeSection, setActiveSection] = useState("general");

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query: Fetch admin settings
   */
  const {
    data: settingsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.adminSettings,
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ==================== MUTATIONS ====================

  /**
   * Mutation: Save admin settings
   */
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
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        },
        buttonsStyling: false,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSettings });
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Save Failed",
        text: err?.response?.data?.error || "Unable to save settings.",
        icon: "error",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    },
  });

  // ==================== EFFECTS ====================

  /**
   * Update local state when API data loads
   */
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

  // ==================== COMPUTED VALUES ====================

  /**
   * Calculate total enabled toggles for stats
   */
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

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Update specific setting field
   */
  const updateSection = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  /**
   * Handle reset to defaults with confirmation
   */
  const handleReset = () => {
    Swal.fire({
      title: "Reset Settings?",
      text: "This will restore settings to default values in the form.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Reset",
      cancelButtonText: "Cancel",
      background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        confirmButton: "btn btn-sm btn-warning",
        cancelButton: "btn btn-sm",
      },
      buttonsStyling: false,
    }).then((result) => {
      if (!result.isConfirmed) return;
      setSettings(defaultSettings);
    });
  };

  /**
   * Handle save settings
   */
  const handleSave = async () => {
    await saveMutation.mutateAsync({
      general: settings.general,
      security: settings.security,
      notifications: settings.notifications,
      dataPolicy: settings.dataPolicy,
      appearance: settings.appearance,
    });
  };

  // ==================== LOADING & ERROR STATES ====================

  if (isLoading) return <BloodLoader />;

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  // ==================== RENDER ====================

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-4 sm:space-y-6 min-h-screen bg-base-200 p-3 sm:p-4 md:p-6"
    >

      {/* ==================== HEADER SECTION ==================== */}
      <motion.div
        variants={fadeInUp}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        {/* Title and description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiSettings className="text-error" />
            Admin Settings
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Configure system behavior, security policies, notifications, and dashboard preferences.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full lg:w-auto">
          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="btn btn-outline btn-xs sm:btn-sm gap-1 sm:gap-2 flex-1 lg:flex-none"
          >
            <FiRefreshCw size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Reset</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 flex-1 lg:flex-none"
          >
            {saveMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span className="text-xs sm:text-sm">Saving...</span>
              </>
            ) : (
              <>
                <FiSave size={12} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Save Settings</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* ==================== STATS CARDS ==================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      >
        {/* Active Toggles Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Active Toggles</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-error">
                {totalEnabledToggles}
              </p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FiCheckCircle className="text-error text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Enabled configuration switches</p>
        </motion.div>

        {/* Session Timeout Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Session Timeout</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-info">
                {settings.security.sessionTimeoutMinutes}
              </p>
            </div>
            <div className="stat-figure bg-info/10 p-2 rounded-full">
              <FiClock className="text-info text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Minutes</p>
        </motion.div>

        {/* Log Retention Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Log Retention</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-success">
                {settings.dataPolicy.auditLogRetentionDays}
              </p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FiCalendar className="text-success text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Days</p>
        </motion.div>
      </motion.div>

      {/* ==================== SECTION TABS ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-2"
      >
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`btn btn-xs sm:btn-sm gap-1 sm:gap-2 ${isActive
                  ? 'btn-error text-white'
                  : 'btn-ghost'
                  }`}
              >
                <Icon size={12} className={`sm:w-4 sm:h-4 ${isActive ? 'text-white' : section.color}`} />
                <span className="text-[10px] sm:text-xs">{section.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ==================== SETTINGS SECTIONS ==================== */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">

        {/* ==================== GENERAL SECTION ==================== */}
        {activeSection === "general" && (
          <motion.section
            key="general"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiSettings className="text-error text-sm sm:text-base" />
              General Settings
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Left column - text inputs */}
              <div className="space-y-4 sm:space-y-5">
                {/* Organization Name */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Organization Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm sm:input-md w-full"
                    value={settings.general.organizationName}
                    onChange={(e) => updateSection("general", "organizationName", e.target.value)}
                  />
                </div>

                {/* Support Email */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Support Email</span>
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-xs sm:text-sm" />
                    <input
                      type="email"
                      className="input input-bordered input-sm sm:input-md w-full pl-7 sm:pl-10"
                      value={settings.general.supportEmail}
                      onChange={(e) => updateSection("general", "supportEmail", e.target.value)}
                    />
                  </div>
                </div>

                {/* Support Phone */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Support Phone</span>
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-xs sm:text-sm" />
                    <input
                      type="tel"
                      className="input input-bordered input-sm sm:input-md w-full pl-7 sm:pl-10"
                      value={settings.general.supportPhone}
                      onChange={(e) => updateSection("general", "supportPhone", e.target.value)}
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Website</span>
                  </label>
                  <div className="relative">
                    <FiGlobe className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-xs sm:text-sm" />
                    <input
                      type="url"
                      className="input input-bordered input-sm sm:input-md w-full pl-7 sm:pl-10"
                      value={settings.general.website}
                      onChange={(e) => updateSection("general", "website", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Right column - selects and toggles */}
              <div className="space-y-4 sm:space-y-5">
                {/* Default Page Size */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Default Page Size</span>
                  </label>
                  <select
                    className="select select-bordered select-sm sm:select-md w-full"
                    value={settings.general.defaultPageSize}
                    onChange={(e) => updateSection("general", "defaultPageSize", Number(e.target.value))}
                  >
                    <option value={5}>5 items per page</option>
                    <option value={10}>10 items per page</option>
                    <option value={20}>20 items per page</option>
                    <option value={50}>50 items per page</option>
                    <option value={100}>100 items per page</option>
                  </select>
                </div>

                {/* Maintenance Mode Toggle */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-warning/10 p-1.5 sm:p-2 rounded-full">
                      <FiAlertCircle className="text-warning text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Maintenance Mode</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">Users cannot access system</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-warning toggle-sm sm:toggle-md"
                    checked={settings.general.maintenanceMode}
                    onChange={(e) => updateSection("general", "maintenanceMode", e.target.checked)}
                  />
                </div>

                {/* Auto-Approve Blood Banks Toggle */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-success/10 p-1.5 sm:p-2 rounded-full">
                      <FiCheckCircle className="text-success text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Auto-Approve Blood Banks</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">Bypass manual verification</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success toggle-sm sm:toggle-md"
                    checked={settings.general.autoApproveBanks}
                    onChange={(e) => updateSection("general", "autoApproveBanks", e.target.checked)}
                  />
                </div>

                {/* Allow Public Registration Toggle */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-info/10 p-1.5 sm:p-2 rounded-full">
                      <FiUsers className="text-info text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Allow Public Registration</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">Users can create accounts</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-info toggle-sm sm:toggle-md"
                    checked={settings.general.allowPublicRegistration}
                    onChange={(e) => updateSection("general", "allowPublicRegistration", e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* ==================== SECURITY SECTION ==================== */}
        {activeSection === "security" && (
          <motion.section
            key="security"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiShield className="text-primary text-sm sm:text-base" />
              Security Settings
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Left column - numeric inputs */}
              <div className="space-y-4 sm:space-y-5">
                {/* Session Timeout */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Session Timeout (minutes)</span>
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    className="input input-bordered input-sm sm:input-md w-full"
                    value={settings.security.sessionTimeoutMinutes}
                    onChange={(e) => updateSection("security", "sessionTimeoutMinutes", Number(e.target.value) || 60)}
                  />
                  <span className="label-text-alt text-[10px] sm:text-xs text-base-content/50 mt-1">
                    Automatically log out after inactivity
                  </span>
                </div>

                {/* Max Login Attempts */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Max Login Attempts</span>
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    className="input input-bordered input-sm sm:input-md w-full"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSection("security", "maxLoginAttempts", Number(e.target.value) || 5)}
                  />
                  <span className="label-text-alt text-[10px] sm:text-xs text-base-content/50 mt-1">
                    Lock account after failed attempts
                  </span>
                </div>

                {/* Password Minimum Length */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Password Minimum Length</span>
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={20}
                    className="input input-bordered input-sm sm:input-md w-full"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => updateSection("security", "passwordMinLength", Number(e.target.value) || 8)}
                  />
                </div>

                {/* Allowed IP Ranges */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Allowed IP Ranges</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered textarea-sm sm:textarea-md w-full h-20 sm:h-24"
                    placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                    value={settings.security.allowedIpRanges}
                    onChange={(e) => updateSection("security", "allowedIpRanges", e.target.value)}
                  />
                  <span className="label-text-alt text-[10px] sm:text-xs text-base-content/50 mt-1">
                    One CIDR range per line (leave empty to allow all)
                  </span>
                </div>
              </div>

              {/* Right column - security toggles */}
              <div className="space-y-3 sm:space-y-4">
                {/* Require 2FA for Admins */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-primary/10 p-1.5 sm:p-2 rounded-full">
                      <FiLock className="text-primary text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Require 2FA for Admins</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">Additional security layer</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm sm:toggle-md"
                    checked={settings.security.require2FAForAdmins}
                    onChange={(e) => updateSection("security", "require2FAForAdmins", e.target.checked)}
                  />
                </div>

                {/* Allow Unknown Devices */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-warning/10 p-1.5 sm:p-2 rounded-full">
                      <FiAlertCircle className="text-warning text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Allow Unknown Devices</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">May increase security risk</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-warning toggle-sm sm:toggle-md"
                    checked={settings.security.allowUnknownDevices}
                    onChange={(e) => updateSection("security", "allowUnknownDevices", e.target.checked)}
                  />
                </div>

                {/* Password Requirements */}
                <div className="p-3 sm:p-4 bg-base-200 rounded-lg space-y-3">
                  <p className="font-medium text-xs sm:text-sm flex items-center gap-2">
                    <FiLock className="text-primary sm:w-4 sm:h-4" size={12} />
                    Password Requirements
                  </p>
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                    <span className="text-[10px] sm:text-xs">Require Special Character (!@#$%)</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success toggle-xs sm:toggle-sm"
                      checked={settings.security.requireSpecialChar}
                      onChange={(e) => updateSection("security", "requireSpecialChar", e.target.checked)}
                    />
                  </div>
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                    <span className="text-[10px] sm:text-xs">Require Number (0-9)</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success toggle-xs sm:toggle-sm"
                      checked={settings.security.requireNumber}
                      onChange={(e) => updateSection("security", "requireNumber", e.target.checked)}
                    />
                  </div>
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                    <span className="text-[10px] sm:text-xs">Require Uppercase (A-Z)</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success toggle-xs sm:toggle-sm"
                      checked={settings.security.requireUppercase}
                      onChange={(e) => updateSection("security", "requireUppercase", e.target.checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* ==================== NOTIFICATIONS SECTION ==================== */}
        {activeSection === "notifications" && (
          <motion.section
            key="notifications"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiBell className="text-warning text-sm sm:text-base" />
              Notification Settings
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Left column - alert toggles */}
              <div className="space-y-3 sm:space-y-4">
                {/* Email Alerts */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-info/10 p-1.5 sm:p-2 rounded-full">
                      <FiMail className="text-info text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Email Alerts</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">Send notifications via email</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-info toggle-sm sm:toggle-md"
                    checked={settings.notifications.emailAlerts}
                    onChange={(e) => updateSection("notifications", "emailAlerts", e.target.checked)}
                  />
                </div>

                {/* Low Inventory Alerts */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-warning/10 p-1.5 sm:p-2 rounded-full">
                      <FiAlertCircle className="text-warning text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Low Inventory Alerts</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">Alert for low blood stock</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-warning toggle-sm sm:toggle-md"
                    checked={settings.notifications.lowInventoryAlerts}
                    onChange={(e) => updateSection("notifications", "lowInventoryAlerts", e.target.checked)}
                  />
                </div>

                {/* New User Alerts */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-success/10 p-1.5 sm:p-2 rounded-full">
                      <FiUsers className="text-success text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">New User Alerts</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">Alert for new registrations</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success toggle-sm sm:toggle-md"
                    checked={settings.notifications.newUserAlerts}
                    onChange={(e) => updateSection("notifications", "newUserAlerts", e.target.checked)}
                  />
                </div>

                {/* New Request Alerts */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-secondary/10 p-1.5 sm:p-2 rounded-full">
                      <FiBell className="text-secondary text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">New Request Alerts</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">Alert for blood requests</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-secondary toggle-sm sm:toggle-md"
                    checked={settings.notifications.newRequestAlerts}
                    onChange={(e) => updateSection("notifications", "newRequestAlerts", e.target.checked)}
                  />
                </div>
              </div>

              {/* Right column - reports and threshold */}
              <div className="space-y-3 sm:space-y-4">
                {/* Weekly Summary Report */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-primary/10 p-1.5 sm:p-2 rounded-full">
                      <FiCalendar className="text-primary text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Weekly Summary Report</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">Weekly activity digest</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm sm:toggle-md"
                    checked={settings.notifications.weeklySummaryReport}
                    onChange={(e) => updateSection("notifications", "weeklySummaryReport", e.target.checked)}
                  />
                </div>

                {/* Monthly Report */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-accent/10 p-1.5 sm:p-2 rounded-full">
                      <FiCalendar className="text-accent text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Monthly Report</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">Monthly statistics</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-accent toggle-sm sm:toggle-md"
                    checked={settings.notifications.monthlyReport}
                    onChange={(e) => updateSection("notifications", "monthlyReport", e.target.checked)}
                  />
                </div>

                {/* Alert Threshold */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Alert Threshold (units)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className="input input-bordered input-sm sm:input-md w-full"
                    value={settings.notifications.alertThreshold}
                    onChange={(e) => updateSection("notifications", "alertThreshold", Number(e.target.value) || 10)}
                  />
                  <span className="label-text-alt text-[10px] sm:text-xs text-base-content/50 mt-1">
                    Minimum units before low inventory alert
                  </span>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* ==================== DATA POLICY SECTION ==================== */}
        {activeSection === "dataPolicy" && (
          <motion.section
            key="dataPolicy"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiDatabase className="text-success text-sm sm:text-base" />
              Data & Audit Settings
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Left column - numeric inputs and selects */}
              <div className="space-y-4 sm:space-y-5">
                {/* Audit Log Retention */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Audit Log Retention (days)</span>
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={3650}
                    className="input input-bordered input-sm sm:input-md w-full"
                    value={settings.dataPolicy.auditLogRetentionDays}
                    onChange={(e) => updateSection("dataPolicy", "auditLogRetentionDays", Number(e.target.value) || 90)}
                  />
                  <span className="label-text-alt text-[10px] sm:text-xs text-base-content/50 mt-1">
                    How long to keep audit logs (30-3650 days)
                  </span>
                </div>

                {/* Default Export Format */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Default Export Format</span>
                  </label>
                  <select
                    className="select select-bordered select-sm sm:select-md w-full"
                    value={settings.dataPolicy.exportFormat}
                    onChange={(e) => updateSection("dataPolicy", "exportFormat", e.target.value)}
                  >
                    <option value="csv">CSV (Comma Separated Values)</option>
                    <option value="json">JSON (JavaScript Object Notation)</option>
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="pdf">PDF (Portable Document Format)</option>
                  </select>
                </div>

                {/* Backup Frequency */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-medium">Backup Frequency</span>
                  </label>
                  <select
                    className="select select-bordered select-sm sm:select-md w-full"
                    value={settings.dataPolicy.backupFrequency}
                    onChange={(e) => updateSection("dataPolicy", "backupFrequency", e.target.value)}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Right column - data policy toggles */}
              <div className="space-y-3 sm:space-y-4">
                {/* Include Sensitive Fields */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-error/10 p-1.5 sm:p-2 rounded-full">
                      <FiAlertCircle className="text-error text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Include Sensitive Fields</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">In exports (may include PII)</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-error toggle-sm sm:toggle-md"
                    checked={settings.dataPolicy.includeSensitiveFieldsInExport}
                    onChange={(e) => updateSection("dataPolicy", "includeSensitiveFieldsInExport", e.target.checked)}
                  />
                </div>

                {/* Data Backup Enabled */}
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-success/10 p-1.5 sm:p-2 rounded-full">
                      <FiDatabase className="text-success text-sm sm:text-base" />
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Data Backup Enabled</p>
                      <p className="text-[10px] sm:text-xs text-base-content/60">Automatic system backups</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success toggle-sm sm:toggle-md"
                    checked={settings.dataPolicy.dataBackupEnabled}
                    onChange={(e) => updateSection("dataPolicy", "dataBackupEnabled", e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* ==================== APPEARANCE SECTION ==================== */}
        {activeSection === "appearance" && (
          <motion.section
            key="appearance"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiMonitor className="text-info text-sm sm:text-base" />
              Appearance Settings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

              {/* Dashboard Refresh */}
              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm font-medium">Dashboard Refresh (seconds)</span>
                </label>
                <input
                  type="number"
                  min={10}
                  max={600}
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={settings.appearance.dashboardRefreshSeconds}
                  onChange={(e) => updateSection("appearance", "dashboardRefreshSeconds", Number(e.target.value) || 60)}
                />
                <span className="label-text-alt text-[10px] sm:text-xs text-base-content/50 mt-1">
                  Auto-refresh interval
                </span>
              </div>

              {/* Default Theme */}
              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm font-medium">Default Theme</span>
                </label>
                <select
                  className="select select-bordered select-sm sm:select-md w-full"
                  value={settings.appearance.defaultTheme}
                  onChange={(e) => updateSection("appearance", "defaultTheme", e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              {/* Compact Tables Toggle */}
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3 h-fit">
                <div>
                  <p className="font-medium text-xs sm:text-sm">Compact Tables</p>
                  <p className="text-[10px] sm:text-xs text-base-content/60">Show more rows per view</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-info toggle-sm sm:toggle-md"
                  checked={settings.appearance.compactTables}
                  onChange={(e) => updateSection("appearance", "compactTables", e.target.checked)}
                />
              </div>

              {/* Show Animations Toggle */}
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3 h-fit">
                <div>
                  <p className="font-medium text-xs sm:text-sm">Show Animations</p>
                  <p className="text-[10px] sm:text-xs text-base-content/60">Enable motion effects</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-sm sm:toggle-md"
                  checked={settings.appearance.showAnimations}
                  onChange={(e) => updateSection("appearance", "showAnimations", e.target.checked)}
                />
              </div>
            </div>
          </motion.section>
        )}
      </div>

      {/* ==================== MOBILE SAVE BUTTON - FAB ==================== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="lg:hidden fixed bottom-4 right-4 z-10"
      >
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="btn btn-error btn-circle shadow-xl w-12 h-12 sm:w-14 sm:h-14"
          data-tip="Save Settings"
          aria-label="Save Settings"
        >
          {saveMutation.isPending ? (
            <span className="loading loading-spinner loading-sm sm:loading-md"></span>
          ) : (
            <FiSave size={18} className="sm:w-6 sm:h-6" />
          )}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default AdminSettings;