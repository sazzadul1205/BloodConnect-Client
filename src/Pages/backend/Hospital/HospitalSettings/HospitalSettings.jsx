// Pages/backend/Hospital/HospitalSettings/HospitalSettings.jsx

// React
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FiBell,
  FiShield,
  FiSave,
  FiTrash2,
  FiMail,
  FiPhone,
  FiSmartphone,
  FiMapPin,
  FiUsers,
  FiStar,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiUser,
  FiGlobe,
  FiEdit2,
  FiImage,
  FiRefreshCw,
  FiKey,
} from "react-icons/fi";
import {
  FaHospital,
  FaMapMarkerAlt,
  FaAmbulance,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";
import ChangePasswordModal from "../../Admin/UsersManagement/ChangePasswordModal/ChangePasswordModal";

// ==================== QUERY KEYS ====================

const queryKeys = {
  hospitalSettings: (userId) => ['hospital-settings', userId],
};

// ==================== CONSTANTS ====================

// Default settings configuration
const defaultSettingsForm = {
  notifications: {
    email: true,
    sms: true,
    push: false,
  },
  privacy: {
    showLocation: true,
    showContact: true,
  },
};

// Animation variants for staggered animations
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

// ==================== MAIN COMPONENT ====================

const HospitalSettings = () => {
  const { user, logout } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");
  const userId = user?._id || user?.userId || user?.id || user?.uid;

  // ==================== STATE MANAGEMENT ====================

  const [activeTab, setActiveTab] = useState("profile");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    bio: "",
    profilePicture: "",
    emergencyContact: {
      name: "",
      relation: "",
      phone: "",
    },
  });

  // Address form state
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    coordinates: [0, 0],
  });

  // Settings form state (notifications & privacy)
  const [settingsForm, setSettingsForm] = useState(defaultSettingsForm);

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query: Fetch hospital profile and settings
   * Combines profile, address, and settings data in one request
   */
  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.hospitalSettings(userId),
    enabled: !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/profile/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // ==================== MUTATIONS ====================

  /**
   * Mutation 1: Save profile information
   * Updates hospital name, bio, profile picture, and emergency contact
   */
  const profileMutation = useMutation({
    mutationFn: async (payload) =>
      axiosInstance.patch(`/users/profile/${userId}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: async () => {
      await Swal.fire({
        title: "Profile Updated",
        text: "Your hospital profile has been updated successfully.",
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
      // Invalidate query to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitalSettings(userId) });
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update profile.",
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

  /**
   * Mutation 2: Save address information
   * Updates hospital street address, city, state, zip, and coordinates
   */
  const addressMutation = useMutation({
    mutationFn: async (payload) =>
      axiosInstance.patch(`/users/address/${userId}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: async () => {
      await Swal.fire({
        title: "Address Updated",
        text: "Your hospital address has been updated successfully.",
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
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitalSettings(userId) });
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update address.",
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

  /**
   * Mutation 3: Save notification & privacy settings
   */
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
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        },
        buttonsStyling: false,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitalSettings(userId) });
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update settings.",
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

  /**
   * Mutation 4: Update statistics (manual refresh)
   */
  const statsMutation = useMutation({
    mutationFn: async (payload) =>
      axiosInstance.patch(`/users/stats/${userId}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: async () => {
      await Swal.fire({
        title: "Stats Updated",
        text: "Your hospital statistics have been updated successfully.",
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
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitalSettings(userId) });
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update stats.",
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

  /**
   * Mutation 5: Delete account (danger zone)
   */
  const deleteAccountMutation = useMutation({
    mutationFn: async () =>
      axiosInstance.delete(`/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    onSuccess: async () => {
      await Swal.fire({
        title: "Account Deleted",
        text: "Your hospital account has been deactivated successfully.",
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
      await logout();
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Delete Failed",
        text: err?.response?.data?.error || "Unable to delete account.",
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
   * Maps profile data to form states
   */
  useEffect(() => {
    if (!profileData) return;

    // Update profile form
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileForm({
      fullName: profileData?.profile?.fullName || "",
      bio: profileData?.profile?.bio || "",
      profilePicture: profileData?.profile?.profilePicture || "",
      emergencyContact: {
        name: profileData?.profile?.emergencyContact?.name || "",
        relation: profileData?.profile?.emergencyContact?.relation || "",
        phone: profileData?.profile?.emergencyContact?.phone || "",
      },
    });

    // Update address form
    setAddressForm({
      street: profileData?.address?.street || "",
      city: profileData?.address?.city || "",
      state: profileData?.address?.state || "",
      zipCode: profileData?.address?.zipCode || "",
      country: profileData?.address?.country || "",
      coordinates: profileData?.address?.coordinates?.coordinates || [0, 0],
    });

    // Update settings form with fallbacks
    const notifications = profileData?.settings?.notifications || {};
    const privacy = profileData?.settings?.privacy || {};

    setSettingsForm({
      notifications: {
        email: notifications.email ?? true,
        sms: notifications.sms ?? true,
        push: notifications.push ?? false,
      },
      privacy: {
        showLocation: privacy.showLocation ?? true,
        showContact: privacy.showContact ?? true,
      },
    });

  }, [profileData]);

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle profile input changes
   */
  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Handle emergency contact changes (nested object)
   */
  const handleEmergencyContactChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value,
      },
    }));
  };

  /**
   * Handle address input changes
   */
  const handleAddressChange = (field, value) => {
    setAddressForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Handle coordinates change (array of [longitude, latitude])
   */
  const handleCoordinatesChange = (index, value) => {
    const newCoords = [...addressForm.coordinates];
    newCoords[index] = parseFloat(value) || 0;
    setAddressForm((prev) => ({
      ...prev,
      coordinates: newCoords,
    }));
  };

  /**
   * Handle settings toggle switches
   */
  const handleSettingsToggle = (group, key) => {
    setSettingsForm((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: !prev[group][key],
      },
    }));
  };

  /**
   * Handle save profile
   */
  const handleSaveProfile = async () => {
    await profileMutation.mutateAsync({
      fullName: profileForm.fullName,
      bio: profileForm.bio,
      profilePicture: profileForm.profilePicture,
      emergencyContact: profileForm.emergencyContact,
    });
  };

  /**
   * Handle save address
   */
  const handleSaveAddress = async () => {
    await addressMutation.mutateAsync({
      street: addressForm.street,
      city: addressForm.city,
      state: addressForm.state,
      zipCode: addressForm.zipCode,
      country: addressForm.country,
      coordinates: addressForm.coordinates,
    });
  };

  /**
   * Handle save settings (notifications & privacy)
   */
  const handleSaveSettings = async () => {
    await settingsMutation.mutateAsync({
      notifications: settingsForm.notifications,
      privacy: settingsForm.privacy,
    });
  };

  /**
   * Handle update statistics (manual refresh)
   */
  const handleUpdateStats = async () => {
    await statsMutation.mutateAsync({
      totalDonations: profileData?.stats?.totalDonations || 0,
      totalRequests: profileData?.stats?.totalRequests || 0,
      responseRate: profileData?.stats?.responseRate || 0,
    });
  };

  /**
   * Handle delete account with confirmation
   */
  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: "Delete Hospital Account?",
      html: `
        <div class="text-left">
          <p class="mb-3">This action is irreversible. Your hospital account will be deactivated and:</p>
          <ul class="list-disc list-inside text-sm mb-3">
            <li>All blood requests will be cancelled</li>
            <li>Staff associations will be removed</li>
            <li>You will be signed out immediately</li>
          </ul>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete hospital account",
      cancelButtonText: "Cancel",
      background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        title: "text-lg font-bold text-error",
        htmlContainer: "text-sm sm:text-base text-base-content/80",
        confirmButton: "btn btn-sm btn-error text-white",
        cancelButton: "btn btn-sm",
      },
      buttonsStyling: false,
    });

    if (!result.isConfirmed) return;
    await deleteAccountMutation.mutateAsync();
  };

  // ==================== LOADING & ERROR STATES ====================

  if (!userId) {
    return (
      <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-6">
        <div className="bg-base-100 rounded-lg border border-base-300 p-6 sm:p-8 text-center">
          <FiAlertCircle className="mx-auto text-3xl sm:text-4xl text-error mb-3" />
          <p className="text-xs sm:text-sm text-base-content/70">Unable to resolve hospital settings.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <BloodLoader />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  /**
 * Close password modal
 */
  const closePasswordModal = () => {
    document.getElementById("settings_change_password_modal")?.close();
  };

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
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        {/* Title and description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FaHospital className="text-error" />
            Hospital Settings
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Manage your hospital profile, address, notification preferences, and account settings.
          </p>
        </div>

        {/* Hospital Name Badge */}
        <div className="badge badge-lg badge-outline p-3 sm:p-4">
          <FaHospital className="mr-2 text-error text-xs sm:text-sm" />
          <span className="text-xs sm:text-sm truncate max-w-40">
            {profileData?.profile?.fullName || "Hospital"}
          </span>
        </div>
        {/* Change Password Button */}
        <button
          type="button"
          onClick={() =>
            document.getElementById("settings_change_password_modal")?.showModal()
          }
          className="btn btn-outline btn-xs sm:btn-sm gap-1 sm:gap-2 flex-1 sm:flex-none"
        >
          <FiKey size={12} className="sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Change Password</span>
        </button>
      </motion.div>

      {/* ==================== STATS CARDS ==================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      >
        {/* Total Requests Card */}
        <motion.div
          variants={fadeInUp}
          className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Total Requests</p>
              <p className="stat-value text-xl sm:text-2xl md:text-3xl font-bold text-error">
                {profileData?.stats?.totalRequests || 0}
              </p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FiCheckCircle className="text-error text-lg sm:text-xl" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Blood requests made</p>
        </motion.div>

        {/* Response Rate Card */}
        <motion.div
          variants={fadeInUp}
          className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Response Rate</p>
              <p className="stat-value text-xl sm:text-2xl md:text-3xl font-bold text-info">
                {profileData?.stats?.responseRate || 0}%
              </p>
            </div>
            <div className="stat-figure bg-info/10 p-2 rounded-full">
              <FiClock className="text-info text-lg sm:text-xl" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Request fulfillment rate</p>
        </motion.div>

        {/* Reputation Card */}
        <motion.div
          variants={fadeInUp}
          className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Reputation</p>
              <p className="stat-value text-xl sm:text-2xl md:text-3xl font-bold text-success">
                {profileData?.stats?.reputation || 0}
              </p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FiStar className="text-success text-lg sm:text-xl" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Trust score</p>
        </motion.div>
      </motion.div>

      {/* ==================== SETTINGS TABS ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
      >
        {/* Tab Navigation - Responsive */}
        <div className="flex flex-wrap border-b border-base-300">
          <button
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 font-medium text-[10px] sm:text-sm flex items-center justify-center gap-1 sm:gap-2 ${activeTab === 'profile' ? 'bg-error/10 text-error border-b-2 border-error' : 'hover:bg-base-200'
              }`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser size={12} className="sm:w-4 sm:h-4" />
            <span>Profile</span>
          </button>
          <button
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 font-medium text-[10px] sm:text-sm flex items-center justify-center gap-1 sm:gap-2 ${activeTab === 'address' ? 'bg-error/10 text-error border-b-2 border-error' : 'hover:bg-base-200'
              }`}
            onClick={() => setActiveTab('address')}
          >
            <FiMapPin size={12} className="sm:w-4 sm:h-4" />
            <span>Address</span>
          </button>
          <button
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 font-medium text-[10px] sm:text-sm flex items-center justify-center gap-1 sm:gap-2 ${activeTab === 'notifications' ? 'bg-error/10 text-error border-b-2 border-error' : 'hover:bg-base-200'
              }`}
            onClick={() => setActiveTab('notifications')}
          >
            <FiBell size={12} className="sm:w-4 sm:h-4" />
            <span>Notifications</span>
          </button>
          <button
            className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 font-medium text-[10px] sm:text-sm flex items-center justify-center gap-1 sm:gap-2 ${activeTab === 'privacy' ? 'bg-error/10 text-error border-b-2 border-error' : 'hover:bg-base-200'
              }`}
            onClick={() => setActiveTab('privacy')}
          >
            <FiShield size={12} className="sm:w-4 sm:h-4" />
            <span>Privacy</span>
          </button>
        </div>

        {/* ==================== PROFILE TAB ==================== */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiUser className="text-error text-sm sm:text-base" />
              Hospital Profile Information
            </h2>

            {/* Responsive grid: 1 column on mobile, 2 on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

              {/* Hospital Name - Full width */}
              <div className="form-control md:col-span-2">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                    <FaHospital className="text-error" size={12} />
                    Hospital Name *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter hospital name"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={profileForm.fullName}
                  onChange={(e) => handleProfileChange("fullName", e.target.value)}
                />
              </div>

              {/* Profile Picture URL */}
              <div className="form-control md:col-span-2">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                    <FiImage className="text-error" size={12} />
                    Profile Picture URL
                  </span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/hospital-logo.jpg"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={profileForm.profilePicture}
                  onChange={(e) => handleProfileChange("profilePicture", e.target.value)}
                />
              </div>

              {/* Hospital Description */}
              <div className="form-control md:col-span-2">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                    <FiEdit2 className="text-error" size={12} />
                    Hospital Description
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered textarea-sm sm:textarea-md h-20 sm:h-24 w-full"
                  placeholder="Describe your hospital, specialties, facilities..."
                  value={profileForm.bio ?? ""}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                />
              </div>

              {/* Emergency Contact Section */}
              <div className="md:col-span-2 mt-2">
                <p className="font-medium text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
                  <FaAmbulance className="text-error" size={12} />
                  Emergency Contact Person
                </p>

                {/* Responsive grid for emergency contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {/* Contact Name */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-xs">Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contact person name"
                      className="input input-bordered input-xs sm:input-sm w-full"
                      value={profileForm.emergencyContact.name}
                      onChange={(e) => handleEmergencyContactChange("name", e.target.value)}
                    />
                  </div>

                  {/* Relation */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-xs">Relation</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Director, Manager"
                      className="input input-bordered input-xs sm:input-sm w-full"
                      value={profileForm.emergencyContact.relation}
                      onChange={(e) => handleEmergencyContactChange("relation", e.target.value)}
                    />
                  </div>

                  {/* Phone */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-xs">Phone</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Emergency contact number"
                      className="input input-bordered input-xs sm:input-sm w-full"
                      value={profileForm.emergencyContact.phone}
                      onChange={(e) => handleEmergencyContactChange("phone", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save button for profile */}
            <div className="pt-2 sm:pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={profileMutation.isPending}
                className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 w-full sm:w-auto"
              >
                {profileMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    <span className="text-xs sm:text-sm">Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSave size={12} className="sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ==================== ADDRESS TAB ==================== */}
        {activeTab === 'address' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiMapPin className="text-error text-sm sm:text-base" />
              Hospital Address & Location
            </h2>

            {/* Responsive grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

              {/* Street Address - Full width */}
              <div className="form-control md:col-span-2">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                    <FaMapMarkerAlt className="text-error" size={12} />
                    Street Address *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="123 Hospital Road"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={addressForm.street}
                  onChange={(e) => handleAddressChange("street", e.target.value)}
                />
              </div>

              {/* City */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm">City *</span>
                </label>
                <input
                  type="text"
                  placeholder="Mumbai"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={addressForm.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                />
              </div>

              {/* State */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm">State *</span>
                </label>
                <input
                  type="text"
                  placeholder="Maharashtra"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={addressForm.state}
                  onChange={(e) => handleAddressChange("state", e.target.value)}
                />
              </div>

              {/* ZIP Code */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm">ZIP Code *</span>
                </label>
                <input
                  type="text"
                  placeholder="400001"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={addressForm.zipCode}
                  onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                />
              </div>

              {/* Country */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm">Country</span>
                </label>
                <input
                  type="text"
                  placeholder="India"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={addressForm.country}
                  onChange={(e) => handleAddressChange("country", e.target.value)}
                />
              </div>

              {/* Coordinates Section */}
              <div className="form-control md:col-span-2">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                    <FiGlobe className="text-error" size={12} />
                    Coordinates (Longitude, Latitude)
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude (e.g., 72.8777)"
                    className="input input-bordered input-sm sm:input-md flex-1 w-full"
                    value={addressForm.coordinates[0]}
                    onChange={(e) => handleCoordinatesChange(0, e.target.value)}
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude (e.g., 19.0760)"
                    className="input input-bordered input-sm sm:input-md flex-1 w-full"
                    value={addressForm.coordinates[1]}
                    onChange={(e) => handleCoordinatesChange(1, e.target.value)}
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-base-content/50 mt-1">
                  Used for mapping and finding nearby donors
                </p>
              </div>
            </div>

            {/* Save button for address */}
            <div className="pt-2 sm:pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={addressMutation.isPending}
                className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 w-full sm:w-auto"
              >
                {addressMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    <span className="text-xs sm:text-sm">Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSave size={12} className="sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Save Address</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ==================== NOTIFICATIONS TAB ==================== */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiBell className="text-error text-sm sm:text-base" />
              Notification Preferences
            </h2>

            {/* Notification options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

              {/* Email Notifications */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-info/10 p-1.5 sm:p-2 rounded-full">
                    <FiMail className="text-info text-sm sm:text-base" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Email</p>
                    <p className="text-[10px] sm:text-xs text-base-content/60">Blood request alerts</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-error toggle-sm sm:toggle-md"
                  checked={settingsForm.notifications.email}
                  onChange={() => handleSettingsToggle("notifications", "email")}
                />
              </div>

              {/* SMS Notifications */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-warning/10 p-1.5 sm:p-2 rounded-full">
                    <FiPhone className="text-warning text-sm sm:text-base" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">SMS</p>
                    <p className="text-[10px] sm:text-xs text-base-content/60">Text message alerts</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-warning toggle-sm sm:toggle-md"
                  checked={settingsForm.notifications.sms}
                  onChange={() => handleSettingsToggle("notifications", "sms")}
                />
              </div>

              {/* Push Notifications */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-success/10 p-1.5 sm:p-2 rounded-full">
                    <FiSmartphone className="text-success text-sm sm:text-base" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Push</p>
                    <p className="text-[10px] sm:text-xs text-base-content/60">Browser push alerts</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-sm sm:toggle-md"
                  checked={settingsForm.notifications.push}
                  onChange={() => handleSettingsToggle("notifications", "push")}
                />
              </div>
            </div>

            {/* Save button for notifications */}
            <div className="pt-2 sm:pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={settingsMutation.isPending}
                className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 w-full sm:w-auto"
              >
                {settingsMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    <span className="text-xs sm:text-sm">Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSave size={12} className="sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Save Notification Settings</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ==================== PRIVACY TAB ==================== */}
        {activeTab === 'privacy' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiShield className="text-error text-sm sm:text-base" />
              Privacy Controls
            </h2>

            {/* Privacy options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

              {/* Show Location */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-info/10 p-1.5 sm:p-2 rounded-full">
                    <FiMapPin className="text-info text-sm sm:text-base" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Show Location</p>
                    <p className="text-[10px] sm:text-xs text-base-content/60">Display hospital location on maps</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-info toggle-sm sm:toggle-md"
                  checked={settingsForm.privacy.showLocation}
                  onChange={() => handleSettingsToggle("privacy", "showLocation")}
                />
              </div>

              {/* Show Contact Details */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-warning/10 p-1.5 sm:p-2 rounded-full">
                    <FiUsers className="text-warning text-sm sm:text-base" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Show Contact Details</p>
                    <p className="text-[10px] sm:text-xs text-base-content/60">Display phone/email to donors and requesters</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-warning toggle-sm sm:toggle-md"
                  checked={settingsForm.privacy.showContact}
                  onChange={() => handleSettingsToggle("privacy", "showContact")}
                />
              </div>
            </div>

            {/* Save button for privacy */}
            <div className="pt-2 sm:pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={settingsMutation.isPending}
                className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 w-full sm:w-auto"
              >
                {settingsMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    <span className="text-xs sm:text-sm">Saving...</span>
                  </>
                ) : (
                  <>
                    <FiSave size={12} className="sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Save Privacy Settings</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ==================== STATS UPDATE SECTION ==================== */}
      <motion.section
        variants={fadeInUp}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4 sm:space-y-5"
      >
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
          <FiClock className="text-error text-sm sm:text-base" />
          Hospital Statistics
        </h2>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-base-200 rounded-lg p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs opacity-70">Total Blood Requests</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{profileData?.stats?.totalRequests || 0}</p>
          </div>
          <div className="bg-base-200 rounded-lg p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs opacity-70">Response Rate</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{profileData?.stats?.responseRate || 0}%</p>
          </div>
          <div className="bg-base-200 rounded-lg p-3 sm:p-4 sm:col-span-2 md:col-span-1">
            <p className="text-[10px] sm:text-xs opacity-70">Reputation Score</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{profileData?.stats?.reputation || 0}</p>
          </div>
        </div>

        {/* Info alert */}
        <div className="alert alert-info bg-info/10 border-info/20 flex-col sm:flex-row gap-2 p-3 sm:p-4">
          <FiAlertCircle className="text-info text-sm sm:text-base shrink-0" />
          <span className="text-[10px] sm:text-xs text-center sm:text-left">
            Statistics are automatically updated based on your hospital's activity.
          </span>
        </div>

        {/* Manual update button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleUpdateStats}
            disabled={statsMutation.isPending}
            className="btn btn-outline btn-info btn-xs sm:btn-sm gap-1 sm:gap-2 w-full sm:w-auto"
          >
            {statsMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span className="text-xs sm:text-sm">Updating...</span>
              </>
            ) : (
              <>
                <FiRefreshCw size={12} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Refresh Statistics</span>
              </>
            )}
          </button>
        </div>
      </motion.section>

      {/* ==================== DANGER ZONE SECTION ==================== */}
      <motion.section
        variants={fadeInUp}
        className="bg-base-100 rounded-lg shadow-lg border border-error/30 p-4 sm:p-6"
      >
        <h2 className="text-base sm:text-lg font-semibold text-error flex items-center gap-2 pb-2 border-b border-error/20">
          <FiTrash2 className="text-sm sm:text-base" />
          Danger Zone
        </h2>

        {/* Delete account section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mt-3">
          <div className="flex items-start gap-2 sm:gap-3 flex-1">
            <FiAlertCircle className="text-error shrink-0 mt-1 sm:w-5 sm:h-5" size={16} />
            <div>
              <p className="font-medium text-xs sm:text-sm">Delete Hospital Account</p>
              <p className="text-[10px] sm:text-xs text-base-content/70">
                This will permanently delete your hospital profile, cancel all active blood requests,
                and remove staff associations. This action cannot be undone.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 w-full lg:w-auto"
            onClick={handleDeleteAccount}
            disabled={deleteAccountMutation.isPending}
          >
            {deleteAccountMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span className="text-xs sm:text-sm">Deleting...</span>
              </>
            ) : (
              <>
                <FiTrash2 size={12} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Delete Hospital Account</span>
              </>
            )}
          </button>
        </div>
      </motion.section>

      {/* ==================== MOBILE SAVE BUTTON ==================== */}
      {/* FAB for mobile when any mutation is in progress */}
      {(profileMutation.isPending || addressMutation.isPending || settingsMutation.isPending || statsMutation.isPending) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden fixed bottom-4 right-4 z-10"
        >
          <div className="btn btn-error btn-circle shadow-xl w-12 h-12 sm:w-14 sm:h-14">
            <span className="loading loading-spinner loading-sm sm:loading-md"></span>
          </div>
        </motion.div>
      )}

      {/* ==================== CHANGE PASSWORD MODAL ==================== */}
      <dialog id="settings_change_password_modal" className="modal">
        <ChangePasswordModal
          userId={userId}
          userName={user?.profile?.fullName || "My Account"}
          onClose={closePasswordModal}
          refreshUsers={() => refetch()}
        />
        <form method="dialog" className="modal-backdrop" onClick={closePasswordModal}>
          <button>close</button>
        </form>
      </dialog>
    </motion.div>
  );
};

export default HospitalSettings;