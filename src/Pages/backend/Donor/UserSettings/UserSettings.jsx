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
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        {/* Header copy: communicates context and purpose of user settings dashboard. */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {/* Visual identity icon for user settings system. */}
            <FiSettings className="text-error" />
            Account Settings
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Manage your notification preferences, privacy controls, profile statistics, and account settings.
          </p>
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
        {/* Card 1: Total Donations - user's lifetime donation count. */}
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
          <p className="stat-title">Total Donations</p>
          <p className="stat-value text-3xl">
            {profileData?.stats?.totalDonations || 0}
          </p>
          <p className="stat-desc">Lifetime contributions</p>
        </motion.div>

        {/* Card 2: Response Rate - user's engagement metric. */}
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
          <p className="stat-title">Response Rate</p>
          <p className="stat-value text-3xl">
            {profileData?.stats?.responseRate || 0}%
          </p>
          <p className="stat-desc">Request response rate</p>
        </motion.div>

        {/* Card 3: Reputation - user's trust score. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-success">
            <FiStar size={24} />
          </div>
          <p className="stat-title">Reputation</p>
          <p className="stat-value text-3xl">
            {profileData?.stats?.reputation || 0}
          </p>
          <p className="stat-desc">Trust score</p>
        </motion.div>
      </motion.div>

      {/* Notifications Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-5"
      >
        {/* Section header with icon and title */}
        <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
          <FiBell className="text-error" />
          Notification Preferences
        </h3>

        {/* Three-column layout for notification settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Email Notifications: system alerts via email. */}
          <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FiMail className="text-info" size={20} />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-xs text-base-content/60">Receive email alerts</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-error"
              checked={settingsForm.notifications.email}
              onChange={() => handleSettingsToggle("notifications", "email")}
            />
          </div>

          {/* SMS Notifications: mobile text alerts. */}
          <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FiPhone className="text-warning" size={20} />
              <div>
                <p className="font-medium">SMS</p>
                <p className="text-xs text-base-content/60">Text message alerts</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-warning"
              checked={settingsForm.notifications.sms}
              onChange={() => handleSettingsToggle("notifications", "sms")}
            />
          </div>

          {/* Push Notifications: in-app/browser notifications. */}
          <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FiSmartphone className="text-success" size={20} />
              <div>
                <p className="font-medium">Push</p>
                <p className="text-xs text-base-content/60">Browser push alerts</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-success"
              checked={settingsForm.notifications.push}
              onChange={() => handleSettingsToggle("notifications", "push")}
            />
          </div>
        </div>

        {/* Save button for notification settings */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={settingsMutation.isPending}
            className="btn btn-error btn-sm gap-2"
          >
            <FiSave size={16} />
            {settingsMutation.isPending ? "Saving..." : "Save Notification Settings"}
          </button>
        </div>
      </motion.section>

      {/* Privacy Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-5"
      >
        {/* Section header with icon and title */}
        <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
          <FiShield className="text-error" />
          Privacy Controls
        </h3>

        {/* Two-column layout for privacy settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Show Location: display location to other users. */}
          <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FiMapPin className="text-info" size={20} />
              <div>
                <p className="font-medium">Show Location</p>
                <p className="text-xs text-base-content/60">Display your location to others</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-info"
              checked={settingsForm.privacy.showLocation}
              onChange={() => handleSettingsToggle("privacy", "showLocation")}
            />
          </div>

          {/* Show Contact Details: display contact information. */}
          <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FiUsers className="text-warning" size={20} />
              <div>
                <p className="font-medium">Show Contact Details</p>
                <p className="text-xs text-base-content/60">Display phone/email to others</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-warning"
              checked={settingsForm.privacy.showContact}
              onChange={() => handleSettingsToggle("privacy", "showContact")}
            />
          </div>

          {/* Show Last Donation: display donation history. */}
          <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg md:col-span-2">
            <div className="flex items-center gap-3">
              <FiCalendar className="text-success" size={20} />
              <div>
                <p className="font-medium">Show Last Donation Date</p>
                <p className="text-xs text-base-content/60">Display your most recent donation</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-success"
              checked={settingsForm.privacy.showLastDonation}
              onChange={() =>
                handleSettingsToggle("privacy", "showLastDonation")
              }
            />
          </div>
        </div>

        {/* Save button for privacy settings */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={settingsMutation.isPending}
            className="btn btn-error btn-sm gap-2"
          >
            <FiSave size={16} />
            {settingsMutation.isPending ? "Saving..." : "Save Privacy Settings"}
          </button>
        </div>
      </motion.section>

      {/* Danger Zone Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="bg-base-100 rounded-lg shadow-lg border border-error/30 p-6"
      >
        {/* Section header with icon and title */}
        <h3 className="text-lg font-semibold text-error flex items-center gap-2 pb-2 border-b border-error/20">
          <FiTrash2 />
          Danger Zone
        </h3>

        {/* Warning message and delete button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-3">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-error shrink-0 mt-1" size={20} />
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-base-content/70">
                Once you delete your account, there is no going back. This action is irreversible and will deactivate your profile immediately.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-error gap-2 shrink-0"
            onClick={handleDeleteAccount}
            disabled={deleteAccountMutation.isPending}
          >
            <FiTrash2 size={16} />
            {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </motion.section>

      {/* Mobile Save Button - FAB for small screens (if needed) */}
      {(settingsMutation.isPending || statsMutation.isPending) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden fixed bottom-6 right-6 z-10"
        >
          <div className="btn btn-error btn-circle shadow-xl w-14 h-14">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UserSettings;
