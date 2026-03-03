// Pages/backend/Admin/SystemStats/SystemStatistics.jsx

// React
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FaUsers,
  FaTint,
  FaHeartbeat,
  FaHospital,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaEquals,
  FaDownload,
  FaSync,
  FaBoxes,
  FaGlobe,
  FaShieldAlt,
  FaBell,
  FaFileAlt,
  FaClipboardList,
  FaUserCheck,
  FaUserClock,
  FaUserPlus,
  FaUserMinus,
  FaStar,
  FaRegCalendarAlt,
  FaUser,
} from "react-icons/fa";
import { FaDroplet } from "react-icons/fa6";

// Recharts
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import { formatAppDate, formatAppTime } from "../../../../utils/dateFormat";

// ==================== QUERY KEYS ====================

const queryKeys = {
  users: ['system-stats-users'],
  donors: ['system-stats-donors'],
  requests: ['system-stats-requests'],
  banks: ['system-stats-banks'],
  events: ['system-stats-events'],
  audit: (dateRange) => ['system-stats-audit', dateRange],
  dashboard: ['system-stats-dashboard'],
};

// ==================== CONSTANTS ====================

/**
 * Color palette for charts
 */
const COLORS = {
  primary: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#3b82f6",
  error: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  orange: "#f97316",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  gray: "#6b7280",
};

/**
 * Chart color cycle
 */
const CHART_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

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
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2
    }
  }
};

// ==================== MAIN COMPONENT ====================

/**
 * System Statistics Component
 * Comprehensive dashboard with charts and metrics across all system domains
 * 
 * @returns {JSX.Element} System statistics dashboard
 */
const SystemStatistics = () => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [dateRange, setDateRange] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query 1: Fetch all users
   */
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrorData,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/admin/all-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 2: Fetch donor statistics
   */
  const {
    data: donorStats,
    isLoading: donorsLoading,
    isError: donorsError,
    error: donorsErrorData,
    refetch: refetchDonors,
  } = useQuery({
    queryKey: queryKeys.donors,
    queryFn: async () => {
      const res = await axiosInstance.get(`/donors/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 3: Fetch request statistics
   */
  const {
    data: requestStats,
    isLoading: requestsLoading,
    isError: requestsError,
    error: requestsErrorData,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: queryKeys.requests,
    queryFn: async () => {
      const res = await axiosInstance.get(`/blood-requests/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 4: Fetch low inventory alerts
   */
  const {
    data: bankStats,
    isLoading: banksLoading,
    isError: banksError,
    error: banksErrorData,
    refetch: refetchBanks,
  } = useQuery({
    queryKey: queryKeys.banks,
    queryFn: async () => {
      const res = await axiosInstance.get(`/blood-banks/alerts/low-inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  /**
   * Query 5: Fetch event statistics
   */
  const {
    data: eventStats,
    isLoading: eventsLoading,
    isError: eventsError,
    error: eventsErrorData,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: queryKeys.events,
    queryFn: async () => {
      const res = await axiosInstance.get(`/donation-events/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 6: Fetch audit statistics (filtered by date range)
   */
  const {
    data: auditStats,
    isLoading: auditLoading,
    isError: auditError,
    error: auditErrorData,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: queryKeys.audit(dateRange),
    queryFn: async () => {
      const res = await axiosInstance.get(`/audit-logs/stats/actions?days=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  /**
   * Query 7: Fetch dashboard summary
   */
  const {
    data: dashboardSummary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErrorData,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const res = await axiosInstance.get(`/audit-logs/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ==================== COMPUTED VALUES ====================

  /**
   * Process all data for charts and display
   */
  const processedData = (() => {
    // User role distribution
    const users = usersData?.data || [];
    const roleDistribution = [
      { name: "Donors", value: users.filter(u => u.role === "donor").length, color: COLORS.primary },
      { name: "Requesters", value: users.filter(u => u.role === "requester").length, color: COLORS.info },
      { name: "Hospitals", value: users.filter(u => u.role === "hospital").length, color: COLORS.success },
      { name: "Blood Banks", value: users.filter(u => u.role === "blood_bank").length, color: COLORS.warning },
      { name: "Admins", value: users.filter(u => u.role === "admin" || u.role === "super_admin").length, color: COLORS.purple },
    ].filter(item => item.value > 0);

    // Blood type distribution from donor stats
    const bloodTypeDistribution = donorStats?.data?.bloodTypeDistribution || [];
    const bloodTypeData = bloodTypeDistribution.map(item => ({
      name: item._id || "Unknown",
      value: item.count || 0
    }));

    // Request status distribution
    const requestStatusData = requestStats?.data?.byStatus || [];
    const requestStatusMap = {
      pending: { name: "Pending", color: COLORS.warning },
      matched: { name: "Matched", color: COLORS.info },
      fulfilled: { name: "Fulfilled", color: COLORS.success },
      cancelled: { name: "Cancelled", color: COLORS.gray },
      expired: { name: "Expired", color: COLORS.gray }
    };

    const requestStatusChartData = requestStatusData.map(item => ({
      name: requestStatusMap[item._id]?.name || item._id,
      value: item.count || 0,
      color: requestStatusMap[item._id]?.color || COLORS.gray
    }));

    // Urgency distribution
    const urgencyData = requestStats?.data?.byUrgency || [];
    const urgencyMap = {
      emergency: { name: "Emergency", color: COLORS.error },
      urgent: { name: "Urgent", color: COLORS.warning },
      normal: { name: "Normal", color: COLORS.info }
    };

    const urgencyChartData = urgencyData.map(item => ({
      name: urgencyMap[item._id]?.name || item._id,
      value: item.count || 0,
      color: urgencyMap[item._id]?.color || COLORS.gray
    }));

    // Donation types (mock data - you might need to add this to your API)
    const donationTypeData = [
      { name: "Whole Blood", value: 456, color: COLORS.primary },
      { name: "Plasma", value: 234, color: COLORS.info },
      { name: "Platelets", value: 123, color: COLORS.success },
    ];

    // Top actions from audit
    const topActions = auditStats?.data?.byAction?.slice(0, 5) || [];

    // Recent activities
    const recentActivities = dashboardSummary?.data?.recentActivities || [];

    // User stats
    const totalUsers = users.length;
    const verifiedUsers = users.filter(u => u.verification?.isEmailVerified).length;
    const pendingUsers = users.filter(u => !u.verification?.isEmailVerified).length;
    const inactiveUsers = users.filter(u => u.isDeleted).length;

    // Donor stats
    const donorCounts = donorStats?.data?.counts || {};
    const totalDonors = donorCounts.total || 0;
    const activeDonors = donorCounts.active || 0;
    const eligibleDonors = donorCounts.eligible || 0;
    const emergencyDonors = donorCounts.emergency || 0;

    // Request stats
    const requestCounts = {
      total: requestStats?.data?.totals?.[0]?.totalEvents || 0,
      fulfilled: requestStats?.data?.totals?.[0]?.completedEvents || 0,
      pending: requestStatusData.find(s => s._id === "pending")?.count || 0,
      avgResponse: requestStats?.data?.averageResponseTime?.[0]?.avgTime
        ? Math.round(requestStats.data.averageResponseTime[0].avgTime / 3600000 * 10) / 10
        : 0
    };

    // Event stats
    const eventCounts = {
      total: eventStats?.data?.totals?.[0]?.totalEvents || 0,
      participants: eventStats?.data?.totals?.[0]?.totalRegistrations || 0,
      upcoming: eventStats?.data?.byStatus?.find(s => s._id === "upcoming")?.count || 0,
      completed: eventStats?.data?.byStatus?.find(s => s._id === "completed")?.count || 0
    };

    // Inventory stats
    const lowInventoryItems = bankStats?.data || [];
    const lowStockCount = lowInventoryItems.length;
    const totalLowUnits = lowInventoryItems.reduce((acc, bank) => {
      return acc + (bank.lowInventory?.reduce((sum, item) => sum + item.units, 0) || 0);
    }, 0);

    return {
      users: { total: totalUsers, verified: verifiedUsers, pending: pendingUsers, inactive: inactiveUsers },
      donors: { total: totalDonors, active: activeDonors, eligible: eligibleDonors, emergency: emergencyDonors },
      requests: requestCounts,
      events: eventCounts,
      inventory: { lowStock: lowStockCount, lowUnits: totalLowUnits },
      roleDistribution,
      bloodTypeData,
      requestStatusChartData,
      urgencyChartData,
      donationTypeData,
      topActions,
      recentActivities,
      auditSummary: dashboardSummary?.data?.summary || { totalLogs: 0, uniqueUsers: 0, uniqueResources: 0 },
      activityToday: dashboardSummary?.data?.activity?.today || 0
    };
  })();

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Format large numbers with K/M suffixes
   */
  const formatNumber = (num) => {
    if (!num && num !== 0) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || "0";
  };

  /**
   * Format percentage
   */
  const formatPercent = (value, total) => {
    if (!total || total === 0) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  /**
   * Get trend icon (mock - would need historical data)
   */
  const getTrendIcon = (trend) => {
    if (trend > 0) return <FaArrowUp className="text-success text-xs sm:text-sm" />;
    if (trend < 0) return <FaArrowDown className="text-error text-xs sm:text-sm" />;
    return <FaEquals className="text-warning text-xs sm:text-sm" />;
  };

  /**
   * Handle refresh all data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchUsers(),
      refetchDonors(),
      refetchRequests(),
      refetchBanks(),
      refetchEvents(),
      refetchAudit(),
      refetchSummary(),
    ]);
    setTimeout(() => setRefreshing(false), 500);
  };

  // ==================== LOADING & ERROR STATES ====================

  if (usersLoading || donorsLoading || requestsLoading || banksLoading || eventsLoading || auditLoading || summaryLoading) {
    return <BloodLoader />;
  }

  if (usersError || donorsError || requestsError || banksError || eventsError || auditError || summaryError) {
    return (
      <ErrorState
        error={[
          usersErrorData || donorsErrorData || requestsErrorData || banksErrorData || eventsErrorData || auditErrorData || summaryErrorData
        ]}
        onRetry={handleRefresh}
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <FaChartLine className="text-error" />
            System Statistics
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Comprehensive overview of platform metrics and performance
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date range selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="select select-bordered select-xs sm:select-sm w-24 sm:w-32"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className={`btn btn-outline btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 ${refreshing ? "loading" : ""}`}
            disabled={refreshing}
          >
            {!refreshing && <FaSync size={12} className="sm:w-4 sm:h-4" />}
            <span className="text-xs sm:text-sm">{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          {/* Export button */}
          <button className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2">
            <FaDownload size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Export</span>
          </button>
        </div>
      </motion.div>

      {/* ==================== QUICK KPIs ==================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* Total Users Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Total Users</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-error">
                {formatNumber(processedData.users.total)}
              </p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FaUsers className="text-error text-sm sm:text-base" />
            </div>
          </div>
          <div className="stat-desc flex items-center gap-1 mt-1">
            {getTrendIcon(12)}
          </div>
          <div className="mt-2 text-[10px] sm:text-xs">
            <span className="text-success">+{processedData.users.verified}</span> verified
          </div>
        </motion.div>

        {/* Active Donors Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Active Donors</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-success">
                {formatNumber(processedData.donors.active)}
              </p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FaTint className="text-success text-sm sm:text-base" />
            </div>
          </div>
          <div className="stat-desc flex items-center gap-1 mt-1">
            {getTrendIcon(8)}
          </div>
          <div className="mt-2 text-[10px] sm:text-xs">
            <span className="text-warning">{processedData.donors.total - processedData.donors.active}</span> inactive
          </div>
        </motion.div>

        {/* Blood Requests Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Blood Requests</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-warning">
                {formatNumber(processedData.requests.total)}
              </p>
            </div>
            <div className="stat-figure bg-warning/10 p-2 rounded-full">
              <FaHeartbeat className="text-warning text-sm sm:text-base" />
            </div>
          </div>
          <div className="stat-desc flex items-center gap-1 mt-1">
            {getTrendIcon(-5)}
          </div>
          <div className="mt-2 text-[10px] sm:text-xs">
            <span className="text-error">{processedData.requests.pending}</span> pending
          </div>
        </motion.div>

        {/* Blood Banks Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Blood Banks</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-info">
                {formatNumber(usersData?.data?.filter(u => u.role === "blood_bank").length || 0)}
              </p>
            </div>
            <div className="stat-figure bg-info/10 p-2 rounded-full">
              <FaHospital className="text-info text-sm sm:text-base" />
            </div>
          </div>
          <div className="stat-desc flex items-center gap-1 mt-1">
            {getTrendIcon(3)}
          </div>
          <div className="mt-2 text-[10px] sm:text-xs">
            <span className="text-success">{bankStats?.count || 0}</span> low inventory
          </div>
        </motion.div>
      </motion.div>

      {/* ==================== TAB NAVIGATION ==================== */}
      <motion.div
        variants={fadeInUp}
        className="tabs tabs-boxed bg-base-100 p-1 overflow-x-auto flex-nowrap"
      >
        <button
          className={`tab tab-xs sm:tab-md lg:tab-lg ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <FaChartLine className="mr-1 sm:mr-2 text-xs sm:text-sm" />
          <span className="text-[10px] sm:text-sm">Overview</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-md lg:tab-lg ${activeTab === "users" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <FaUsers className="mr-1 sm:mr-2 text-xs sm:text-sm" />
          <span className="text-[10px] sm:text-sm">Users</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-md lg:tab-lg ${activeTab === "donors" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("donors")}
        >
          <FaTint className="mr-1 sm:mr-2 text-xs sm:text-sm" />
          <span className="text-[10px] sm:text-sm">Donors</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-md lg:tab-lg ${activeTab === "requests" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          <FaHeartbeat className="mr-1 sm:mr-2 text-xs sm:text-sm" />
          <span className="text-[10px] sm:text-sm">Requests</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-md lg:tab-lg ${activeTab === "inventory" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          <FaDroplet className="mr-1 sm:mr-2 text-xs sm:text-sm" />
          <span className="text-[10px] sm:text-sm">Inventory</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-md lg:tab-lg ${activeTab === "events" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          <FaCalendarAlt className="mr-1 sm:mr-2 text-xs sm:text-sm" />
          <span className="text-[10px] sm:text-sm">Events</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-md lg:tab-lg ${activeTab === "audit" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          <FaClipboardList className="mr-1 sm:mr-2 text-xs sm:text-sm" />
          <span className="text-[10px] sm:text-sm">Audit</span>
        </button>
      </motion.div>

      {/* ==================== TAB CONTENT ==================== */}
      <AnimatePresence mode="wait">

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4 sm:space-y-6"
          >
            {/* Overview chart grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Blood Type Distribution Pie Chart */}
              {processedData.bloodTypeData.length > 0 && (
                <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                    <FaChartPie className="text-error" />
                    Blood Type Distribution
                  </h3>
                  <div className="h-48 sm:h-56 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={processedData.bloodTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={60}
                          dataKey="value"
                        >
                          {processedData.bloodTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "0.5rem",
                            fontSize: "12px"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {processedData.bloodTypeData.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[10px] sm:text-xs">
                        <span className="opacity-70">{item.name}:</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request Status Overview Bar Chart */}
              {processedData.requestStatusChartData.length > 0 && (
                <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                    <FaChartBar className="text-error" />
                    Request Status Overview
                  </h3>
                  <div className="h-48 sm:h-56 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedData.requestStatusChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "0.5rem",
                            fontSize: "12px"
                          }}
                        />
                        <Bar dataKey="value">
                          {processedData.requestStatusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS.gray} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {processedData.requestStatusChartData.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[10px] sm:text-xs">
                        <span className="opacity-70">{item.name}:</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                <FaClock className="text-error" />
                Recent Activity
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {processedData.recentActivities.length > 0 ? (
                  processedData.recentActivities.map((activity, idx) => (
                    <div key={idx} className="flex flex-col xs:flex-row xs:items-center justify-between p-2 sm:p-3 bg-base-200 rounded-lg gap-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-error/10 text-error rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                            <FaUserCheck size={10} className="sm:w-3 sm:h-3" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-xs sm:text-sm">{activity.action}</p>
                          <p className="text-[10px] sm:text-xs opacity-70">
                            {activity.userName} • {activity.resource}
                          </p>
                        </div>
                      </div>
                      <span className="text-[8px] sm:text-xs opacity-50 self-end xs:self-auto">
                        {activity.timestamp ? formatAppTime(activity.timestamp) : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 opacity-70 text-xs sm:text-sm">No recent activities</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== USERS TAB ==================== */}
        {activeTab === "users" && (
          <motion.div
            key="users"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4 sm:space-y-6"
          >
            {/* Users KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Total Users</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-primary">
                      {processedData.users.total}
                    </p>
                  </div>
                  <div className="stat-figure bg-primary/10 p-2 rounded-full">
                    <FaUsers className="text-primary text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">↗︎ {processedData.users.verified} verified</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Verified</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-success">
                      {processedData.users.verified}
                    </p>
                  </div>
                  <div className="stat-figure bg-success/10 p-2 rounded-full">
                    <FaUserCheck className="text-success text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">{formatPercent(processedData.users.verified, processedData.users.total)} of total</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Pending</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-warning">
                      {processedData.users.pending}
                    </p>
                  </div>
                  <div className="stat-figure bg-warning/10 p-2 rounded-full">
                    <FaUserClock className="text-warning text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">{formatPercent(processedData.users.pending, processedData.users.total)} of total</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Inactive</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-error">
                      {processedData.users.inactive}
                    </p>
                  </div>
                  <div className="stat-figure bg-error/10 p-2 rounded-full">
                    <FaUserMinus className="text-error text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">{formatPercent(processedData.users.inactive, processedData.users.total)} of total</div>
              </div>
            </div>

            {/* Users detail row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* User Roles Pie Chart */}
              {processedData.roleDistribution.length > 0 && (
                <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                    <FaChartPie className="text-error" />
                    User Roles
                  </h3>
                  <div className="h-48 sm:h-56 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={processedData.roleDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={60}
                          dataKey="value"
                        >
                          {processedData.roleDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "0.5rem",
                            fontSize: "12px"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent Registrations */}
              <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                  <FaUserPlus className="text-error" />
                  Recent Registrations
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {usersData?.data?.slice(0, 5).map((user, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-base-200 rounded">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="avatar placeholder hidden xs:block">
                          <div className="bg-error/10 text-error rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                            <FaUser size={8} className="sm:w-3 sm:h-3" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate max-w-24 sm:max-w-40">
                            {user.profile?.fullName || user.email}
                          </p>
                          <p className="text-[8px] sm:text-xs opacity-70 capitalize truncate">
                            {user.role}
                          </p>
                        </div>
                      </div>
                      <span className="text-[8px] sm:text-xs opacity-50 shrink-0">
                        {user.createdAt ? formatAppDate(user.createdAt) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== DONORS TAB ==================== */}
        {activeTab === "donors" && (
          <motion.div
            key="donors"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4 sm:space-y-6"
          >
            {/* Donors KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Total Donors</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-primary">
                      {processedData.donors.total}
                    </p>
                  </div>
                  <div className="stat-figure bg-primary/10 p-2 rounded-full">
                    <FaTint className="text-primary text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">{processedData.donors.active} active</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Eligible</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-success">
                      {processedData.donors.eligible}
                    </p>
                  </div>
                  <div className="stat-figure bg-success/10 p-2 rounded-full">
                    <FaCheckCircle className="text-success text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">{formatPercent(processedData.donors.eligible, processedData.donors.total)} of donors</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Deferred</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-warning">
                      {processedData.donors.total - processedData.donors.eligible}
                    </p>
                  </div>
                  <div className="stat-figure bg-warning/10 p-2 rounded-full">
                    <FaExclamationTriangle className="text-warning text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">{formatPercent(processedData.donors.total - processedData.donors.eligible, processedData.donors.total)} of donors</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Emergency Ready</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-info">
                      {processedData.donors.emergency}
                    </p>
                  </div>
                  <div className="stat-figure bg-info/10 p-2 rounded-full">
                    <FaStar className="text-info text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">{formatPercent(processedData.donors.emergency, processedData.donors.total)} of donors</div>
              </div>
            </div>

            {/* Donors charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Donation Types Pie Chart */}
              <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                  <FaChartPie className="text-error" />
                  Donation Types
                </h3>
                <div className="h-48 sm:h-56 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processedData.donationTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={60}
                        dataKey="value"
                      >
                        {processedData.donationTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "0.5rem",
                          fontSize: "12px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donors by Blood Type Bar Chart */}
              <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                  <FaChartBar className="text-error" />
                  Donors by Blood Type
                </h3>
                <div className="h-48 sm:h-56 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedData.bloodTypeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "0.5rem",
                          fontSize: "12px"
                        }}
                      />
                      <Bar dataKey="value" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== REQUESTS TAB ==================== */}
        {activeTab === "requests" && (
          <motion.div
            key="requests"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4 sm:space-y-6"
          >
            {/* Requests KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Total Requests</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-primary">
                      {processedData.requests.total}
                    </p>
                  </div>
                  <div className="stat-figure bg-primary/10 p-2 rounded-full">
                    <FaHeartbeat className="text-primary text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">{processedData.requests.pending} pending</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Fulfilled</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-success">
                      {processedData.requests.fulfilled}
                    </p>
                  </div>
                  <div className="stat-figure bg-success/10 p-2 rounded-full">
                    <FaCheckCircle className="text-success text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">{formatPercent(processedData.requests.fulfilled, processedData.requests.total)} success rate</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Pending</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-warning">
                      {processedData.requests.pending}
                    </p>
                  </div>
                  <div className="stat-figure bg-warning/10 p-2 rounded-full">
                    <FaExclamationTriangle className="text-warning text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">{formatPercent(processedData.requests.pending, processedData.requests.total)} pending</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Avg Response</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-info">
                      {processedData.requests.avgResponse}h
                    </p>
                  </div>
                  <div className="stat-figure bg-info/10 p-2 rounded-full">
                    <FaClock className="text-info text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">Average response time</div>
              </div>
            </div>

            {/* Requests charts */}
            {processedData.urgencyChartData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                {/* Requests by Urgency Pie Chart */}
                <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                    <FaChartPie className="text-error" />
                    Requests by Urgency
                  </h3>
                  <div className="h-48 sm:h-56 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={processedData.urgencyChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={60}
                          dataKey="value"
                        >
                          {processedData.urgencyChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "0.5rem",
                            fontSize: "12px"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Requests by Blood Type Bar Chart */}
                <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                    <FaChartBar className="text-error" />
                    Requests by Blood Type
                  </h3>
                  <div className="h-48 sm:h-56 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={requestStats?.data?.byBloodType || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="_id" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "0.5rem",
                            fontSize: "12px"
                          }}
                        />
                        <Bar dataKey="count" fill={COLORS.warning} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ==================== INVENTORY TAB ==================== */}
        {activeTab === "inventory" && (
          <motion.div
            key="inventory"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4 sm:space-y-6"
          >
            {/* Inventory KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Total Units</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-primary">
                      {formatNumber(processedData.inventory.lowUnits || 1204)}
                    </p>
                  </div>
                  <div className="stat-figure bg-primary/10 p-2 rounded-full">
                    <FaDroplet className="text-primary text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">Across all blood types</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Blood Banks</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-success">
                      {usersData?.data?.filter(u => u.role === "blood_bank").length || 0}
                    </p>
                  </div>
                  <div className="stat-figure bg-success/10 p-2 rounded-full">
                    <FaBoxes className="text-success text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">With inventory</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Low Stock</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-warning">
                      {processedData.inventory.lowStock}
                    </p>
                  </div>
                  <div className="stat-figure bg-warning/10 p-2 rounded-full">
                    <FaExclamationTriangle className="text-warning text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">Blood banks with low inventory</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Turnover Rate</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-info">
                      15.3
                    </p>
                  </div>
                  <div className="stat-figure bg-info/10 p-2 rounded-full">
                    <FaSync className="text-info text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">Units per day (estimated)</div>
              </div>
            </div>

            {/* Low Inventory Alerts */}
            <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                <FaBell className="text-error" />
                Low Inventory Alerts
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {bankStats?.data?.length > 0 ? (
                  bankStats.data.map((bank, idx) => (
                    <div key={idx} className="alert alert-warning shadow-lg p-3 sm:p-4 flex-col xs:flex-row gap-2">
                      <FaExclamationTriangle className="text-warning text-lg shrink-0" />
                      <div className="flex-1">
                        <span className="font-bold text-xs sm:text-sm">{bank.name}</span>
                        <span className="text-xs sm:text-sm ml-1">has low inventory:</span>
                        <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                          {bank.lowInventory?.map((item, i) => (
                            <span key={i} className="badge badge-warning badge-xs sm:badge-sm">
                              {item.bloodType}: {item.units} units
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 opacity-70 text-xs sm:text-sm">No low inventory alerts</p>
                )}
              </div>
            </div>

            {/* Current Inventory Chart */}
            <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                <FaChartBar className="text-error" />
                Current Inventory by Blood Type
              </h3>
              <div className="h-48 sm:h-56 md:h-64 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedData.bloodTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "0.5rem",
                        fontSize: "12px"
                      }}
                    />
                    <Bar dataKey="value" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== EVENTS TAB ==================== */}
        {activeTab === "events" && (
          <motion.div
            key="events"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4 sm:space-y-6"
          >
            {/* Events KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Total Events</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-primary">
                      {processedData.events.total}
                    </p>
                  </div>
                  <div className="stat-figure bg-primary/10 p-2 rounded-full">
                    <FaCalendarAlt className="text-primary text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">{processedData.events.upcoming} upcoming</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Participants</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-success">
                      {processedData.events.participants}
                    </p>
                  </div>
                  <div className="stat-figure bg-success/10 p-2 rounded-full">
                    <FaUsers className="text-success text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">
                  Avg {processedData.events.total ? Math.round(processedData.events.participants / processedData.events.total) : 0} per event
                </div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Upcoming</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-warning">
                      {processedData.events.upcoming}
                    </p>
                  </div>
                  <div className="stat-figure bg-warning/10 p-2 rounded-full">
                    <FaClock className="text-warning text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">Next 30 days</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Completed</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-info">
                      {processedData.events.completed}
                    </p>
                  </div>
                  <div className="stat-figure bg-info/10 p-2 rounded-full">
                    <FaCheckCircle className="text-info text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">{formatPercent(processedData.events.completed, processedData.events.total)} completion</div>
              </div>
            </div>

            {/* Event Type Distribution */}
            <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                <FaRegCalendarAlt className="text-error" />
                Event Type Distribution
              </h3>
              <div className="h-48 sm:h-56 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventStats?.data?.byType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      dataKey="count"
                      nameKey="_id"
                    >
                      {(eventStats?.data?.byType || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "0.5rem",
                        fontSize: "12px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== AUDIT TAB ==================== */}
        {activeTab === "audit" && (
          <motion.div
            key="audit"
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4 sm:space-y-6"
          >
            {/* Audit KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Total Logs</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-primary">
                      {formatNumber(processedData.auditSummary.totalLogs)}
                    </p>
                  </div>
                  <div className="stat-figure bg-primary/10 p-2 rounded-full">
                    <FaFileAlt className="text-primary text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">Last {dateRange} days</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Active Users</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-success">
                      {processedData.auditSummary.uniqueUsers}
                    </p>
                  </div>
                  <div className="stat-figure bg-success/10 p-2 rounded-full">
                    <FaUsers className="text-success text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">Performed actions</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Actions Today</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-warning">
                      {processedData.activityToday}
                    </p>
                  </div>
                  <div className="stat-figure bg-warning/10 p-2 rounded-full">
                    <FaShieldAlt className="text-warning text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">↗︎ 23% from yesterday</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="stat-title text-xs sm:text-sm opacity-70">Resources</p>
                    <p className="stat-value text-lg sm:text-xl font-bold text-info">
                      {processedData.auditSummary.uniqueResources}
                    </p>
                  </div>
                  <div className="stat-figure bg-info/10 p-2 rounded-full">
                    <FaGlobe className="text-info text-sm sm:text-base" />
                  </div>
                </div>
                <div className="stat-desc text-xs mt-2">Tracked resources</div>
              </div>
            </div>

            {/* Audit detail row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Top Actions */}
              <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                  <FaChartBar className="text-error" />
                  Top Actions
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {processedData.topActions.length > 0 ? (
                    processedData.topActions.map((action, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="capitalize">{action._id}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{action.count}</span>
                          <span className="text-[8px] sm:text-xs opacity-50">
                            ({formatPercent(action.count, processedData.auditSummary.totalLogs)})
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 opacity-70 text-xs sm:text-sm">No action data available</p>
                  )}
                </div>
              </div>

              {/* Hourly Activity Bar Chart */}
              <div className="bg-base-100 rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                  <FaClock className="text-error" />
                  Activity by Hour
                </h3>
                <div className="h-48 sm:h-56 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={auditStats?.data?.byHour || [
                        { _id: "0", count: 45 },
                        { _id: "4", count: 78 },
                        { _id: "8", count: 234 },
                        { _id: "12", count: 345 },
                        { _id: "16", count: 267 },
                        { _id: "20", count: 123 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="_id" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "0.5rem",
                          fontSize: "12px"
                        }}
                      />
                      <Bar dataKey="count" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SystemStatistics;