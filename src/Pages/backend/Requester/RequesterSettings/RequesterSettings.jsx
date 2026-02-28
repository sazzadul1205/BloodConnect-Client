// Pages/backend/Requester/Settings/Settings.jsx

// React
import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

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
  FiTrash2
} from "react-icons/fi";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import ChangePasswordModal from "../../Admin/UsersManagement/ChangePasswordModal/ChangePasswordModal";
import { formatDateInputValue } from "../../../../utils/dateFormat";

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
    push: true
  },
  privacy: {
    showLocation: true,
    showContact: false,
    showLastDonation: false
  }
};

const RequesterSettings = () => {
  const { user } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");
  const userId = user?._id || user?.userId;

  // Form state
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("profile");

  // 🔹 Fetch Requester Profile Data
  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["requester-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    },
  });

  // Update form when profile data loads
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
        push: true
      },
      privacy: profileData?.settings?.privacy || {
        showLocation: true,
        showContact: false,
        showLastDonation: false
      }
    });
  }, [profileData]);

  // Update profile mutation
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
  });

  // Update address mutation
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
  });

  // Update settings mutation
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
  });

  // Delete account mutation
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
      });
    },
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      // Handle nested objects (notifications, privacy)
      const [parent, child] = name.split('.');
      setForm((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle notification/privacy toggle
  const handleToggle = (category, setting) => {
    setForm((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }));
  };

  // Handle form submission based on active tab
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
        });
      } else if (activeTab === "address") {
        await updateAddressMutation.mutateAsync(form);
        await Swal.fire({
          title: "Address Updated",
          text: "Your address was saved successfully.",
          icon: "success",
          timer: 1700,
          showConfirmButton: false,
        });
      } else if (activeTab === "settings") {
        await updateSettingsMutation.mutateAsync(form);
        await Swal.fire({
          title: "Settings Updated",
          text: "Your notification and privacy settings were saved.",
          icon: "success",
          timer: 1700,
          showConfirmButton: false,
        });
      }
      refetch();
    } catch (err) {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update.",
        icon: "error",
      });
    }
  };

  // Handle account deletion
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
    });

    if (result.isConfirmed) {
      await deleteAccountMutation.mutateAsync();
    }
  };

  const closePasswordModal = () => {
    document.getElementById("settings_change_password_modal")?.close();
  };

  // User ID validation
  if (!userId) {
    return (
      <div className="bg-base-100 rounded-lg border border-base-300 p-6 text-center">
        <FiUser size={48} className="mx-auto text-base-content/30 mb-3" />
        <p className="text-base-content/70">Unable to resolve user profile.</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) return <BloodLoader />;

  // Error state
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  // Check if any mutation is pending
  const isPending = updateProfileMutation.isPending ||
    updateAddressMutation.isPending ||
    updateSettingsMutation.isPending;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiUser className="text-primary" />
            Account Settings
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Manage your profile, address, and notification preferences.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              document.getElementById("settings_change_password_modal")?.showModal()
            }
            className="btn btn-outline btn-sm gap-2"
          >
            <FiKey size={16} />
            Change Password
          </button>
          {activeTab !== "danger" && (
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="btn btn-primary btn-sm gap-2"
            >
              <FiSave size={16} />
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="tabs tabs-boxed bg-base-100 p-1 gap-1 border border-base-300"
      >
        <button
          className={`tab gap-2 ${activeTab === "profile" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <FiUser size={16} />
          Profile
        </button>
        <button
          className={`tab gap-2 ${activeTab === "address" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("address")}
        >
          <FiMapPin size={16} />
          Address
        </button>
        <button
          className={`tab gap-2 ${activeTab === "settings" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <FiBell size={16} />
          Preferences
        </button>
        <button
          className={`tab gap-2 text-error ${activeTab === "danger" ? "tab-active bg-error/20" : ""}`}
          onClick={() => setActiveTab("danger")}
        >
          <FiTrash2 size={16} />
          Danger Zone
        </button>
      </motion.div>

      {/* Tab Content */}
      <form onSubmit={handleSubmit}>
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiUser className="text-primary" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">Full Name</span>
                <input
                  name="fullName"
                  className="input input-bordered w-full"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </label>

              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">Phone Number</span>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={16} />
                  <input
                    name="phone"
                    className="input input-bordered w-full pl-10"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                  />
                </div>
              </label>

              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">Date of Birth</span>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={16} />
                  <input
                    type="date"
                    name="dateOfBirth"
                    className="input input-bordered w-full pl-10"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
              </label>

              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">Gender</span>
                <select
                  name="gender"
                  className="select select-bordered w-full"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">Blood Group</span>
                <div className="relative">
                  <FiDroplet className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={16} />
                  <select
                    name="bloodGroup"
                    className="select select-bordered w-full pl-10"
                    value={form.bloodGroup}
                    onChange={handleChange}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </label>

              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">Weight (kg)</span>
                <input
                  type="number"
                  name="weight"
                  min={20}
                  max={300}
                  step={0.1}
                  className="input input-bordered w-full"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="Enter weight in kg"
                />
              </label>

              <label className="form-control w-full md:col-span-2">
                <span className="label-text font-medium mb-1">Bio</span>
                <textarea
                  name="bio"
                  className="textarea textarea-bordered w-full"
                  rows={4}
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell us a little about yourself..."
                />
              </label>
            </div>

            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300 mt-6">
              <FiHeart className="text-primary" />
              Emergency Contact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">Contact Name</span>
                <input
                  name="emergencyContactName"
                  className="input input-bordered w-full"
                  value={form.emergencyContactName}
                  onChange={handleChange}
                  placeholder="Full name"
                />
              </label>

              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">Relation</span>
                <input
                  name="emergencyContactRelation"
                  className="input input-bordered w-full"
                  value={form.emergencyContactRelation}
                  onChange={handleChange}
                  placeholder="Spouse, parent, sibling..."
                />
              </label>

              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">Phone</span>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={16} />
                  <input
                    name="emergencyContactPhone"
                    className="input input-bordered w-full pl-10"
                    value={form.emergencyContactPhone}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </div>
              </label>
            </div>
          </motion.section>
        )}

        {/* Address Tab */}
        {activeTab === "address" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiMapPin className="text-primary" />
              Address Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="form-control w-full md:col-span-2">
                <span className="label-text font-medium mb-1">Street Address</span>
                <input
                  name="street"
                  className="input input-bordered w-full"
                  value={form.street}
                  onChange={handleChange}
                  placeholder="Street name, building number, apartment"
                />
              </label>

              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">City</span>
                <input
                  name="city"
                  className="input input-bordered w-full"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </label>

              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">State</span>
                <input
                  name="state"
                  className="input input-bordered w-full"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="State / Province"
                />
              </label>

              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">Zip Code</span>
                <input
                  name="zipCode"
                  className="input input-bordered w-full"
                  value={form.zipCode}
                  onChange={handleChange}
                  placeholder="Postal / Zip code"
                />
              </label>

              <label className="form-control w-full">
                <span className="label-text font-medium mb-1">Country</span>
                <input
                  name="country"
                  className="input input-bordered w-full"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="Country"
                />
              </label>
            </div>

            <div className="alert alert-info bg-info/10 border-info/20">
              <FiGlobe className="text-info" size={20} />
              <span>Your address helps us find nearby blood banks and donation centers.</span>
            </div>
          </motion.section>
        )}

        {/* Settings/Preferences Tab */}
        {activeTab === "settings" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
                <FiBell className="text-primary" />
                Notification Preferences
              </h3>

              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiMail className="text-primary" size={20} />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-base-content/70">Receive updates via email</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={form.notifications.email}
                    onChange={() => handleToggle('notifications', 'email')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiMessageSquare className="text-primary" size={20} />
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-base-content/70">Get text messages for urgent requests</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={form.notifications.sms}
                    onChange={() => handleToggle('notifications', 'sms')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiBell className="text-primary" size={20} />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-base-content/70">In-app and browser notifications</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={form.notifications.push}
                    onChange={() => handleToggle('notifications', 'push')}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
                <FiEye className="text-primary" />
                Privacy Settings
              </h3>

              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiMapPin className="text-primary" size={20} />
                    <div>
                      <p className="font-medium">Show Location</p>
                      <p className="text-sm text-base-content/70">Allow others to see your general location</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={form.privacy.showLocation}
                    onChange={() => handleToggle('privacy', 'showLocation')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiPhone className="text-primary" size={20} />
                    <div>
                      <p className="font-medium">Show Contact Info</p>
                      <p className="text-sm text-base-content/70">Display your contact information to verified users</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={form.privacy.showContact}
                    onChange={() => handleToggle('privacy', 'showContact')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiCalendar className="text-primary" size={20} />
                    <div>
                      <p className="font-medium">Show Last Donation</p>
                      <p className="text-sm text-base-content/70">Display when you last donated blood</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={form.privacy.showLastDonation}
                    onChange={() => handleToggle('privacy', 'showLastDonation')}
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Danger Zone Tab */}
        {activeTab === "danger" && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-base-100 rounded-lg shadow-lg border border-error/30 p-6 space-y-4"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-error/30 text-error">
              <FiTrash2 />
              Danger Zone
            </h3>

            <div className="alert alert-error bg-error/10 border-error/20">
              <FiLock size={20} />
              <span className="text-primary" >These actions are irreversible. Please proceed with caution.</span>
            </div>

            <div className="p-4 border border-error/30 rounded-lg bg-error/5">
              <h4 className="font-semibold text-error flex items-center gap-2">
                <FiTrash2 size={18} />
                Delete Account
              </h4>
              <p className="text-sm text-base-content/70 mt-1 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
                className="btn btn-error btn-sm"
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Deleting...
                  </>
                ) : (
                  "Delete My Account"
                )}
              </button>
            </div>
          </motion.section>
        )}
      </form>

      {/* Mobile Save Button - Only show for non-danger tabs */}
      {activeTab !== "danger" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="lg:hidden fixed bottom-6 right-6 z-10"
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="btn btn-primary btn-circle shadow-xl w-14 h-14"
            data-tip="Save Changes"
          >
            {isPending ? (
              <span className="loading loading-spinner loading-md"></span>
            ) : (
              <FiSave size={24} />
            )}
          </button>
        </motion.div>
      )}

      {/* Change Password Modal */}
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
