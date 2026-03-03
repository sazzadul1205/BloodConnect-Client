// Pages/backend/Admin/BloodBanksManagement/BloodBanksManagement.jsx

// React
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FiHome,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiXCircle,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiDownload,
  FiPlus,
  FiUsers,
  FiDroplet,
  FiAlertCircle,
  FiPackage,
  FiCalendar,
} from "react-icons/fi";
import { FaHospital, FaHeartbeat, FaBuilding } from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import Pagination from "../../../../shared/Pagination";
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";
import ResultsCount from "../../../../shared/ResultsCount";
import { formatAppDate } from "../../../../utils/dateFormat";

// Modals
import StaffModal from "./StaffModal/StaffModal";
import InventoryModal from "./InventoryModal/InventoryModal";
import AddBloodBankModal from "./AddBloodBankModal/AddBloodBankModal";
import ViewBloodBankModal from "./ViewBloodBankModal/ViewBloodBankModal";
import EditBloodBankModal from "./EditBloodBankModal/EditBloodBankModal";

// Utils
import { showExportOptions } from "./BloodBanksExport";

// ==================== QUERY KEYS ====================

const queryKeys = {
  allBloodBanks: ['all-blood-banks'],
  lowInventoryAlerts: ['low-inventory-alerts'],
};

// ==================== CONSTANTS ====================

/**
 * Bank type configuration for consistent display
 */
const bankTypeConfig = {
  government: {
    color: "badge-primary",
    icon: FaBuilding,
    label: "Government",
  },
  private: {
    color: "badge-secondary",
    icon: FaBuilding,
    label: "Private",
  },
  ngo: {
    color: "badge-success",
    icon: FaHeartbeat,
    label: "NGO",
  },
  hospital: {
    color: "badge-info",
    icon: FaHospital,
    label: "Hospital",
  },
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

const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (custom) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.3 + custom * 0.02,
      duration: 0.3
    }
  })
};

// ==================== MAIN COMPONENT ====================

/**
 * Blood Banks Management Component
 * Allows admin to manage all blood banks, view inventory, and verify facilities
 * 
 * @returns {JSX.Element} Blood banks management page
 */
const BloodBanksManagement = () => {
  const queryClient = useQueryClient();
  const { axiosInstance } = useAxiosPublic();
  const location = useLocation();
  const navigate = useNavigate();

  // Token
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedType, setSelectedType] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [showLowInventory, setShowLowInventory] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("");

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query 1: Fetch All Blood Banks
   */
  const {
    data: bloodBanksData,
    isLoading: loadingBanks,
    isError: banksError,
    error: banksErrorData,
    refetch: refetchBanks,
  } = useQuery({
    queryKey: queryKeys.allBloodBanks,
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 2: Fetch Low Inventory Alerts
   */
  const {
    data: lowInventoryData,
    isLoading: loadingLowInventory,
    isError: lowInventoryError,
    error: lowInventoryErrorData,
    refetch: refetchLowInventory,
  } = useQuery({
    queryKey: queryKeys.lowInventoryAlerts,
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks/alerts/low-inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: showLowInventory,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ==================== MUTATIONS ====================

  /**
   * Mutation: Delete blood bank
   */
  const deleteMutation = useMutation({
    mutationFn: async (bankId) => {
      const response = await axiosInstance.delete(`/blood-banks/${bankId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allBloodBanks });
    },
  });

  // ==================== COMPUTED VALUES ====================

  /**
   * Filter banks based on all filter criteria
   */
  const filteredBanks = React.useMemo(() => {
    if (!bloodBanksData?.data) return [];

    let filtered = bloodBanksData.data;

    // Filter by low inventory if enabled
    if (showLowInventory && lowInventoryData?.data) {
      const lowInventoryIds = lowInventoryData.data.map(bank => bank._id);
      filtered = filtered.filter(bank => lowInventoryIds.includes(bank._id));
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(bank =>
        bank.name?.toLowerCase().includes(term) ||
        bank.registrationNumber?.toLowerCase().includes(term) ||
        bank.address?.city?.toLowerCase().includes(term) ||
        bank.address?.state?.toLowerCase().includes(term)
      );
    }

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter(bank => bank.type === selectedType);
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter(bank =>
        bank.address?.city?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    // Filter by verification status
    if (verificationStatus) {
      if (verificationStatus === "verified") {
        filtered = filtered.filter(bank => bank.verification?.isVerified);
      } else if (verificationStatus === "unverified") {
        filtered = filtered.filter(bank => !bank.verification?.isVerified);
      }
    }

    return filtered;
  }, [bloodBanksData, showLowInventory, lowInventoryData, searchTerm, selectedType, selectedCity, verificationStatus]);

  // Get unique cities for filter
  const uniqueCities = React.useMemo(() => {
    return [...new Set(bloodBanksData?.data?.map(bank => bank.address?.city).filter(Boolean))];
  }, [bloodBanksData]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBanks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBanks = filteredBanks.slice(startIndex, endIndex);

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return formatAppDate(dateString);
  };

  /**
   * Get verification badge based on bank verification status
   */
  const getVerificationBadge = (bank) => {
    const isVerified = bank.verification?.isVerified;
    return isVerified ? (
      <span className="badge badge-success badge-xs sm:badge-sm gap-1">
        <FiCheckCircle size={8} className="sm:w-3 sm:h-3" />
        <span className="text-[10px] sm:text-xs">Verified</span>
      </span>
    ) : (
      <span className="badge badge-warning badge-xs sm:badge-sm gap-1">
        <FiXCircle size={8} className="sm:w-3 sm:h-3" />
        <span className="text-[10px] sm:text-xs">Pending</span>
      </span>
    );
  };

  /**
   * Get inventory status with appropriate badge
   */
  const getInventoryStatus = (inventory) => {
    if (!inventory) return { status: "No Data", color: "badge-ghost" };

    const totalUnits = inventory.reduce((sum, item) => sum + (item.units || 0), 0);
    const lowStockItems = inventory.filter(item => item.units <= item.threshold).length;

    if (totalUnits === 0) {
      return { status: "Empty", color: "badge-error" };
    } else if (lowStockItems > 0) {
      return { status: `${lowStockItems} Low`, color: "badge-warning" };
    } else {
      return { status: "Good", color: "badge-success" };
    }
  };

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle page change with smooth scroll
   */
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Handle export button click
   */
  const handleExport = () => {
    showExportOptions(filteredBanks, setIsExporting);
  };

  /**
   * Handle delete bank with confirmation
   */
  const handleDeleteBank = async (bankId, bankName) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        html: `
          <div class="text-left">
            <p class="mb-3">You are about to delete blood bank:</p>
            <p class="font-semibold text-error">${bankName}</p>
            <p class="mt-3 text-sm opacity-70">This action will permanently delete the blood bank and all associated data.</p>
            <p class="text-sm font-semibold text-warning">This action cannot be undone!</p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete bank",
        cancelButtonText: "Cancel",
        reverseButtons: true,
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          title: "text-lg font-bold text-error",
          htmlContainer: "text-xs sm:text-sm text-base-content/80",
          confirmButton: "btn btn-sm btn-error text-white",
          cancelButton: "btn btn-sm",
        },
        buttonsStyling: false,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            await deleteMutation.mutateAsync(bankId);
          } catch (error) {
            Swal.showValidationMessage(
              error.response?.data?.error || "Failed to delete blood bank"
            );
            throw error;
          }
        },
        allowOutsideClick: () => !Swal.isLoading()
      });

      if (result.isConfirmed) {
        await Swal.fire({
          title: "Deleted!",
          html: `
            <div class="text-center">
              <p class="mb-2">Blood bank <span class="font-semibold text-error">${bankName}</span> has been deleted successfully.</p>
            </div>
          `,
          icon: "success",
          timer: 3000,
          showConfirmButton: true,
          confirmButtonColor: "#22c55e",
          confirmButtonText: "OK",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
            title: "text-lg font-bold text-success",
            htmlContainer: "text-xs sm:text-sm text-base-content/80",
            confirmButton: "btn btn-sm btn-success text-white",
          },
          buttonsStyling: false,
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  /**
   * Handle verify/unverify bank
   */
  const handleVerifyBank = async (bankId, bankName, shouldVerify) => {
    try {
      const result = await Swal.fire({
        title: shouldVerify ? "Verify Blood Bank?" : "Un-verify Blood Bank?",
        html: `
          <div class="text-left">
            <p class="mb-3">You are about to ${shouldVerify ? "verify" : "un-verify"}:</p>
            <p class="font-semibold ${shouldVerify ? "text-success" : "text-warning"}">${bankName}</p>
            <p class="mt-3 text-sm opacity-70">
              ${shouldVerify
            ? "This will mark the blood bank as verified and make it fully visible to users."
            : "This will remove the verified status from this blood bank."}
            </p>
          </div>
        `,
        icon: shouldVerify ? "success" : "warning",
        showCancelButton: true,
        confirmButtonColor: shouldVerify ? "#22c55e" : "#f59e0b",
        cancelButtonColor: "#6b7280",
        confirmButtonText: shouldVerify ? "Yes, verify" : "Yes, un-verify",
        cancelButtonText: "Cancel",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          title: `text-lg font-bold ${shouldVerify ? "text-success" : "text-warning"}`,
          htmlContainer: "text-xs sm:text-sm text-base-content/80",
          confirmButton: `btn btn-sm ${shouldVerify ? "btn-success" : "btn-warning"} text-white`,
          cancelButton: "btn btn-sm",
        },
        buttonsStyling: false,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            const response = await axiosInstance.patch(
              `/blood-banks/${bankId}/verify`,
              { isVerified: shouldVerify },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
          } catch (error) {
            Swal.showValidationMessage(
              error.response?.data?.error || `Failed to ${shouldVerify ? "verify" : "un-verify"} blood bank`
            );
            throw error;
          }
        },
        allowOutsideClick: () => !Swal.isLoading()
      });

      if (result.isConfirmed) {
        await Swal.fire({
          title: "Success!",
          text: `Blood bank has been ${shouldVerify ? "verified" : "unverified"} successfully.`,
          icon: "success",
          timer: 3000,
          showConfirmButton: true,
          confirmButtonColor: "#22c55e",
          confirmButtonText: "OK",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
            title: "text-lg font-bold text-success",
            htmlContainer: "text-xs sm:text-sm text-base-content/80",
            confirmButton: "btn btn-sm btn-success text-white",
          },
          buttonsStyling: false,
        });

        refetchBanks();
      }
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  /**
   * Refresh helper for modal actions
   */
  const refreshManagementData = async () => {
    await refetchBanks();
    if (showLowInventory) {
      await refetchLowInventory();
    }
  };

  /**
   * Close all modals
   */
  const CloseModal = () => {
    setSelectedBankId(null);
    document.getElementById('staff_modal')?.close();
    document.getElementById('add_bank_modal')?.close();
    document.getElementById('view_bank_modal')?.close();
    document.getElementById('edit_bank_modal')?.close();
    document.getElementById('inventory_modal')?.close();
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedCity, verificationStatus, showLowInventory]);

  // Open Add Blood Bank modal when redirected with ?openCreate=1
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpenCreate = params.get("openCreate") === "1";
    if (!shouldOpenCreate) return;

    document.getElementById("add_bank_modal")?.showModal();

    // Clean up URL query so modal doesn't reopen on refresh/navigation.
    params.delete("openCreate");
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate]);

  // ==================== LOADING & ERROR STATES ====================

  if (loadingBanks || loadingLowInventory) return <BloodLoader />;

  if (banksError || lowInventoryError) {
    return (
      <ErrorState
        error={[banksErrorData, lowInventoryErrorData]}
        onRetry={refreshManagementData}
      />
    );
  }

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
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        {/* Title and description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiHome className="text-error" />
            Blood Banks Management
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Manage all blood banks, monitor inventory, and verify facilities
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Low Inventory Toggle */}
          <button
            onClick={() => setShowLowInventory(!showLowInventory)}
            className={`btn btn-xs sm:btn-sm gap-1 sm:gap-2 ${showLowInventory ? 'btn-warning' : 'btn-outline'
              }`}
          >
            <FiAlertCircle size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">
              {showLowInventory ? 'Showing Low Inventory' : 'Show Low Inventory'}
            </span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="btn btn-outline btn-xs sm:btn-sm gap-1 sm:gap-2"
            disabled={isExporting || filteredBanks.length === 0}
          >
            {isExporting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span className="text-xs sm:text-sm">Exporting...</span>
              </>
            ) : (
              <>
                <FiDownload size={12} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Export ({filteredBanks.length})</span>
              </>
            )}
          </button>

          {/* Add Blood Bank Button */}
          <button
            onClick={() => document.getElementById('add_bank_modal')?.showModal()}
            className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2"
          >
            <FiPlus size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Add Blood Bank</span>
          </button>
        </div>
      </motion.div>

      {/* ==================== STATS CARDS ==================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"
      >
        {/* Total Banks Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Total Banks</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-error">
                {bloodBanksData?.count || 0}
              </p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FiHome className="text-error text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Registered facilities</p>
        </motion.div>

        {/* Verified Banks Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Verified</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-success">
                {bloodBanksData?.data?.filter(b => b.verification?.isVerified).length || 0}
              </p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FiCheckCircle className="text-success text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Approved banks</p>
        </motion.div>

        {/* Total Inventory Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Total Units</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-info">
                {bloodBanksData?.data?.reduce((sum, bank) =>
                  sum + (bank.inventory?.reduce((s, i) => s + (i.units || 0), 0) || 0), 0
                )}
              </p>
            </div>
            <div className="stat-figure bg-info/10 p-2 rounded-full">
              <FiDroplet className="text-info text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Blood units available</p>
        </motion.div>

        {/* Low Inventory Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Low Inventory</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-warning">
                {lowInventoryData?.count || 0}
              </p>
            </div>
            <div className="stat-figure bg-warning/10 p-2 rounded-full">
              <FiAlertCircle className="text-warning text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Banks need attention</p>
        </motion.div>

        {/* Staff Count Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Total Staff</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-secondary">
                {bloodBanksData?.data?.reduce((sum, bank) => sum + (bank.staff?.length || 0), 0)}
              </p>
            </div>
            <div className="stat-figure bg-secondary/10 p-2 rounded-full">
              <FiUsers className="text-secondary text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Healthcare workers</p>
        </motion.div>
      </motion.div>

      {/* ==================== FILTERS SECTION ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4"
      >
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">

          {/* Search Input */}
          <div className="flex-1">
            <div className="form-control">
              <input
                type="text"
                placeholder="Search by name, registration number, city..."
                className="input input-bordered input-sm sm:input-md w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="government">Government</option>
              <option value="private">Private</option>
              <option value="ngo">NGO</option>
              <option value="hospital">Hospital</option>
            </select>
          </div>

          {/* City Filter */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Verification Filter */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          <button
            className="btn btn-outline btn-sm btn-square"
            onClick={() => {
              setSearchTerm("");
              setSelectedType("");
              setSelectedCity("");
              setVerificationStatus("");
              setShowLowInventory(false);
            }}
          >
            <FiRefreshCw size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </motion.div>

      {/* ==================== RESULTS COUNT ==================== */}
      <motion.div variants={fadeInUp}>
        <ResultsCount
          endIndex={endIndex}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          filteredUsers={filteredBanks}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
        />
      </motion.div>

      {/* ==================== BLOOD BANKS TABLE ==================== */}
      <motion.div
        variants={fadeInUp}
        className="overflow-x-auto bg-base-100 rounded-lg shadow-lg border border-base-300"
      >
        <table className="table table-xs sm:table-sm md:table-md w-full">
          <thead>
            <tr className="bg-base-200">
              <th className="text-xs sm:text-sm w-12">#</th>
              <th className="text-xs sm:text-sm">Blood Bank</th>
              <th className="text-xs sm:text-sm">Type</th>
              <th className="text-xs sm:text-sm hidden md:table-cell">Contact</th>
              <th className="text-xs sm:text-sm hidden lg:table-cell">Location</th>
              <th className="text-xs sm:text-sm">Inventory</th>
              <th className="text-xs sm:text-sm">Status</th>
              <th className="text-xs sm:text-sm hidden xl:table-cell">Staff</th>
              <th className="text-xs sm:text-sm hidden xl:table-cell">Registered</th>
              <th className="text-xs sm:text-sm text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedBanks.length > 0 ? (
              paginatedBanks.map((bank, index) => {
                const TypeIcon = bankTypeConfig[bank.type]?.icon || FaBuilding;
                const inventoryStatus = getInventoryStatus(bank.inventory);
                const lowInventoryItems = bank.inventory?.filter(item => item.units <= item.threshold) || [];

                return (
                  <motion.tr
                    key={bank._id}
                    variants={tableRowVariants}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    className="hover"
                  >
                    <td className="text-xs sm:text-sm font-medium">{startIndex + index + 1}</td>

                    {/* Blood Bank Details */}
                    <td>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="avatar">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-error/10 flex items-center justify-center">
                            <FiHome className="text-error text-sm sm:text-base" />
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-xs sm:text-sm truncate max-w-24 sm:max-w-32">
                            {bank.name}
                          </div>
                          <div className="text-[10px] sm:text-xs text-base-content/70 truncate max-w-24 sm:max-w-32">
                            Reg: {bank.registrationNumber}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td>
                      <div className={`badge ${bankTypeConfig[bank.type]?.color || "badge-ghost"} badge-xs sm:badge-sm gap-1`}>
                        <TypeIcon size={8} className="sm:w-3 sm:h-3" />
                        <span className="text-[10px] sm:text-xs">{bankTypeConfig[bank.type]?.label || bank.type}</span>
                      </div>
                    </td>

                    {/* Contact - Hidden on mobile */}
                    <td className="hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                          <FiPhone size={8} className="sm:w-3 sm:h-3 text-base-content/50" />
                          <span>{bank.contact?.phone?.[0] || "N/A"}</span>
                        </div>
                        {bank.contact?.email && (
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                            <FiMail size={8} className="sm:w-3 sm:h-3 text-base-content/50" />
                            <span className="truncate max-w-24">{bank.contact.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Location - Hidden on tablet */}
                    <td className="hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                        <FiMapPin size={8} className="sm:w-3 sm:h-3 text-base-content/50" />
                        <span className="truncate max-w-24">
                          {bank.address?.city}, {bank.address?.state}
                        </span>
                      </div>
                    </td>

                    {/* Inventory */}
                    <td>
                      <div className="space-y-1">
                        <div className={`badge ${inventoryStatus.color} badge-xs sm:badge-sm gap-1`}>
                          <FiPackage size={8} className="sm:w-3 sm:h-3" />
                          <span className="text-[10px] sm:text-xs">{inventoryStatus.status}</span>
                        </div>
                        {lowInventoryItems.length > 0 && (
                          <div className="text-[8px] sm:text-xs text-warning">
                            {lowInventoryItems.map(item => item.bloodType).join(', ')} low
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <div className="space-y-1">
                        {getVerificationBadge(bank)}
                      </div>
                    </td>

                    {/* Staff - Hidden on desktop */}
                    <td className="hidden xl:table-cell">
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                        <FiUsers size={8} className="sm:w-3 sm:h-3 text-base-content/50" />
                        <span>{bank.staff?.length || 0}</span>
                      </div>
                    </td>

                    {/* Registered Date - Hidden on desktop */}
                    <td className="hidden xl:table-cell">
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                        <FiCalendar size={8} className="sm:w-3 sm:h-3 text-base-content/50" />
                        <span>{formatDate(bank.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex justify-center gap-1">
                        {/* View Button */}
                        <button
                          onClick={() => {
                            setSelectedBankId(bank._id);
                            document.getElementById('view_bank_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip"
                          data-tip="View Details"
                        >
                          <FiEye size={12} className="sm:w-4 sm:h-4" />
                        </button>

                        {/* Inventory Button */}
                        <button
                          onClick={() => {
                            setSelectedBankId(bank._id);
                            document.getElementById('inventory_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip text-info"
                          data-tip="Manage Inventory"
                        >
                          <FiDroplet size={12} className="sm:w-4 sm:h-4" />
                        </button>

                        {/* Staff Button */}
                        <button
                          onClick={() => {
                            setSelectedBankId(bank._id);
                            document.getElementById('staff_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip text-secondary"
                          data-tip="Manage Staff"
                        >
                          <FiUsers size={12} className="sm:w-4 sm:h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setSelectedBankId(bank._id);
                            document.getElementById('edit_bank_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip"
                          data-tip="Edit"
                        >
                          <FiEdit2 size={12} className="sm:w-4 sm:h-4" />
                        </button>

                        {/* Verify/Un-verify Toggle */}
                        {!bank.verification?.isVerified ? (
                          <button
                            onClick={() => handleVerifyBank(bank._id, bank.name, true)}
                            className="btn btn-ghost btn-xs sm:btn-sm btn-square text-success tooltip"
                            data-tip="Verify"
                          >
                            <FiCheckCircle size={12} className="sm:w-4 sm:h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyBank(bank._id, bank.name, false)}
                            className="btn btn-ghost btn-xs sm:btn-sm btn-square text-warning tooltip"
                            data-tip="Un-verify"
                          >
                            <FiXCircle size={12} className="sm:w-4 sm:h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteBank(bank._id, bank.name)}
                          className="btn btn-ghost btn-xs sm:btn-sm btn-square text-error tooltip"
                          data-tip="Delete"
                        >
                          <FiTrash2 size={12} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              // Empty State
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <td colSpan={10} className="text-center py-8 sm:py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FiHome size={32} className="sm:w-12 sm:h-12 text-base-content/30" />
                    <h3 className="text-sm sm:text-base font-semibold text-base-content/70">No blood banks found</h3>
                    <p className="text-xs sm:text-sm text-base-content/50">
                      Try adjusting your filters or add a new blood bank
                    </p>
                  </div>
                </td>
              </motion.tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* ==================== PAGINATION ==================== */}
      {filteredBanks.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </motion.div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Add Blood Bank Modal */}
      <dialog id="add_bank_modal" className="modal">
        <AddBloodBankModal
          onClose={CloseModal}
          refreshBanks={refreshManagementData}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>

      {/* Edit Blood Bank Modal */}
      <dialog id="edit_bank_modal" className="modal">
        <EditBloodBankModal
          bankId={selectedBankId}
          onClose={CloseModal}
          refreshBanks={refreshManagementData}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>

      {/* View Blood Bank Modal */}
      <dialog id="view_bank_modal" className="modal">
        <ViewBloodBankModal
          bankId={selectedBankId}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>

      {/* Inventory Modal */}
      <dialog id="inventory_modal" className="modal">
        <InventoryModal
          bankId={selectedBankId}
          onClose={CloseModal}
          refreshBanks={refreshManagementData}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>

      {/* Staff Modal */}
      <dialog id="staff_modal" className="modal">
        <StaffModal
          bankId={selectedBankId}
          onClose={CloseModal}
          refreshBanks={refreshManagementData}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>
    </motion.div>
  );
};

export default BloodBanksManagement;