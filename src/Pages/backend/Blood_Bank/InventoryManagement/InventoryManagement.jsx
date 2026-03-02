// Pages/backend/BloodBank/InventoryManagement/InventoryManagement.jsx

// React
import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons - Fi (Feather Icons)
import {
  FiSave,
  FiRefreshCw,
  FiAlertCircle,
  FiClock,
  FiEdit2,
  FiActivity,
  FiPackage,
  FiDownload,
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaTint,
  FaExclamationTriangle,
  FaCheckCircle as FaCheckCircleSolid,
  FaFlask,
  FaHeartbeat,
  FaSyringe,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";
import {
  formatAppDateTime,
  formatAppTime,
  formatDateInputValue,
} from "../../../../utils/dateFormat";

// ==================== CONSTANTS ====================

// Format date for display
const formatDateTime = (value) => {
  return formatAppDateTime(value);
};

// Format time only
const formatTimeOnly = (value) => {
  return formatAppTime(value);
};

// Blood types
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Component types
const componentTypes = [
  { id: "wholeBlood", label: "Whole Blood", icon: FaTint },
  { id: "plasma", label: "Plasma", icon: FaFlask },
  { id: "platelets", label: "Platelets", icon: FaHeartbeat },
  { id: "cryoprecipitate", label: "Cryo", icon: FaSyringe },
];

// Default inventory structure for new banks
const defaultInventory = bloodTypes.map((bloodType) => ({
  bloodType,
  units: 0,
  threshold: 10,
  lastUpdated: new Date(),
  components: {
    wholeBlood: 0,
    plasma: 0,
    platelets: 0,
    cryoprecipitate: 0,
  },
}));

// Status configuration for inventory levels
const statusConfig = {
  CRITICAL: {
    label: "Critical",
    color: "error",
    icon: FaExclamationTriangle,
    bgColor: "bg-error/10",
    textColor: "text-error",
    borderColor: "border-error/20",
  },
  LOW: {
    label: "Low",
    color: "warning",
    icon: FiAlertCircle,
    bgColor: "bg-warning/10",
    textColor: "text-warning",
    borderColor: "border-warning/20",
  },
  ADEQUATE: {
    label: "Adequate",
    color: "info",
    icon: FiActivity,
    bgColor: "bg-info/10",
    textColor: "text-info",
    borderColor: "border-info/20",
  },
  GOOD: {
    label: "Good",
    color: "success",
    icon: FaCheckCircleSolid,
    bgColor: "bg-success/10",
    textColor: "text-success",
    borderColor: "border-success/20",
  },
};

// Calculate inventory status based on units and threshold
const calculateInventoryStatus = (units, threshold) => {
  if (units <= threshold) return "CRITICAL";
  if (units <= threshold * 2) return "LOW";
  if (units <= threshold * 3) return "ADEQUATE";
  return "GOOD";
};

// ==================== QUERY KEYS ====================

const queryKeys = {
  myBloodBank: (userId) => ['my-blood-bank-inventory', userId],
  bloodBankInventory: (bankId) => ['blood-bank-inventory', bankId],
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

const InventoryManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");
  const isBloodBankUser = user?.role === "blood_bank";

  // Get user ID from auth
  const userId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  // Auth headers for API requests
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  // ==================== QUERIES ====================

  /**
   * Query 1: Fetch blood bank data for current staff user
   * Only runs for blood bank staff users
   */
  const {
    data: myBankData,
    isLoading: myBankLoading,
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

  const [draftInventory, setDraftInventory] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Form states for editing
  const [editForm, setEditForm] = useState({
    bloodType: "",
    units: 0,
    threshold: 10,
    components: {
      wholeBlood: 0,
      plasma: 0,
      platelets: 0,
      cryoprecipitate: 0,
    },
  });

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query 2: Fetch blood bank inventory details
   * Main query for inventory data
   */
  const {
    data: bankData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.bloodBankInventory(bankId),
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
    staleTime: 2 * 60 * 1000, // 2 minutes - inventory changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // ==================== MUTATIONS ====================

  /**
   * Mutation: Update inventory (single or bulk)
   */
  const updateInventoryMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axiosInstance.patch(
        `/blood-banks/${bankId}/inventory`,
        payload,
        { headers: authHeaders }
      );
      return response.data;
    },
    onSuccess: async () => {
      await Swal.fire({
        title: "Inventory Updated",
        text: "Blood inventory has been updated successfully.",
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
      queryClient.invalidateQueries({ queryKey: queryKeys.bloodBankInventory(bankId) });

      setEditingType(null);
      setBulkEditMode(false);
      setDraftInventory(null);
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Failed to update inventory.",
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

  // ==================== COMPUTED VALUES ====================

  /**
   * Base inventory from API or default
   */
  const baseInventory = useMemo(
    () => (bankData?.inventory?.length ? bankData.inventory : defaultInventory),
    [bankData],
  );

  /**
   * Current inventory (draft or base)
   */
  const inventory = draftInventory ?? baseInventory;

  /**
   * Process inventory with status calculations
   */
  const processedInventory = useMemo(() => {
    return inventory.map(item => ({
      ...item,
      status: calculateInventoryStatus(item.units || 0, item.threshold || 10),
      statusConfig: statusConfig[calculateInventoryStatus(item.units || 0, item.threshold || 10)],
    }));
  }, [inventory]);

  /**
   * Filter inventory by status and search term
   */
  const filteredInventory = useMemo(() => {
    let filtered = processedInventory;

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.bloodType.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [processedInventory, filterStatus, searchTerm]);

  /**
   * Calculate inventory statistics
   */
  const inventoryStats = useMemo(() => {
    const totalUnits = inventory.reduce((sum, item) => sum + (item.units || 0), 0);
    const criticalCount = processedInventory.filter(i => i.status === "CRITICAL").length;
    const lowCount = processedInventory.filter(i => i.status === "LOW").length;
    const adequateCount = processedInventory.filter(i => i.status === "ADEQUATE").length;
    const goodCount = processedInventory.filter(i => i.status === "GOOD").length;
    const activeTypes = inventory.filter(i => i.units > 0).length;

    return {
      totalUnits,
      criticalCount,
      lowCount,
      adequateCount,
      goodCount,
      activeTypes,
      totalTypes: bloodTypes.length,
    };
  }, [inventory, processedInventory]);

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle edit single blood type
   */
  const handleEdit = (bloodType) => {
    const item = inventory.find(i => i.bloodType === bloodType);
    if (item) {
      setEditForm({
        bloodType: item.bloodType,
        units: item.units || 0,
        threshold: item.threshold || 10,
        components: {
          wholeBlood: item.components?.wholeBlood || 0,
          plasma: item.components?.plasma || 0,
          platelets: item.components?.platelets || 0,
          cryoprecipitate: item.components?.cryoprecipitate || 0,
        },
      });
      setEditingType(bloodType);
    }
  };

  /**
   * Handle save single update
   */
  const handleSaveSingle = async () => {
    await updateInventoryMutation.mutateAsync({
      bloodType: editForm.bloodType,
      units: parseInt(editForm.units, 10) || 0,
      threshold: parseInt(editForm.threshold, 10) || 0,
      components: editForm.components,
    });
  };

  /**
   * Handle bulk update
   */
  const handleBulkUpdate = async () => {
    const updates = inventory.map(item => ({
      bloodType: item.bloodType,
      units: item.units,
      threshold: item.threshold,
      components: item.components,
    }));

    await updateInventoryMutation.mutateAsync({ updates });
  };

  /**
   * Handle reset to thresholds (set all to 2x threshold)
   */
  const handleResetToThreshold = () => {
    setDraftInventory((prev) => {
      const source = prev ?? baseInventory;
      return source.map((item) => ({
        ...item,
        units: Math.max(item.threshold * 2, item.units),
      }));
    });
  };

  /**
   * Handle set all to zero with confirmation
   */
  const handleSetAllZero = () => {
    Swal.fire({
      title: "Reset All Inventory?",
      text: "This will set all blood units to zero. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, reset all",
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
    }).then((result) => {
      if (result.isConfirmed) {
        setDraftInventory((prev) => {
          const source = prev ?? baseInventory;
          return source.map((item) => ({
            ...item,
            units: 0,
            components: {
              wholeBlood: 0,
              plasma: 0,
              platelets: 0,
              cryoprecipitate: 0,
            },
          }));
        });
      }
    });
  };

  /**
   * Handle input change for edit form
   */
  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: field === "units" || field === "threshold" ? (parseInt(value, 10) || 0) : value,
    }));
  };

  /**
   * Handle component change in edit form
   */
  const handleComponentChange = (component, value) => {
    setEditForm(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [component]: parseInt(value, 10) || 0,
      },
    }));
  };

  /**
   * Handle inventory change in bulk mode
   */
  const handleBulkChange = (bloodType, field, value) => {
    setDraftInventory((prev) => {
      const source = prev ?? baseInventory;
      return source.map((item) => {
        if (item.bloodType === bloodType) {
          if (field === 'units' || field === 'threshold') {
            return { ...item, [field]: parseInt(value, 10) || 0 };
          } else {
            // Handle component fields
            return {
              ...item,
              components: {
                ...item.components,
                [field]: parseInt(value, 10) || 0,
              },
            };
          }
        }
        return item;
      });
    });
  };

  /**
   * Handle export inventory to CSV
   */
  const handleExport = () => {
    const exportData = processedInventory.map(item => ({
      BloodType: item.bloodType,
      Units: item.units,
      Threshold: item.threshold,
      Status: item.status,
      WholeBlood: item.components?.wholeBlood || 0,
      Plasma: item.components?.plasma || 0,
      Platelets: item.components?.platelets || 0,
      Cryoprecipitate: item.components?.cryoprecipitate || 0,
      LastUpdated: formatDateTime(item.lastUpdated),
    }));

    if (!exportData.length) {
      Swal.fire({
        title: "No Data",
        text: "There is no inventory data to export.",
        icon: "info",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-info text-white",
        },
        buttonsStyling: false,
      });
      return;
    }

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${formatDateInputValue(new Date())}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ==================== ERROR HANDLING ====================

  const profileErrorStatus = error?.response?.status;
  const profileErrorMessage = error?.response?.data?.error || error?.message || "";
  const isProfileMissingError =
    isError &&
    (profileErrorStatus === 404 ||
      profileErrorStatus === 400 ||
      /blood bank not found|invalid blood bank id|no blood bank profile assigned/i.test(
        profileErrorMessage,
      ));

  const showNoProfileState =
    (!bankId && !authLoading && !myBankLoading) || isProfileMissingError;

  // ==================== LOADING STATES ====================

  if (isLoading || authLoading || myBankLoading) return <BloodLoader />;

  // ==================== NO PROFILE STATE ====================

  if (showNoProfileState) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-4 sm:space-y-6 min-h-screen bg-base-200 p-3 sm:p-4 md:p-6"
      >
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <FaTint className="text-error" />
              Inventory Management
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Manage blood inventory levels and components.
            </p>
          </div>
        </motion.div>

        {/* No Profile Alert */}
        <motion.div
          variants={fadeInUp}
          className="alert bg-base-100 border border-error/20 shadow-sm items-start p-3 sm:p-4"
        >
          <FaExclamationTriangle className="text-error mt-0.5 text-lg sm:text-xl shrink-0" />
          <div>
            <h3 className="font-semibold text-error text-sm sm:text-base">Blood Bank Profile Not Found</h3>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              No blood bank profile data is available for this account. Please contact an admin to create or link your blood bank profile.
            </p>
          </div>
        </motion.div>
      </motion.div>
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
            <FaTint className="text-error" />
            Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            {bankData?.name} • Manage blood inventory levels and components
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="btn btn-outline btn-xs sm:btn-sm gap-1 sm:gap-2"
          >
            <FiDownload size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Export</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-outline btn-xs sm:btn-sm gap-1 sm:gap-2"
            disabled={isLoading}
          >
            <FiRefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            <span className="text-xs sm:text-sm">Refresh</span>
          </button>

          {/* Edit Mode Toggle */}
          {!bulkEditMode ? (
            <button
              onClick={() => {
                setBulkEditMode(true);
                setDraftInventory(
                  baseInventory.map((item) => ({
                    ...item,
                    components: { ...item.components },
                  })),
                );
              }}
              className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2"
            >
              <FiEdit2 size={12} className="sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Bulk Edit</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setBulkEditMode(false);
                setEditingType(null);
                setDraftInventory(null);
              }}
              className="btn btn-ghost btn-xs sm:btn-sm gap-1 sm:gap-2"
            >
              <span className="text-xs sm:text-sm">Cancel Bulk Edit</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* ==================== STATS CARDS ==================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"
      >
        {/* Total Units Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Total Units</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-error">{inventoryStats.totalUnits}</p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FaTint className="text-error text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Across all blood types</p>
        </motion.div>

        {/* Active Types Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Active Types</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-info">{inventoryStats.activeTypes}/8</p>
            </div>
            <div className="stat-figure bg-info/10 p-2 rounded-full">
              <FiPackage className="text-info text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Blood types in stock</p>
        </motion.div>

        {/* Critical Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Critical</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-error">{inventoryStats.criticalCount}</p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FaExclamationTriangle className="text-error text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Need immediate attention</p>
        </motion.div>

        {/* Low Stock Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Low Stock</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-warning">{inventoryStats.lowCount}</p>
            </div>
            <div className="stat-figure bg-warning/10 p-2 rounded-full">
              <FiAlertCircle className="text-warning text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Below 2x threshold</p>
        </motion.div>

        {/* Good Stock Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Good Stock</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-success">{inventoryStats.goodCount}</p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FaCheckCircleSolid className="text-success text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Healthy inventory</p>
        </motion.div>
      </motion.div>

      {/* ==================== FILTERS AND QUICK ACTIONS ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4"
      >
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by blood type..."
              className="input input-bordered input-sm sm:input-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="CRITICAL">Critical</option>
              <option value="LOW">Low</option>
              <option value="ADEQUATE">Adequate</option>
              <option value="GOOD">Good</option>
            </select>
          </div>

          {/* Quick Actions for Bulk Edit Mode */}
          {bulkEditMode && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleResetToThreshold}
                className="btn btn-outline btn-info btn-xs sm:btn-sm"
              >
                Set to 2x Threshold
              </button>
              <button
                onClick={handleSetAllZero}
                className="btn btn-outline btn-error btn-xs sm:btn-sm"
              >
                Reset All
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={updateInventoryMutation.isPending}
                className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2"
              >
                {updateInventoryMutation.isPending ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <FiSave size={12} className="sm:w-4 sm:h-4" />
                )}
                <span className="text-xs sm:text-sm">Save All Changes</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ==================== INVENTORY TABLE ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="table table-xs sm:table-sm md:table-md w-full">
            {/* Table Header */}
            <thead>
              <tr className="bg-base-200">
                <th className="text-xs sm:text-sm">Blood Type</th>
                <th className="text-xs sm:text-sm">Status</th>
                <th className="text-xs sm:text-sm">Units</th>
                <th className="text-xs sm:text-sm">Threshold</th>
                <th colSpan={4} className="text-center text-xs sm:text-sm">Components</th>
                <th className="text-xs sm:text-sm">Last Updated</th>
                <th className="text-center text-xs sm:text-sm">Actions</th>
              </tr>
              {/* Component Sub-header */}
              <tr className="bg-base-200 text-[10px] sm:text-xs">
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th className="text-center">Whole Blood</th>
                <th className="text-center">Plasma</th>
                <th className="text-center">Platelets</th>
                <th className="text-center">Cryo</th>
                <th></th>
                <th></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {filteredInventory.map((item) => {
                const StatusIcon = item.statusConfig.icon;
                const isEditing = editingType === item.bloodType;

                return (
                  <motion.tr
                    key={item.bloodType}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={item.status === "CRITICAL" ? "bg-error/5" : ""}
                  >
                    {/* Blood Type */}
                    <td className="font-bold text-sm sm:text-base">{item.bloodType}</td>

                    {/* Status Badge */}
                    <td>
                      <span className={`badge badge-${item.statusConfig.color} badge-xs sm:badge-sm gap-1`}>
                        <StatusIcon size={8} className="sm:w-3 sm:h-3" />
                        <span className="text-[10px] sm:text-xs">{item.statusConfig.label}</span>
                      </span>
                    </td>

                    {/* Units */}
                    <td>
                      {isEditing || bulkEditMode ? (
                        <input
                          type="number"
                          min="0"
                          className="input input-bordered input-xs sm:input-sm w-16 sm:w-20"
                          value={bulkEditMode ? item.units : editForm.units}
                          onChange={(e) => {
                            if (bulkEditMode) {
                              handleBulkChange(item.bloodType, 'units', e.target.value);
                            } else {
                              handleEditFormChange('units', e.target.value);
                            }
                          }}
                        />
                      ) : (
                        <span className={`font-bold text-xs sm:text-sm ${item.units <= item.threshold ? 'text-error' : ''}`}>
                          {item.units}
                        </span>
                      )}
                    </td>

                    {/* Threshold */}
                    <td>
                      {isEditing || bulkEditMode ? (
                        <input
                          type="number"
                          min="0"
                          className="input input-bordered input-xs sm:input-sm w-16 sm:w-20"
                          value={bulkEditMode ? item.threshold : editForm.threshold}
                          onChange={(e) => {
                            if (bulkEditMode) {
                              handleBulkChange(item.bloodType, 'threshold', e.target.value);
                            } else {
                              handleEditFormChange('threshold', e.target.value);
                            }
                          }}
                        />
                      ) : (
                        <span className="text-xs sm:text-sm">{item.threshold}</span>
                      )}
                    </td>

                    {/* Components */}
                    {componentTypes.map((comp) => (
                      <td key={comp.id} className="text-center">
                        {isEditing || bulkEditMode ? (
                          <input
                            type="number"
                            min="0"
                            className="input input-bordered input-xs sm:input-sm w-14 sm:w-16"
                            value={bulkEditMode ? (item.components?.[comp.id] || 0) : (editForm.components?.[comp.id] || 0)}
                            onChange={(e) => {
                              if (bulkEditMode) {
                                handleBulkChange(item.bloodType, comp.id, e.target.value);
                              } else {
                                handleComponentChange(comp.id, e.target.value);
                              }
                            }}
                          />
                        ) : (
                          <span className="text-[10px] sm:text-xs">
                            {item.components?.[comp.id] || 0}
                          </span>
                        )}
                      </td>
                    ))}

                    {/* Last Updated */}
                    <td>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                        <FiClock size={8} className="sm:w-3 sm:h-3 opacity-50" />
                        <span title={formatDateTime(item.lastUpdated)}>
                          {formatTimeOnly(item.lastUpdated)}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex justify-center gap-1">
                        {!bulkEditMode && !isEditing && (
                          <button
                            onClick={() => handleEdit(item.bloodType)}
                            className="btn btn-ghost btn-xs btn-square tooltip"
                            data-tip="Edit"
                          >
                            <FiEdit2 size={10} className="sm:w-4 sm:h-4" />
                          </button>
                        )}
                        {isEditing && (
                          <>
                            <button
                              onClick={handleSaveSingle}
                              disabled={updateInventoryMutation.isPending}
                              className="btn btn-xs btn-error gap-1"
                            >
                              {updateInventoryMutation.isPending ? (
                                <span className="loading loading-spinner loading-xs"></span>
                              ) : (
                                <FiSave size={10} />
                              )}
                              <span className="text-[10px]">Save</span>
                            </button>
                            <button
                              onClick={() => setEditingType(null)}
                              className="btn btn-xs btn-ghost"
                            >
                              <span className="text-[10px]">Cancel</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ==================== LOW INVENTORY ALERT ==================== */}
      {inventoryStats.criticalCount > 0 && (
        <motion.div
          variants={fadeInUp}
          className="alert alert-error bg-error/10 border-error/20 flex-col sm:flex-row gap-3 p-3 sm:p-4"
        >
          <FaExclamationTriangle className="text-error text-lg sm:text-xl shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-error text-xs sm:text-sm">Critical Inventory Alert!</span>
            <p className="text-[10px] sm:text-xs">
              {inventoryStats.criticalCount} blood type(s) have critically low inventory.
              {filteredInventory
                .filter(i => i.status === "CRITICAL")
                .map(i => ` ${i.bloodType} (${i.units}/${i.threshold})`)
                .join(', ')}
            </p>
          </div>
          <button
            onClick={() => setFilterStatus("CRITICAL")}
            className="btn btn-error btn-xs sm:btn-sm w-full sm:w-auto"
          >
            View Critical
          </button>
        </motion.div>
      )}

      {/* ==================== INVENTORY TIPS ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-info/10 border border-info/20 rounded-lg p-3 sm:p-4 text-xs sm:text-sm"
      >
        <div className="flex flex-col xs:flex-row items-start gap-2 sm:gap-3">
          <FiAlertCircle className="text-info text-lg sm:text-xl shrink-0" />
          <div>
            <p className="font-semibold text-info mb-1 text-xs sm:text-sm">Inventory Management Tips:</p>
            <ul className="list-disc list-inside text-[10px] sm:text-xs text-base-content/70 space-y-1">
              <li><span className="font-medium text-error">Critical</span> - Below threshold, needs immediate restocking</li>
              <li><span className="font-medium text-warning">Low</span> - Between threshold and 2x threshold, plan restocking soon</li>
              <li><span className="font-medium text-info">Adequate</span> - Between 2x and 3x threshold, comfortable levels</li>
              <li><span className="font-medium text-success">Good</span> - Above 3x threshold, healthy inventory levels</li>
              <li>Update components separately to track different blood products</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InventoryManagement;