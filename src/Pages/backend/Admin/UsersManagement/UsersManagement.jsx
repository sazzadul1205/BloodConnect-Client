// Pages/backend/Admin/UsersManagement/UsersManagement.jsx

// React
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiMail,
  FiPhone,
  FiCalendar,
  FiDroplet,
  FiMapPin,
  FiShield,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiDownload,
  FiUserPlus,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { FaHeartbeat, FaUserCircle } from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";
import useAuth from "../../../../hooks/useAuth";

// Shared
import Pagination from "../../../../shared/Pagination";
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";
import ResultsCount from "../../../../shared/ResultsCount";
import { formatAppDate } from "../../../../utils/dateFormat";

// Services
import { showExportOptions } from "./userExport";

// Modals
import AddUserModal from "./AddUserModal/AddUserModal";
import EditUserModal from "./EditUserModal/EditUserModal";
import ViewUserModal from "./ViewUserModal/ViewUserModal";

// ==================== QUERY KEYS ====================

const queryKeys = {
  allUsers: ['all-users'],
};

// ==================== CONSTANTS ====================

/**
 * Role configuration for different user types
 * Each role has a specific color, icon, and label
 */
const roleConfig = {
  admin: { color: "badge-error", icon: FiShield, label: "Admin" },
  hospital: { color: "badge-info", icon: FiMapPin, label: "Hospital" },
  donor: { color: "badge-success", icon: FaHeartbeat, label: "Donor" },
  super_admin: { color: "badge-error", icon: FiShield, label: "Super Admin" },
  requester: { color: "badge-warning", icon: FiUserCheck, label: "Requester" },
  blood_bank: { color: "badge-secondary", icon: FiDroplet, label: "Blood Bank" },
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
      delay: 0.35 + custom * 0.02,
      duration: 0.3
    }
  })
};

// ==================== MAIN COMPONENT ====================

/**
 * Users Management Component
 * Allows admin to view, filter, add, edit, and delete users
 * 
 * @returns {JSX.Element} Users management page
 */
const UsersManagement = () => {
  const { axiosInstance } = useAxiosPublic();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRole, setSelectedRole] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState("");

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query: Fetch all users
   */
  const {
    data: allUsers,
    isLoading: loadingUsers,
    isError: usersError,
    error: usersErrorData,
    refetch: usersRefetch,
  } = useQuery({
    queryKey: queryKeys.allUsers,
    queryFn: async () => {
      const res = await axiosInstance.get("/users/admin/all-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ==================== COMPUTED VALUES ====================

  /**
   * Filter users based on active tab, search term, role, and verification status
   */
  const filteredUsers = React.useMemo(() => {
    if (!allUsers?.data) return [];

    let filtered = allUsers.data;

    // Filter by tab (user type)
    if (activeTab !== "all") {
      switch (activeTab) {
        case "donors":
          filtered = filtered.filter(user => user.role === "donor");
          break;
        case "hospitals":
          filtered = filtered.filter(user => user.role === "hospital");
          break;
        case "requesters":
          filtered = filtered.filter(user => user.role === "requester");
          break;
        case "blood_banks":
          filtered = filtered.filter(user => user.role === "blood_bank");
          break;
        case "admins":
          filtered = filtered.filter(user => user.role === "admin" || user.role === "super_admin");
          break;
        default:
          break;
      }
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.profile?.fullName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.includes(term) ||
        user.profile?.bloodGroup?.toLowerCase().includes(term)
      );
    }

    // Filter by role
    if (selectedRole) {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Filter by verification status
    if (selectedVerification) {
      filtered = filtered.filter(user => {
        const isVerified = user.verification?.isEmailVerified;
        return selectedVerification === "verified" ? isVerified : !isVerified;
      });
    }

    return filtered;
  }, [allUsers, activeTab, searchTerm, selectedRole, selectedVerification]);

  /**
   * Calculate statistics
   */
  const stats = React.useMemo(() => {
    const users = allUsers?.data || [];
    return {
      total: users.length,
      donors: users.filter(u => u.role === "donor").length,
      hospitals: users.filter(u => u.role === "hospital").length,
      requesters: users.filter(u => u.role === "requester").length,
      bloodBanks: users.filter(u => u.role === "blood_bank").length,
      admins: users.filter(u => u.role === "admin" || u.role === "super_admin").length,
      verified: users.filter(u => u.verification?.isEmailVerified).length,
    };
  }, [allUsers]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return formatAppDate(dateString);
  };

  /**
   * Get verification badge based on user's email verification status
   */
  const getVerificationBadge = (user) => {
    const isVerified = user.verification?.isEmailVerified;
    return isVerified ? (
      <div className="badge badge-success badge-xs sm:badge-sm gap-1">
        <FiCheckCircle size={8} className="sm:w-3 sm:h-3" />
        <span className="text-[10px] sm:text-xs">Verified</span>
      </div>
    ) : (
      <div className="badge badge-ghost badge-xs sm:badge-sm gap-1">
        <FiXCircle size={8} className="sm:w-3 sm:h-3" />
        <span className="text-[10px] sm:text-xs">Unverified</span>
      </div>
    );
  };

  /**
   * Check if current user can manage a user with the given role
   * Implements role-based access control (RBAC)
   */
  const canManageRole = (targetRole) => {
    if (currentUser?.role === "super_admin") {
      // Super admin can manage all except super admin accounts
      return targetRole !== "super_admin";
    }

    if (currentUser?.role === "admin") {
      // Admin cannot manage admin or super admin accounts
      return targetRole !== "admin" && targetRole !== "super_admin";
    }

    return false;
  };

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle page change with smooth scroll to top
   */
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Handle export button click
   */
  const handleExport = () => {
    showExportOptions(filteredUsers, activeTab, setIsExporting);
  };

  /**
   * Handle delete user with confirmation
   */
  const handleDeleteUser = async (userId, userName, userRole) => {
    try {
      // Check permissions first
      if (!canManageRole(userRole)) {
        await Swal.fire({
          title: "Protected User",
          text: "You do not have permission to modify this user.",
          icon: "warning",
          timer: 2000,
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          },
          buttonsStyling: false,
        });
        return;
      }

      // Show confirmation dialog
      const result = await Swal.fire({
        title: "Are you sure?",
        html: `
          <div class="text-left">
            <p class="mb-3">You are about to delete user:</p>
            <p class="font-semibold text-error">${userName}</p>
            <p class="mt-3 text-sm opacity-70">This action will deactivate the user account. The user will no longer be able to access the system.</p>
            <p class="text-sm font-semibold text-warning">This action can be reversed by an admin.</p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete user",
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
          setIsDeleting(true);
          try {
            const response = await axiosInstance.delete(`/users/${userId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.success) {
              return response.data;
            } else {
              throw new Error(response.data?.error || "Failed to delete user");
            }
          } catch (error) {
            Swal.showValidationMessage(
              error.response?.data?.error || error.message || "Failed to delete user"
            );
            throw error;
          } finally {
            setIsDeleting(false);
          }
        },
        allowOutsideClick: () => !Swal.isLoading()
      });

      if (result.isConfirmed) {
        await Swal.fire({
          title: "Deleted!",
          html: `
            <div class="text-center">
              <p class="mb-2">User <span class="font-semibold text-error">${userName}</span> has been deleted successfully.</p>
              <p class="text-sm opacity-70">The user account has been deactivated.</p>
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

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: queryKeys.allUsers });
      }
    } catch (error) {
      console.error("Delete error:", error);
      await Swal.fire({
        title: "Error!",
        text: error.response?.data?.error || "Failed to delete user. Please try again.",
        icon: "error",
        timer: 3000,
        showConfirmButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "OK",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          title: "text-lg font-bold text-error",
          content: "text-xs sm:text-sm text-base-content/80",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    }
  };

  /**
   * Close all modals
   */
  const CloseModal = () => {
    setSelectedUserId(null);
    document.getElementById('add_user_modal')?.close();
    document.getElementById('view_user_modal')?.close();
    document.getElementById('edit_user_modal')?.close();
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, selectedRole, selectedVerification]);

  // ==================== LOADING & ERROR STATES ====================

  if (loadingUsers) return <BloodLoader />;

  if (usersError) {
    return (
      <ErrorState
        error={usersErrorData}
        onRetry={() => usersRefetch()}
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
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        {/* Title and description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiUsers className="text-error" />
            Users Management
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Manage all users, verify accounts, and monitor activity
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="btn btn-outline btn-xs sm:btn-sm gap-1 sm:gap-2 flex-1 sm:flex-none"
            disabled={isExporting || filteredUsers.length === 0}
          >
            {isExporting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span className="text-xs sm:text-sm">Exporting...</span>
              </>
            ) : (
              <>
                <FiDownload size={12} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Export ({filteredUsers.length})</span>
              </>
            )}
          </button>

          {/* Add User Button */}
          <button
            onClick={() => document.getElementById('add_user_modal')?.showModal()}
            className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 flex-1 sm:flex-none"
          >
            <FiUserPlus size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Add User</span>
          </button>
        </div>
      </motion.div>

      {/* ==================== STATS CARDS ==================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"
      >
        {/* Total Users Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Total Users</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-error">{stats.total}</p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FiUsers className="text-error text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Active accounts</p>
        </motion.div>

        {/* Donors Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Donors</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-success">{stats.donors}</p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FaHeartbeat className="text-success text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Ready to donate</p>
        </motion.div>

        {/* Hospitals Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Hospitals</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-info">{stats.hospitals}</p>
            </div>
            <div className="stat-figure bg-info/10 p-2 rounded-full">
              <FiMapPin className="text-info text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Medical facilities</p>
        </motion.div>

        {/* Requesters Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Requesters</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-warning">{stats.requesters}</p>
            </div>
            <div className="stat-figure bg-warning/10 p-2 rounded-full">
              <FiUserCheck className="text-warning text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Active requests</p>
        </motion.div>

        {/* Verified Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Verified</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-success">{stats.verified}</p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FiCheckCircle className="text-success text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Email verified</p>
        </motion.div>
      </motion.div>

      {/* ==================== TABS ==================== */}
      <motion.div
        variants={fadeInUp}
        className="tabs tabs-boxed bg-base-100 p-1 border border-base-300 overflow-x-auto flex-nowrap"
      >
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "all" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Users
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "donors" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("donors")}
        >
          Donors
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "hospitals" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("hospitals")}
        >
          Hospitals
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "requesters" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("requesters")}
        >
          Requesters
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "blood_banks" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("blood_banks")}
        >
          Blood Banks
        </button>
        <button
          className={`tab tab-xs sm:tab-sm ${activeTab === "admins" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("admins")}
        >
          Admins
        </button>
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
                placeholder="Search by name, email, phone, blood group..."
                className="input input-bordered input-sm sm:input-md w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="donor">Donors</option>
              <option value="hospital">Hospitals</option>
              <option value="requester">Requesters</option>
              <option value="blood_bank">Blood Banks</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Verification Filter */}
          <div className="w-full lg:w-48">
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value)}
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
              setSelectedRole("");
              setSelectedVerification("");
              setActiveTab("all");
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
          filteredUsers={filteredUsers}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
        />
      </motion.div>

      {/* ==================== USERS TABLE ==================== */}
      <motion.div
        variants={fadeInUp}
        className="overflow-x-auto bg-base-100 rounded-lg shadow-lg border border-base-300"
      >
        <table className="table table-xs sm:table-sm md:table-md w-full">
          <thead>
            <tr className="bg-base-200">
              <th className="text-xs sm:text-sm w-12">#</th>
              <th className="text-xs sm:text-sm">User</th>
              <th className="text-xs sm:text-sm">Role</th>
              <th className="text-xs sm:text-sm hidden md:table-cell">Contact</th>
              <th className="text-xs sm:text-sm hidden lg:table-cell">Blood Group</th>
              <th className="text-xs sm:text-sm hidden xl:table-cell">Location</th>
              <th className="text-xs sm:text-sm">Status</th>
              <th className="text-xs sm:text-sm hidden lg:table-cell">Joined</th>
              <th className="text-xs sm:text-sm text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user, index) => {
                const RoleIcon = roleConfig[user.role]?.icon || FiUserCheck;
                const userName = user.profile?.fullName || user.email || "Unknown User";
                const canManageThisUser = canManageRole(user.role);

                return (
                  <motion.tr
                    key={user._id}
                    variants={tableRowVariants}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    className="hover"
                  >
                    <td className="text-xs sm:text-sm font-medium">{startIndex + index + 1}</td>

                    {/* User Details */}
                    <td>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="avatar">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-error/10 flex items-center justify-center">
                            {user.profile?.profilePicture ? (
                              <img
                                src={user.profile.profilePicture}
                                alt={user.profile?.fullName}
                                className="rounded-full"
                              />
                            ) : (
                              <FaUserCircle className="text-error text-sm sm:text-base" />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-xs sm:text-sm truncate max-w-24 sm:max-w-32">
                            {user.profile?.fullName || "N/A"}
                          </div>
                          <div className="text-[10px] sm:text-xs text-base-content/70 truncate max-w-24 sm:max-w-32">
                            @{user.username || "username"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* User Role */}
                    <td>
                      <div className={`badge ${roleConfig[user.role]?.color || "badge-ghost"} badge-xs sm:badge-sm gap-1`}>
                        <RoleIcon size={8} className="sm:w-3 sm:h-3" />
                        <span className="text-[10px] sm:text-xs">{roleConfig[user.role]?.label || user.role}</span>
                      </div>
                    </td>

                    {/* Contact - Hidden on mobile */}
                    <td className="hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                          <FiMail size={8} className="sm:w-3 sm:h-3 text-base-content/50" />
                          <span className="truncate max-w-32">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                            <FiPhone size={8} className="sm:w-3 sm:h-3 text-base-content/50" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Blood Group - Hidden on tablet */}
                    <td className="hidden lg:table-cell">
                      {user.profile?.bloodGroup ? (
                        <div className="font-semibold text-error text-xs sm:text-sm">
                          {user.profile.bloodGroup}
                        </div>
                      ) : (
                        <span className="text-base-content/50 text-xs sm:text-sm">—</span>
                      )}
                    </td>

                    {/* Location - Hidden on desktop */}
                    <td className="hidden xl:table-cell">
                      {user.address?.city ? (
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <FiMapPin size={10} className="sm:w-3 sm:h-3 text-base-content/50" />
                          <span>{user.address.city}</span>
                        </div>
                      ) : (
                        <span className="text-base-content/50 text-xs sm:text-sm">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <div className="space-y-1">
                        {getVerificationBadge(user)}
                        {user.isDeleted && (
                          <div className="badge badge-error badge-xs sm:badge-sm gap-1">
                            <FiUserX size={8} className="sm:w-3 sm:h-3" />
                            <span className="text-[10px] sm:text-xs">Deleted</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Joined - Hidden on tablet */}
                    <td className="hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-xs sm:text-sm">
                        <FiCalendar size={10} className="sm:w-3 sm:h-3 text-base-content/50" />
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      {canManageThisUser ? (
                        <div className="flex justify-center gap-1">
                          {/* View Button */}
                          <button
                            onClick={() => {
                              setSelectedUserId(user?._id);
                              document.getElementById('view_user_modal')?.showModal();
                            }}
                            className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip"
                            data-tip="View"
                            disabled={isDeleting || isExporting}
                          >
                            <FiEye size={12} className="sm:w-4 sm:h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setSelectedUserId(user?._id);
                              document.getElementById('edit_user_modal')?.showModal();
                            }}
                            className="btn btn-ghost btn-xs sm:btn-sm btn-square tooltip"
                            data-tip="Edit"
                            disabled={isDeleting || isExporting}
                          >
                            <FiEdit2 size={12} className="sm:w-4 sm:h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteUser(user._id, userName, user.role)}
                            className="btn btn-ghost btn-xs sm:btn-sm btn-square text-error tooltip"
                            data-tip="Delete"
                            disabled={isDeleting || isExporting}
                          >
                            <FiTrash2 size={12} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <span className="badge badge-ghost badge-xs sm:badge-sm">Protected</span>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              // Empty State
              <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <td colSpan={9} className="text-center py-8 sm:py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FiUsers size={32} className="sm:w-12 sm:h-12 text-base-content/30" />
                    <h3 className="text-sm sm:text-base font-semibold text-base-content/70">No users found</h3>
                    <p className="text-xs sm:text-sm text-base-content/50">
                      Try adjusting your filters or search term
                    </p>
                  </div>
                </td>
              </motion.tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* ==================== PAGINATION ==================== */}
      {filteredUsers.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </motion.div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Add User Modal */}
      <dialog id="add_user_modal" className="modal">
        <AddUserModal
          onClose={CloseModal}
          refreshUsers={() => usersRefetch()}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>

      {/* Edit User Modal */}
      <dialog id="edit_user_modal" className="modal">
        <EditUserModal
          userId={selectedUserId}
          onClose={CloseModal}
          refreshUsers={() => usersRefetch()}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>

      {/* View User Modal */}
      <dialog id="view_user_modal" className="modal">
        <ViewUserModal
          userId={selectedUserId}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>
    </motion.div>
  );
};

export default UsersManagement;