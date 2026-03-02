// Pages/backend/BloodBank/BankProfile/BankProfile.jsx

// React
import { Link } from "react-router";
import React, { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons - Fi (Feather Icons)
import {
  FiSave,
  FiEdit2,
  FiClock,
  FiPhone,
  FiMail,
  FiGlobe,
  FiCalendar,
  FiUsers,
  FiActivity,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaHospital,
  FaBuilding,
  FaHeartbeat,
  FaTint,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaClock,
  FaTools,
  FaCheckCircle as FaCheckCircleSolid,
  FaShieldAlt,
  FaExclamationTriangle,
  FaUsers,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";
import { formatAppDate } from "../../../../utils/dateFormat";

// ==================== CONSTANTS ====================

// Format date for display
const formatDate = (value) => {
  return formatAppDate(value);
};

// Bank type configuration for consistent display
const bankTypeConfig = {
  government: {
    icon: FaBuilding,
    color: "primary",
    label: "Government",
    bgGradient: "from-primary to-primary/80",
  },
  private: {
    icon: FaBuilding,
    color: "secondary",
    label: "Private",
    bgGradient: "from-secondary to-secondary/80",
  },
  ngo: {
    icon: FaHeartbeat,
    color: "success",
    label: "NGO",
    bgGradient: "from-success to-success/80",
  },
  hospital: {
    icon: FaHospital,
    color: "info",
    label: "Hospital-Based",
    bgGradient: "from-info to-info/80",
  },
};

// Default config for unknown types
const defaultBankConfig = {
  icon: FaHospital,
  color: "primary",
  label: "Blood Bank",
  bgGradient: "from-primary to-primary/80",
};

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

// ==================== QUERY KEYS ====================

const queryKeys = {
  myBloodBank: (userId) => ['my-blood-bank', userId],
  bloodBankProfile: (bankId) => ['blood-bank-profile', bankId],
  bloodBankStats: (bankId) => ['blood-bank-stats', bankId],
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

// ==================== MAIN COMPONENT ====================

const BankProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");

  // User role checks
  const isAdminUser = user?.role === "admin" || user?.role === "super_admin";
  const isBloodBankUser = user?.role === "blood_bank";

  // Get user ID from auth
  const userId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  // ==================== QUERIES ====================

  /**
   * Query 1: Fetch blood bank data for current staff user
   * Only runs for blood bank staff users
   */
  const {
    data: myBankData,
    isLoading: myBankLoading,
    isError: myBankError,
  } = useQuery({
    queryKey: queryKeys.myBloodBank(userId),
    enabled: !authLoading && isBloodBankUser && !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks/staff/me", {
        headers: authHeaders,
      });
      return res.data?.data || null;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Auth headers for API requests
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  /**
   * Resolve blood bank ID from multiple possible sources
   * For blood bank staff, never fall back to userId (it causes invalid /blood-banks/:id calls)
   */
  const bankId = useMemo(() => {
    const profileBankId =
      user?.bankId ||
      user?.bloodBankId ||
      user?.assignedBankId ||
      user?.profile?.bankId ||
      user?.profile?.bloodBankId;

    if (isBloodBankUser) {
      return myBankData?._id || profileBankId || null;
    }

    return profileBankId || userId || null;
  }, [isBloodBankUser, myBankData, user, userId]);

  // ==================== STATE MANAGEMENT ====================

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editSection, setEditSection] = useState(null);

  // Form states for different sections
  const [bankInfo, setBankInfo] = useState({
    name: "",
    registrationNumber: "",
    type: "",
  });

  const [contactInfo, setContactInfo] = useState({
    phone: [""],
    email: "",
    website: "",
    emergency: "",
  });

  const [addressInfo, setAddressInfo] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    coordinates: [0, 0],
  });

  const [operatingHours, setOperatingHours] = useState({
    monday: { open: "09:00", close: "17:00" },
    tuesday: { open: "09:00", close: "17:00" },
    wednesday: { open: "09:00", close: "17:00" },
    thursday: { open: "09:00", close: "17:00" },
    friday: { open: "09:00", close: "17:00" },
    saturday: { open: "09:00", close: "13:00" },
    sunday: { open: "", close: "" },
  });

  const [facilities, setFacilities] = useState([]);
  const [newFacility, setNewFacility] = useState("");

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query 2: Fetch blood bank details by ID
   * Main query for bank profile data
   */
  const {
    data: bankData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.bloodBankProfile(bankId),
    enabled: !authLoading && !!bankId && (!isBloodBankUser || !myBankLoading),
    queryFn: async () => {
      if (!bankId) {
        throw new Error("Bank ID not found. Please log in again.");
      }

      const res = await axiosInstance.get(`/blood-banks/${bankId}`, {
        headers: authHeaders,
      });

      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  /**
   * Query 3: Fetch blood bank statistics
   * Separate query for performance data
   */
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: queryKeys.bloodBankStats(bankId),
    enabled: !authLoading && !!bankData?._id,
    queryFn: async () => {
      if (!bankId) return null;

      const res = await axiosInstance.get(`/blood-banks/${bankId}/stats`, {
        headers: authHeaders,
      });

      return res.data?.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ==================== MUTATIONS ====================

  /**
   * Mutation: Update bank information
   * Handles all PATCH updates to different sections
   */
  const updateBankMutation = useMutation({
    mutationFn: async ({ updates }) => {
      const response = await axiosInstance.patch(
        `/blood-banks/${bankId}`,
        updates,
        { headers: authHeaders }
      );
      return response.data;
    },
    onSuccess: async () => {
      await Swal.fire({
        title: "Updated Successfully",
        text: "Blood bank information has been updated.",
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

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.bloodBankProfile(bankId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bloodBankStats(bankId) });

      setIsEditing(false);
      setEditSection(null);
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Failed to update information.",
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
   * Maps bank data to form states
   */
  useEffect(() => {
    if (bankData) {
      // Bank Info
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBankInfo({
        name: bankData.name || "",
        registrationNumber: bankData.registrationNumber || "",
        type: bankData.type || "",
      });

      // Contact Info
      setContactInfo({
        phone: bankData.contact?.phone?.length ? bankData.contact.phone : [""],
        email: bankData.contact?.email || "",
        website: bankData.contact?.website || "",
        emergency: bankData.contact?.emergency || "",
      });

      // Address Info
      setAddressInfo({
        street: bankData.address?.street || "",
        city: bankData.address?.city || "",
        state: bankData.address?.state || "",
        zipCode: bankData.address?.zipCode || "",
        coordinates: bankData.address?.coordinates?.coordinates || [0, 0],
      });

      // Operating Hours
      if (bankData.operatingHours) {
        setOperatingHours({
          monday: bankData.operatingHours.monday || { open: "09:00", close: "17:00" },
          tuesday: bankData.operatingHours.tuesday || { open: "09:00", close: "17:00" },
          wednesday: bankData.operatingHours.wednesday || { open: "09:00", close: "17:00" },
          thursday: bankData.operatingHours.thursday || { open: "09:00", close: "17:00" },
          friday: bankData.operatingHours.friday || { open: "09:00", close: "17:00" },
          saturday: bankData.operatingHours.saturday || { open: "09:00", close: "13:00" },
          sunday: bankData.operatingHours.sunday || { open: "", close: "" },
        });
      }

      // Facilities
      setFacilities(bankData.facilities || []);
    }
  }, [bankData]);

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle phone array changes
   */
  const handlePhoneChange = (index, value) => {
    const newPhones = [...contactInfo.phone];
    newPhones[index] = value;
    setContactInfo({ ...contactInfo, phone: newPhones });
  };

  /**
   * Add new phone field
   */
  const addPhoneField = () => {
    setContactInfo({
      ...contactInfo,
      phone: [...contactInfo.phone, ""],
    });
  };

  /**
   * Remove phone field at index
   */
  const removePhoneField = (index) => {
    if (contactInfo.phone.length > 1) {
      const newPhones = contactInfo.phone.filter((_, i) => i !== index);
      setContactInfo({ ...contactInfo, phone: newPhones });
    }
  };

  /**
   * Add new facility
   */
  const addFacility = () => {
    if (newFacility.trim()) {
      setFacilities([...facilities, newFacility.trim()]);
      setNewFacility("");
    }
  };

  /**
   * Remove facility at index
   */
  const removeFacility = (index) => {
    setFacilities(facilities.filter((_, i) => i !== index));
  };

  /**
   * Handle coordinates change
   */
  const handleCoordinatesChange = (index, value) => {
    const newCoords = [...addressInfo.coordinates];
    newCoords[index] = parseFloat(value) || 0;
    setAddressInfo({ ...addressInfo, coordinates: newCoords });
  };

  /**
   * Handle operating hours change
   */
  const handleHoursChange = (day, period, value) => {
    setOperatingHours({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        [period]: value,
      },
    });
  };

  /**
   * Save handlers for different sections
   */
  const handleSaveBankInfo = async () => {
    await updateBankMutation.mutateAsync({
      updates: {
        name: bankInfo.name,
      },
    });
  };

  const handleSaveContactInfo = async () => {
    // Clean up empty phones
    const cleanedPhones = contactInfo.phone.filter(p => p.trim() !== "");

    await updateBankMutation.mutateAsync({
      updates: {
        contact: {
          phone: cleanedPhones,
          email: contactInfo.email,
          website: contactInfo.website,
          emergency: contactInfo.emergency,
        },
      },
    });
  };

  const handleSaveAddressInfo = async () => {
    await updateBankMutation.mutateAsync({
      updates: {
        address: {
          street: addressInfo.street,
          city: addressInfo.city,
          state: addressInfo.state,
          zipCode: addressInfo.zipCode,
          coordinates: addressInfo.coordinates,
        },
      },
    });
  };

  const handleSaveOperatingHours = async () => {
    await updateBankMutation.mutateAsync({
      updates: {
        operatingHours: operatingHours,
      },
    });
  };

  const handleSaveFacilities = async () => {
    await updateBankMutation.mutateAsync({
      updates: {
        facilities: facilities,
      },
    });
  };

  // ==================== COMPUTED VALUES ====================

  // Get bank type info with fallback
  const typeInfo = bankTypeConfig[bankInfo.type] || {
    ...defaultBankConfig,
    label: bankInfo.type || "Blood Bank",
  };
  const TypeIcon = typeInfo.icon;

  // Verification status
  const isVerified = bankData?.verification?.isVerified || false;

  // ==================== LOADING STATES ====================

  if (isLoading || authLoading || statsLoading || myBankLoading) return <BloodLoader />;

  // ==================== ERROR HANDLING ====================

  const profileErrorStatus = error?.response?.status;
  const profileErrorMessage = error?.response?.data?.error || error?.message || "";
  const isProfileMissingError =
    isError &&
    (profileErrorStatus === 404 ||
      profileErrorStatus === 400 ||
      /blood bank not found|invalid blood bank id/i.test(profileErrorMessage));

  const createProfileLink = user?.role === "super_admin"
    ? "/super_admin/blood-banks-management?openCreate=1"
    : "/admin/blood-banks-management?openCreate=1";

  const showCreateProfileState =
    (!bankId && !authLoading && !myBankLoading) ||
    (isBloodBankUser && !myBankData && (myBankError || !bankId)) ||
    isProfileMissingError;

  // ==================== NO PROFILE STATE ====================

  if (showCreateProfileState) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-3 sm:p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="card bg-base-100 shadow-xl w-full max-w-lg border border-error/20"
        >
          <div className="card-body items-center text-center space-y-4">
            <div className="bg-error/10 text-error rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              <FaHospital size={24} className="sm:w-8 sm:h-8" />
            </div>
            <h2 className="card-title text-lg sm:text-xl md:text-2xl text-error">Blood Bank Profile Not Found</h2>
            <p className="text-xs sm:text-sm text-base-content/70">
              You do not have a blood bank profile yet. Create a Blood Bank profile to manage inventory, staff, and requests.
            </p>

            {isAdminUser ? (
              <Link to={createProfileLink} className="btn btn-error btn-sm sm:btn-md text-white">
                Create New Profile
              </Link>
            ) : (
              <p className="text-xs sm:text-sm text-base-content/70">
                Please contact an admin to create your Blood Bank profile and assign your account.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ==================== ERROR STATE ====================

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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        {/* Title and description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FaHospital className="text-error" />
            Blood Bank Profile
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Manage your blood bank information, operating hours, and contact details.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => {
              refetch();
              refetchStats();
            }}
            className="btn btn-outline btn-xs sm:btn-sm gap-2"
            disabled={isLoading || statsLoading}
          >
            <FiRefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            <span className="text-xs sm:text-sm hidden sm:inline">Refresh</span>
          </button>

          {/* Verification Badge */}
          <div className={`badge ${isVerified ? 'badge-success' : 'badge-warning'} badge-sm sm:badge-md gap-1 sm:gap-2 p-2 sm:p-3`}>
            {isVerified ? (
              <>
                <FaCheckCircleSolid size={10} className="sm:w-3 sm:h-3" />
                <span className="text-[10px] sm:text-xs">Verified Bank</span>
              </>
            ) : (
              <>
                <FiAlertCircle size={10} className="sm:w-3 sm:h-3" />
                <span className="text-[10px] sm:text-xs">Pending Verification</span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ==================== BANK HEADER CARD ==================== */}
      <motion.div
        variants={fadeInUp}
        className={`bg-linear-to-r ${typeInfo.bgGradient} rounded-lg p-4 sm:p-6 text-white`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Bank Icon */}
          <div className="bg-white/20 p-3 sm:p-4 rounded-full w-fit">
            <TypeIcon size={24} className="sm:w-10 sm:h-10 md:w-12 md:h-12" />
          </div>

          {/* Bank Info */}
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold wrap-break-word">{bankInfo.name}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              {/* Bank Type Badge */}
              <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-sm flex items-center gap-1">
                <TypeIcon size={10} className="sm:w-3 sm:h-3" />
                {typeInfo.label}
              </span>

              {/* Registration Number Badge */}
              <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-sm">
                Reg: {bankInfo.registrationNumber}
              </span>

              {/* Member Since Badge */}
              <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-sm flex items-center gap-1">
                <FiCalendar size={10} className="sm:w-3 sm:h-3" />
                Member since {formatDate(bankData?.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ==================== STATS CARDS ==================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* Total Inventory Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Total Inventory</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-error">{statsData?.totalInventory || 0}</p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FaTint className="text-error text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Blood units available</p>
        </motion.div>

        {/* Pending Requests Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Pending Requests</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-warning">{statsData?.requests?.pending || 0}</p>
            </div>
            <div className="stat-figure bg-warning/10 p-2 rounded-full">
              <FiClock className="text-warning text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Awaiting fulfillment</p>
        </motion.div>

        {/* Fulfilled Requests Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Fulfilled</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-success">{statsData?.requests?.fulfilled || 0}</p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FaCheckCircleSolid className="text-success text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Completed requests</p>
        </motion.div>

        {/* Registered Donors Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Registered Donors</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-info">{statsData?.donors?.total || 0}</p>
            </div>
            <div className="stat-figure bg-info/10 p-2 rounded-full">
              <FiUsers className="text-info text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Preferred this bank</p>
        </motion.div>
      </motion.div>

      {/* ==================== MAIN CONTENT TABS ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
      >
        {/* Tab Headers - Responsive with horizontal scroll */}
        <div className="flex overflow-x-auto border-b border-base-300">
          <button
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === "overview" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("overview")}
          >
            <FaHospital size={12} className="sm:w-4 sm:h-4" />
            Overview
          </button>
          <button
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === "contact" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("contact")}
          >
            <FaPhoneAlt size={12} className="sm:w-4 sm:h-4" />
            Contact
          </button>
          <button
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === "hours" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("hours")}
          >
            <FaClock size={12} className="sm:w-4 sm:h-4" />
            Operating Hours
          </button>
          <button
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === "facilities" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("facilities")}
          >
            <FaTools size={12} className="sm:w-4 sm:h-4" />
            Facilities
          </button>
          <button
            className={`px-3 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === "stats" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("stats")}
          >
            <FiActivity size={12} className="sm:w-4 sm:h-4" />
            Statistics
          </button>
        </div>

        {/* ==================== TAB CONTENT ==================== */}
        <div className="p-4 sm:p-6">

          {/* ==================== OVERVIEW TAB ==================== */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Bank Information Section */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                    <FaHospital className="text-error text-sm sm:text-base" />
                    Bank Information
                  </h3>
                  {!isEditing || editSection !== "overview" ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditSection("overview");
                      }}
                      className="btn btn-xs sm:btn-sm btn-ghost gap-1"
                    >
                      <FiEdit2 size={12} className="sm:w-4 sm:h-4" />
                      <span className="text-xs">Edit</span>
                    </button>
                  ) : null}
                </div>

                {isEditing && editSection === "overview" ? (
                  // Edit Mode
                  <div className="space-y-3 sm:space-y-4">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-xs sm:text-sm">Bank Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-sm sm:input-md w-full"
                        value={bankInfo.name}
                        onChange={(e) => setBankInfo({ ...bankInfo, name: e.target.value })}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-xs sm:text-sm">Registration Number</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-sm sm:input-md w-full bg-base-300"
                        value={bankInfo.registrationNumber}
                        disabled
                      />
                      <label className="label py-1">
                        <span className="label-text-alt text-[10px] sm:text-xs text-base-content/60">
                          Registration number cannot be changed
                        </span>
                      </label>
                    </div>
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-xs sm:text-sm">Bank Type</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-sm sm:input-md w-full bg-base-300"
                        value={typeInfo.label}
                        disabled
                      />
                      <label className="label py-1">
                        <span className="label-text-alt text-[10px] sm:text-xs text-base-content/60">
                          Bank type cannot be changed
                        </span>
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditSection(null);
                        }}
                        className="btn btn-xs sm:btn-sm btn-ghost w-full sm:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBankInfo}
                        disabled={updateBankMutation.isPending}
                        className="btn btn-xs sm:btn-sm btn-error gap-2 w-full sm:w-auto"
                      >
                        {updateBankMutation.isPending ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <FiSave size={12} className="sm:w-4 sm:h-4" />
                        )}
                        <span className="text-xs">Save Changes</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Bank Name</p>
                      <p className="font-medium text-xs sm:text-sm wrap-break-word">{bankInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Registration Number</p>
                      <p className="font-medium text-xs sm:text-sm wrap-break-word">{bankInfo.registrationNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Bank Type</p>
                      <p className="font-medium text-xs sm:text-sm">{typeInfo.label}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70">Verification Status</p>
                      <p className="font-medium text-xs sm:text-sm flex items-center gap-1">
                        {isVerified ? (
                          <>
                            <FaCheckCircleSolid className="text-success text-xs" />
                            <span className="text-success">Verified</span>
                          </>
                        ) : (
                          <>
                            <FiAlertCircle className="text-warning text-xs" />
                            <span className="text-warning">Pending Verification</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Address Information Section */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                    <FaMapMarkerAlt className="text-error text-sm sm:text-base" />
                    Address
                  </h3>
                  {!isEditing || editSection !== "address" ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditSection("address");
                      }}
                      className="btn btn-xs sm:btn-sm btn-ghost gap-1"
                    >
                      <FiEdit2 size={12} className="sm:w-4 sm:h-4" />
                      <span className="text-xs">Edit</span>
                    </button>
                  ) : null}
                </div>

                {isEditing && editSection === "address" ? (
                  // Edit Mode
                  <div className="space-y-3 sm:space-y-4">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-xs sm:text-sm">Street Address</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-sm sm:input-md w-full"
                        value={addressInfo.street}
                        onChange={(e) => setAddressInfo({ ...addressInfo, street: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-xs sm:text-sm">City</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered input-sm sm:input-md w-full"
                          value={addressInfo.city}
                          onChange={(e) => setAddressInfo({ ...addressInfo, city: e.target.value })}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-xs sm:text-sm">State</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered input-sm sm:input-md w-full"
                          value={addressInfo.state}
                          onChange={(e) => setAddressInfo({ ...addressInfo, state: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-xs sm:text-sm">ZIP Code</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered input-sm sm:input-md w-full"
                          value={addressInfo.zipCode}
                          onChange={(e) => setAddressInfo({ ...addressInfo, zipCode: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-xs sm:text-sm">Coordinates (Longitude, Latitude)</span>
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          className="input input-bordered input-sm sm:input-md flex-1 w-full"
                          value={addressInfo.coordinates[0]}
                          onChange={(e) => handleCoordinatesChange(0, e.target.value)}
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          className="input input-bordered input-sm sm:input-md flex-1 w-full"
                          value={addressInfo.coordinates[1]}
                          onChange={(e) => handleCoordinatesChange(1, e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditSection(null);
                        }}
                        className="btn btn-xs sm:btn-sm btn-ghost w-full sm:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAddressInfo}
                        disabled={updateBankMutation.isPending}
                        className="btn btn-xs sm:btn-sm btn-error gap-2 w-full sm:w-auto"
                      >
                        {updateBankMutation.isPending ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <FiSave size={12} className="sm:w-4 sm:h-4" />
                        )}
                        <span className="text-xs">Save Address</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-1 sm:space-y-2">
                    <p className="font-medium text-xs sm:text-sm wrap-break-word">
                      {addressInfo.street || "No street address provided"}
                    </p>
                    <p className="text-[10px] sm:text-xs text-base-content/70 wrap-break-word">
                      {addressInfo.city && addressInfo.state
                        ? `${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode || ""}`
                        : "No city/state information"}
                    </p>
                    {addressInfo.coordinates[0] !== 0 && addressInfo.coordinates[1] !== 0 && (
                      <p className="text-[10px] text-base-content/50">
                        Coordinates: {addressInfo.coordinates[0]}, {addressInfo.coordinates[1]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== CONTACT TAB ==================== */}
          {activeTab === "contact" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                    <FaPhoneAlt className="text-error text-sm sm:text-base" />
                    Contact Information
                  </h3>
                  {!isEditing || editSection !== "contact" ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditSection("contact");
                      }}
                      className="btn btn-xs sm:btn-sm btn-ghost gap-1"
                    >
                      <FiEdit2 size={12} className="sm:w-4 sm:h-4" />
                      <span className="text-xs">Edit</span>
                    </button>
                  ) : null}
                </div>

                {isEditing && editSection === "contact" ? (
                  // Edit Mode
                  <div className="space-y-3 sm:space-y-4">
                    {/* Phone Numbers */}
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                          <FiPhone size={12} className="text-error" />
                          Phone Numbers
                        </span>
                      </label>
                      <div className="space-y-2">
                        {contactInfo.phone.map((phone, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="tel"
                              placeholder={`Phone number ${index + 1}`}
                              className="input input-bordered input-sm sm:input-md flex-1"
                              value={phone}
                              onChange={(e) => handlePhoneChange(index, e.target.value)}
                            />
                            {contactInfo.phone.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePhoneField(index)}
                                className="btn btn-square btn-ghost btn-sm text-error"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addPhoneField}
                          className="btn btn-xs sm:btn-sm btn-outline btn-error gap-2 mt-2"
                        >
                          + Add Phone
                        </button>
                      </div>
                    </div>

                    {/* Email and Website Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                            <FiMail size={12} className="text-error" />
                            Email
                          </span>
                        </label>
                        <input
                          type="email"
                          placeholder="Email address"
                          className="input input-bordered input-sm sm:input-md w-full"
                          value={contactInfo.email}
                          onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                            <FiGlobe size={12} className="text-error" />
                            Website
                          </span>
                        </label>
                        <input
                          type="url"
                          placeholder="Website URL"
                          className="input input-bordered input-sm sm:input-md w-full"
                          value={contactInfo.website}
                          onChange={(e) => setContactInfo({ ...contactInfo, website: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                          <FaPhoneAlt size={12} className="text-error" />
                          Emergency Contact
                        </span>
                      </label>
                      <input
                        type="tel"
                        placeholder="Emergency phone number"
                        className="input input-bordered input-sm sm:input-md w-full"
                        value={contactInfo.emergency}
                        onChange={(e) => setContactInfo({ ...contactInfo, emergency: e.target.value })}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditSection(null);
                        }}
                        className="btn btn-xs sm:btn-sm btn-ghost w-full sm:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveContactInfo}
                        disabled={updateBankMutation.isPending}
                        className="btn btn-xs sm:btn-sm btn-error gap-2 w-full sm:w-auto"
                      >
                        {updateBankMutation.isPending ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <FiSave size={12} className="sm:w-4 sm:h-4" />
                        )}
                        <span className="text-xs">Save Contact</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-3 sm:space-y-4">
                    {/* Phone Numbers */}
                    <div>
                      <p className="text-[10px] sm:text-xs opacity-70 mb-1">Phone Numbers</p>
                      <div className="space-y-1">
                        {contactInfo.phone.filter(p => p.trim()).map((phone, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm">
                            <FiPhone size={10} className="sm:w-3 sm:h-3 text-error" />
                            <span>{phone}</span>
                            {idx === 0 && <span className="badge badge-xs badge-error">Primary</span>}
                          </div>
                        ))}
                        {!contactInfo.phone.filter(p => p.trim()).length && (
                          <p className="text-[10px] sm:text-xs text-base-content/50">No phone numbers listed</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    {contactInfo.email && (
                      <div>
                        <p className="text-[10px] sm:text-xs opacity-70 mb-1">Email</p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FiMail size={10} className="sm:w-3 sm:h-3 text-error" />
                          <span className="break-all">{contactInfo.email}</span>
                        </div>
                      </div>
                    )}

                    {/* Website */}
                    {contactInfo.website && (
                      <div>
                        <p className="text-[10px] sm:text-xs opacity-70 mb-1">Website</p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FiGlobe size={10} className="sm:w-3 sm:h-3 text-error" />
                          <a
                            href={contactInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-error hover:underline break-all"
                          >
                            {contactInfo.website}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Emergency Contact */}
                    {contactInfo.emergency && (
                      <div>
                        <p className="text-[10px] sm:text-xs opacity-70 mb-1">Emergency Contact</p>
                        <div className="flex items-center gap-2 text-error text-xs sm:text-sm">
                          <FaPhoneAlt size={10} className="sm:w-3 sm:h-3" />
                          <span>{contactInfo.emergency}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== OPERATING HOURS TAB ==================== */}
          {activeTab === "hours" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                    <FaClock className="text-error text-sm sm:text-base" />
                    Operating Hours
                  </h3>
                  {!isEditing || editSection !== "hours" ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditSection("hours");
                      }}
                      className="btn btn-xs sm:btn-sm btn-ghost gap-1"
                    >
                      <FiEdit2 size={12} className="sm:w-4 sm:h-4" />
                      <span className="text-xs">Edit</span>
                    </button>
                  ) : null}
                </div>

                {isEditing && editSection === "hours" ? (
                  // Edit Mode
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {daysOfWeek.map((day) => (
                        <div key={day} className="border border-base-300 rounded-lg p-3">
                          <label className="label py-1">
                            <span className="label-text text-xs sm:text-sm font-semibold capitalize">{dayDisplayNames[day]}</span>
                          </label>
                          <div className="flex flex-col xs:flex-row gap-2">
                            <input
                              type="time"
                              className="input input-bordered input-xs sm:input-sm flex-1"
                              value={operatingHours[day]?.open || ""}
                              onChange={(e) => handleHoursChange(day, "open", e.target.value)}
                            />
                            <span className="self-center text-xs hidden xs:inline">-</span>
                            <input
                              type="time"
                              className="input input-bordered input-xs sm:input-sm flex-1"
                              value={operatingHours[day]?.close || ""}
                              onChange={(e) => handleHoursChange(day, "close", e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditSection(null);
                        }}
                        className="btn btn-xs sm:btn-sm btn-ghost w-full sm:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveOperatingHours}
                        disabled={updateBankMutation.isPending}
                        className="btn btn-xs sm:btn-sm btn-error gap-2 w-full sm:w-auto"
                      >
                        {updateBankMutation.isPending ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <FiSave size={12} className="sm:w-4 sm:h-4" />
                        )}
                        <span className="text-xs">Save Hours</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    {daysOfWeek.map((day) => {
                      const hours = operatingHours[day];
                      const isOpen = hours?.open && hours?.close;
                      return (
                        <div key={day} className="flex justify-between items-center p-2 bg-base-300 rounded text-xs sm:text-sm">
                          <span className="capitalize font-medium">{dayDisplayNames[day]}</span>
                          <span className={isOpen ? "" : "text-base-content/50"}>
                            {isOpen ? `${hours.open} - ${hours.close}` : "Closed"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== FACILITIES TAB ==================== */}
          {activeTab === "facilities" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                    <FaTools className="text-error text-sm sm:text-base" />
                    Facilities & Services
                  </h3>
                  {!isEditing || editSection !== "facilities" ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditSection("facilities");
                      }}
                      className="btn btn-xs sm:btn-sm btn-ghost gap-1"
                    >
                      <FiEdit2 size={12} className="sm:w-4 sm:h-4" />
                      <span className="text-xs">Edit</span>
                    </button>
                  ) : null}
                </div>

                {isEditing && editSection === "facilities" ? (
                  // Edit Mode
                  <div className="space-y-3 sm:space-y-4">
                    {/* Existing Facilities */}
                    <div className="space-y-2">
                      {facilities.map((facility, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            className="input input-bordered input-sm sm:input-md flex-1"
                            value={facility}
                            onChange={(e) => {
                              const newFacilities = [...facilities];
                              newFacilities[index] = e.target.value;
                              setFacilities(newFacilities);
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
                    </div>

                    {/* Add New Facility */}
                    <div className="flex flex-col xs:flex-row gap-2">
                      <input
                        type="text"
                        className="input input-bordered input-sm sm:input-md flex-1"
                        placeholder="Add new facility (e.g., 24/7 Emergency, Blood Testing)"
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

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditSection(null);
                        }}
                        className="btn btn-xs sm:btn-sm btn-ghost w-full sm:w-auto"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveFacilities}
                        disabled={updateBankMutation.isPending}
                        className="btn btn-xs sm:btn-sm btn-error gap-2 w-full sm:w-auto"
                      >
                        {updateBankMutation.isPending ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <FiSave size={12} className="sm:w-4 sm:h-4" />
                        )}
                        <span className="text-xs">Save Facilities</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {facilities.length > 0 ? (
                      facilities.map((facility, index) => (
                        <span key={index} className="badge badge-outline badge-xs sm:badge-sm p-2 sm:p-3">
                          {facility}
                        </span>
                      ))
                    ) : (
                      <p className="text-[10px] sm:text-xs text-base-content/50">No facilities listed</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== STATISTICS TAB ==================== */}
          {activeTab === "stats" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Inventory Status */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                  <FaTint className="text-error text-sm sm:text-base" />
                  Blood Inventory Status
                </h3>
                <div className="overflow-x-auto">
                  <table className="table table-xs sm:table-sm w-full">
                    <thead>
                      <tr className="bg-base-300">
                        <th className="text-[10px] sm:text-xs">Blood Type</th>
                        <th className="text-[10px] sm:text-xs">Units</th>
                        <th className="text-[10px] sm:text-xs">Threshold</th>
                        <th className="text-[10px] sm:text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData?.inventory?.map((item) => (
                        <tr key={item.bloodType}>
                          <td className="font-semibold text-xs sm:text-sm">{item.bloodType}</td>
                          <td className="text-xs sm:text-sm">{item.units}</td>
                          <td className="text-xs sm:text-sm">{item.threshold}</td>
                          <td>
                            <span className={`badge badge-xs sm:badge-sm ${item.status === "LOW" ? "badge-error" :
                              item.status === "ADEQUATE" ? "badge-warning" :
                                "badge-success"
                              }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bank Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Performance Stats */}
                <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                    <FiActivity className="text-error text-sm sm:text-base" />
                    Performance Stats
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="opacity-70">Total Donations</span>
                      <span className="font-semibold">{statsData?.stats?.totalDonations || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="opacity-70">Total Requests</span>
                      <span className="font-semibold">{statsData?.stats?.totalRequests || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="opacity-70">Avg Response Time</span>
                      <span className="font-semibold">{statsData?.stats?.avgResponseTime || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="opacity-70">Rating</span>
                      <span className="font-semibold flex items-center gap-1">
                        {statsData?.stats?.rating || 0}/5
                      </span>
                    </div>
                  </div>
                </div>

                {/* Donor Statistics */}
                <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                    <FaUsers className="text-error text-sm sm:text-base" />
                    Donor Statistics
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="opacity-70">Registered Donors</span>
                      <span className="font-semibold">{statsData?.donors?.total || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="opacity-70">Pending Requests</span>
                      <span className="font-semibold text-warning">{statsData?.requests?.pending || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="opacity-70">Fulfilled Requests</span>
                      <span className="font-semibold text-success">{statsData?.requests?.fulfilled || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Donations */}
              {statsData?.recentDonations?.length > 0 && (
                <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                    <FiClock className="text-error text-sm sm:text-base" />
                    Recent Donations
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {statsData.recentDonations.slice(0, 5).map((donation, index) => (
                      <div key={index} className="flex flex-col xs:flex-row xs:justify-between xs:items-center p-2 bg-base-300 rounded gap-2">
                        <div>
                          <p className="font-medium text-xs sm:text-sm">{donation.donorName || "Anonymous Donor"}</p>
                          <p className="text-[10px] sm:text-xs opacity-70">
                            {donation.type} • {donation.volume}ml
                          </p>
                        </div>
                        <div className="text-left xs:text-right">
                          <p className="text-xs sm:text-sm">{formatDate(donation.date)}</p>
                          <p className="text-[10px] sm:text-xs opacity-70">{donation.donorBloodGroup}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ==================== VERIFICATION STATUS CARD ==================== */}
      {!isVerified && (
        <motion.div
          variants={fadeInUp}
          className="bg-warning/10 border border-warning/30 rounded-lg p-3 sm:p-4"
        >
          <div className="flex flex-col xs:flex-row items-start gap-3">
            <FaExclamationTriangle className="text-warning text-lg sm:text-xl shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-warning text-xs sm:text-sm mb-1">Verification Pending</p>
              <p className="text-[10px] sm:text-xs text-base-content/70">
                Your blood bank is not yet verified. Verification helps build trust with donors and hospitals.
                Please ensure all your information is accurate and complete.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ==================== FOOTER NOTE ==================== */}
      <motion.div
        variants={fadeInUp}
        className="text-[10px] sm:text-xs text-center text-base-content/60 flex items-center justify-center gap-2"
      >
        <FaShieldAlt className="inline text-xs" />
        All information is securely stored and only shared with authorized personnel.
      </motion.div>
    </motion.div>
  );
};

export default BankProfile;