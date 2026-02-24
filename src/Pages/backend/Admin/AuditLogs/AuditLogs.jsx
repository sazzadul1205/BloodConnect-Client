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

const AuditLogs = () => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // Pagination and filter states
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

  // Action icons and colors mapping
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

  // Resource icons mapping
  const resourceConfig = {
    User: { icon: FiUsers, color: "primary" },
    Admin: { icon: FiShield, color: "error" },
    Donor: { icon: FiUser, color: "success" },
    default: { icon: FiServer, color: "ghost" },
    Hospital: { icon: FiServer, color: "info" },
    Request: { icon: FiActivity, color: "warning" },
    BloodBank: { icon: FiServer, color: "secondary" },
  };

  // 🔹 Fetch Audit Logs (Base route: /)
  const {
    data: auditData,
    isLoading: loadingLogs,
    isError: logsError,
    error: logsErrorData,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["audit-logs", currentPage, itemsPerPage, sortBy, sortOrder, selectedAction, selectedResource, selectedUserId, startDate, endDate],
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
  });

  // 🔹 Fetch Dashboard Summary (/dashboard/summary)
  const {
    data: summaryData,
    isLoading: loadingSummary,
    isError: summaryError,
    error: summaryErrorData,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["audit-summary"],
    queryFn: async () => {
      const res = await axiosInstance.get("/audit-logs/dashboard/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // 🔹 Fetch Action Statistics (/stats/actions)
  const {
    data: statsData,
    isLoading: loadingStats,
    isError: statsError,
    error: statsErrorData,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["audit-stats"],
    queryFn: async () => {
      const res = await axiosInstance.get("/audit-logs/stats/actions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: viewMode === "stats",
  });

  // Format timestamp
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

  // Get action badge
  const getActionBadge = (action) => {
    const config = actionConfig[action?.toUpperCase()] || actionConfig.default;
    const Icon = config.icon;

    return (
      <div className={`badge badge-${config.color} gap-1`}>
        <Icon size={12} />
        {config.label}
      </div>
    );
  };

  // Get resource badge
  const getResourceBadge = (resource) => {
    const config = resourceConfig[resource] || resourceConfig.default;
    const Icon = config.icon;

    return (
      <div className="badge badge-outline gap-1">
        <Icon size={12} />
        {resource}
      </div>
    );
  };

  // Handle export button click - FIXED
  const handleExport = () => {
    // Prepare filters for metadata
    const filters = {
      action: selectedAction,
      resource: selectedResource,
      userId: selectedUserId,
      startDate,
      endDate,
      searchTerm,
      viewMode
    };

    // Show export options modal with current logs and filters
    showExportOptions(logs, filters, setIsExporting);
  };

  // Handle search
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

      // Update the data with search results
      // You might want to set this to a separate state, but for now we'll just refetch
      if (res.data) {
        refetchLogs();
      }
    } catch (error) {
      console.error("Error searching audit logs:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to search audit logs",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          title: "text-lg font-bold text-error",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    }
  };

  // Handle clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedAction("");
    setSelectedResource("");
    setSelectedUserId("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  // Toggle log expansion
  const toggleLogExpansion = (logId) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedAction, selectedResource, selectedUserId, startDate, endDate, searchTerm]);

  // Loading state
  if (loadingLogs || loadingSummary || loadingStats) return <BloodLoader />;

  // Error state
  if (logsError || summaryError || statsError) {
    return (
      <ErrorState
        error={[logsErrorData, summaryErrorData, statsErrorData]}
        onRetry={() => refetchLogs() && refetchSummary() && refetchStats()}
      />
    );
  }

  const logs = auditData?.data || [];
  const pagination = auditData?.pagination || { totalCount: 0, totalPages: 1 };
  const summary = summaryData?.data || null;

  // Handle reset all logs
  const handleResetLogs = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete all audit logs. This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete all",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        title: "text-lg font-bold text-warning",
        confirmButton: "btn btn-sm btn-error text-white",
        cancelButton: "btn btn-sm",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      try {
        // Call your API endpoint to delete logs
        await axiosInstance.delete("/audit-logs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        await Swal.fire({
          title: "Deleted!",
          text: "All audit logs have been removed.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          },
        });

        // Refresh the list
        refetchLogs();
      } catch (error) {
        console.error("Error resetting logs:", error);
        await Swal.fire({
          title: "Error!",
          text: "Failed to delete audit logs.",
          icon: "error",
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            title: "text-lg font-bold text-error",
            confirmButton: "btn btn-sm btn-error text-white",
          },
          buttonsStyling: false,
        });
      }
    }
  };

  return (
    // Page shell: full-height admin audit surface with neutral background and consistent padding.
    <div className="min-h-screen bg-base-200 p-6">
      {/* Header Section with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        {/* Header copy: communicates context and purpose of the audit logs dashboard. */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {/* Visual identity icon for audit/logging system. */}
            <FaHistory className="text-error" />
            Audit Logs
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Track and monitor all system activities and user actions
          </p>
        </div>

        {/* Toolbar: view toggle + export + reset utility actions. */}
        <div className="flex gap-2">
          {/* View Mode Toggle: switches between list view and statistics view. */}
          <div className="join">
            <button
              onClick={() => setViewMode("list")}
              className={`join-item btn btn-sm ${viewMode === "list" ? "btn-error" : "btn-outline"}`}
            >
              <FiActivity size={16} />
              List
            </button>
            <button
              onClick={() => setViewMode("stats")}
              className={`join-item btn btn-sm ${viewMode === "stats" ? "btn-error" : "btn-outline"}`}
            >
              <FiBarChart2 size={16} />
              Stats
            </button>
          </div>

          {/* Export Button with Count: exports current filtered log set with item count. */}
          <button
            onClick={handleExport}
            className="btn btn-outline btn-sm gap-2"
            disabled={isExporting || logs.length === 0}
          >
            {isExporting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Exporting...
              </>
            ) : (
              <>
                <FiDownload size={16} />
                Export ({logs.length})
              </>
            )}
          </button>

          {/* Reset All Logs Button: destructive action to clear entire audit trail. */}
          <button
            onClick={handleResetLogs}
            className="btn btn-error btn-sm gap-2"
          >
            <FiTrash2 size={16} />
            Reset Logs
          </button>
        </div>
      </motion.div>

      {/* Dashboard Summary Cards with Staggered Fade In */}
      {summary && (
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {/* Card 1: Today's Activity - immediate operational pulse. */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.4 }}
            className="stat bg-base-100 rounded-lg shadow-lg p-4"
          >
            {/* KPI icon area with brand-consistent error color. */}
            <div className="stat-figure text-error">
              <FiActivity size={24} />
            </div>
            {/* KPI label. */}
            <p className="stat-title">Today's Activity</p>
            {/* KPI primary numeric value. */}
            <p className="stat-value text-3xl">{summary.activity?.today || 0}</p>
            {/* Secondary context line. */}
            <p className="stat-desc">Actions performed today</p>
          </motion.div>

          {/* Card 2: This Week - weekly trend indicator. */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.4 }}
            className="stat bg-base-100 rounded-lg shadow-lg p-4"
          >
            <div className="stat-figure text-info">
              <FiCalendar size={24} />
            </div>
            <p className="stat-title">This Week</p>
            <p className="stat-value text-3xl">{summary.activity?.thisWeek || 0}</p>
            <p className="stat-desc">Last 7 days</p>
          </motion.div>

          {/* Card 3: This Month - monthly volume snapshot. */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.4 }}
            className="stat bg-base-100 rounded-lg shadow-lg p-4"
          >
            <div className="stat-figure text-success">
              <FiTrendingUp size={24} />
            </div>
            <p className="stat-title">This Month</p>
            <p className="stat-value text-3xl">{summary.activity?.thisMonth || 0}</p>
            <p className="stat-desc">Last 30 days</p>
          </motion.div>

          {/* Card 4: Total Logs - all-time record count. */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            transition={{ duration: 0.4 }}
            className="stat bg-base-100 rounded-lg shadow-lg p-4"
          >
            <div className="stat-figure text-warning">
              <FiServer size={24} />
            </div>
            <p className="stat-title">Total Logs</p>
            <p className="stat-value text-3xl">{summary.summary?.totalLogs || 0}</p>
            <p className="stat-desc">All time records</p>
          </motion.div>
        </motion.div>
      )}

      {/* Filters Section with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 mb-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search input: free-text search across actions, resources, and changes. */}
          <div className="flex-1">
            <div className="form-control">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search actions, resources, or changes..."
                  className="input input-bordered w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
          </div>

          {/* Action Filter: dropdown for CRUD + auth operation types. */}
          <div className="w-full lg:w-40">
            <select
              className="select select-bordered w-full"
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

          {/* Resource Filter: scopes to specific domain entity types. */}
          <div className="w-full lg:w-40">
            <select
              className="select select-bordered w-full"
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

          {/* Date Range: start and end date pickers for temporal filtering. */}
          <div className="w-full lg:w-40">
            <input
              type="date"
              placeholder="Start Date"
              className="input input-bordered w-full"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="w-full lg:w-40">
            <input
              type="date"
              placeholder="End Date"
              className="input input-bordered w-full"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Sort Order: newest/oldest first toggle. */}
          <div className="w-full lg:w-32">
            <select
              className="select select-bordered w-full"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          {/* Clear Filters: resets all filter inputs to default. */}
          <button
            className="btn btn-outline btn-square"
            onClick={clearFilters}
            title="Clear filters"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
      </motion.div>

      {/* Results Count with Fade In: shows current range and total items. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-4"
      >
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

      {/* Content based on view mode with AnimatePresence for smooth transitions */}
      <AnimatePresence mode="wait">
        {/* List View: tabular audit log display with expandable details. */}
        {viewMode === "list" && (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Recent Activities Feed: latest actions from summary payload. */}
            {summary?.recentActivities && summary.recentActivities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4"
              >
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FiActivity className="text-error" />
                  Recent Activities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {summary.recentActivities.slice(0, 5).map((activity, idx) => {
                    const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
                        className="badge badge-outline gap-1 p-3"
                      >
                        <span className="font-semibold">{activity.userName || "System"}</span>
                        <span>{activity.action}</span>
                        <span>{activity.resource}</span>
                        <span className="text-xs opacity-70">{timeAgo}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Main Logs Table with Fade In */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="overflow-x-auto bg-base-100 rounded-lg shadow-lg border border-base-300"
            >
              <table className="table table-zebra w-full">
                {/* Table Header: column definitions for audit trail. */}
                <thead>
                  <tr className="bg-base-200">
                    <th className="w-8"></th>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>IP Address</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>

                {/* Table Body with staggered row animations */}
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log, index) => {
                      const timeFormatted = formatTimestamp(log.timestamp);
                      const isExpanded = expandedLogId === log._id;

                      return (
                        <React.Fragment key={log._id}>
                          {/* Main row with hover expansion trigger */}
                          <motion.tr
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.25 + index * 0.02 }}
                            className="hover cursor-pointer"
                            onClick={() => toggleLogExpansion(log._id)}
                          >
                            <td>
                              <button className="btn btn-ghost btn-xs btn-square">
                                {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                              </button>
                            </td>

                            {/* Timestamp cell with relative/absolute tooltip */}
                            <td>
                              <div className="tooltip" data-tip={timeFormatted.full}>
                                <div className="flex items-center gap-1 text-sm">
                                  <FiClock size={12} className="text-base-content/50" />
                                  <span>{timeFormatted.relative}</span>
                                </div>
                                <div className="text-xs text-base-content/50">
                                  {timeFormatted.time}
                                </div>
                              </div>
                            </td>

                            {/* User information with role badge */}
                            <td>
                              {log.user ? (
                                <div>
                                  <div className="font-medium text-sm">{log.user.name || "N/A"}</div>
                                  <div className="text-xs text-base-content/50">{log.user.email}</div>
                                  <div className="badge badge-xs badge-outline mt-1">{log.user.role}</div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-sm text-base-content/50">
                                  <FiUser size={14} />
                                  System
                                </div>
                              )}
                            </td>

                            {/* Action with color-coded badge */}
                            <td>{getActionBadge(log.action)}</td>

                            {/* Resource type with truncated ID */}
                            <td>
                              <div className="flex items-center gap-2">
                                {getResourceBadge(log.resource)}
                                {log.resourceId && (
                                  <span className="text-xs text-base-content/50">
                                    ID: {log.resourceId.toString().slice(-6)}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* IP Address with globe icon */}
                            <td>
                              <div className="flex items-center gap-1 text-sm">
                                <FiGlobe size={12} className="text-base-content/50" />
                                <span>{log.ipAddress || "N/A"}</span>
                              </div>
                            </td>

                            {/* Actions column with detail view button */}
                            <td className="text-center">
                              <button
                                className="btn btn-ghost btn-xs btn-square tooltip"
                                data-tip="View Details"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLogExpansion(log._id);
                                }}
                              >
                                <FiEye size={14} />
                              </button>
                            </td>
                          </motion.tr>

                          {/* Expanded Details Row with slide-down animation */}
                          {isExpanded && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <td colSpan={7} className="bg-base-200/50 p-4">
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: 0.1 }}
                                  className="space-y-3"
                                >
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <FiActivity size={16} className="text-error" />
                                    Audit Log Details
                                  </h4>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Basic Information Card */}
                                    <motion.div
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.15 }}
                                      className="bg-base-100 rounded-lg p-3 border border-base-300"
                                    >
                                      <h5 className="text-sm font-semibold mb-2 text-base-content/70">
                                        Basic Information
                                      </h5>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-base-content/50">Log ID:</span>
                                          <span className="font-mono">{log._id}</span>
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
                                            <span className="font-mono">{log.resourceId.toString()}</span>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>

                                    {/* User Information Card */}
                                    <motion.div
                                      initial={{ opacity: 0, x: 10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.2 }}
                                      className="bg-base-100 rounded-lg p-3 border border-base-300"
                                    >
                                      <h5 className="text-sm font-semibold mb-2 text-base-content/70">
                                        User Information
                                      </h5>
                                      {log.user ? (
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-base-content/50">Name:</span>
                                            <span>{log.user.name || "N/A"}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-base-content/50">Email:</span>
                                            <span>{log.user.email}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-base-content/50">Role:</span>
                                            <span className="badge badge-xs">{log.user.role}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-base-content/50">User ID:</span>
                                            <span className="font-mono">{log.userId?.toString()}</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-sm text-base-content/50">System Action</div>
                                      )}
                                    </motion.div>
                                  </div>

                                  {/* Changes Section - only shows if there are field changes */}
                                  {log.changes && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.25 }}
                                      className="bg-base-100 rounded-lg p-3 border border-base-300"
                                    >
                                      <h5 className="text-sm font-semibold mb-3 text-base-content/70">
                                        Changes
                                      </h5>
                                      <div className="overflow-x-auto">
                                        <table className="table table-xs">
                                          <thead>
                                            <tr>
                                              <th>Field</th>
                                              <th>Old Value</th>
                                              <th>New Value</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {Object.entries(log.changes).map(([field, value]) => (
                                              <tr key={field}>
                                                <td className="font-medium">{field}</td>
                                                <td className="text-base-content/70">
                                                  {typeof value.old === "object"
                                                    ? JSON.stringify(value.old)
                                                    : String(value.old || "—")}
                                                </td>
                                                <td className="text-success">
                                                  {typeof value.new === "object"
                                                    ? JSON.stringify(value.new)
                                                    : String(value.new || "—")}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </motion.div>
                                  )}
                                </motion.div>
                              </td>
                            </motion.tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    // Empty state with animation
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <FaHistory size={48} className="text-base-content/30" />
                          <h3 className="text-lg font-semibold text-base-content/70">No audit logs found</h3>
                          <p className="text-sm text-base-content/50">
                            Try adjusting your filters or date range
                          </p>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </tbody>
              </table>
            </motion.div>

            {/* Pagination with fade in */}
            {logs.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Statistics View: analytical charts and aggregations */}
        {viewMode === "stats" && (
          <motion.div
            key="stats-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {loadingStats ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-12"
              >
                <BloodLoader />
              </motion.div>
            ) : statsData?.data ? (
              <>
                {/* Summary Cards with staggered animation */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1 }
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {/* Total Actions Card */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="stat bg-base-100 rounded-lg shadow-lg p-4"
                  >
                    <div className="stat-figure text-error">
                      <FiActivity size={24} />
                    </div>
                    <p className="stat-title">Total Actions</p>
                    <p className="stat-value text-3xl">{statsData.data.totals?.[0]?.totalLogs || 0}</p>
                    <p className="stat-desc">Last {statsData.data.period || 30} days</p>
                  </motion.div>

                  {/* Active Users Card */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="stat bg-base-100 rounded-lg shadow-lg p-4"
                  >
                    <div className="stat-figure text-info">
                      <FiUsers size={24} />
                    </div>
                    <p className="stat-title">Active Users</p>
                    <p className="stat-value text-3xl">{statsData.data.totals?.[0]?.uniqueUsers || 0}</p>
                    <p className="stat-desc">Unique users</p>
                  </motion.div>

                  {/* Resources Card */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="stat bg-base-100 rounded-lg shadow-lg p-4"
                  >
                    <div className="stat-figure text-success">
                      <FiServer size={24} />
                    </div>
                    <p className="stat-title">Resources</p>
                    <p className="stat-value text-3xl">{statsData.data.totals?.[0]?.uniqueResources || 0}</p>
                    <p className="stat-desc">Accessed resources</p>
                  </motion.div>

                  {/* Action Types Card */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    className="stat bg-base-100 rounded-lg shadow-lg p-4"
                  >
                    <div className="stat-figure text-warning">
                      <FiTrendingUp size={24} />
                    </div>
                    <p className="stat-title">Action Types</p>
                    <p className="stat-value text-3xl">{statsData.data.totals?.[0]?.uniqueActions || 0}</p>
                    <p className="stat-desc">Unique actions</p>
                  </motion.div>
                </motion.div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Actions by Type Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-base-100 rounded-lg shadow-lg p-4"
                  >
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FiActivity className="text-error" />
                      Actions by Type
                    </h3>
                    <div className="space-y-3">
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
                            className="flex items-center gap-3"
                          >
                            <div className={`badge badge-${config.color} gap-1 w-24`}>
                              <Icon size={12} />
                              {config.label}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">{action.count} actions</span>
                                <span className="text-sm text-base-content/50">{percentage}%</span>
                              </div>
                              <progress
                                className="progress progress-error w-full"
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-base-100 rounded-lg shadow-lg p-4"
                  >
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FiServer className="text-info" />
                      Resources Accessed
                    </h3>
                    <div className="space-y-3">
                      {statsData.data.byResource?.map((resource, idx) => {
                        const total = statsData.data.totals?.[0]?.totalLogs || 1;
                        const percentage = ((resource.count / total) * 100).toFixed(1);

                        return (
                          <motion.div
                            key={resource._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + idx * 0.05 }}
                            className="flex items-center gap-3"
                          >
                            <div className="badge badge-outline w-24">
                              {resource._id}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">{resource.count} accesses</span>
                                <span className="text-sm text-base-content/50">{percentage}%</span>
                              </div>
                              <progress
                                className="progress progress-info w-full"
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-base-100 rounded-lg shadow-lg p-4 lg:col-span-2"
                  >
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FiClock className="text-warning" />
                      Activity by Hour
                    </h3>
                    <div className="grid grid-cols-24 gap-1">
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
                            className="flex flex-col items-center"
                          >
                            <div className="tooltip" data-tip={`${count} actions at ${hour}:00`}>
                              <div className="w-6 bg-base-200 rounded relative" style={{ height: "60px" }}>
                                <div
                                  className="absolute bottom-0 w-full bg-error rounded"
                                  style={{ height: `${height}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-xs mt-1">{hour}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Top Users Table */}
                  {statsData.data.topUsers && statsData.data.topUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-base-100 rounded-lg shadow-lg p-4 lg:col-span-2"
                    >
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FiUsers className="text-success" />
                        Most Active Users
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="table table-sm">
                          <thead>
                            <tr>
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
                                >
                                  <td>
                                    <div className="flex items-center gap-2">
                                      <div className="avatar placeholder">
                                        <div className="bg-error/10 text-error rounded-full w-8 h-8">
                                          <span>{userStat.user?.name?.charAt(0) || "U"}</span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="font-medium">{userStat.user?.name || "Unknown"}</div>
                                        <div className="text-xs text-base-content/50">{userStat.user?.email}</div>
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
                                        className="progress progress-success w-20"
                                        value={userStat.count}
                                        max={total}
                                      ></progress>
                                      <span className="text-sm">{percentage}%</span>
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
                className="text-center py-12"
              >
                <FiBarChart2 size={48} className="mx-auto text-base-content/30 mb-4" />
                <h3 className="text-lg font-semibold">No statistics available</h3>
                <p className="text-sm text-base-content/50">Try adjusting your filters</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditLogs;