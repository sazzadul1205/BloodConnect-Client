// Pages/backend/BloodBank/Settings/Settings.jsx

// React
import React, { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

// ==================== CONSTANTS ====================

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

// Day display names for UI
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

// ==================== HELPER FUNCTIONS ====================

/**
 * Extract ID from MongoDB ObjectId or other formats
 */
const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    return value?.$oid || value?._id || value?.toString?.() || JSON.stringify(value);
  }
  return String(value);
};

// ==================== QUERY KEYS ====================

const queryKeys = {
  userProfile: (userId) => ['user-profile-settings', userId],
  bloodBankSettings: (userId) => ['blood-bank-settings', userId],
};

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

const tabContentVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3
    }
  }
};

// ==================== MAIN COMPONENT ====================

const Settings = () => {
  const { user, logout } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");

  // ==================== MEMOIZED VALUES ====================

  /**
   * Get user ID from auth object
   */
  const userId = useMemo(
    () => getId(user?.userId) || getId(user?._id) || getId(user?.id) || getId(user?.uid),
    [user],
  );

  // ==================== STATE MANAGEMENT ====================

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

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query 1: Fetch user profile data
   */
  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErrorData,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: queryKeys.userProfile(userId),
    enabled: !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/profile/${userId}`, {
        headers: authHeaders,
      });
      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 2: Fetch blood bank details (if user is associated with a bank)
   */
  const {
    data: bankData,
    isLoading: bankLoading,
  } = useQuery({
    queryKey: queryKeys.bloodBankSettings(userId),
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const bankId = useMemo(() => getId(bankData?._id), [bankData]);

  // ==================== MUTATIONS ====================

  /**
   * Mutation 1: Update user profile
   */
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
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        },
        buttonsStyling: false,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
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
   * Mutation 2: Update address
   */
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
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        },
        buttonsStyling: false,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
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
   * Mutation 3: Update user settings (notifications & privacy)
   */
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
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        },
        buttonsStyling: false,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) });
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
   * Mutation 4: Update bank settings
   */
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
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        },
        buttonsStyling: false,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bloodBankSettings(userId) });
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update bank settings.",
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
   * Mutation 5: Delete account
   */
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
   * Update local state when profile data loads
   */
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

  /**
   * Update local state when bank data loads
   */
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

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle profile input changes
   */
  const handleProfileChange = (field, value) => {
    setUserProfile((prev) => ({
      ...prev,
      [field]: value,
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
    setUserSettings((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: !prev[group][key],
      },
    }));
  };

  /**
   * Handle operating hours change
   */
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

  /**
   * Add new facility
   */
  const addFacility = () => {
    if (newFacility.trim()) {
      setBankSettings((prev) => ({
        ...prev,
        facilities: [...prev.facilities, newFacility.trim()],
      }));
      setNewFacility("");
    }
  };

  /**
   * Remove facility at index
   */
  const removeFacility = (index) => {
    setBankSettings((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((_, i) => i !== index),
    }));
  };

  /**
   * Save profile
   */
  const handleSaveProfile = async () => {
    await updateProfileMutation.mutateAsync({
      fullName: userProfile.fullName,
      bio: userProfile.bio,
      profilePicture: userProfile.profilePicture,
    });
  };

  /**
   * Save address
   */
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

  /**
   * Save user settings
   */
  const handleSaveSettings = async () => {
    await updateSettingsMutation.mutateAsync({
      notifications: userSettings.notifications,
      privacy: userSettings.privacy,
    });
  };

  /**
   * Save bank settings
   */
  const handleSaveBankSettings = async () => {
    if (!bankId) {
      await Swal.fire({
        title: "No Bank Associated",
        text: "You are not associated with any blood bank.",
        icon: "warning",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
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

  /**
   * Handle delete account with confirmation
   */
  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: "Delete Account?",
      text: "This action is irreversible and will deactivate your account immediately.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        title: "text-lg font-bold text-error",
        htmlContainer: "text-sm sm:text-base text-base-content/80",
        confirmButton: "btn btn-sm btn-error",
        cancelButton: "btn btn-sm",
      },
      buttonsStyling: false,
    });

    if (!result.isConfirmed) return;
    await deleteAccountMutation.mutateAsync();
  };

  // ==================== LOADING & ERROR STATES ====================

  if (profileLoading || bankLoading) return <BloodLoader />;
  if (profileError) return <ErrorState error={profileErrorData} onRetry={refetchProfile} />;

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
            Blood Bank Settings
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Manage your profile, bank information, and preferences
          </p>
        </div>

        {/* User Info Badge */}
        <div className="badge badge-lg badge-outline p-3 sm:p-4">
          <FaUserMd className="mr-2 text-error text-xs sm:text-sm" />
          <span className="text-xs sm:text-sm truncate max-w-40">
            {userProfile.fullName || "Staff Member"}
          </span>
        </div>
      </motion.div>

      {/* ==================== STATS CARDS ==================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      >
        {/* Blood Bank Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Blood Bank</p>
              <p className="stat-value text-sm sm:text-base md:text-lg font-bold truncate max-w-40">
                {bankData?.name || "Not Associated"}
              </p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FaBuilding className="text-error text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">{bankData?.type || "N/A"}</p>
        </motion.div>

        {/* Facilities Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Facilities</p>
              <p className="stat-value text-sm sm:text-base md:text-lg font-bold">
                {bankSettings.facilities.length || 0}
              </p>
            </div>
            <div className="stat-figure bg-info/10 p-2 rounded-full">
              <FaTools className="text-info text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Available services</p>
        </motion.div>

        {/* Operating Hours Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Operating Hours</p>
              <p className="stat-value text-sm sm:text-base md:text-lg font-bold">
                {Object.values(bankSettings.operatingHours).filter(h => h.open && h.close).length}/7
              </p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FaClock className="text-success text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Days open</p>
        </motion.div>
      </motion.div>

      {/* ==================== SETTINGS TABS ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
      >
        {/* Tab Headers - Responsive with horizontal scroll */}
        <div className="flex overflow-x-auto border-b border-base-300">
          <button
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === "profile" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("profile")}
          >
            <FiUser size={12} className="sm:w-4 sm:h-4" />
            Profile
          </button>
          <button
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === "address" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("address")}
          >
            <FiMapPin size={12} className="sm:w-4 sm:h-4" />
            Address
          </button>
          <button
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === "bank" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("bank")}
          >
            <FaBuilding size={12} className="sm:w-4 sm:h-4" />
            Bank Settings
          </button>
          <button
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === "hours" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("hours")}
          >
            <FaClock size={12} className="sm:w-4 sm:h-4" />
            Hours
          </button>
          <button
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === "notifications" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("notifications")}
          >
            <FiBell size={12} className="sm:w-4 sm:h-4" />
            Notifications
          </button>
          <button
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === "privacy" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("privacy")}
          >
            <FiShield size={12} className="sm:w-4 sm:h-4" />
            Privacy
          </button>
        </div>

        {/* ==================== PROFILE TAB ==================== */}
        {activeTab === "profile" && (
          <motion.div
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            className="p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiUser className="text-error text-sm sm:text-base" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Full Name */}
              <div className="form-control md:col-span-2">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FiUser className="text-error" size={12} />
                    Full Name *
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={userProfile.fullName}
                  onChange={(e) => handleProfileChange("fullName", e.target.value)}
                />
              </div>

              {/* Email (read-only) */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FiMail className="text-error" size={12} />
                    Email
                  </span>
                </label>
                <input
                  type="email"
                  className="input input-bordered input-sm sm:input-md w-full bg-base-200"
                  value={userProfile.email}
                  disabled
                />
                <label className="label py-1">
                  <span className="label-text-alt text-[10px] sm:text-xs text-base-content/60">
                    Email cannot be changed
                  </span>
                </label>
              </div>

              {/* Phone (read-only) */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FiPhone className="text-error" size={12} />
                    Phone
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="Phone number"
                  className="input input-bordered input-sm sm:input-md w-full bg-base-200"
                  value={userProfile.phone}
                  disabled
                />
                <label className="label py-1">
                  <span className="label-text-alt text-[10px] sm:text-xs text-base-content/60">
                    Phone cannot be changed
                  </span>
                </label>
              </div>

              {/* Profile Picture URL */}
              <div className="form-control md:col-span-2">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FiImage className="text-error" size={12} />
                    Profile Picture URL
                  </span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/profile.jpg"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={userProfile.profilePicture}
                  onChange={(e) => handleProfileChange("profilePicture", e.target.value)}
                />
              </div>

              {/* Bio */}
              <div className="form-control md:col-span-2">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FiEdit2 className="text-error" size={12} />
                    Bio / Description
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered textarea-sm sm:textarea-md h-20 sm:h-24 w-full"
                  placeholder="Tell us about yourself..."
                  value={userProfile.bio}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                />
              </div>
            </div>

            {/* Save button */}
            <div className="pt-2 sm:pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 w-full sm:w-auto"
              >
                {updateProfileMutation.isPending ? (
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

            {/* Change Password Button */}
            <div className="pt-4 border-t border-base-300">
              <button
                onClick={() => setShowChangePassword(true)}
                className="btn btn-outline btn-info btn-xs sm:btn-sm gap-1 sm:gap-2"
              >
                <FiLock size={12} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Change Password</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ==================== ADDRESS TAB ==================== */}
        {activeTab === "address" && (
          <motion.div
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            className="p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiMapPin className="text-error text-sm sm:text-base" />
              Address Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Street Address */}
              <div className="form-control md:col-span-2">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaMapMarkerAlt className="text-error" size={12} />
                    Street Address
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="123 Main St"
                  className="input input-bordered input-sm sm:input-md w-full"
                  value={addressForm.street}
                  onChange={(e) => handleAddressChange("street", e.target.value)}
                />
              </div>

              {/* City */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm">City</span>
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
                  <span className="label-text text-xs sm:text-sm">State</span>
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
                  <span className="label-text text-xs sm:text-sm">ZIP Code</span>
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

              {/* Coordinates */}
              <div className="form-control md:col-span-2">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FiGlobe className="text-error" size={12} />
                    Coordinates (Longitude, Latitude)
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    className="input input-bordered input-sm sm:input-md flex-1 w-full"
                    value={addressForm.coordinates[0]}
                    onChange={(e) => handleCoordinatesChange(0, e.target.value)}
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    className="input input-bordered input-sm sm:input-md flex-1 w-full"
                    value={addressForm.coordinates[1]}
                    onChange={(e) => handleCoordinatesChange(1, e.target.value)}
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-base-content/50 mt-1">
                  Used for mapping and location services
                </p>
              </div>
            </div>

            {/* Save button */}
            <div className="pt-2 sm:pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={updateAddressMutation.isPending}
                className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 w-full sm:w-auto"
              >
                {updateAddressMutation.isPending ? (
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

        {/* ==================== BANK SETTINGS TAB ==================== */}
        {activeTab === "bank" && (
          <motion.div
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            className="p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FaBuilding className="text-error text-sm sm:text-base" />
              Blood Bank Settings
            </h2>

            {!bankId ? (
              <div className="alert alert-warning flex-col sm:flex-row gap-2 p-3 sm:p-4">
                <FiAlertCircle size={16} className="sm:w-5 sm:h-5 shrink-0" />
                <span className="text-xs sm:text-sm">You are not associated with any blood bank.</span>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Bank Info (read-only) */}
                <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-medium text-xs sm:text-sm mb-2 sm:mb-3">Bank Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Bank Name</p>
                      <p className="font-semibold text-xs sm:text-sm">{bankData?.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Registration</p>
                      <p className="font-semibold text-xs sm:text-sm">{bankData?.registrationNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Type</p>
                      <p className="font-semibold text-xs sm:text-sm capitalize">{bankData?.type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Verification</p>
                      <p className="font-semibold text-xs sm:text-sm">
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
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                      <FiGlobe className="text-error" size={12} />
                      Website
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.example.com"
                    className="input input-bordered input-sm sm:input-md w-full"
                    value={bankSettings.website}
                    onChange={(e) =>
                      setBankSettings((prev) => ({ ...prev, website: e.target.value }))
                    }
                  />
                </div>

                {/* Emergency Contact */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                      <FaPhoneAlt className="text-error" size={12} />
                      Emergency Contact
                    </span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Emergency phone number"
                    className="input input-bordered input-sm sm:input-md w-full"
                    value={bankSettings.emergencyContact}
                    onChange={(e) =>
                      setBankSettings((prev) => ({ ...prev, emergencyContact: e.target.value }))
                    }
                  />
                </div>

                {/* Facilities */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                      <FaTools className="text-error" size={12} />
                      Facilities & Services
                    </span>
                  </label>
                  <div className="space-y-2">
                    {bankSettings.facilities.map((facility, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          className="input input-bordered input-sm sm:input-md flex-1"
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
                          className="btn btn-square btn-ghost btn-sm text-error"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <div className="flex flex-col xs:flex-row gap-2">
                      <input
                        type="text"
                        className="input input-bordered input-sm sm:input-md flex-1"
                        placeholder="Add new facility (e.g., Centrifuge, Refrigerator)"
                        value={newFacility}
                        onChange={(e) => setNewFacility(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={addFacility}
                        className="btn btn-error btn-sm"
                        disabled={!newFacility.trim()}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <div className="pt-2 sm:pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveBankSettings}
                    disabled={updateBankMutation.isPending}
                    className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 w-full sm:w-auto"
                  >
                    {updateBankMutation.isPending ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span className="text-xs sm:text-sm">Saving...</span>
                      </>
                    ) : (
                      <>
                        <FiSave size={12} className="sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Save Bank Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ==================== OPERATING HOURS TAB ==================== */}
        {activeTab === "hours" && (
          <motion.div
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            className="p-4 sm:p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-base-300 pb-3">
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <FaClock className="text-error text-sm sm:text-base" />
                Operating Hours
              </h2>

              {/* Quick Apply Button */}
              <button
                type="button"
                onClick={() => {
                  const monday = bankSettings.operatingHours.monday;
                  if (!monday?.open || !monday?.close) return;

                  const updated = { ...bankSettings.operatingHours };
                  ["tuesday", "wednesday", "thursday", "friday"].forEach((day) => {
                    updated[day] = { ...monday };
                  });

                  setBankSettings((prev) => ({
                    ...prev,
                    operatingHours: updated,
                  }));
                }}
                className="btn btn-ghost btn-xs"
              >
                Apply Mon → Fri
              </button>
            </div>

            {!bankId ? (
              <div className="alert alert-warning flex-col sm:flex-row gap-2 p-4">
                <FiAlertCircle className="shrink-0" />
                <span className="text-sm">
                  You are not associated with any blood bank.
                </span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {daysOfWeek.map((day) => {
                    const openTime = bankSettings.operatingHours[day]?.open || "";
                    const closeTime = bankSettings.operatingHours[day]?.close || "";
                    const isClosed = !openTime && !closeTime;

                    const invalid =
                      openTime && closeTime && closeTime <= openTime;

                    return (
                      <div
                        key={day}
                        className="border border-base-300 rounded-xl p-4 bg-base-100 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold capitalize">
                            {dayDisplayNames[day]}
                          </span>

                          {/* Closed Toggle */}
                          <label className="cursor-pointer flex items-center gap-2 text-xs">
                            <span>Closed</span>
                            <input
                              type="checkbox"
                              className="toggle toggle-error toggle-xs"
                              checked={isClosed}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleHoursChange(day, "open", "");
                                  handleHoursChange(day, "close", "");
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* Time Inputs */}
                        <div className="flex gap-2">
                          <input
                            type="time"
                            disabled={isClosed}
                            className={`input input-bordered input-sm flex-1 ${invalid ? "input-error" : ""
                              }`}
                            value={openTime}
                            onChange={(e) =>
                              handleHoursChange(day, "open", e.target.value)
                            }
                          />

                          <input
                            type="time"
                            disabled={isClosed}
                            className={`input input-bordered input-sm flex-1 ${invalid ? "input-error" : ""
                              }`}
                            value={closeTime}
                            onChange={(e) =>
                              handleHoursChange(day, "close", e.target.value)
                            }
                          />
                        </div>

                        {/* Validation Message */}
                        {invalid && (
                          <p className="text-xs text-error">
                            Closing time must be after opening time.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Save Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveBankSettings}
                    disabled={updateBankMutation.isPending}
                    className="btn btn-error btn-sm gap-2 w-full sm:w-auto"
                  >
                    {updateBankMutation.isPending ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave />
                        Save Hours
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ==================== NOTIFICATIONS TAB ==================== */}
        {activeTab === "notifications" && (
          <motion.div
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            className="p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiBell className="text-error text-sm sm:text-base" />
              Notification Preferences
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Email Notifications */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-info/10 p-1.5 sm:p-2 rounded-full">
                    <FiMail className="text-info text-sm sm:text-base" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Email</p>
                    <p className="text-[10px] sm:text-xs text-base-content/60">Receive email alerts</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-error toggle-sm sm:toggle-md"
                  checked={userSettings.notifications.email}
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
                  checked={userSettings.notifications.sms}
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
                  checked={userSettings.notifications.push}
                  onChange={() => handleSettingsToggle("notifications", "push")}
                />
              </div>
            </div>

            {/* Save button */}
            <div className="pt-2 sm:pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 w-full sm:w-auto"
              >
                {updateSettingsMutation.isPending ? (
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
        {activeTab === "privacy" && (
          <motion.div
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            className="p-4 sm:p-6 space-y-4 sm:space-y-5"
          >
            <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
              <FiShield className="text-error text-sm sm:text-base" />
              Privacy Controls
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Show Location */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-info/10 p-1.5 sm:p-2 rounded-full">
                    <FiMapPin className="text-info text-sm sm:text-base" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Show Location</p>
                    <p className="text-[10px] sm:text-xs text-base-content/60">Display your location to others</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-info toggle-sm sm:toggle-md"
                  checked={userSettings.privacy.showLocation}
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
                    <p className="text-[10px] sm:text-xs text-base-content/60">
                      Display your contact information to others
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-warning toggle-sm sm:toggle-md"
                  checked={userSettings.privacy.showContact}
                  onChange={() => handleSettingsToggle("privacy", "showContact")}
                />
              </div>
            </div>

            {/* Save button */}
            <div className="pt-2 sm:pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 w-full sm:w-auto"
              >
                {updateSettingsMutation.isPending ? (
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

      {/* ==================== DANGER ZONE ==================== */}
      <motion.section
        variants={fadeInUp}
        className="bg-base-100 rounded-lg shadow-lg border border-error/30 p-4 sm:p-6"
      >
        <h2 className="text-base sm:text-lg font-semibold text-error flex items-center gap-2 pb-2 border-b border-error/20">
          <FiTrash2 className="text-sm sm:text-base" />
          Danger Zone
        </h2>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mt-3">
          <div className="flex items-start gap-2 sm:gap-3 flex-1">
            <FiAlertCircle className="text-error shrink-0 mt-1 sm:w-5 sm:h-5" size={16} />
            <div>
              <p className="font-medium text-xs sm:text-sm">Delete Account</p>
              <p className="text-[10px] sm:text-xs text-base-content/70">
                Once you delete your account, there is no going back. This action is irreversible
                and will deactivate your profile immediately. All your associations with blood banks
                will be removed.
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
                <span className="text-xs sm:text-sm">Delete Account</span>
              </>
            )}
          </button>
        </div>
      </motion.section>

      {/* ==================== MOBILE SAVE BUTTON FAB ==================== */}
      {(updateProfileMutation.isPending ||
        updateAddressMutation.isPending ||
        updateSettingsMutation.isPending ||
        updateBankMutation.isPending) && (
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
    </motion.div>
  );
};

export default Settings;