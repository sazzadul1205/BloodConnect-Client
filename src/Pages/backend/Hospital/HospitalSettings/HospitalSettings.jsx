// Pages/backend/Hospital/HospitalSettings/HospitalSettings.jsx

// React
import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

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

const HospitalSettings = () => {
  const { user, logout } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");
  const userId = user?._id || user?.userId || user?.id || user?.uid;

  // State management
  const [activeTab, setActiveTab] = useState("profile");
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

  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    coordinates: [0, 0],
  });

  const [settingsForm, setSettingsForm] = useState(defaultSettingsForm);

  // Fetch hospital profile and settings
  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["hospital-settings", userId],
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

    // Profile form
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

    // Address form
    setAddressForm({
      street: profileData?.address?.street || "",
      city: profileData?.address?.city || "",
      state: profileData?.address?.state || "",
      zipCode: profileData?.address?.zipCode || "",
      coordinates: profileData?.address?.coordinates?.coordinates || [0, 0],
    });

    // Settings form
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

  // Save profile mutation
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
      refetch();
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update profile.",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    },
  });

  // Save address mutation
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
      refetch();
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update address.",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    },
  });

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
        text: "Your hospital statistics have been updated successfully.",
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
        text: "Your hospital account has been deactivated successfully.",
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

  // Handle profile input changes
  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value,
      },
    }));
  };

  // Handle address input changes
  const handleAddressChange = (field, value) => {
    setAddressForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle coordinates change
  const handleCoordinatesChange = (index, value) => {
    const newCoords = [...addressForm.coordinates];
    newCoords[index] = parseFloat(value) || 0;
    setAddressForm((prev) => ({
      ...prev,
      coordinates: newCoords,
    }));
  };

  // Handle settings toggle
  const handleSettingsToggle = (group, key) => {
    setSettingsForm((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: !prev[group][key],
      },
    }));
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    await profileMutation.mutateAsync({
      fullName: profileForm.fullName,
      bio: profileForm.bio,
      profilePicture: profileForm.profilePicture,
      emergencyContact: profileForm.emergencyContact,
    });
  };

  // Handle save address
  const handleSaveAddress = async () => {
    await addressMutation.mutateAsync({
      street: addressForm.street,
      city: addressForm.city,
      state: addressForm.state,
      zipCode: addressForm.zipCode,
      coordinates: addressForm.coordinates,
    });
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    await settingsMutation.mutateAsync({
      notifications: settingsForm.notifications,
      privacy: settingsForm.privacy,
    });
  };

  // Handle update stats
  const handleUpdateStats = async () => {
    // Example: You could add form fields for stats, but typically these are auto-updated
    await statsMutation.mutateAsync({
      // These would come from form fields if you add them
      totalDonations: profileData?.stats?.totalDonations || 0,
      totalRequests: profileData?.stats?.totalRequests || 0,
      responseRate: profileData?.stats?.responseRate || 0,
    });
  };

  // Handle delete account with confirmation
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
          <p className="text-base-content/70">Unable to resolve hospital settings.</p>
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
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaHospital className="text-error" />
            Hospital Settings
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Manage your hospital profile, address, notification preferences, and account settings.
          </p>
        </div>

        {/* Hospital Name Badge */}
        <div className="badge badge-lg badge-outline p-4">
          <FaHospital className="mr-2 text-error" />
          {profileData?.profile?.fullName || "Hospital"}
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
              staggerChildren: 0.1
            }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Card 1: Total Requests */}
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
          <p className="stat-title">Total Requests</p>
          <p className="stat-value text-3xl">
            {profileData?.stats?.totalRequests || 0}
          </p>
          <p className="stat-desc">Blood requests made</p>
        </motion.div>

        {/* Card 2: Response Rate */}
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
          <p className="stat-desc">Request fulfillment rate</p>
        </motion.div>

        {/* Card 3: Reputation */}
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

      {/* Settings Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
      >
        <div className="flex border-b border-base-300">
          <button
            className={`flex-1 py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'profile' ? 'bg-error/10 text-error border-b-2 border-error' : 'hover:bg-base-200'}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser size={16} />
            Profile
          </button>
          <button
            className={`flex-1 py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'address' ? 'bg-error/10 text-error border-b-2 border-error' : 'hover:bg-base-200'}`}
            onClick={() => setActiveTab('address')}
          >
            <FiMapPin size={16} />
            Address
          </button>
          <button
            className={`flex-1 py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'notifications' ? 'bg-error/10 text-error border-b-2 border-error' : 'hover:bg-base-200'}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FiBell size={16} />
            Notifications
          </button>
          <button
            className={`flex-1 py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'privacy' ? 'bg-error/10 text-error border-b-2 border-error' : 'hover:bg-base-200'}`}
            onClick={() => setActiveTab('privacy')}
          >
            <FiShield size={16} />
            Privacy
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 space-y-5"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiUser className="text-error" />
              Hospital Profile Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaHospital className="text-error" />
                    Hospital Name *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter hospital name"
                  className="input input-bordered w-full"
                  value={profileForm.fullName}
                  onChange={(e) => handleProfileChange("fullName", e.target.value)}
                />
              </div>

              {/* Profile Picture URL */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FiImage className="text-error" />
                    Profile Picture URL
                  </span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/hospital-logo.jpg"
                  className="input input-bordered w-full"
                  value={profileForm.profilePicture}
                  onChange={(e) => handleProfileChange("profilePicture", e.target.value)}
                />
              </div>

              {/* Bio/Description */}
              <div className="form-control md:col-span-2">
                <label htmlFor="hospital-description">
                  <span className="label-text flex items-center gap-2">
                    <FiEdit2 className="text-error" />
                    Hospital Description
                  </span>
                </label>
                <textarea
                  id="hospital-description"
                  className="textarea textarea-bordered h-24 w-full"
                  placeholder="Describe your hospital, specialties, facilities..."
                  value={profileForm.bio ?? ""}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                />
              </div>

              {/* Emergency Contact Section */}
              <div className="md:col-span-2 mt-2">
                <p className="font-medium mb-3 flex items-center gap-2">
                  <FaAmbulance className="text-error" />
                  Emergency Contact Person
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contact person name"
                      className="input input-bordered w-full"
                      value={profileForm.emergencyContact.name}
                      onChange={(e) => handleEmergencyContactChange("name", e.target.value)}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Relation</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Director, Manager"
                      className="input input-bordered w-full"
                      value={profileForm.emergencyContact.relation}
                      onChange={(e) => handleEmergencyContactChange("relation", e.target.value)}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Phone</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Emergency contact number"
                      className="input input-bordered w-full"
                      value={profileForm.emergencyContact.phone}
                      onChange={(e) => handleEmergencyContactChange("phone", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save button for profile */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={profileMutation.isPending}
                className="btn btn-error btn-sm gap-2"
              >
                <FiSave size={16} />
                {profileMutation.isPending ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Address Tab */}
        {activeTab === 'address' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 space-y-5"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiMapPin className="text-error" />
              Hospital Address & Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Street Address */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaMapMarkerAlt className="text-error" />
                    Street Address *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="123 Hospital Road"
                  className="input input-bordered w-full"
                  value={addressForm.street}
                  onChange={(e) => handleAddressChange("street", e.target.value)}
                />
              </div>

              {/* City */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">City *</span>
                </label>
                <input
                  type="text"
                  placeholder="Mumbai"
                  className="input input-bordered w-full"
                  value={addressForm.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                />
              </div>

              {/* State */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">State *</span>
                </label>
                <input
                  type="text"
                  placeholder="Maharashtra"
                  className="input input-bordered w-full"
                  value={addressForm.state}
                  onChange={(e) => handleAddressChange("state", e.target.value)}
                />
              </div>

              {/* ZIP Code */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">ZIP Code *</span>
                </label>
                <input
                  type="text"
                  placeholder="400001"
                  className="input input-bordered w-full"
                  value={addressForm.zipCode}
                  onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                />
              </div>

              {/* Coordinates */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Country</span>
                </label>
                <input
                  type="text"
                  placeholder="India"
                  className="input input-bordered w-full"
                  value={addressForm.country}
                  onChange={(e) => handleAddressChange("country", e.target.value)}
                />
              </div>

              {/* Coordinates Section */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FiGlobe className="text-error" />
                    Coordinates (Longitude, Latitude)
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude (e.g., 72.8777)"
                    className="input input-bordered flex-1"
                    value={addressForm.coordinates[0]}
                    onChange={(e) => handleCoordinatesChange(0, e.target.value)}
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude (e.g., 19.0760)"
                    className="input input-bordered flex-1"
                    value={addressForm.coordinates[1]}
                    onChange={(e) => handleCoordinatesChange(1, e.target.value)}
                  />
                </div>
                <p className="text-xs text-base-content/50 mt-1">
                  Used for mapping and finding nearby donors
                </p>
              </div>
            </div>

            {/* Save button for address */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={addressMutation.isPending}
                className="btn btn-error btn-sm gap-2"
              >
                <FiSave size={16} />
                {addressMutation.isPending ? "Saving..." : "Save Address"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 space-y-5"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiBell className="text-error" />
              Notification Preferences
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiMail className="text-info" size={20} />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-xs text-base-content/60">Blood request alerts</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-error"
                  checked={settingsForm.notifications.email}
                  onChange={() => handleSettingsToggle("notifications", "email")}
                />
              </div>

              {/* SMS Notifications */}
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

              {/* Push Notifications */}
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

            {/* Save button for notifications */}
            <div className="pt-4 flex justify-end">
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
          </motion.div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 space-y-5"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiShield className="text-error" />
              Privacy Controls
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Show Location */}
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiMapPin className="text-info" size={20} />
                  <div>
                    <p className="font-medium">Show Location</p>
                    <p className="text-xs text-base-content/60">Display hospital location on maps</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-info"
                  checked={settingsForm.privacy.showLocation}
                  onChange={() => handleSettingsToggle("privacy", "showLocation")}
                />
              </div>

              {/* Show Contact Details */}
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg md:col-span-2">
                <div className="flex items-center gap-3">
                  <FiUsers className="text-warning" size={20} />
                  <div>
                    <p className="font-medium">Show Contact Details</p>
                    <p className="text-xs text-base-content/60">Display phone/email to donors and requesters</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-warning"
                  checked={settingsForm.privacy.showContact}
                  onChange={() => handleSettingsToggle("privacy", "showContact")}
                />
              </div>
            </div>

            {/* Save button for privacy */}
            <div className="pt-4 flex justify-end">
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
          </motion.div>
        )}
      </motion.div>

      {/* Stats Update Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-5"
      >
        <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
          <FiClock className="text-error" />
          Hospital Statistics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-base-200 rounded-lg p-4">
            <p className="text-sm opacity-70">Total Blood Requests</p>
            <p className="text-2xl font-bold">{profileData?.stats?.totalRequests || 0}</p>
          </div>
          <div className="bg-base-200 rounded-lg p-4">
            <p className="text-sm opacity-70">Response Rate</p>
            <p className="text-2xl font-bold">{profileData?.stats?.responseRate || 0}%</p>
          </div>
          <div className="bg-base-200 rounded-lg p-4">
            <p className="text-sm opacity-70">Reputation Score</p>
            <p className="text-2xl font-bold">{profileData?.stats?.reputation || 0}</p>
          </div>
        </div>

        <div className="alert alert-info bg-info/10 border-info/20 text-sm">
          <FiAlertCircle className="text-info" />
          <span>Statistics are automatically updated based on your hospital's activity.</span>
        </div>

        {/* Manual update button (optional) */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleUpdateStats}
            disabled={statsMutation.isPending}
            className="btn btn-outline btn-info btn-sm gap-2"
          >
            <FiRefreshCw size={16} />
            {statsMutation.isPending ? "Updating..." : "Refresh Statistics"}
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
        <h3 className="text-lg font-semibold text-error flex items-center gap-2 pb-2 border-b border-error/20">
          <FiTrash2 />
          Danger Zone
        </h3>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-3">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-error shrink-0 mt-1" size={20} />
            <div>
              <p className="font-medium">Delete Hospital Account</p>
              <p className="text-sm text-base-content/70">
                This will permanently delete your hospital profile, cancel all active blood requests,
                and remove staff associations. This action cannot be undone.
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
            {deleteAccountMutation.isPending ? "Deleting..." : "Delete Hospital Account"}
          </button>
        </div>
      </motion.section>

      {/* Mobile Save Button - FAB for small screens */}
      {(profileMutation.isPending || addressMutation.isPending || settingsMutation.isPending || statsMutation.isPending) && (
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

export default HospitalSettings;
