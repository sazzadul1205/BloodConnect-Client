// Pages/frontend/User/UserSettings/UserSettings.jsx

// React
import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FiSettings,
  FiBell,
  FiShield,
  FiSave,
  FiTrash2,
  FiMail,
  FiPhone,
  FiSmartphone,
  FiMapPin,
  FiUsers,
  FiCalendar,
  FiStar,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";

// Default settings configuration
const defaultSettingsForm = {
  notifications: {
    email: true,
    sms: false,
    push: true,
  },
  privacy: {
    showLocation: true,
    showContact: false,
    showLastDonation: true,
  },
};

const UserSettings = () => {
  const { user, logout } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");
  const userId = user?._id || user?.userId || user?.id || user?.uid;

  // State management
  const [settingsForm, setSettingsForm] = useState(defaultSettingsForm);

  // Fetch user profile and settings
  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user-settings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/profile/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data?.data;
    },
  });

  // Update local state when API data loads
  useEffect(() => {
    if (!profileData) return;

    const notifications = profileData?.settings?.notifications || {};
    const privacy = profileData?.settings?.privacy || {};

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettingsForm({
      notifications: {
        email: notifications.email ?? true,
        sms: notifications.sms ?? false,
        push: notifications.push ?? true,
      },
      privacy: {
        showLocation: privacy.showLocation ?? true,
        showContact: privacy.showContact ?? false,
        showLastDonation: privacy.showLastDonation ?? true,
      },
    });

  }, [profileData]);

  // Save notification & privacy settings mutation
  const settingsMutation = useMutation({
    mutationFn: async (payload) =>
      axiosInstance.patch(`/users/settings/${userId}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: async () => {
      await Swal.fire({
        title: "Settings Updated",
        text: "Your notification and privacy settings have been saved successfully.",
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
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update settings.",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    },
  });

  // Save stats mutation
  const statsMutation = useMutation({
    mutationFn: async (payload) =>
      axiosInstance.patch(`/users/stats/${userId}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: async () => {
      await Swal.fire({
        title: "Stats Updated",
        text: "Your profile statistics have been updated successfully.",
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
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update stats.",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () =>
      axiosInstance.delete(`/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: async () => {
      await Swal.fire({
        title: "Account Deleted",
        text: "Your account has been deactivated successfully.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
      await logout();
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Delete Failed",
        text: err?.response?.data?.error || "Unable to delete account.",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    },
  });

  // Update toggle settings
  const handleSettingsToggle = (group, key) => {
    setSettingsForm((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: !prev[group][key],
      },
    }));
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    await settingsMutation.mutateAsync({
      notifications: settingsForm.notifications,
      privacy: settingsForm.privacy,
    });
  };

  // Handle delete account with confirmation
  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: "Delete Account?",
      text: "This action is irreversible. Your account will be deactivated and you will be signed out immediately.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete my account",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        confirmButton: "btn btn-sm btn-error",
        cancelButton: "btn btn-sm",
      },
      buttonsStyling: false,
    });

    if (!result.isConfirmed) return;
    await deleteAccountMutation.mutateAsync();
  };

  // Loading state
  if (!userId) {
    return (
      <div className="min-h-screen bg-base-200 p-6">
        <div className="bg-base-100 rounded-lg border border-base-300 p-8 text-center">
          <FiAlertCircle className="mx-auto text-4xl text-error mb-3" />
          <p className="text-base-content/70">Unable to resolve user settings.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) return <BloodLoader />;

  // Error state
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-base-200 p-3 sm:p-4 md:p-6">
      {/* Header Section with Fade In - Enhanced Responsive */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
      >
        {/* Header copy: communicates context and purpose of user settings dashboard. */}
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            {/* Visual identity icon for user settings system. */}
            <FiSettings className="text-error text-lg sm:text-2xl" />
            Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1 max-w-2xl">
            Manage your notification preferences, privacy controls, profile statistics, and account settings.
          </p>
        </div>

        {/* Optional: Add a quick action button for mobile */}
        <div className="w-full sm:w-auto flex justify-end">
          <button className="btn btn-sm btn-error btn-outline gap-2 w-full sm:w-auto">
            <FiRefreshCw size={14} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards with Staggered Fade In - Enhanced Responsive Grid */}
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      >
        {/* Card 1: Total Donations - user's lifetime donation count. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 hover:shadow-xl transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm">Total Donations</p>
              <p className="stat-value text-2xl sm:text-3xl md:text-4xl mt-1">
                {profileData?.stats?.totalDonations || 0}
              </p>
            </div>
            <div className="stat-figure text-error bg-error/10 p-2 rounded-lg">
              <FiCheckCircle size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2 flex items-center gap-1">
            <span className="text-success">↑ 12%</span>
            <span className="text-base-content/50">from last month</span>
          </p>
        </motion.div>

        {/* Card 2: Response Rate - user's engagement metric. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 hover:shadow-xl transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm">Response Rate</p>
              <p className="stat-value text-2xl sm:text-3xl md:text-4xl mt-1">
                {profileData?.stats?.responseRate || 0}%
              </p>
            </div>
            <div className="stat-figure text-info bg-info/10 p-2 rounded-lg">
              <FiClock size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2 flex items-center gap-1">
            <span className="text-warning">↗ 5%</span>
            <span className="text-base-content/50">above average</span>
          </p>
        </motion.div>

        {/* Card 3: Reputation - user's trust score. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm">Reputation</p>
              <p className="stat-value text-2xl sm:text-3xl md:text-4xl mt-1">
                {profileData?.stats?.reputation || 0}
              </p>
            </div>
            <div className="stat-figure text-success bg-success/10 p-2 rounded-lg">
              <FiStar size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="stat-desc text-xs mt-2 flex items-center gap-1">
            <div className="rating rating-xs gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <input
                  key={star}
                  type="radio"
                  name="rating-2"
                  className="mask mask-star-2 bg-orange-400"
                  checked={star <= Math.round((profileData?.stats?.reputation || 0) / 20)}
                  readOnly
                />
              ))}
            </div>
            <span className="text-base-content/50 ml-1">trust score</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Notifications Section - Enhanced Responsive */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4 sm:space-y-5"
      >
        {/* Section header with icon and title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-base-300">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <FiBell className="text-error text-sm sm:text-base" />
            Notification Preferences
          </h2>

          {/* Mobile-friendly indicator */}
          <span className="text-xs text-base-content/50 sm:hidden">
            Tap to toggle settings
          </span>
        </div>

        {/* Three-column layout for notification settings - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Email Notifications: system alerts via email. */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-base-200 rounded-lg hover:bg-base-300/50 transition-colors">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-info/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                <FiMail className="text-info text-sm sm:text-base" size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">Email</p>
                <p className="text-xs text-base-content/60 truncate">Receive email alerts</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-info toggle-sm sm:toggle-md"
              checked={settingsForm.notifications.email}
              onChange={() => handleSettingsToggle("notifications", "email")}
              aria-label="Toggle email notifications"
            />
          </div>

          {/* SMS Notifications: mobile text alerts. */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-base-200 rounded-lg hover:bg-base-300/50 transition-colors">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-warning/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                <FiSmartphone className="text-warning text-sm sm:text-base" size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">SMS</p>
                <p className="text-xs text-base-content/60 truncate">Text message alerts</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-warning toggle-sm sm:toggle-md"
              checked={settingsForm.notifications.sms}
              onChange={() => handleSettingsToggle("notifications", "sms")}
              aria-label="Toggle SMS notifications"
            />
          </div>

          {/* Push Notifications: in-app/browser notifications. */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-base-200 rounded-lg hover:bg-base-300/50 transition-colors sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-success/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                <FiBell className="text-success text-sm sm:text-base" size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">Push</p>
                <p className="text-xs text-base-content/60 truncate">Browser push alerts</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-success toggle-sm sm:toggle-md"
              checked={settingsForm.notifications.push}
              onChange={() => handleSettingsToggle("notifications", "push")}
              aria-label="Toggle push notifications"
            />
          </div>
        </div>

        {/* Save button for notification settings - Responsive */}
        <div className="pt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <p className="text-xs text-base-content/50 order-2 sm:order-1">
            Changes are saved automatically or click save
          </p>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={settingsMutation.isPending}
            className="btn btn-error btn-sm sm:btn-md gap-2 w-full sm:w-auto order-1 sm:order-2"
          >
            {settingsMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiSave size={14} className="sm:w-4 sm:h-4" />
                <span>Save Notification Settings</span>
              </>
            )}
          </button>
        </div>
      </motion.section>

      {/* Privacy Section - Enhanced Responsive */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4 sm:space-y-5"
      >
        {/* Section header with icon and title */}
        <div className="flex items-center justify-between pb-2 border-b border-base-300">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <FiShield className="text-error text-sm sm:text-base" />
            Privacy Controls
          </h2>

          {/* Privacy score indicator - visible on larger screens */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-base-content/50">Privacy Score</span>
            <progress className="progress progress-success w-20 h-2" value="85" max="100"></progress>
            <span className="text-xs font-semibold">85%</span>
          </div>
        </div>

        {/* Two-column layout for privacy settings - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Show Location: display location to other users. */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-base-200 rounded-lg hover:bg-base-300/50 transition-colors">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-info/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                <FiMapPin className="text-info text-sm sm:text-base" size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">Show Location</p>
                <p className="text-xs text-base-content/60 truncate hidden sm:block">Display location to others</p>
                <p className="text-xs text-base-content/60 block sm:hidden">Location visibility</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-info toggle-sm sm:toggle-md"
              checked={settingsForm.privacy.showLocation}
              onChange={() => handleSettingsToggle("privacy", "showLocation")}
              aria-label="Toggle location visibility"
            />
          </div>

          {/* Show Contact Details: display contact information. */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-base-200 rounded-lg hover:bg-base-300/50 transition-colors">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-warning/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                <FiUsers className="text-warning text-sm sm:text-base" size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">Show Contact</p>
                <p className="text-xs text-base-content/60 truncate hidden sm:block">Display phone/email to others</p>
                <p className="text-xs text-base-content/60 block sm:hidden">Contact visibility</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-warning toggle-sm sm:toggle-md"
              checked={settingsForm.privacy.showContact}
              onChange={() => handleSettingsToggle("privacy", "showContact")}
              aria-label="Toggle contact visibility"
            />
          </div>

          {/* Show Last Donation: display donation history. */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-base-200 rounded-lg hover:bg-base-300/50 transition-colors md:col-span-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="bg-success/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                <FiCalendar className="text-success text-sm sm:text-base" size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">Show Last Donation Date</p>
                <p className="text-xs text-base-content/60 truncate">Display your most recent donation to others</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-success toggle-sm sm:toggle-md"
              checked={settingsForm.privacy.showLastDonation}
              onChange={() => handleSettingsToggle("privacy", "showLastDonation")}
              aria-label="Toggle last donation visibility"
            />
          </div>
        </div>

        {/* Privacy summary for mobile */}
        <div className="block sm:hidden text-xs bg-base-300/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Privacy Summary</p>
          <p className="text-base-content/70">
            {Object.values(settingsForm.privacy).filter(Boolean).length} of 3 privacy settings enabled
          </p>
        </div>

        {/* Save button for privacy settings - Responsive */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={settingsMutation.isPending}
            className="btn btn-error btn-sm sm:btn-md gap-2 w-full sm:w-auto"
          >
            {settingsMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiSave size={14} className="sm:w-4 sm:h-4" />
                <span>Save Privacy Settings</span>
              </>
            )}
          </button>
        </div>
      </motion.section>

      {/* Danger Zone Section - Enhanced Responsive */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="bg-base-100 rounded-lg shadow-lg border border-error/30 p-4 sm:p-6"
      >
        {/* Section header with icon and title */}
        <div className="flex items-center gap-2 pb-2 border-b border-error/20">
          <FiTrash2 className="text-error text-sm sm:text-base" />
          <h2 className="text-base sm:text-lg font-semibold text-error">Danger Zone</h2>

          {/* Warning badge for mobile */}
          <span className="badge badge-error badge-xs sm:hidden ml-auto">Caution</span>
        </div>

        {/* Warning message and delete button - Responsive layout */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 sm:gap-6 mt-3 sm:mt-4">
          <div className="flex items-start gap-2 sm:gap-3 flex-1">
            <div className="bg-error/10 p-1.5 sm:p-2 rounded-lg shrink-0 mt-0.5">
              <FiAlertCircle className="text-error text-sm sm:text-base" size={18} />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="font-medium text-sm sm:text-base">Delete Account</p>
              <p className="text-xs sm:text-sm text-base-content/70">
                Once you delete your account, there is no going back. This action is irreversible and will:
              </p>
              <ul className="text-xs text-base-content/60 list-disc list-inside mt-2 space-y-1">
                <li className="truncate">Permanently delete your profile</li>
                <li className="hidden sm:list-item">Remove all your donation history</li>
                <li className="hidden sm:list-item">Cancel any pending requests</li>
              </ul>
            </div>
          </div>

          {/* Delete button with confirmation flow */}
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <button
              type="button"
              className="btn btn-outline btn-error btn-sm sm:btn-md gap-2 w-full lg:w-auto order-2 lg:order-1"
              onClick={() => {/* Handle cancel */ }}
            >
              <FiX size={14} />
              <span className="sm:hidden">No</span>
              <span className="hidden sm:inline">Cancel</span>
            </button>
            <button
              type="button"
              className="btn btn-error btn-sm sm:btn-md gap-2 w-full lg:w-auto order-1 lg:order-2"
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <FiTrash2 size={14} />
                  <span>Delete Account</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Additional warning for mobile */}
        <div className="mt-4 p-3 bg-error/5 rounded-lg border border-error/20 lg:hidden">
          <p className="text-xs text-error flex items-center gap-1">
            <FiAlertCircle size={12} />
            <span>This action cannot be undone. Please be certain.</span>
          </p>
        </div>
      </motion.section>

      {/* Mobile Save Button - FAB for small screens */}
      {(settingsMutation.isPending || statsMutation.isPending) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden fixed bottom-4 right-4 z-20"
        >
          <button className="btn btn-error btn-circle shadow-xl w-12 h-12 sm:w-14 sm:h-14">
            <span className="loading loading-spinner loading-sm"></span>
          </button>
        </motion.div>
      )}

      {/* Progress indicator for long forms - visible on mobile */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-base-300 z-30 lg:hidden">
        <div
          className="h-full bg-error transition-all duration-300"
          style={{ width: '65%' }} // Calculate based on form completion
        ></div>
      </div>
    </div>
  );
};

export default UserSettings;
