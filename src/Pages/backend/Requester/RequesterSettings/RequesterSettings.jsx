// Pages/backend/Requester/Settings/Settings.jsx

// React
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FiUser,
  FiMapPin,
  FiSave,
  FiPhone,
  FiHeart,
  FiCalendar,
  FiDroplet,
  FiKey,
  FiBell,
  FiLock,
  FiEye,
  FiMail,
  FiMessageSquare,
  FiGlobe,
  FiTrash2,
} from "react-icons/fi";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import ChangePasswordModal from "../../Admin/UsersManagement/ChangePasswordModal/ChangePasswordModal";
import { formatDateInputValue } from "../../../../utils/dateFormat";

// ==================== QUERY KEYS ====================

const queryKeys = {
  requesterProfile: (userId) => ['requester-profile', userId],
};

// ==================== CONSTANTS ====================

// Blood type options
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Gender options
const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

// Empty form template for initial state
const emptyForm = {
  // Profile Information
  fullName: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  weight: "",
  bio: "",
  profilePicture: "",
  phone: "",

  // Emergency Contact
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactPhone: "",

  // Address
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  coordinates: [],

  // Settings
  notifications: {
    email: true,
    sms: false,
    push: true,
  },
  privacy: {
    showLocation: true,
    showContact: false,
    showLastDonation: false,
  },
};

// ==================== MAIN COMPONENT ====================

const RequesterSettings = () => {
  const { user } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");
  const userId = user?._id || user?.userId;

  // ==================== STATE MANAGEMENT ====================

  // Form state
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("profile");

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query 1: Fetch Requester Profile Data
   * Automatically fetches when userId is available
   */
  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.requesterProfile(userId),
    enabled: !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // ==================== MUTATIONS ====================

  /**
   * Mutation 1: Update profile information
   */
  const updateProfileMutation = useMutation({
    mutationFn: async (payload) => {
      const profilePayload = {
        fullName: payload.fullName,
        dateOfBirth: payload.dateOfBirth || undefined,
        gender: payload.gender || undefined,
        bloodGroup: payload.bloodGroup || undefined,
        weight: payload.weight ? Number(payload.weight) : undefined,
        bio: payload.bio || undefined,
        profilePicture: payload.profilePicture || undefined,
        emergencyContact: {
          name: payload.emergencyContactName || undefined,
          relation: payload.emergencyContactRelation || undefined,
          phone: payload.emergencyContactPhone || undefined,
        },
      };

      return await axiosInstance.patch(`/users/profile/${userId}`, profilePayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      // Invalidate profile query to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.requesterProfile(userId) });
    },
  });

  /**
   * Mutation 2: Update address
   */
  const updateAddressMutation = useMutation({
    mutationFn: async (payload) => {
      const addressPayload = {
        street: payload.street || undefined,
        city: payload.city || undefined,
        state: payload.state || undefined,
        zipCode: payload.zipCode || undefined,
        country: payload.country || undefined,
        coordinates: payload.coordinates.length === 2 ? payload.coordinates : undefined,
      };

      return await axiosInstance.patch(`/users/address/${userId}`, addressPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requesterProfile(userId) });
    },
  });

  /**
   * Mutation 3: Update settings (notifications & privacy)
   */
  const updateSettingsMutation = useMutation({
    mutationFn: async (payload) => {
      const settingsPayload = {
        notifications: payload.notifications,
        privacy: payload.privacy,
      };

      return await axiosInstance.patch(`/users/settings/${userId}`, settingsPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requesterProfile(userId) });
    },
  });

  /**
   * Mutation 4: Delete account
   */
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await axiosInstance.delete(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: async () => {
      await Swal.fire({
        title: "Account Deactivated",
        text: "Your account has been successfully deactivated.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        },
        buttonsStyling: false,
      });
      // Logout user or redirect to home
      localStorage.removeItem("auth_token");
      window.location.href = "/";
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Deactivation Failed",
        text: err?.response?.data?.error || "Unable to deactivate account.",
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
   * Update form when profile data loads
   * Maps API response to form structure
   */
  useEffect(() => {
    if (!profileData) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      // Profile Information
      fullName: profileData?.profile?.fullName || "",
      dateOfBirth: profileData?.profile?.dateOfBirth
        ? formatDateInputValue(profileData.profile.dateOfBirth)
        : "",
      gender: profileData?.profile?.gender || "",
      bloodGroup: profileData?.profile?.bloodGroup || "",
      weight: profileData?.profile?.weight || "",
      bio: profileData?.profile?.bio || "",
      profilePicture: profileData?.profile?.profilePicture || "",
      phone: profileData?.phone || "",

      // Emergency Contact
      emergencyContactName: profileData?.profile?.emergencyContact?.name || "",
      emergencyContactRelation: profileData?.profile?.emergencyContact?.relation || "",
      emergencyContactPhone: profileData?.profile?.emergencyContact?.phone || "",

      // Address
      street: profileData?.address?.street || "",
      city: profileData?.address?.city || "",
      state: profileData?.address?.state || "",
      zipCode: profileData?.address?.zipCode || "",
      country: profileData?.address?.country || "",
      coordinates: profileData?.address?.coordinates?.coordinates || [],

      // Settings
      notifications: profileData?.settings?.notifications || {
        email: true,
        sms: false,
        push: true,
      },
      privacy: profileData?.settings?.privacy || {
        showLocation: true,
        showContact: false,
        showLastDonation: false,
      },
    });
  }, [profileData]);

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle form input changes
   * Supports nested objects via dot notation
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      // Handle nested objects (notifications, privacy)
      const [parent, child] = name.split('.');
      setForm((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  /**
   * Handle notification/privacy toggle switches
   */
  const handleToggle = (category, setting) => {
    setForm((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting],
      },
    }));
  };

  /**
   * Handle form submission based on active tab
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (activeTab === "profile") {
        await updateProfileMutation.mutateAsync(form);
        await Swal.fire({
          title: "Profile Updated",
          text: "Your profile information was saved successfully.",
          icon: "success",
          timer: 1700,
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          },
          buttonsStyling: false,
        });
      } else if (activeTab === "address") {
        await updateAddressMutation.mutateAsync(form);
        await Swal.fire({
          title: "Address Updated",
          text: "Your address was saved successfully.",
          icon: "success",
          timer: 1700,
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          },
          buttonsStyling: false,
        });
      } else if (activeTab === "settings") {
        await updateSettingsMutation.mutateAsync(form);
        await Swal.fire({
          title: "Settings Updated",
          text: "Your notification and privacy settings were saved.",
          icon: "success",
          timer: 1700,
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          },
          buttonsStyling: false,
        });
      }

      // Refetch profile data to ensure UI is in sync
      refetch();
    } catch (err) {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update.",
        icon: "error",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    }
  };

  /**
   * Handle account deletion with confirmation
   */
  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: "Delete Account?",
      text: "This action cannot be undone. All your data will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete my account",
      cancelButtonText: "Cancel",
      reverseButtons: true,
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

    if (result.isConfirmed) {
      await deleteAccountMutation.mutateAsync();
    }
  };

  /**
   * Close password modal
   */
  const closePasswordModal = () => {
    document.getElementById("settings_change_password_modal")?.close();
  };

  // ==================== COMPUTED VALUES ====================

  // Check if any mutation is pending
  const isPending = updateProfileMutation.isPending ||
    updateAddressMutation.isPending ||
    updateSettingsMutation.isPending ||
    deleteAccountMutation.isPending;

  // ==================== VALIDATION ====================

  // User ID validation
  if (!userId) {
    return (
      <div className="bg-base-100 rounded-lg border border-base-300 p-4 sm:p-6 text-center">
        <FiUser size={32} className="sm:w-12 sm:h-12 mx-auto text-base-content/30 mb-2 sm:mb-3" />
        <p className="text-xs sm:text-sm text-base-content/70">Unable to resolve user profile.</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) return <BloodLoader />;

  // Error state
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  // ==================== RENDER ====================

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-base-200 p-3 sm:p-4 md:p-6">

      {/* ==================== HEADER SECTION ==================== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
      >
        {/* Title and description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiUser className="text-primary" />
            Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Manage your profile, address, and notification preferences.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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

          {/* Save Button - Only for non-danger tabs */}
          {activeTab !== "danger" && (
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="btn btn-primary btn-xs sm:btn-sm gap-1 sm:gap-2 flex-1 sm:flex-none"
            >
              {isPending ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span className="text-xs sm:text-sm">Saving...</span>
                </>
              ) : (
                <>
                  <FiSave size={12} className="sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Save Changes</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* ==================== TAB NAVIGATION ==================== */}
      {/* Responsive tabs - wrap on mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="tabs tabs-boxed bg-base-100 p-1 gap-1 border border-base-300 flex-wrap"
      >
        {/* Profile Tab */}
        <button
          className={`tab tab-xs sm:tab-md gap-1 sm:gap-2 ${activeTab === "profile" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <FiUser size={12} className="sm:w-4 sm:h-4" />
          <span className="text-[10px] sm:text-sm">Profile</span>
        </button>

        {/* Address Tab */}
        <button
          className={`tab tab-xs sm:tab-md gap-1 sm:gap-2 ${activeTab === "address" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("address")}
        >
          <FiMapPin size={12} className="sm:w-4 sm:h-4" />
          <span className="text-[10px] sm:text-sm">Address</span>
        </button>

        {/* Preferences Tab */}
        <button
          className={`tab tab-xs sm:tab-md gap-1 sm:gap-2 ${activeTab === "settings" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <FiBell size={12} className="sm:w-4 sm:h-4" />
          <span className="text-[10px] sm:text-sm">Preferences</span>
        </button>

        {/* Danger Zone Tab */}
        <button
          className={`tab tab-xs sm:tab-md gap-1 sm:gap-2 text-error ${activeTab === "danger" ? "tab-active bg-error/20" : ""}`}
          onClick={() => setActiveTab("danger")}
        >
          <FiTrash2 size={12} className="sm:w-4 sm:h-4" />
          <span className="text-[10px] sm:text-sm">Danger Zone</span>
        </button>
      </motion.div>

      {/* ==================== TAB CONTENT ==================== */}
      <form onSubmit={handleSubmit}>

        {/* ==================== PROFILE TAB ==================== */}
        {activeTab === "profile" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            {/* Personal Information Section */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
                <FiUser className="text-primary text-sm sm:text-base" />
                Personal Information
              </h2>

              {/* Responsive grid: 1 col on mobile, 2 on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4">

                {/* Full Name */}
                <label className="form-control w-full">
                  <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                    <FiUser className="text-primary" size={12} />
                    Full Name
                  </span>
                  <input
                    name="fullName"
                    className="input input-bordered input-sm sm:input-md w-full"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </label>

                {/* Phone Number */}
                <label className="form-control w-full">
                  <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                    <FiPhone className="text-primary" size={12} />
                    Phone Number
                  </span>
                  <div className="relative">
                    <FiPhone className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-xs sm:text-sm" />
                    <input
                      name="phone"
                      className="input input-bordered input-sm sm:input-md w-full pl-7 sm:pl-10"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Your phone number"
                    />
                  </div>
                </label>

                {/* Date of Birth */}
                <label className="form-control w-full">
                  <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                    <FiCalendar className="text-primary" size={12} />
                    Date of Birth
                  </span>
                  <div className="relative">
                    <FiCalendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-xs sm:text-sm" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      className="input input-bordered input-sm sm:input-md w-full pl-7 sm:pl-10"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>
                </label>

                {/* Gender */}
                <label className="form-control w-full">
                  <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                    <FiUser className="text-primary" size={12} />
                    Gender
                  </span>
                  <select
                    name="gender"
                    className="select select-bordered select-sm sm:select-md w-full"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Blood Group */}
                <label className="form-control w-full">
                  <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                    <FiDroplet className="text-primary" size={12} />
                    Blood Group
                  </span>
                  <div className="relative">
                    <FiDroplet className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-xs sm:text-sm" />
                    <select
                      name="bloodGroup"
                      className="select select-bordered select-sm sm:select-md w-full pl-7 sm:pl-10"
                      value={form.bloodGroup}
                      onChange={handleChange}
                    >
                      <option value="">Select Blood Group</option>
                      {bloodTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                {/* Weight */}
                <label className="form-control w-full">
                  <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                    <FiHeart className="text-primary" size={12} />
                    Weight (kg)
                  </span>
                  <input
                    type="number"
                    name="weight"
                    min={20}
                    max={300}
                    step={0.1}
                    className="input input-bordered input-sm sm:input-md w-full"
                    value={form.weight}
                    onChange={handleChange}
                    placeholder="Enter weight in kg"
                  />
                </label>

                {/* Bio - Full width */}
                <label className="form-control w-full md:col-span-2">
                  <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                    <FiMessageSquare className="text-primary" size={12} />
                    Bio
                  </span>
                  <textarea
                    name="bio"
                    className="textarea textarea-bordered textarea-sm sm:textarea-md w-full"
                    rows={3}
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Tell us a little about yourself..."
                  />
                </label>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="mt-4 sm:mt-6">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
                <FiHeart className="text-primary text-sm sm:text-base" />
                Emergency Contact
              </h2>

              {/* Responsive grid: 1 col on mobile, 3 on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4">

                {/* Contact Name */}
                <label className="form-control w-full">
                  <span className="label-text text-xs sm:text-sm font-medium mb-1">Contact Name</span>
                  <input
                    name="emergencyContactName"
                    className="input input-bordered input-sm sm:input-md w-full"
                    value={form.emergencyContactName}
                    onChange={handleChange}
                    placeholder="Full name"
                  />
                </label>

                {/* Relation */}
                <label className="form-control w-full">
                  <span className="label-text text-xs sm:text-sm font-medium mb-1">Relation</span>
                  <input
                    name="emergencyContactRelation"
                    className="input input-bordered input-sm sm:input-md w-full"
                    value={form.emergencyContactRelation}
                    onChange={handleChange}
                    placeholder="Spouse, parent, sibling..."
                  />
                </label>

                {/* Emergency Phone */}
                <label className="form-control w-full">
                  <span className="label-text text-xs sm:text-sm font-medium mb-1">Phone</span>
                  <div className="relative">
                    <FiPhone className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-xs sm:text-sm" />
                    <input
                      name="emergencyContactPhone"
                      className="input input-bordered input-sm sm:input-md w-full pl-7 sm:pl-10"
                      value={form.emergencyContactPhone}
                      onChange={handleChange}
                      placeholder="Phone number"
                    />
                  </div>
                </label>
              </div>
            </div>
          </motion.section>
        )}

        {/* ==================== ADDRESS TAB ==================== */}
        {activeTab === "address" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiMapPin className="text-primary text-sm sm:text-base" />
              Address Information
            </h2>

            {/* Responsive grid: 1 col on mobile, 2 on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

              {/* Street Address - Full width */}
              <label className="form-control w-full md:col-span-2">
                <span className="label-text text-xs sm:text-sm font-medium mb-1">Street Address</span>
                <input
                  name="street"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={form.street}
                  onChange={handleChange}
                  placeholder="Street name, building number, apartment"
                />
              </label>

              {/* City */}
              <label className="form-control w-full">
                <span className="label-text text-xs sm:text-sm font-medium mb-1">City</span>
                <input
                  name="city"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </label>

              {/* State */}
              <label className="form-control w-full">
                <span className="label-text text-xs sm:text-sm font-medium mb-1">State</span>
                <input
                  name="state"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="State / Province"
                />
              </label>

              {/* Zip Code */}
              <label className="form-control w-full">
                <span className="label-text text-xs sm:text-sm font-medium mb-1">Zip Code</span>
                <input
                  name="zipCode"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={form.zipCode}
                  onChange={handleChange}
                  placeholder="Postal / Zip code"
                />
              </label>

              {/* Country */}
              <label className="form-control w-full">
                <span className="label-text text-xs sm:text-sm font-medium mb-1">Country</span>
                <input
                  name="country"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="Country"
                />
              </label>
            </div>

            {/* Info Alert */}
            <div className="alert alert-info bg-info/10 border-info/20 flex-col sm:flex-row gap-2 p-3 sm:p-4">
              <FiGlobe className="text-info text-lg sm:text-xl shrink-0" />
              <span className="text-xs sm:text-sm text-center sm:text-left">
                Your address helps us find nearby blood banks and donation centers.
              </span>
            </div>
          </motion.section>
        )}

        {/* ==================== SETTINGS/PREFERENCES TAB ==================== */}
        {activeTab === "settings" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-6"
          >
            {/* Notification Preferences */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
                <FiBell className="text-primary text-sm sm:text-base" />
                Notification Preferences
              </h2>

              <div className="space-y-3 sm:space-y-4 mt-4">
                {/* Email Notifications */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiMail className="text-primary text-sm sm:text-base shrink-0" />
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Email Notifications</p>
                      <p className="text-[10px] sm:text-xs text-base-content/70">Receive updates via email</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm sm:toggle-md"
                    checked={form.notifications.email}
                    onChange={() => handleToggle('notifications', 'email')}
                  />
                </div>

                {/* SMS Notifications */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiMessageSquare className="text-primary text-sm sm:text-base shrink-0" />
                    <div>
                      <p className="font-medium text-xs sm:text-sm">SMS Notifications</p>
                      <p className="text-[10px] sm:text-xs text-base-content/70">Get text messages for urgent requests</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm sm:toggle-md"
                    checked={form.notifications.sms}
                    onChange={() => handleToggle('notifications', 'sms')}
                  />
                </div>

                {/* Push Notifications */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiBell className="text-primary text-sm sm:text-base shrink-0" />
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Push Notifications</p>
                      <p className="text-[10px] sm:text-xs text-base-content/70">In-app and browser notifications</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm sm:toggle-md"
                    checked={form.notifications.push}
                    onChange={() => handleToggle('notifications', 'push')}
                  />
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="mt-4 sm:mt-6">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
                <FiEye className="text-primary text-sm sm:text-base" />
                Privacy Settings
              </h2>

              <div className="space-y-3 sm:space-y-4 mt-4">
                {/* Show Location */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiMapPin className="text-primary text-sm sm:text-base shrink-0" />
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Show Location</p>
                      <p className="text-[10px] sm:text-xs text-base-content/70">Allow others to see your general location</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm sm:toggle-md"
                    checked={form.privacy.showLocation}
                    onChange={() => handleToggle('privacy', 'showLocation')}
                  />
                </div>

                {/* Show Contact Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiPhone className="text-primary text-sm sm:text-base shrink-0" />
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Show Contact Info</p>
                      <p className="text-[10px] sm:text-xs text-base-content/70">Display your contact information to verified users</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm sm:toggle-md"
                    checked={form.privacy.showContact}
                    onChange={() => handleToggle('privacy', 'showContact')}
                  />
                </div>

                {/* Show Last Donation */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiCalendar className="text-primary text-sm sm:text-base shrink-0" />
                    <div>
                      <p className="font-medium text-xs sm:text-sm">Show Last Donation</p>
                      <p className="text-[10px] sm:text-xs text-base-content/70">Display when you last donated blood</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm sm:toggle-md"
                    checked={form.privacy.showLastDonation}
                    onChange={() => handleToggle('privacy', 'showLastDonation')}
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* ==================== DANGER ZONE TAB ==================== */}
        {activeTab === "danger" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-base-100 rounded-lg shadow-lg border border-error/30 p-4 sm:p-6 space-y-4"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-error/30 text-error">
              <FiTrash2 className="text-sm sm:text-base" />
              Danger Zone
            </h2>

            {/* Warning Alert */}
            <div className="alert alert-error bg-error/10 border-error/20 flex-col sm:flex-row gap-2 p-3 sm:p-4">
              <FiLock size={16} className="sm:w-5 sm:h-5 shrink-0" />
              <span className="text-xs sm:text-sm text-center sm:text-left">
                These actions are irreversible. Please proceed with caution.
              </span>
            </div>

            {/* Delete Account Section */}
            <div className="p-3 sm:p-4 border border-error/30 rounded-lg bg-error/5">
              <h3 className="font-semibold text-error text-sm sm:text-base flex items-center gap-2">
                <FiTrash2 size={14} className="sm:w-4 sm:h-4" />
                Delete Account
              </h3>
              <p className="text-[10px] sm:text-xs text-base-content/70 mt-1 mb-3 sm:mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
                className="btn btn-error btn-xs sm:btn-sm w-full sm:w-auto"
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    <span className="text-xs sm:text-sm">Deleting...</span>
                  </>
                ) : (
                  <span className="text-xs sm:text-sm">Delete My Account</span>
                )}
              </button>
            </div>
          </motion.section>
        )}
      </form>

      {/* ==================== MOBILE SAVE BUTTON ==================== */}
      {/* Only show for non-danger tabs on mobile */}
      {activeTab !== "danger" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden fixed bottom-4 right-4 z-10"
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="btn btn-primary btn-circle shadow-xl w-12 h-12 sm:w-14 sm:h-14"
            data-tip="Save Changes"
            aria-label="Save Changes"
          >
            {isPending ? (
              <span className="loading loading-spinner loading-sm sm:loading-md"></span>
            ) : (
              <FiSave size={18} className="sm:w-6 sm:h-6" />
            )}
          </button>
        </motion.div>
      )}

      {/* ==================== CHANGE PASSWORD MODAL ==================== */}
      <dialog id="settings_change_password_modal" className="modal">
        <ChangePasswordModal
          userId={userId}
          userName={form.fullName || user?.profile?.fullName || "My Account"}
          onClose={closePasswordModal}
          refreshUsers={() => refetch()}
        />
        <form method="dialog" className="modal-backdrop" onClick={closePasswordModal}>
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default RequesterSettings;