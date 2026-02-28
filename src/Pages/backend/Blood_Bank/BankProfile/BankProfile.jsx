// Pages/backend/BloodBank/BankProfile/BankProfile.jsx

// React
import React, { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

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

// Format date for display
const formatDate = (value) => {
  if (!value) return "N/A";
  try {
    const date = new Date(value?.$date || value);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

// Bank type configuration
const bankTypeConfig = {
  government: {
    icon: FaBuilding,
    color: "primary",
    label: "Government",
    bgColor: "from-primary to-primary/80",
  },
  private: {
    icon: FaBuilding,
    color: "secondary",
    label: "Private",
    bgColor: "from-secondary to-secondary/80",
  },
  ngo: {
    icon: FaHeartbeat,
    color: "success",
    label: "NGO",
    bgColor: "from-success to-success/80",
  },
  hospital: {
    icon: FaHospital,
    color: "info",
    label: "Hospital-Based",
    bgColor: "from-info to-info/80",
  },
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

const BankProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");
  const isAdminUser = user?.role === "admin" || user?.role === "super_admin";
  const isBloodBankUser = user?.role === "blood_bank";

  const userId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  const {
    data: myBankData,
    isLoading: myBankLoading,
    isError: myBankError,
  } = useQuery({
    queryKey: ["my-blood-bank", userId, user?.role],
    enabled: !authLoading && isBloodBankUser && !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks/staff/me", {
        headers: authHeaders,
      });
      return res.data?.data || null;
    },
    retry: false,
  });

  // Resolve blood bank ID.
  // For blood bank staff, never fall back to userId (it causes invalid /blood-banks/:id calls).
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

  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editSection, setEditSection] = useState(null);

  // Form states
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

  // Auth headers for API requests
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch blood bank details
  const {
    data: bankData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["blood-bank-profile", bankId],
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
  });

  // Fetch bank statistics
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["blood-bank-stats", bankId],
    enabled: !authLoading && !!bankData?._id,
    queryFn: async () => {
      if (!bankId) return null;

      const res = await axiosInstance.get(`/blood-banks/${bankId}/stats`, {
        headers: authHeaders,
      });

      return res.data?.data;
    },
  });

  // Update bank info mutation
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
      refetch();
      setIsEditing(false);
      setEditSection(null);
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Failed to update information.",
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

  // Handle phone array changes
  const handlePhoneChange = (index, value) => {
    const newPhones = [...contactInfo.phone];
    newPhones[index] = value;
    setContactInfo({ ...contactInfo, phone: newPhones });
  };

  const addPhoneField = () => {
    setContactInfo({
      ...contactInfo,
      phone: [...contactInfo.phone, ""],
    });
  };

  const removePhoneField = (index) => {
    if (contactInfo.phone.length > 1) {
      const newPhones = contactInfo.phone.filter((_, i) => i !== index);
      setContactInfo({ ...contactInfo, phone: newPhones });
    }
  };

  // Handle facilities changes
  const addFacility = () => {
    if (newFacility.trim()) {
      setFacilities([...facilities, newFacility.trim()]);
      setNewFacility("");
    }
  };

  const removeFacility = (index) => {
    setFacilities(facilities.filter((_, i) => i !== index));
  };

  // Handle coordinates change
  const handleCoordinatesChange = (index, value) => {
    const newCoords = [...addressInfo.coordinates];
    newCoords[index] = parseFloat(value) || 0;
    setAddressInfo({ ...addressInfo, coordinates: newCoords });
  };

  // Handle operating hours change
  const handleHoursChange = (day, period, value) => {
    setOperatingHours({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        [period]: value,
      },
    });
  };

  // Save handlers for different sections
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

  // Loading state
  if (isLoading || authLoading || statsLoading || myBankLoading) return <BloodLoader />;

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

  // No profile state
  if (showCreateProfileState) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="card bg-base-100 shadow-xl w-full max-w-lg border border-error/20"
        >
          <div className="card-body items-center text-center space-y-4">
            <div className="bg-error/10 text-error rounded-full w-20 h-20 flex items-center justify-center">
              <FaHospital size={34} />
            </div>
            <h2 className="card-title text-2xl text-error">Blood Bank Profile Not Found</h2>
            <p className="text-base-content/70">
              You do not have a blood bank profile yet. Create a Blood Bank profile to manage inventory, staff, and requests.
            </p>

            {isAdminUser ? (
              <Link to={createProfileLink} className="btn btn-error text-white">
                Create New Profile
              </Link>
            ) : (
              <p className="text-sm text-base-content/70">
                Please contact an admin to create your Blood Bank profile and assign your account.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  // Get bank type info
  const typeInfo = bankTypeConfig[bankInfo.type] || {
    icon: FaHospital,
    color: "primary",
    label: bankInfo.type || "Blood Bank",
    bgColor: "from-primary to-primary/80",
  };
  const TypeIcon = typeInfo.icon;

  // Verification status
  const isVerified = bankData?.verification?.isVerified || false;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaHospital className="text-error" />
            Blood Bank Profile
          </h2>
          <p className="text-sm text-base-content/70 mt-1">
            Manage your blood bank information, operating hours, and contact details.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              refetch();
              refetchStats();
            }}
            className="btn btn-sm btn-outline gap-2"
          >
            <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <div className={`badge badge-lg ${isVerified ? 'badge-success' : 'badge-warning'} gap-2 p-3`}>
            {isVerified ? (
              <>
                <FaCheckCircleSolid />
                Verified Bank
              </>
            ) : (
              <>
                <FiAlertCircle />
                Pending Verification
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Bank Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`bg-linear-to-r ${typeInfo.bgColor} rounded-lg p-6 text-white`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="bg-white/20 p-4 rounded-full">
            <TypeIcon size={48} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{bankInfo.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <TypeIcon size={14} />
                {typeInfo.label}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                Reg: {bankInfo.registrationNumber}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <FiCalendar size={14} />
                Member since {formatDate(bankData?.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-error">
            <FaTint size={24} />
          </div>
          <div className="stat-title">Total Inventory</div>
          <div className="stat-value text-2xl">{statsData?.totalInventory || 0}</div>
          <div className="stat-desc">Blood units available</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-warning">
            <FiClock size={24} />
          </div>
          <div className="stat-title">Pending Requests</div>
          <div className="stat-value text-2xl">{statsData?.requests?.pending || 0}</div>
          <div className="stat-desc">Awaiting fulfillment</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-success">
            <FaCheckCircleSolid size={24} />
          </div>
          <div className="stat-title">Fulfilled</div>
          <div className="stat-value text-2xl">{statsData?.requests?.fulfilled || 0}</div>
          <div className="stat-desc">Completed requests</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-info">
            <FiUsers size={24} />
          </div>
          <div className="stat-title">Registered Donors</div>
          <div className="stat-value text-2xl">{statsData?.donors?.total || 0}</div>
          <div className="stat-desc">Preferred this bank</div>
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
      >
        {/* Tab Headers */}
        <div className="flex overflow-x-auto border-b border-base-300">
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === "overview" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("overview")}
          >
            <FaHospital size={16} />
            Overview
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === "contact" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("contact")}
          >
            <FaPhoneAlt size={16} />
            Contact
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === "hours" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("hours")}
          >
            <FaClock size={16} />
            Operating Hours
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === "facilities" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("facilities")}
          >
            <FaTools size={16} />
            Facilities
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === "stats" ? "bg-error/10 text-error border-b-2 border-error" : "hover:bg-base-200"
              }`}
            onClick={() => setActiveTab("stats")}
          >
            <FiActivity size={16} />
            Statistics
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Bank Information */}
              <div className="bg-base-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FaHospital className="text-error" />
                    Bank Information
                  </h3>
                  {!isEditing || editSection !== "overview" ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditSection("overview");
                      }}
                      className="btn btn-xs btn-ghost gap-1"
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </button>
                  ) : null}
                </div>

                {isEditing && editSection === "overview" ? (
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Bank Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={bankInfo.name}
                        onChange={(e) => setBankInfo({ ...bankInfo, name: e.target.value })}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Registration Number</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full bg-base-300"
                        value={bankInfo.registrationNumber}
                        disabled
                      />
                      <label className="label">
                        <span className="label-text-alt text-base-content/60">
                          Registration number cannot be changed
                        </span>
                      </label>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Bank Type</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full bg-base-300"
                        value={typeInfo.label}
                        disabled
                      />
                      <label className="label">
                        <span className="label-text-alt text-base-content/60">
                          Bank type cannot be changed
                        </span>
                      </label>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditSection(null);
                        }}
                        className="btn btn-sm btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBankInfo}
                        disabled={updateBankMutation.isPending}
                        className="btn btn-sm btn-error gap-2"
                      >
                        {updateBankMutation.isPending ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <FiSave size={14} />
                        )}
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm opacity-70">Bank Name</p>
                      <p className="font-medium">{bankInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-70">Registration Number</p>
                      <p className="font-medium">{bankInfo.registrationNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-70">Bank Type</p>
                      <p className="font-medium">{typeInfo.label}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-70">Verification Status</p>
                      <p className="font-medium flex items-center gap-1">
                        {isVerified ? (
                          <>
                            <FaCheckCircleSolid className="text-success" />
                            <span className="text-success">Verified</span>
                          </>
                        ) : (
                          <>
                            <FiAlertCircle className="text-warning" />
                            <span className="text-warning">Pending Verification</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Address Information */}
              <div className="bg-base-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FaMapMarkerAlt className="text-error" />
                    Address
                  </h3>
                  {!isEditing || editSection !== "address" ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditSection("address");
                      }}
                      className="btn btn-xs btn-ghost gap-1"
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </button>
                  ) : null}
                </div>

                {isEditing && editSection === "address" ? (
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Street Address</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={addressInfo.street}
                        onChange={(e) => setAddressInfo({ ...addressInfo, street: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">City</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={addressInfo.city}
                          onChange={(e) => setAddressInfo({ ...addressInfo, city: e.target.value })}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">State</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={addressInfo.state}
                          onChange={(e) => setAddressInfo({ ...addressInfo, state: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">ZIP Code</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={addressInfo.zipCode}
                          onChange={(e) => setAddressInfo({ ...addressInfo, zipCode: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Coordinates (Longitude, Latitude)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="Longitude"
                          className="input input-bordered flex-1"
                          value={addressInfo.coordinates[0]}
                          onChange={(e) => handleCoordinatesChange(0, e.target.value)}
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Latitude"
                          className="input input-bordered flex-1"
                          value={addressInfo.coordinates[1]}
                          onChange={(e) => handleCoordinatesChange(1, e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditSection(null);
                        }}
                        className="btn btn-sm btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAddressInfo}
                        disabled={updateBankMutation.isPending}
                        className="btn btn-sm btn-error gap-2"
                      >
                        {updateBankMutation.isPending ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <FiSave size={14} />
                        )}
                        Save Address
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium">{addressInfo.street || "No street address provided"}</p>
                    <p className="text-base-content/70">
                      {addressInfo.city && addressInfo.state
                        ? `${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode || ""}`
                        : "No city/state information"}
                    </p>
                    {addressInfo.coordinates[0] !== 0 && addressInfo.coordinates[1] !== 0 && (
                      <p className="text-xs text-base-content/50">
                        Coordinates: {addressInfo.coordinates[0]}, {addressInfo.coordinates[1]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-base-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FaPhoneAlt className="text-error" />
                    Contact Information
                  </h3>
                  {!isEditing || editSection !== "contact" ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditSection("contact");
                      }}
                      className="btn btn-xs btn-ghost gap-1"
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </button>
                  ) : null}
                </div>

                {isEditing && editSection === "contact" ? (
                  <div className="space-y-4">
                    {/* Phone Numbers */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text flex items-center gap-2">
                          <FiPhone size={14} className="text-error" />
                          Phone Numbers
                        </span>
                      </label>
                      <div className="space-y-2">
                        {contactInfo.phone.map((phone, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="tel"
                              placeholder={`Phone number ${index + 1}`}
                              className="input input-bordered flex-1"
                              value={phone}
                              onChange={(e) => handlePhoneChange(index, e.target.value)}
                            />
                            {contactInfo.phone.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePhoneField(index)}
                                className="btn btn-square btn-ghost text-error"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addPhoneField}
                          className="btn btn-sm btn-outline btn-error gap-2 mt-2"
                        >
                          + Add Phone
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text flex items-center gap-2">
                            <FiMail size={14} className="text-error" />
                            Email
                          </span>
                        </label>
                        <input
                          type="email"
                          placeholder="Email address"
                          className="input input-bordered w-full"
                          value={contactInfo.email}
                          onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text flex items-center gap-2">
                            <FiGlobe size={14} className="text-error" />
                            Website
                          </span>
                        </label>
                        <input
                          type="url"
                          placeholder="Website URL"
                          className="input input-bordered w-full"
                          value={contactInfo.website}
                          onChange={(e) => setContactInfo({ ...contactInfo, website: e.target.value })}
                        />
                      </div>

                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text flex items-center gap-2">
                            <FaPhoneAlt size={14} className="text-error" />
                            Emergency Contact
                          </span>
                        </label>
                        <input
                          type="tel"
                          placeholder="Emergency phone number"
                          className="input input-bordered w-full"
                          value={contactInfo.emergency}
                          onChange={(e) => setContactInfo({ ...contactInfo, emergency: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditSection(null);
                        }}
                        className="btn btn-sm btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveContactInfo}
                        disabled={updateBankMutation.isPending}
                        className="btn btn-sm btn-error gap-2"
                      >
                        {updateBankMutation.isPending ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <FiSave size={14} />
                        )}
                        Save Contact
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm opacity-70 mb-1">Phone Numbers</p>
                      <div className="space-y-1">
                        {contactInfo.phone.filter(p => p.trim()).map((phone, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <FiPhone size={14} className="text-error" />
                            <span>{phone}</span>
                            {idx === 0 && <span className="badge badge-xs badge-error">Primary</span>}
                          </div>
                        ))}
                        {!contactInfo.phone.filter(p => p.trim()).length && (
                          <p className="text-base-content/50">No phone numbers listed</p>
                        )}
                      </div>
                    </div>

                    {contactInfo.email && (
                      <div>
                        <p className="text-sm opacity-70 mb-1">Email</p>
                        <div className="flex items-center gap-2">
                          <FiMail size={14} className="text-error" />
                          <span>{contactInfo.email}</span>
                        </div>
                      </div>
                    )}

                    {contactInfo.website && (
                      <div>
                        <p className="text-sm opacity-70 mb-1">Website</p>
                        <div className="flex items-center gap-2">
                          <FiGlobe size={14} className="text-error" />
                          <a href={contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-error hover:underline">
                            {contactInfo.website}
                          </a>
                        </div>
                      </div>
                    )}

                    {contactInfo.emergency && (
                      <div>
                        <p className="text-sm opacity-70 mb-1">Emergency Contact</p>
                        <div className="flex items-center gap-2 text-error">
                          <FaPhoneAlt size={14} />
                          <span>{contactInfo.emergency}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Operating Hours Tab */}
          {activeTab === "hours" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-base-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FaClock className="text-error" />
                    Operating Hours
                  </h3>
                  {!isEditing || editSection !== "hours" ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditSection("hours");
                      }}
                      className="btn btn-xs btn-ghost gap-1"
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </button>
                  ) : null}
                </div>

                {isEditing && editSection === "hours" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {daysOfWeek.map((day) => (
                        <div key={day} className="border border-base-300 rounded-lg p-3">
                          <label className="label">
                            <span className="label-text font-semibold capitalize">{dayDisplayNames[day]}</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="time"
                              className="input input-bordered input-sm flex-1"
                              value={operatingHours[day]?.open || ""}
                              onChange={(e) => handleHoursChange(day, "open", e.target.value)}
                            />
                            <span className="self-center">-</span>
                            <input
                              type="time"
                              className="input input-bordered input-sm flex-1"
                              value={operatingHours[day]?.close || ""}
                              onChange={(e) => handleHoursChange(day, "close", e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditSection(null);
                        }}
                        className="btn btn-sm btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveOperatingHours}
                        disabled={updateBankMutation.isPending}
                        className="btn btn-sm btn-error gap-2"
                      >
                        {updateBankMutation.isPending ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <FiSave size={14} />
                        )}
                        Save Hours
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {daysOfWeek.map((day) => {
                      const hours = operatingHours[day];
                      const isOpen = hours?.open && hours?.close;
                      return (
                        <div key={day} className="flex justify-between items-center p-2 bg-base-300 rounded">
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

          {/* Facilities Tab */}
          {activeTab === "facilities" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-base-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FaTools className="text-error" />
                    Facilities & Services
                  </h3>
                  {!isEditing || editSection !== "facilities" ? (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditSection("facilities");
                      }}
                      className="btn btn-xs btn-ghost gap-1"
                    >
                      <FiEdit2 size={14} />
                      Edit
                    </button>
                  ) : null}
                </div>

                {isEditing && editSection === "facilities" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {facilities.map((facility, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            className="input input-bordered flex-1"
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
                            className="btn btn-square btn-ghost text-error"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered flex-1"
                        placeholder="Add new facility"
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

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditSection(null);
                        }}
                        className="btn btn-sm btn-ghost"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveFacilities}
                        disabled={updateBankMutation.isPending}
                        className="btn btn-sm btn-error gap-2"
                      >
                        {updateBankMutation.isPending ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <FiSave size={14} />
                        )}
                        Save Facilities
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {facilities.length > 0 ? (
                      facilities.map((facility, index) => (
                        <span key={index} className="badge badge-outline badge-lg p-3">
                          {facility}
                        </span>
                      ))
                    ) : (
                      <p className="text-base-content/50">No facilities listed</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Statistics Tab */}
          {activeTab === "stats" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Inventory Status */}
              <div className="bg-base-200 rounded-lg p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <FaTint className="text-error" />
                  Blood Inventory Status
                </h3>
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr className="bg-base-300">
                        <th>Blood Type</th>
                        <th>Units</th>
                        <th>Threshold</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData?.inventory?.map((item) => (
                        <tr key={item.bloodType}>
                          <td className="font-semibold">{item.bloodType}</td>
                          <td>{item.units}</td>
                          <td>{item.threshold}</td>
                          <td>
                            <span className={`badge badge-sm ${item.status === "LOW" ? "badge-error" :
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

              {/* Bank Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-base-200 rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <FiActivity className="text-error" />
                    Performance Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="opacity-70">Total Donations</span>
                      <span className="font-semibold">{statsData?.stats?.totalDonations || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Total Requests</span>
                      <span className="font-semibold">{statsData?.stats?.totalRequests || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Average Response Time</span>
                      <span className="font-semibold">{statsData?.stats?.avgResponseTime || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Rating</span>
                      <span className="font-semibold flex items-center gap-1">
                        {statsData?.stats?.rating || 0}/5
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-base-200 rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <FaUsers className="text-error" />
                    Donor Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="opacity-70">Registered Donors</span>
                      <span className="font-semibold">{statsData?.donors?.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Pending Requests</span>
                      <span className="font-semibold text-warning">{statsData?.requests?.pending || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Fulfilled Requests</span>
                      <span className="font-semibold text-success">{statsData?.requests?.fulfilled || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Donations */}
              {statsData?.recentDonations?.length > 0 && (
                <div className="bg-base-200 rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <FiClock className="text-error" />
                    Recent Donations
                  </h3>
                  <div className="space-y-3">
                    {statsData.recentDonations.slice(0, 5).map((donation, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-base-300 rounded">
                        <div>
                          <p className="font-medium">{donation.donorName || "Anonymous Donor"}</p>
                          <p className="text-xs opacity-70">
                            {donation.type} • {donation.volume}ml
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{formatDate(donation.date)}</p>
                          <p className="text-xs opacity-70">{donation.donorBloodGroup}</p>
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

      {/* Verification Status Card */}
      {!isVerified && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-warning/10 border border-warning/30 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-warning text-xl shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-warning mb-1">Verification Pending</p>
              <p className="text-sm text-base-content/70">
                Your blood bank is not yet verified. Verification helps build trust with donors and hospitals.
                Please ensure all your information is accurate and complete.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer Note */}
      <div className="text-xs text-center text-base-content/60 flex items-center justify-center gap-2">
        <FaShieldAlt className="inline" />
        All information is securely stored and only shared with authorized personnel.
      </div>
    </div>
  );
};

export default BankProfile;
