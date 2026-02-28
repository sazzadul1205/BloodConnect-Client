// Pages/backend/BloodBank/Settings/Settings.jsx

// React
import React, { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons - Fi (Feather Icons)
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

  FiAlertCircle,

  FiUser,

  FiGlobe,
  FiEdit2,
  FiImage,

  FiLock,

} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaHospital,
  FaUserMd,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhoneAlt,

  FaTools,
  FaClock,

} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";
import ChangePasswordModal from "../../Admin/UsersManagement/ChangePasswordModal/ChangePasswordModal";

// Days of week for operating hours
const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// Day display names
const dayDisplayNames = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

// Default settings configuration
const defaultUserSettings = {
  notifications: {
    email: true,
    sms: true,
    push: true,
  },
  privacy: {
    showLocation: true,
    showContact: true,
  },
};

// Default bank hours
const defaultOperatingHours = {
  monday: { open: "09:00", close: "17:00" },
  tuesday: { open: "09:00", close: "17:00" },
  wednesday: { open: "09:00", close: "17:00" },
  thursday: { open: "09:00", close: "17:00" },
  friday: { open: "09:00", close: "17:00" },
  saturday: { open: "09:00", close: "13:00" },
  sunday: { open: "", close: "" },
};

const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    return value?.$oid || value?._id || value?.toString?.() || JSON.stringify(value);
  }
  return String(value);
};

const Settings = () => {
  const { user, logout } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // Get user ID and bank ID
  const userId = useMemo(
    () => getId(user?.userId) || getId(user?._id) || getId(user?.id) || getId(user?.uid),
    [user],
  );

  // State management
  const [activeTab, setActiveTab] = useState("profile");
  const [showChangePassword, setShowChangePassword] = useState(false);

  // User profile form
  const [userProfile, setUserProfile] = useState({
    fullName: "",
    bio: "",
    profilePicture: "",
    email: "",
    phone: "",
  });

  // Address form
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    coordinates: [0, 0],
  });

  // User settings form
  const [userSettings, setUserSettings] = useState(defaultUserSettings);

  // Bank-specific settings
  const [bankSettings, setBankSettings] = useState({
    facilities: [],
    operatingHours: defaultOperatingHours,
    description: "",
    website: "",
    emergencyContact: "",
  });

  const [newFacility, setNewFacility] = useState("");

  // Auth headers for API requests
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  // Fetch user profile
  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErrorData,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["user-profile-settings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/profile/${userId}`, {
        headers: authHeaders,
      });
      return res.data?.data;
    },
  });

  // Fetch blood bank details (if user is associated with a bank)
  const {
    data: bankData,
    isLoading: bankLoading,
    refetch: refetchBank,
  } = useQuery({
    queryKey: ["blood-bank-settings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const currentUserId = getId(userId);
      try {
        // Preferred API for staff-linked bank
        const myBankRes = await axiosInstance.get("/blood-banks/staff/me", {
          headers: authHeaders,
        });
        const myBank = myBankRes.data?.data;
        if (myBank?._id) {
          return myBank;
        }
      } catch {
        // Fallback to list-based matching below
      }

      try {
        const banksRes = await axiosInstance.get("/blood-banks", {
          headers: authHeaders,
        });

        const banks = banksRes.data?.data || [];
        const userBank = banks.find((bank) =>
          (bank.staff || []).some((staffItem) => {
            const staffUserId = getId(staffItem?.userId);
            const nestedUserId = getId(staffItem?.user?._id);
            return staffUserId === currentUserId || nestedUserId === currentUserId;
          }) ||
          getId(bank?.createdBy) === currentUserId ||
          getId(bank?.ownerId) === currentUserId ||
          getId(bank?.adminId) === currentUserId,
        );

        if (userBank) {
          return userBank;
        }
        return null;
      } catch (error) {
        console.error("Error fetching blood bank:", error);
        return null;
      }
    },
  });

  const bankId = useMemo(() => getId(bankData?._id), [bankData]);

  // Update user profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload) =>
      axiosInstance.patch(`/users/profile/${userId}`, payload, {
        headers: authHeaders,
      }),
    onSuccess: async () => {
      await Swal.fire({
        title: "Profile Updated",
        text: "Your profile has been updated successfully.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
      refetchProfile();
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

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async (payload) =>
      axiosInstance.patch(`/users/address/${userId}`, payload, {
        headers: authHeaders,
      }),
    onSuccess: async () => {
      await Swal.fire({
        title: "Address Updated",
        text: "Your address has been updated successfully.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
      refetchProfile();
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

  // Update user settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (payload) =>
      axiosInstance.patch(`/users/settings/${userId}`, payload, {
        headers: authHeaders,
      }),
    onSuccess: async () => {
      await Swal.fire({
        title: "Settings Updated",
        text: "Your notification and privacy settings have been saved.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
      refetchProfile();
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

  // Update bank settings mutation
  const updateBankMutation = useMutation({
    mutationFn: async ({ bankId, payload }) =>
      axiosInstance.patch(`/blood-banks/${bankId}`, payload, {
        headers: authHeaders,
      }),
    onSuccess: async () => {
      await Swal.fire({
        title: "Bank Settings Updated",
        text: "Blood bank settings have been updated successfully.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
      refetchBank();
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update bank settings.",
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
        headers: authHeaders,
      }),
    onSuccess: async () => {
      await Swal.fire({
        title: "Account Deactivated",
        text: "Your account has been successfully deactivated.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
      await logout();
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Deactivation Failed",
        text: err?.response?.data?.error || "Unable to deactivate account.",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    },
  });

  // Update local state when API data loads
  useEffect(() => {
    if (profileData) {
      // User profile
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserProfile({
        fullName: profileData?.profile?.fullName || "",
        bio: profileData?.profile?.bio || "",
        profilePicture: profileData?.profile?.profilePicture || "",
        email: profileData?.email || "",
        phone: profileData?.phone || "",
      });

      // Address
      setAddressForm({
        street: profileData?.address?.street || "",
        city: profileData?.address?.city || "",
        state: profileData?.address?.state || "",
        zipCode: profileData?.address?.zipCode || "",
        country: profileData?.address?.country || "",
        coordinates: profileData?.address?.coordinates?.coordinates || [0, 0],
      });

      // User settings
      const notifications = profileData?.settings?.notifications || {};
      const privacy = profileData?.settings?.privacy || {};

      setUserSettings({
        notifications: {
          email: notifications.email ?? true,
          sms: notifications.sms ?? true,
          push: notifications.push ?? true,
        },
        privacy: {
          showLocation: privacy.showLocation ?? true,
          showContact: privacy.showContact ?? true,
        },
      });
    }
  }, [profileData]);

  // Update local state when bank data loads
  useEffect(() => {
    if (bankData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBankSettings({
        facilities: bankData.facilities || [],
        operatingHours: bankData.operatingHours || defaultOperatingHours,
        description: bankData.description || "",
        website: bankData.contact?.website || "",
        emergencyContact: bankData.contact?.emergency || "",
      });
    }
  }, [bankData]);

  // Handle profile input changes
  const handleProfileChange = (field, value) => {
    setUserProfile((prev) => ({
      ...prev,
      [field]: value,
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
    setUserSettings((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: !prev[group][key],
      },
    }));
  };

  // Handle operating hours change
  const handleHoursChange = (day, period, value) => {
    setBankSettings((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [period]: value,
        },
      },
    }));
  };

  // Handle facilities
  const addFacility = () => {
    if (newFacility.trim()) {
      setBankSettings((prev) => ({
        ...prev,
        facilities: [...prev.facilities, newFacility.trim()],
      }));
      setNewFacility("");
    }
  };

  const removeFacility = (index) => {
    setBankSettings((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((_, i) => i !== index),
    }));
  };

  // Save handlers
  const handleSaveProfile = async () => {
    await updateProfileMutation.mutateAsync({
      fullName: userProfile.fullName,
      bio: userProfile.bio,
      profilePicture: userProfile.profilePicture,
    });
  };

  const handleSaveAddress = async () => {
    await updateAddressMutation.mutateAsync({
      street: addressForm.street,
      city: addressForm.city,
      state: addressForm.state,
      zipCode: addressForm.zipCode,
      country: addressForm.country,
      coordinates: addressForm.coordinates,
    });
  };

  const handleSaveSettings = async () => {
    await updateSettingsMutation.mutateAsync({
      notifications: userSettings.notifications,
      privacy: userSettings.privacy,
    });
  };

  const handleSaveBankSettings = async () => {
    if (!bankId) {
      await Swal.fire({
        title: "No Bank Associated",
        text: "You are not associated with any blood bank.",
        icon: "warning",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-warning",
        },
        buttonsStyling: false,
      });
      return;
    }

    await updateBankMutation.mutateAsync({
      bankId,
      payload: {
        facilities: bankSettings.facilities,
        operatingHours: bankSettings.operatingHours,
        contact: {
          ...bankData?.contact,
          website: bankSettings.website,
          emergency: bankSettings.emergencyContact,
        },
      },
    });
  };

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: "Delete Account?",
      text: "This action is irreversible and will deactivate your account immediately.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
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
  if (profileLoading || bankLoading) return <BloodLoader />;

  // Error state
  if (profileError) {
    return <ErrorState error={profileErrorData} onRetry={refetchProfile} />;
  }

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
            <FaHospital className="text-error" />
            Blood Bank Settings
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Manage your profile, bank information, and preferences
          </p>
        </div>

        {/* User Info Badge */}
        <div className="badge badge-lg badge-outline p-4">
          <FaUserMd className="mr-2 text-error" />
          {userProfile.fullName || "Staff Member"}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-error">
            <FaBuilding size={24} />
          </div>
          <p className="stat-title">Blood Bank</p>
          <p className="stat-value text-3xl">{bankData?.name || "Not Associated"}</p>
          <p className="stat-desc">{bankData?.type || "N/A"}</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-info">
            <FaTools size={24} />
          </div>
          <p className="stat-title">Facilities</p>
          <p className="stat-value text-3xl">{bankSettings.facilities.length || 0}</p>
          <p className="stat-desc">Available services</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-success">
            <FaClock size={24} />
          </div>
          <p className="stat-title">Operating Hours</p>
          <p className="stat-value text-3xl">
            {Object.values(bankSettings.operatingHours).filter(h => h.open && h.close).length}/7
          </p>
          <p className="stat-desc">Days open</p>
        </motion.div>
      </motion.div>

      {/* Settings Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
      >
        <div className="flex overflow-x-auto border-b border-base-300">
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === "profile"
              ? "bg-error/10 text-error border-b-2 border-error"
              : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("profile")}
          >
            <FiUser size={16} />
            Profile
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === "address"
              ? "bg-error/10 text-error border-b-2 border-error"
              : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("address")}
          >
            <FiMapPin size={16} />
            Address
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === "bank"
              ? "bg-error/10 text-error border-b-2 border-error"
              : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("bank")}
          >
            <FaBuilding size={16} />
            Bank Settings
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === "hours"
              ? "bg-error/10 text-error border-b-2 border-error"
              : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("hours")}
          >
            <FaClock size={16} />
            Operating Hours
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === "notifications"
              ? "bg-error/10 text-error border-b-2 border-error"
              : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("notifications")}
          >
            <FiBell size={16} />
            Notifications
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === "privacy"
              ? "bg-error/10 text-error border-b-2 border-error"
              : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("privacy")}
          >
            <FiShield size={16} />
            Privacy
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 space-y-5"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiUser className="text-error" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FiUser className="text-error" />
                    Full Name *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="input input-bordered w-full"
                  value={userProfile.fullName}
                  onChange={(e) => handleProfileChange("fullName", e.target.value)}
                />
              </div>

              {/* Email (read-only) */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FiMail className="text-error" />
                    Email
                  </span>
                </label>
                <input
                  type="email"
                  className="input input-bordered w-full bg-base-200"
                  value={userProfile.email}
                  disabled
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Email cannot be changed
                  </span>
                </label>
              </div>

              {/* Phone */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FiPhone className="text-error" />
                    Phone
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="Phone number"
                  className="input input-bordered w-full bg-base-200"
                  value={userProfile.phone}
                  disabled
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Phone cannot be changed
                  </span>
                </label>
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
                  placeholder="https://example.com/profile.jpg"
                  className="input input-bordered w-full"
                  value={userProfile.profilePicture}
                  onChange={(e) => handleProfileChange("profilePicture", e.target.value)}
                />
              </div>

              {/* Bio */}
              <div className="form-control md:col-span-2">
                <label className="label w-full">
                  <span className="label-text flex items-center gap-2">
                    <FiEdit2 className="text-error" />
                    Bio / Description
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24 w-full"
                  placeholder="Tell us about yourself..."
                  value={userProfile.bio}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                />
              </div>
            </div>

            {/* Save button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="btn btn-error btn-sm gap-2"
              >
                <FiSave size={16} />
                {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
              </button>
            </div>

            {/* Change Password Button */}
            <div className="pt-4 border-t border-base-300">
              <button
                onClick={() => setShowChangePassword(true)}
                className="btn btn-outline btn-info gap-2"
              >
                <FiLock size={16} />
                Change Password
              </button>
            </div>
          </motion.div>
        )}

        {/* Address Tab */}
        {activeTab === "address" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 space-y-5"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiMapPin className="text-error" />
              Address Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Street Address */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaMapMarkerAlt className="text-error" />
                    Street Address
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="123 Main St"
                  className="input input-bordered w-full"
                  value={addressForm.street}
                  onChange={(e) => handleAddressChange("street", e.target.value)}
                />
              </div>

              {/* City */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">City</span>
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
                  <span className="label-text">State</span>
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
                  <span className="label-text">ZIP Code</span>
                </label>
                <input
                  type="text"
                  placeholder="400001"
                  className="input input-bordered w-full"
                  value={addressForm.zipCode}
                  onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                />
              </div>

              {/* Country */}
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

              {/* Coordinates */}
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
                    placeholder="Longitude"
                    className="input input-bordered flex-1"
                    value={addressForm.coordinates[0]}
                    onChange={(e) => handleCoordinatesChange(0, e.target.value)}
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    className="input input-bordered flex-1"
                    value={addressForm.coordinates[1]}
                    onChange={(e) => handleCoordinatesChange(1, e.target.value)}
                  />
                </div>
                <p className="text-xs text-base-content/50 mt-1">
                  Used for mapping and location services
                </p>
              </div>
            </div>

            {/* Save button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={updateAddressMutation.isPending}
                className="btn btn-error btn-sm gap-2"
              >
                <FiSave size={16} />
                {updateAddressMutation.isPending ? "Saving..." : "Save Address"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Bank Settings Tab */}
        {activeTab === "bank" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 space-y-5"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FaBuilding className="text-error" />
              Blood Bank Settings
            </h3>

            {!bankId ? (
              <div className="alert alert-warning">
                <FiAlertCircle size={20} />
                <span>You are not associated with any blood bank.</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Bank Info (read-only) */}
                <div className="bg-base-200 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Bank Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm opacity-70">Bank Name</p>
                      <p className="font-semibold">{bankData?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-70">Registration</p>
                      <p className="font-semibold">{bankData?.registrationNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-70">Type</p>
                      <p className="font-semibold capitalize">{bankData?.type}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-70">Verification</p>
                      <p className="font-semibold">
                        {bankData?.verification?.isVerified ? (
                          <span className="text-success">Verified</span>
                        ) : (
                          <span className="text-warning">Pending</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Website */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FiGlobe className="text-error" />
                      Website
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.example.com"
                    className="input input-bordered w-full"
                    value={bankSettings.website}
                    onChange={(e) =>
                      setBankSettings((prev) => ({ ...prev, website: e.target.value }))
                    }
                  />
                </div>

                {/* Emergency Contact */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaPhoneAlt className="text-error" />
                      Emergency Contact
                    </span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Emergency phone number"
                    className="input input-bordered w-full"
                    value={bankSettings.emergencyContact}
                    onChange={(e) =>
                      setBankSettings((prev) => ({ ...prev, emergencyContact: e.target.value }))
                    }
                  />
                </div>

                {/* Facilities */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text flex items-center gap-2">
                      <FaTools className="text-error" />
                      Facilities & Services
                    </span>
                  </label>
                  <div className="space-y-2">
                    {bankSettings.facilities.map((facility, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          className="input input-bordered flex-1"
                          value={facility}
                          onChange={(e) => {
                            const newFacilities = [...bankSettings.facilities];
                            newFacilities[index] = e.target.value;
                            setBankSettings((prev) => ({ ...prev, facilities: newFacilities }));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeFacility(index)}
                          className="btn btn-square btn-ghost text-error"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered flex-1"
                        placeholder="Add new facility (e.g., Centrifuge, Refrigerator)"
                        value={newFacility}
                        onChange={(e) => setNewFacility(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={addFacility}
                        className="btn btn-error"
                        disabled={!newFacility.trim()}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveBankSettings}
                    disabled={updateBankMutation.isPending}
                    className="btn btn-error btn-sm gap-2"
                  >
                    <FiSave size={16} />
                    {updateBankMutation.isPending ? "Saving..." : "Save Bank Settings"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Operating Hours Tab */}
        {activeTab === "hours" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 space-y-5"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FaClock className="text-error" />
              Operating Hours
            </h3>

            {!bankId ? (
              <div className="alert alert-warning">
                <FiAlertCircle size={20} />
                <span>You are not associated with any blood bank.</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="border border-base-300 rounded-lg p-3">
                      <label className="label">
                        <span className="label-text font-semibold capitalize">
                          {dayDisplayNames[day]}
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="time"
                          className="input input-bordered input-sm flex-1"
                          value={bankSettings.operatingHours[day]?.open || ""}
                          onChange={(e) => handleHoursChange(day, "open", e.target.value)}
                        />
                        <span className="self-center">-</span>
                        <input
                          type="time"
                          className="input input-bordered input-sm flex-1"
                          value={bankSettings.operatingHours[day]?.close || ""}
                          onChange={(e) => handleHoursChange(day, "close", e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveBankSettings}
                    disabled={updateBankMutation.isPending}
                    className="btn btn-error btn-sm gap-2"
                  >
                    <FiSave size={16} />
                    {updateBankMutation.isPending ? "Saving..." : "Save Hours"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
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
                    <p className="text-xs text-base-content/60">Receive email alerts</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-error"
                  checked={userSettings.notifications.email}
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
                  checked={userSettings.notifications.sms}
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
                  checked={userSettings.notifications.push}
                  onChange={() => handleSettingsToggle("notifications", "push")}
                />
              </div>
            </div>

            {/* Save button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="btn btn-error btn-sm gap-2"
              >
                <FiSave size={16} />
                {updateSettingsMutation.isPending ? "Saving..." : "Save Notification Settings"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Privacy Tab */}
        {activeTab === "privacy" && (
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
                    <p className="text-xs text-base-content/60">Display your location to others</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-info"
                  checked={userSettings.privacy.showLocation}
                  onChange={() => handleSettingsToggle("privacy", "showLocation")}
                />
              </div>

              {/* Show Contact Details */}
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg md:col-span-2">
                <div className="flex items-center gap-3">
                  <FiUsers className="text-warning" size={20} />
                  <div>
                    <p className="font-medium">Show Contact Details</p>
                    <p className="text-xs text-base-content/60">
                      Display your contact information to others
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-warning"
                  checked={userSettings.privacy.showContact}
                  onChange={() => handleSettingsToggle("privacy", "showContact")}
                />
              </div>
            </div>

            {/* Save button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="btn btn-error btn-sm gap-2"
              >
                <FiSave size={16} />
                {updateSettingsMutation.isPending ? "Saving..." : "Save Privacy Settings"}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Danger Zone */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
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
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-base-content/70">
                Once you delete your account, there is no going back. This action is irreversible
                and will deactivate your profile immediately. All your associations with blood banks
                will be removed.
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

      {/* Mobile Save Button FAB */}
      {(updateProfileMutation.isPending ||
        updateAddressMutation.isPending ||
        updateSettingsMutation.isPending ||
        updateBankMutation.isPending) && (
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

      {/* Change Password Modal */}
      {showChangePassword && (
        <dialog open className="modal">
          <ChangePasswordModal
            userId={userId}
            userName={userProfile.fullName || user?.profile?.fullName || "Blood Bank Account"}
            onClose={() => setShowChangePassword(false)}
            refreshUsers={() => refetchProfile()}
          />
          <form
            onClick={() => setShowChangePassword(false)}
            method="dialog"
            className="modal-backdrop"
          >
            <button>close</button>
          </form>
        </dialog>
      )}

    </div>
  );
};

export default Settings;
