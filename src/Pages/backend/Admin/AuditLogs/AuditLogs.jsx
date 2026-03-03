// Pages/backend/Admin/AuditLogs/AuditLogs.jsx

// React
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FiClock,
  FiUser,
  FiActivity,
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiServer,
  FiGlobe,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiShield,
  FiLogIn,
  FiLogOut,
  FiEdit2,
  FiTrash2,
  FiPlusCircle,
  FiXCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { FaHistory } from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Services
import { showExportOptions } from "./AuditLogsExport";

// Shared
import Pagination from "../../../../shared/Pagination";
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";
import ResultsCount from "../../../../shared/ResultsCount";

// Date formatting
import { format, formatDistanceToNow } from "date-fns";

// ==================== QUERY KEYS ====================

const queryKeys = {
  auditLogs: (params) => ['audit-logs', params],
  auditSummary: ['audit-summary'],
  auditStats: ['audit-stats'],
};

// ==================== CONSTANTS ====================

/**
 * Action configuration for different log actions
 * Each action has an icon, color, and label
 */
const actionConfig = {
  UPDATE: { icon: FiEdit2, color: "info", label: "Update" },
  LOGIN: { icon: FiLogIn, color: "success", label: "Login" },
  DELETE: { icon: FiTrash2, color: "error", label: "Delete" },
  REJECT: { icon: FiXCircle, color: "error", label: "Reject" },
  LOGOUT: { icon: FiLogOut, color: "warning", label: "Logout" },
  default: { icon: FiActivity, color: "ghost", label: "Action" },
  CREATE: { icon: FiPlusCircle, color: "success", label: "Create" },
  VERIFY: { icon: FiCheckCircle, color: "success", label: "Verify" },
  APPROVE: { icon: FiCheckCircle, color: "success", label: "Approve" },
};

/**
 * Resource configuration for different resource types
 */
const resourceConfig = {
  User: { icon: FiUsers, color: "primary" },
  Admin: { icon: FiShield, color: "error" },
  Donor: { icon: FiUser, color: "success" },
  default: { icon: FiServer, color: "ghost" },
  Hospital: { icon: FiServer, color: "info" },
  Request: { icon: FiActivity, color: "warning" },
  BloodBank: { icon: FiServer, color: "secondary" },
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
      delay: 0.25 + custom * 0.02,
      duration: 0.3
    }
  })
};

// ==================== MAIN COMPONENT ====================

/**
 * Audit Logs Component
 * Displays system audit logs with filtering, search, and statistics
 * 
 * @returns {JSX.Element} Audit logs management page
 */
const AuditLogs = () => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [sortBy] = useState("timestamp");
  const [endDate, setEndDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("desc");
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedResource, setSelectedResource] = useState("");

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query 1: Fetch Audit Logs with filters and pagination
   */
  const {
    data: auditData,
    isLoading: loadingLogs,
    isError: logsError,
    error: logsErrorData,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: queryKeys.auditLogs({
      page: currentPage,
      limit: itemsPerPage,
      sortBy,
      sortOrder,
      selectedAction,
      selectedResource,
      selectedUserId,
      startDate,
      endDate,
    }),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder,
        ...(selectedAction && { action: selectedAction }),
        ...(selectedResource && { resource: selectedResource }),
        ...(selectedUserId && { userId: selectedUserId }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const res = await axiosInstance.get(`/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  /**
   * Query 2: Fetch Dashboard Summary
   */
  const {
    data: summaryData,
    isLoading: loadingSummary,
    isError: summaryError,
    error: summaryErrorData,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: queryKeys.auditSummary,
    queryFn: async () => {
      const res = await axiosInstance.get("/audit-logs/dashboard/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 3: Fetch Action Statistics
   */
  const {
    data: statsData,
    isLoading: loadingStats,
    isError: statsError,
    error: statsErrorData,
    refetch: refetchStats,
  } = useQuery({
    queryKey: queryKeys.auditStats,
    queryFn: async () => {
      const res = await axiosInstance.get("/audit-logs/stats/actions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: viewMode === "stats",
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ==================== COMPUTED VALUES ====================

  const logs = auditData?.data || [];
  const pagination = auditData?.pagination || { totalCount: 0, totalPages: 1 };
  const summary = summaryData?.data || null;

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Format timestamp into full, relative, date, and time formats
   */
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return {
      full: format(date, "PPpp"),
      relative: formatDistanceToNow(date, { addSuffix: true }),
      date: format(date, "PPP"),
      time: format(date, "p"),
    };
  };

  /**
   * Get action badge with appropriate icon and color
   */
  const getActionBadge = (action) => {
    const config = actionConfig[action?.toUpperCase()] || actionConfig.default;
    const Icon = config.icon;

    return (
      <div className={`badge badge-${config.color} badge-xs sm:badge-sm gap-1`}>
        <Icon size={8} className="sm:w-3 sm:h-3" />
        <span className="text-[10px] sm:text-xs">{config.label}</span>
      </div>
    );
  };

  /**
   * Get resource badge with icon
   */
  const getResourceBadge = (resource) => {
    const config = resourceConfig[resource] || resourceConfig.default;
    const Icon = config.icon;

    return (
      <div className="badge badge-outline badge-xs sm:badge-sm gap-1">
        <Icon size={8} className="sm:w-3 sm:h-3" />
        <span className="text-[10px] sm:text-xs">{resource}</span>
      </div>
    );
  };

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle export button click
   */
  const handleExport = () => {
    const filters = {
      action: selectedAction,
      resource: selectedResource,
      userId: selectedUserId,
      startDate,
      endDate,
      searchTerm,
      viewMode
    };
    showExportOptions(logs, filters, setIsExporting);
  };

  /**
   * Handle search
   */
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      refetchLogs();
      return;
    }

    try {
      const params = new URLSearchParams({
        q: searchTerm,
        page: currentPage,
        limit: itemsPerPage,
        ...(selectedAction && { action: selectedAction }),
        ...(selectedResource && { resource: selectedResource }),
        ...(selectedUserId && { userId: selectedUserId }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const res = await axiosInstance.get(`/audit-logs/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data) {
        refetchLogs();
      }
    } catch (error) {
      console.error("Error searching audit logs:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to search audit logs",
        icon: "error",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          title: "text-lg font-bold text-error",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    }
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedAction("");
    setSelectedResource("");
    setSelectedUserId("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  /**
   * Toggle log expansion for details view
   */
  const toggleLogExpansion = (logId) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  /**
   * Handle reset all logs (dangerous action)
   */
  const handleResetLogs = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete all audit logs. This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete all",
      cancelButtonText: "Cancel",
      background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        title: "text-lg font-bold text-warning",
        confirmButton: "btn btn-sm btn-error text-white",
        cancelButton: "btn btn-sm",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete("/audit-logs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        await Swal.fire({
          title: "Deleted!",
          text: "All audit logs have been removed.",
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

        refetchLogs();
      } catch (error) {
        console.error("Error resetting logs:", error);
        await Swal.fire({
          title: "Error!",
          text: "Failed to delete audit logs.",
          icon: "error",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
            title: "text-lg font-bold text-error",
            confirmButton: "btn btn-sm btn-error text-white",
          },
          buttonsStyling: false,
        });
      }
    }
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedAction, selectedResource, selectedUserId, startDate, endDate, searchTerm]);

  // ==================== LOADING & ERROR STATES ====================

  if (loadingLogs || loadingSummary || loadingStats) return <BloodLoader />;

  if (logsError || summaryError || statsError) {
    return (
      <ErrorState
        error={[logsErrorData, summaryErrorData, statsErrorData]}
        onRetry={() => {
          refetchLogs();
          refetchSummary();
          refetchStats();
        }}
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
            <FaHistory className="text-error" />
            Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Track and monitor all system activities and user actions
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2">
          {/* View Mode Toggle */}
          <div className="join">
            <button
              onClick={() => setViewMode("list")}
              className={`join-item btn btn-xs sm:btn-sm ${viewMode === "list" ? "btn-error" : "btn-outline"}`}
            >
              <FiActivity size={12} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline ml-1">List</span>
            </button>
            <button
              onClick={() => setViewMode("stats")}
              className={`join-item btn btn-xs sm:btn-sm ${viewMode === "stats" ? "btn-error" : "btn-outline"}`}
            >
              <FiBarChart2 size={12} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline ml-1">Stats</span>
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="btn btn-outline btn-xs sm:btn-sm gap-1 sm:gap-2"
            disabled={isExporting || logs.length === 0}
          >
            {isExporting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span className="text-xs sm:text-sm">Exporting...</span>
              </>
            ) : (
              <>
                <FiDownload size={12} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Export ({logs.length})</span>
              </>
            )}
          </button>

          {/* Reset Logs Button */}
          <button
            onClick={handleResetLogs}
            className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2"
          >
            <FiTrash2 size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Reset Logs</span>
          </button>
        </div>
      </motion.div>

      {/* ==================== DASHBOARD SUMMARY CARDS ==================== */}
      {summary && (
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {/* Today's Activity Card */}
          <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="stat-title text-xs sm:text-sm opacity-70">Today's Activity</p>
                <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-error">
                  {summary.activity?.today || 0}
                </p>
              </div>
              <div className="stat-figure bg-error/10 p-2 rounded-full">
                <FiActivity className="text-error text-sm sm:text-base" />
              </div>
            </div>
            <p className="stat-desc text-xs mt-2">Actions performed today</p>
          </motion.div>

          {/* This Week Card */}
          <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="stat-title text-xs sm:text-sm opacity-70">This Week</p>
                <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-info">
                  {summary.activity?.thisWeek || 0}
                </p>
              </div>
              <div className="stat-figure bg-info/10 p-2 rounded-full">
                <FiCalendar className="text-info text-sm sm:text-base" />
              </div>
            </div>
            <p className="stat-desc text-xs mt-2">Last 7 days</p>
          </motion.div>

          {/* This Month Card */}
          <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="stat-title text-xs sm:text-sm opacity-70">This Month</p>
                <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-success">
                  {summary.activity?.thisMonth || 0}
                </p>
              </div>
              <div className="stat-figure bg-success/10 p-2 rounded-full">
                <FiTrendingUp className="text-success text-sm sm:text-base" />
              </div>
            </div>
            <p className="stat-desc text-xs mt-2">Last 30 days</p>
          </motion.div>

          {/* Total Logs Card */}
          <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="stat-title text-xs sm:text-sm opacity-70">Total Logs</p>
                <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-warning">
                  {summary.summary?.totalLogs || 0}
                </p>
              </div>
              <div className="stat-figure bg-warning/10 p-2 rounded-full">
                <FiServer className="text-warning text-sm sm:text-base" />
              </div>
            </div>
            <p className="stat-desc text-xs mt-2">All time records</p>
          </motion.div>
        </motion.div>
      )}

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
                placeholder="Search actions, resources, or changes..."
                className="input input-bordered input-sm sm:input-md w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          {/* Action Filter */}
          <div className="w-full lg:w-40">
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="VERIFY">Verify</option>
              <option value="APPROVE">Approve</option>
              <option value="REJECT">Reject</option>
            </select>
          </div>

          {/* Resource Filter */}
          <div className="w-full lg:w-40">
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
            >
              <option value="">All Resources</option>
              <option value="User">User</option>
              <option value="Donor">Donor</option>
              <option value="Hospital">Hospital</option>
              <option value="Request">Request</option>
              <option value="BloodBank">Blood Bank</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="w-full lg:w-40">
            <input
              type="date"
              placeholder="Start Date"
              className="input input-bordered input-sm sm:input-md w-full"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="w-full lg:w-40">
            <input
              type="date"
              placeholder="End Date"
              className="input input-bordered input-sm sm:input-md w-full"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Sort Order */}
          <div className="w-full lg:w-32">
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <button
            className="btn btn-outline btn-sm btn-square"
            onClick={clearFilters}
            title="Clear filters"
          >
            <FiRefreshCw size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </motion.div>

      {/* ==================== RESULTS COUNT ==================== */}
      <motion.div variants={fadeInUp}>
        <ResultsCount
          endIndex={Math.min(currentPage * itemsPerPage, pagination.totalCount)}
          startIndex={(currentPage - 1) * itemsPerPage + 1}
          itemsPerPage={itemsPerPage}
          filteredUsers={logs}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
          totalCount={pagination.totalCount}
        />
      </motion.div>

      {/* ==================== CONTENT (LIST OR STATS) ==================== */}
      <AnimatePresence mode="wait">

        {/* ==================== LIST VIEW ==================== */}
        {viewMode === "list" && (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Recent Activities Feed */}
            {summary?.recentActivities && summary.recentActivities.length > 0 && (
              <motion.div
                variants={fadeInUp}
                className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4"
              >
                <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3 flex items-center gap-2">
                  <FiActivity className="text-error" />
                  Recent Activities
                </h3>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {summary.recentActivities.slice(0, 5).map((activity, idx) => {
                    const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
                        className="badge badge-outline gap-1 p-2 sm:p-3 text-[10px] sm:text-xs"
                      >
                        <span className="font-semibold">{activity.userName || "System"}</span>
                        <span>{activity.action}</span>
                        <span>{activity.resource}</span>
                        <span className="opacity-70 hidden xs:inline">{timeAgo}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Main Logs Table */}
            <motion.div
              variants={fadeInUp}
              className="overflow-x-auto bg-base-100 rounded-lg shadow-lg border border-base-300"
            >
              <table className="table table-xs sm:table-sm md:table-md w-full">
                <thead>
                  <tr className="bg-base-200">
                    <th className="w-8"></th>
                    <th className="text-xs sm:text-sm">Timestamp</th>
                    <th className="text-xs sm:text-sm hidden md:table-cell">User</th>
                    <th className="text-xs sm:text-sm">Action</th>
                    <th className="text-xs sm:text-sm">Resource</th>
                    <th className="text-xs sm:text-sm hidden lg:table-cell">IP Address</th>
                    <th className="text-xs sm:text-sm text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log, index) => {
                      const timeFormatted = formatTimestamp(log.timestamp);
                      const isExpanded = expandedLogId === log._id;

                      return (
                        <React.Fragment key={log._id}>
                          {/* Main Row */}
                          <motion.tr
                            variants={tableRowVariants}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            className="hover cursor-pointer"
                            onClick={() => toggleLogExpansion(log._id)}
                          >
                            <td>
                              <button className="btn btn-ghost btn-xs btn-square">
                                {isExpanded ?
                                  <FiChevronUp size={12} className="sm:w-4 sm:h-4" /> :
                                  <FiChevronDown size={12} className="sm:w-4 sm:h-4" />
                                }
                              </button>
                            </td>

                            {/* Timestamp */}
                            <td>
                              <div className="tooltip" data-tip={timeFormatted.full}>
                                <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                                  <FiClock size={8} className="sm:w-3 sm:h-3 text-base-content/50" />
                                  <span className="hidden xs:inline">{timeFormatted.relative}</span>
                                  <span className="xs:hidden">{timeFormatted.time}</span>
                                </div>
                                <div className="text-[8px] sm:text-xs text-base-content/50 xs:hidden">
                                  {timeFormatted.time}
                                </div>
                              </div>
                            </td>

                            {/* User - Hidden on mobile */}
                            <td className="hidden md:table-cell">
                              {log.user ? (
                                <div>
                                  <div className="font-medium text-xs sm:text-sm truncate max-w-32">
                                    {log.user.name || "N/A"}
                                  </div>
                                  <div className="text-[8px] sm:text-xs text-base-content/50 truncate max-w-32">
                                    {log.user.email}
                                  </div>
                                  <div className="badge badge-xs mt-1">{log.user.role}</div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-xs sm:text-sm text-base-content/50">
                                  <FiUser size={10} className="sm:w-3 sm:h-3" />
                                  System
                                </div>
                              )}
                            </td>

                            {/* Action */}
                            <td>{getActionBadge(log.action)}</td>

                            {/* Resource */}
                            <td>
                              <div className="flex items-center gap-2">
                                {getResourceBadge(log.resource)}
                                {log.resourceId && (
                                  <span className="text-[8px] sm:text-xs text-base-content/50 hidden xl:inline">
                                    ID: {log.resourceId.toString().slice(-6)}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* IP Address - Hidden on tablet */}
                            <td className="hidden lg:table-cell">
                              <div className="flex items-center gap-1 text-xs sm:text-sm">
                                <FiGlobe size={10} className="sm:w-3 sm:h-3 text-base-content/50" />
                                <span className="truncate max-w-24">{log.ipAddress || "N/A"}</span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="text-center">
                              <button
                                className="btn btn-ghost btn-xs btn-square tooltip"
                                data-tip="View Details"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLogExpansion(log._id);
                                }}
                              >
                                <FiEye size={12} className="sm:w-4 sm:h-4" />
                              </button>
                            </td>
                          </motion.tr>

                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <td colSpan={7} className="bg-base-200/50 p-3 sm:p-4">
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: 0.1 }}
                                  className="space-y-3"
                                >
                                  <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                                    <FiActivity size={12} className="sm:w-4 sm:h-4 text-error" />
                                    Audit Log Details
                                  </h4>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {/* Basic Information */}
                                    <div className="bg-base-100 rounded-lg p-3 border border-base-300">
                                      <h5 className="text-[10px] sm:text-xs font-semibold mb-2 text-base-content/70">
                                        Basic Information
                                      </h5>
                                      <div className="space-y-1 text-[8px] sm:text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-base-content/50">Log ID:</span>
                                          <span className="font-mono truncate max-w-32">{log._id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-base-content/50">Timestamp:</span>
                                          <span>{timeFormatted.full}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-base-content/50">Action:</span>
                                          <span>{log.action}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-base-content/50">Resource:</span>
                                          <span>{log.resource}</span>
                                        </div>
                                        {log.resourceId && (
                                          <div className="flex justify-between">
                                            <span className="text-base-content/50">Resource ID:</span>
                                            <span className="font-mono truncate max-w-32">{log.resourceId.toString()}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* User Information */}
                                    <div className="bg-base-100 rounded-lg p-3 border border-base-300">
                                      <h5 className="text-[10px] sm:text-xs font-semibold mb-2 text-base-content/70">
                                        User Information
                                      </h5>
                                      {log.user ? (
                                        <div className="space-y-1 text-[8px] sm:text-xs">
                                          <div className="flex justify-between">
                                            <span className="text-base-content/50">Name:</span>
                                            <span className="truncate max-w-32">{log.user.name || "N/A"}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-base-content/50">Email:</span>
                                            <span className="truncate max-w-32">{log.user.email}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-base-content/50">Role:</span>
                                            <span className="badge badge-xs">{log.user.role}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-base-content/50">User ID:</span>
                                            <span className="font-mono truncate max-w-32">{log.userId?.toString()}</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-[8px] sm:text-xs text-base-content/50">System Action</div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Changes Section */}
                                  {log.changes && (
                                    <div className="bg-base-100 rounded-lg p-3 border border-base-300">
                                      <h5 className="text-[10px] sm:text-xs font-semibold mb-2 text-base-content/70">
                                        Changes
                                      </h5>
                                      <div className="overflow-x-auto">
                                        <table className="table table-xs">
                                          <thead>
                                            <tr className="text-[8px] sm:text-xs">
                                              <th>Field</th>
                                              <th>Old Value</th>
                                              <th>New Value</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {Object.entries(log.changes).map(([field, value]) => (
                                              <tr key={field} className="text-[8px] sm:text-xs">
                                                <td className="font-medium">{field}</td>
                                                <td className="text-base-content/70 wrap-break-word max-w-40">
                                                  {typeof value.old === "object"
                                                    ? JSON.stringify(value.old)
                                                    : String(value.old || "—")}
                                                </td>
                                                <td className="text-success wrap-break-word max-w-40">
                                                  {typeof value.new === "object"
                                                    ? JSON.stringify(value.new)
                                                    : String(value.new || "—")}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              </td>
                            </motion.tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    // Empty State
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <td colSpan={7} className="text-center py-8 sm:py-12">
                        <div className="flex flex-col items-center gap-2">
                          <FaHistory size={32} className="sm:w-12 sm:h-12 text-base-content/30" />
                          <h3 className="text-sm sm:text-base font-semibold text-base-content/70">No audit logs found</h3>
                          <p className="text-xs sm:text-sm text-base-content/50">
                            Try adjusting your filters or date range
                          </p>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </tbody>
              </table>
            </motion.div>

            {/* Pagination */}
            {logs.length > 0 && (
              <motion.div variants={fadeInUp}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ==================== STATISTICS VIEW ==================== */}
        {viewMode === "stats" && (
          <motion.div
            key="stats-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 sm:space-y-6"
          >
            {loadingStats ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-8 sm:py-12"
              >
                <BloodLoader />
              </motion.div>
            ) : statsData?.data ? (
              <>
                {/* Summary Stats Cards */}
                <motion.div
                  variants={staggerContainer}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
                >
                  {/* Total Actions Card */}
                  <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="stat-title text-xs sm:text-sm opacity-70">Total Actions</p>
                        <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-error">
                          {statsData.data.totals?.[0]?.totalLogs || 0}
                        </p>
                      </div>
                      <div className="stat-figure bg-error/10 p-2 rounded-full">
                        <FiActivity className="text-error text-sm sm:text-base" />
                      </div>
                    </div>
                    <p className="stat-desc text-xs mt-2">Last {statsData.data.period || 30} days</p>
                  </motion.div>

                  {/* Active Users Card */}
                  <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="stat-title text-xs sm:text-sm opacity-70">Active Users</p>
                        <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-info">
                          {statsData.data.totals?.[0]?.uniqueUsers || 0}
                        </p>
                      </div>
                      <div className="stat-figure bg-info/10 p-2 rounded-full">
                        <FiUsers className="text-info text-sm sm:text-base" />
                      </div>
                    </div>
                    <p className="stat-desc text-xs mt-2">Unique users</p>
                  </motion.div>

                  {/* Resources Card */}
                  <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="stat-title text-xs sm:text-sm opacity-70">Resources</p>
                        <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-success">
                          {statsData.data.totals?.[0]?.uniqueResources || 0}
                        </p>
                      </div>
                      <div className="stat-figure bg-success/10 p-2 rounded-full">
                        <FiServer className="text-success text-sm sm:text-base" />
                      </div>
                    </div>
                    <p className="stat-desc text-xs mt-2">Accessed resources</p>
                  </motion.div>

                  {/* Action Types Card */}
                  <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="stat-title text-xs sm:text-sm opacity-70">Action Types</p>
                        <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-warning">
                          {statsData.data.totals?.[0]?.uniqueActions || 0}
                        </p>
                      </div>
                      <div className="stat-figure bg-warning/10 p-2 rounded-full">
                        <FiTrendingUp className="text-warning text-sm sm:text-base" />
                      </div>
                    </div>
                    <p className="stat-desc text-xs mt-2">Unique actions</p>
                  </motion.div>
                </motion.div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Actions by Type Chart */}
                  <motion.div
                    variants={fadeInUp}
                    className="bg-base-100 rounded-lg shadow-lg p-3 sm:p-4"
                  >
                    <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                      <FiActivity className="text-error" />
                      Actions by Type
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {statsData.data.byAction?.map((action, idx) => {
                        const config = actionConfig[action._id?.toUpperCase()] || actionConfig.default;
                        const Icon = config.icon;
                        const total = statsData.data.totals?.[0]?.totalLogs || 1;
                        const percentage = ((action.count / total) * 100).toFixed(1);

                        return (
                          <motion.div
                            key={action._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 + idx * 0.05 }}
                            className="flex items-center gap-2 sm:gap-3"
                          >
                            <div className={`badge badge-${config.color} badge-xs sm:badge-sm gap-1 w-16 sm:w-24`}>
                              <Icon size={8} className="sm:w-3 sm:h-3" />
                              <span className="text-[8px] sm:text-xs">{config.label}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-[8px] sm:text-xs">{action.count} actions</span>
                                <span className="text-[8px] sm:text-xs text-base-content/50">{percentage}%</span>
                              </div>
                              <progress
                                className="progress progress-error w-full h-1.5 sm:h-2"
                                value={action.count}
                                max={total}
                              ></progress>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Resources by Type Chart */}
                  <motion.div
                    variants={fadeInUp}
                    className="bg-base-100 rounded-lg shadow-lg p-3 sm:p-4"
                  >
                    <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                      <FiServer className="text-info" />
                      Resources Accessed
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {statsData.data.byResource?.map((resource, idx) => {
                        const total = statsData.data.totals?.[0]?.totalLogs || 1;
                        const percentage = ((resource.count / total) * 100).toFixed(1);

                        return (
                          <motion.div
                            key={resource._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + idx * 0.05 }}
                            className="flex items-center gap-2 sm:gap-3"
                          >
                            <div className="badge badge-outline badge-xs sm:badge-sm w-16 sm:w-24">
                              <span className="text-[8px] sm:text-xs">{resource._id}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-[8px] sm:text-xs">{resource.count} accesses</span>
                                <span className="text-[8px] sm:text-xs text-base-content/50">{percentage}%</span>
                              </div>
                              <progress
                                className="progress progress-info w-full h-1.5 sm:h-2"
                                value={resource.count}
                                max={total}
                              ></progress>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Activity by Hour Heatmap */}
                  <motion.div
                    variants={fadeInUp}
                    className="bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 lg:col-span-2"
                  >
                    <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                      <FiClock className="text-warning" />
                      Activity by Hour
                    </h3>
                    <div className="grid grid-cols-24 gap-1 overflow-x-auto pb-2">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const hourData = statsData.data.byHour?.find(h => h._id === hour);
                        const count = hourData?.count || 0;
                        const maxCount = Math.max(...(statsData.data.byHour?.map(h => h.count) || [1]));
                        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

                        return (
                          <motion.div
                            key={hour}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.45 + hour * 0.01 }}
                            className="flex flex-col items-center min-w-6"
                          >
                            <div className="tooltip" data-tip={`${count} actions at ${hour}:00`}>
                              <div className="w-4 sm:w-6 bg-base-200 rounded relative" style={{ height: "40px", sm: { height: "60px" } }}>
                                <div
                                  className="absolute bottom-0 w-full bg-error rounded"
                                  style={{ height: `${height}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-[8px] sm:text-xs mt-1">{hour}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Top Users Table */}
                  {statsData.data.topUsers && statsData.data.topUsers.length > 0 && (
                    <motion.div
                      variants={fadeInUp}
                      className="bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 lg:col-span-2"
                    >
                      <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                        <FiUsers className="text-success" />
                        Most Active Users
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="table table-xs sm:table-sm w-full">
                          <thead>
                            <tr className="text-[8px] sm:text-xs">
                              <th>User</th>
                              <th>Role</th>
                              <th>Actions</th>
                              <th>Percentage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statsData.data.topUsers.map((userStat, idx) => {
                              const total = statsData.data.totals?.[0]?.totalLogs || 1;
                              const percentage = ((userStat.count / total) * 100).toFixed(1);

                              return (
                                <motion.tr
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.55 + idx * 0.03 }}
                                  className="text-[8px] sm:text-xs"
                                >
                                  <td>
                                    <div className="flex items-center gap-2">
                                      <div className="avatar placeholder hidden xs:block">
                                        <div className="bg-error/10 text-error rounded-full w-6 h-6 sm:w-8 sm:h-8">
                                          <span className="text-[10px] sm:text-xs">
                                            {userStat.user?.name?.charAt(0) || "U"}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="font-medium truncate max-w-24 sm:max-w-32">
                                          {userStat.user?.name || "Unknown"}
                                        </div>
                                        <div className="text-[6px] sm:text-xs text-base-content/50 truncate max-w-24 sm:max-w-32">
                                          {userStat.user?.email}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="badge badge-xs">{userStat.user?.role || "N/A"}</div>
                                  </td>
                                  <td>
                                    <span className="font-semibold">{userStat.count}</span>
                                  </td>
                                  <td>
                                    <div className="flex items-center gap-2">
                                      <progress
                                        className="progress progress-success w-12 sm:w-20 h-1 sm:h-2"
                                        value={userStat.count}
                                        max={total}
                                      ></progress>
                                      <span className="text-[6px] sm:text-xs">{percentage}%</span>
                                    </div>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              // Empty state for stats view
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 sm:py-12"
              >
                <FiBarChart2 size={32} className="sm:w-12 sm:h-12 mx-auto text-base-content/30 mb-4" />
                <h3 className="text-sm sm:text-base font-semibold">No statistics available</h3>
                <p className="text-xs sm:text-sm text-base-content/50">Try adjusting your filters</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AuditLogs;