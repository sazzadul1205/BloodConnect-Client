// Pages/backend/Admin/BloodBanksManagement/BloodBanksManagement.jsx

// React
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

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

// Modals
import StaffModal from "./StaffModal/StaffModal";
import InventoryModal from "./InventoryModal/InventoryModal";
import AddBloodBankModal from "./AddBloodBankModal/AddBloodBankModal";
import ViewBloodBankModal from "./ViewBloodBankModal/ViewBloodBankModal";
import EditBloodBankModal from "./EditBloodBankModal/EditBloodBankModal";

// Utils
import { showExportOptions } from "./BloodBanksExport";

const BloodBanksManagement = () => {
  const queryClient = useQueryClient();
  const { axiosInstance } = useAxiosPublic();
  const location = useLocation();
  const navigate = useNavigate();

  // Token
  const token = localStorage.getItem("auth_token");

  // Pagination and filter states
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedType, setSelectedType] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [showLowInventory, setShowLowInventory] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("");

  // Bank type configuration
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

  // 🔹 Fetch All Blood Banks
  const {
    data: bloodBanksData,
    isLoading: loadingBanks,
    isError: banksError,
    error: banksErrorData,
    refetch: refetchBanks,
  } = useQuery({
    queryKey: ["all-blood-banks"],
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // 🔹 Fetch Low Inventory Alerts
  const {
    data: lowInventoryData,
    isLoading: loadingLowInventory,
    isError: lowInventoryError,
    error: lowInventoryErrorData,
    refetch: refetchLowInventory,
  } = useQuery({
    queryKey: ["low-inventory-alerts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks/alerts/low-inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: showLowInventory,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (bankId) => {
      const response = await axiosInstance.delete(`/blood-banks/${bankId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["all-blood-banks"]);
    },
  });

  // Filter banks
  const getFilteredBanks = () => {
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
  };

  const filteredBanks = getFilteredBanks();

  // Pagination calculations
  const totalPages = Math.ceil(filteredBanks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBanks = filteredBanks.slice(startIndex, endIndex);

  // Get unique cities for filter
  const uniqueCities = [...new Set(bloodBanksData?.data?.map(bank => bank.address?.city).filter(Boolean))];

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get verification badge
  const getVerificationBadge = (bank) => {
    const isVerified = bank.verification?.isVerified;
    return isVerified ? (
      <div className="badge badge-success gap-1">
        <FiCheckCircle size={12} />
        Verified
      </div>
    ) : (
      <div className="badge badge-warning gap-1">
        <FiXCircle size={12} />
        Pending
      </div>
    );
  };

  // Get inventory status
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

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle export
  const handleExport = () => {
    showExportOptions(filteredBanks, setIsExporting);
  };

  // Handle delete bank
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          title: "text-lg font-bold text-error",
          htmlContainer: "text-base text-base-content/80",
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
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            title: "text-lg font-bold text-success",
            htmlContainer: "text-base text-base-content/80",
            confirmButton: "btn btn-sm btn-success text-white",
          },
          buttonsStyling: false,
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Handle verify bank
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          title: `text-lg font-bold ${shouldVerify ? "text-success" : "text-warning"}`,
          htmlContainer: "text-base text-base-content/80",
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
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            title: "text-lg font-bold text-success",
            htmlContainer: "text-base text-base-content/80",
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

  // Close modals helper
  const CloseModal = () => {
    setSelectedBankId(null);
    document.getElementById('staff_modal')?.close();
    document.getElementById('add_bank_modal')?.close();
    document.getElementById('view_bank_modal')?.close();
    document.getElementById('edit_bank_modal')?.close();
    document.getElementById('inventory_modal')?.close();
  };

  // Refresh helper for modal actions (avoids unnecessary low-inventory fetches)
  const refreshManagementData = async () => {
    await refetchBanks();
    if (showLowInventory) {
      await refetchLowInventory();
    }
  };

  // Loading state
  if (loadingBanks || loadingLowInventory) return <BloodLoader />;

  // Error state for blood banks
  if (banksError || lowInventoryError) {
    return (
      <ErrorState
        error={[banksErrorData, lowInventoryErrorData]}
        onRetry={() => refreshManagementData()}
      />
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        {/* Header copy: communicates context and purpose of blood bank management dashboard. */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {/* Visual identity icon for blood bank management system. */}
            <FiHome className="text-error" />
            Blood Banks Management
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Manage all blood banks, monitor inventory, and verify facilities
          </p>
        </div>

        {/* Action Buttons: low inventory toggle, export, and add bank utilities. */}
        <div className="flex gap-2">
          {/* Low Inventory Toggle: filters view to show only banks with low stock. */}
          <button
            onClick={() => setShowLowInventory(!showLowInventory)}
            className={`btn btn-sm gap-2 ${showLowInventory ? 'btn-warning' : 'btn-outline'}`}
          >
            <FiAlertCircle size={16} />
            {showLowInventory ? 'Showing Low Inventory' : 'Show Low Inventory'}
          </button>

          {/* Export Button with Count: exports current filtered bank set. */}
          <button
            onClick={handleExport}
            className="btn btn-outline btn-sm gap-2"
            disabled={isExporting || filteredBanks.length === 0}
          >
            {isExporting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Exporting...
              </>
            ) : (
              <>
                <FiDownload size={16} />
                Export ({filteredBanks.length})
              </>
            )}
          </button>

          {/* Add Blood Bank Button: opens modal for new bank creation. */}
          <button
            onClick={() => document.getElementById('add_bank_modal')?.showModal()}
            className="btn btn-error btn-sm gap-2"
          >
            <FiPlus size={16} />
            Add Blood Bank
          </button>
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
              staggerChildren: 0.1 // Each card fades in sequentially with 0.1s delay
            }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {/* Card 1: Total Banks - overall facility count. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-error">
            <FiHome size={24} />
          </div>
          <p className="stat-title">Total Banks</p>
          <p className="stat-value text-3xl">{bloodBanksData?.count || 0}</p>
          <p className="stat-desc">Registered facilities</p>
        </motion.div>

        {/* Card 2: Verified Banks - approved facilities count. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-success">
            <FiCheckCircle size={24} />
          </div>
          <p className="stat-title">Verified</p>
          <p className="stat-value text-3xl">
            {bloodBanksData?.data?.filter(b => b.verification?.isVerified).length || 0}
          </p>
          <p className="stat-desc">Approved banks</p>
        </motion.div>

        {/* Card 3: Total Inventory - aggregate blood units across all banks. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-info">
            <FiDroplet size={24} />
          </div>
          <p className="stat-title">Total Units</p>
          <p className="stat-value text-3xl">
            {bloodBanksData?.data?.reduce((sum, bank) =>
              sum + (bank.inventory?.reduce((s, i) => s + (i.units || 0), 0) || 0), 0
            )}
          </p>
          <p className="stat-desc">Blood units available</p>
        </motion.div>

        {/* Card 4: Low Inventory - banks needing attention. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-warning">
            <FiAlertCircle size={24} />
          </div>
          <p className="stat-title">Low Inventory</p>
          <p className="stat-value text-3xl">{lowInventoryData?.count || 0}</p>
          <p className="stat-desc">Banks need attention</p>
        </motion.div>

        {/* Card 5: Staff Count - total healthcare workers across banks. */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-secondary">
            <FiUsers size={24} />
          </div>
          <p className="stat-title">Total Staff</p>
          <p className="stat-value text-3xl">
            {bloodBanksData?.data?.reduce((sum, bank) => sum + (bank.staff?.length || 0), 0)}
          </p>
          <p className="stat-desc">Healthcare workers</p>
        </motion.div>
      </motion.div>

      {/* Filters Section with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search input: free-text search across bank fields. */}
          <div className="flex-1">
            <div className="form-control">
              <input
                type="text"
                placeholder="Search by name, registration number, city..."
                className="input input-bordered w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filter: dropdown for bank type filtering. */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered w-full"
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

          {/* City Filter: dropdown for geographic filtering. */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered w-full"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Verification Filter: filters by verification status. */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered w-full"
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* Reset Filters: clears all filter inputs. */}
          <button
            className="btn btn-outline btn-square"
            onClick={() => {
              setSearchTerm("");
              setSelectedType("");
              setSelectedCity("");
              setVerificationStatus("");
              setShowLowInventory(false);
            }}
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </motion.div>

      {/* Results Count with Fade In: shows current range and total items. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ResultsCount
          endIndex={endIndex}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          filteredUsers={filteredBanks}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
        />
      </motion.div>

      {/* Main Blood Banks Table with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="overflow-x-auto bg-base-100 rounded-lg shadow-lg border border-base-300"
      >
        <table className="table table-zebra w-full">
          {/* Table Header: column definitions for blood bank data. */}
          <thead>
            <tr className="bg-base-200">
              <th className="w-12">#</th>
              <th>Blood Bank</th>
              <th>Type</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Inventory</th>
              <th>Status</th>
              <th>Staff</th>
              <th>Registered</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          {/* Table Body with staggered row animations */}
          <tbody>
            {paginatedBanks.length > 0 ? (
              paginatedBanks.map((bank, index) => {
                const TypeIcon = bankTypeConfig[bank.type]?.icon || FaBuilding;
                const inventoryStatus = getInventoryStatus(bank.inventory);
                const lowInventoryItems = bank.inventory?.filter(item => item.units <= item.threshold) || [];

                return (
                  <motion.tr
                    key={bank._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.02 }}
                    className="hover"
                  >
                    {/* Index: sequential number with pagination offset. */}
                    <td className="font-medium">{startIndex + index + 1}</td>

                    {/* Blood Bank Details: name + registration number with icon. */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                            <FiHome className="text-error text-xl" />
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold">{bank.name}</div>
                          <div className="text-sm text-base-content/70">
                            Reg: {bank.registrationNumber}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type: color-coded badge with icon. */}
                    <td>
                      <div className={`badge ${bankTypeConfig[bank.type]?.color || "badge-ghost"} gap-1`}>
                        <TypeIcon size={12} />
                        {bankTypeConfig[bank.type]?.label || bank.type}
                      </div>
                    </td>

                    {/* Contact: phone and email with icons. */}
                    <td>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <FiPhone size={12} className="text-base-content/50" />
                          <span>{bank.contact?.phone?.[0] || "N/A"}</span>
                        </div>
                        {bank.contact?.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <FiMail size={12} className="text-base-content/50" />
                            <span className="truncate max-w-24">{bank.contact.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Location: city and state with map pin. */}
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <FiMapPin size={12} className="text-base-content/50" />
                        <span>
                          {bank.address?.city}, {bank.address?.state}
                        </span>
                      </div>
                    </td>

                    {/* Inventory: status badge + low inventory indicators. */}
                    <td>
                      <div className="space-y-1">
                        <div className={`badge ${inventoryStatus.color} gap-1`}>
                          <FiPackage size={12} />
                          {inventoryStatus.status}
                        </div>
                        {lowInventoryItems.length > 0 && (
                          <div className="text-xs text-warning">
                            {lowInventoryItems.map(item => item.bloodType).join(', ')} low
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status: verification badge. */}
                    <td>
                      <div className="space-y-1">
                        {getVerificationBadge(bank)}
                      </div>
                    </td>

                    {/* Staff: staff count with icon. */}
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <FiUsers size={12} className="text-base-content/50" />
                        <span>{bank.staff?.length || 0}</span>
                      </div>
                    </td>

                    {/* Registered Date: creation date formatted. */}
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <FiCalendar size={12} className="text-base-content/50" />
                        <span>{formatDate(bank.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actions: comprehensive action buttons with tooltips */}
                    <td>
                      <div className="flex justify-center gap-1">
                        {/* View button - opens detail modal */}
                        <button
                          onClick={() => {
                            setSelectedBankId(bank._id);
                            document.getElementById('view_bank_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-sm btn-square tooltip"
                          data-tip="View Details"
                        >
                          <FiEye size={16} />
                        </button>

                        {/* Inventory button - opens inventory management */}
                        <button
                          onClick={() => {
                            setSelectedBankId(bank._id);
                            document.getElementById('inventory_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-sm btn-square tooltip text-info"
                          data-tip="Manage Inventory"
                        >
                          <FiDroplet size={16} />
                        </button>

                        {/* Staff button - opens staff management */}
                        <button
                          onClick={() => {
                            setSelectedBankId(bank._id);
                            document.getElementById('staff_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-sm btn-square tooltip text-secondary"
                          data-tip="Manage Staff"
                        >
                          <FiUsers size={16} />
                        </button>

                        {/* Edit button - opens edit modal */}
                        <button
                          onClick={() => {
                            setSelectedBankId(bank._id);
                            document.getElementById('edit_bank_modal')?.showModal();
                          }}
                          className="btn btn-ghost btn-sm btn-square tooltip"
                          data-tip="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>

                        {/* Verify/Un-verify toggle - conditional verification action */}
                        {!bank.verification?.isVerified ? (
                          <button
                            onClick={() => handleVerifyBank(bank._id, bank.name, true)}
                            className="btn btn-ghost btn-sm btn-square text-success tooltip"
                            data-tip="Verify"
                          >
                            <FiCheckCircle size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyBank(bank._id, bank.name, false)}
                            className="btn btn-ghost btn-sm btn-square text-warning tooltip"
                            data-tip="Un-verify"
                          >
                            <FiXCircle size={16} />
                          </button>
                        )}

                        {/* Delete button - triggers delete confirmation */}
                        <button
                          onClick={() => handleDeleteBank(bank._id, bank.name)}
                          className="btn btn-ghost btn-sm btn-square text-error tooltip"
                          data-tip="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              // Empty state with animation
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <td colSpan={10} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FiHome size={48} className="text-base-content/30" />
                    <h3 className="text-lg font-semibold text-base-content/70">No blood banks found</h3>
                    <p className="text-sm text-base-content/50">
                      Try adjusting your filters or add a new blood bank
                    </p>
                  </div>
                </td>
              </motion.tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Pagination with Fade In */}
      {filteredBanks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </motion.div>
      )}

      {/* Modals - all with native dialog animations preserved */}

      {/* Add Blood Bank Modal */}
      <dialog id="add_bank_modal" className="modal">
        <AddBloodBankModal
          onClose={() => CloseModal()}
          refreshBanks={() => refreshManagementData()}
        />
        <form onClick={() => CloseModal()} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Edit Blood Bank Modal */}
      <dialog id="edit_bank_modal" className="modal">
        <EditBloodBankModal
          bankId={selectedBankId}
          onClose={() => CloseModal()}
          refreshBanks={() => refreshManagementData()}
        />
        <form onClick={() => CloseModal()} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* View Blood Bank Modal */}
      <dialog id="view_bank_modal" className="modal">
        <ViewBloodBankModal
          bankId={selectedBankId}
          onClose={() => CloseModal()}
        />
        <form onClick={() => CloseModal()} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Inventory Modal */}
      <dialog id="inventory_modal" className="modal">
        <InventoryModal
          bankId={selectedBankId}
          onClose={() => CloseModal()}
          refreshBanks={() => refreshManagementData()}
        />
        <form onClick={() => CloseModal()} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Staff Modal */}
      <dialog id="staff_modal" className="modal">
        <StaffModal
          bankId={selectedBankId}
          onClose={() => CloseModal()}
          refreshBanks={() => refreshManagementData()}
        />
        <form onClick={() => CloseModal()} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default BloodBanksManagement;
