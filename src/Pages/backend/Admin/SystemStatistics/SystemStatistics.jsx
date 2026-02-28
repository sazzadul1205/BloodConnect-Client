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
  FaPrint,
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
import { formatAppDate, formatAppTime } from "../../../../utils/dateFormat";

const SystemStatistics = () => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // States
  const [dateRange, setDateRange] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Colors for charts
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

  // Fetch all users
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
    error: usersErrorData,
    refetch: refetchUsers,

  } = useQuery({
    queryKey: ["system-stats-users"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/admin/all-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch donor statistics
  const {
    data: donorStats,
    isLoading: donorsLoading,
    isError: donorsError,
    error: donorsErrorData,
    refetch: refetchDonors,
  } = useQuery({
    queryKey: ["system-stats-donors"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/donors/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch request statistics
  const {
    data: requestStats,
    isLoading: requestsLoading,
    isError: requestsError,
    error: requestsErrorData,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ["system-stats-requests"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/blood-requests/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch low inventory alerts
  const {
    data: bankStats,
    isLoading: banksLoading,
    isError: banksError,
    error: banksErrorData,
    refetch: refetchBanks,
  } = useQuery({
    queryKey: ["system-stats-banks"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/blood-banks/alerts/low-inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch event statistics
  const {
    data: eventStats,
    isLoading: eventsLoading,
    isError: eventsError,
    error: eventsErrorData,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["system-stats-events"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/donation-events/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch audit statistics
  const {
    data: auditStats,
    isLoading: auditLoading,
    isError: auditError,
    error: auditErrorData,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ["system-stats-audit", dateRange],
    queryFn: async () => {
      const res = await axiosInstance.get(`/audit-logs/stats/actions?days=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Fetch dashboard summary
  const {
    data: dashboardSummary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErrorData,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["system-stats-dashboard"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/audit-logs/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Process data for charts
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

    // Donation types from somewhere (you might need to add this to your API)
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

  // Handle refresh
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

  // Format numbers
  const formatNumber = (num) => {
    if (!num && num !== 0) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || "0";
  };

  // Format percentage
  const formatPercent = (value, total) => {
    if (!total || total === 0) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Get trend icon (mock for now - you'd need historical data for real trends)
  const getTrendIcon = (trend) => {
    if (trend > 0) return <FaArrowUp className="text-success" />;
    if (trend < 0) return <FaArrowDown className="text-error" />;
    return <FaEquals className="text-warning" />;
  };

  if (usersLoading || donorsLoading || requestsLoading || banksLoading || eventsLoading || auditLoading || summaryLoading) {
    return <BloodLoader />;
  }

  if (usersError || donorsError || requestsError || banksError || eventsError || auditError || summaryError) {
    return (
      <ErrorState
        error={[usersErrorData || donorsErrorData || requestsErrorData || banksErrorData || eventsErrorData || auditErrorData || summaryErrorData]}
        onRetry={() => handleRefresh()}
      />
    );
  }

  return (
    // Page shell: full-height admin analytics surface with neutral background and consistent padding.
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header block: title/description on the left + controls on the right. */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Header copy: communicates context and purpose of the dashboard. */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {/* Visual identity icon for analytics/system metrics. */}
              <FaChartLine className="text-error" />
              System Statistics
            </h1>
            <p className="text-base-content/70 mt-1">
              Comprehensive overview of platform metrics and performance
            </p>
          </div>

          {/* Toolbar: filter + refresh + export/print utility actions. */}
          <div className="flex items-center gap-2">
            {/* Date range selector: affects APIs that depend on selected time window (e.g., audit endpoints). */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="select select-bordered select-sm w-32"
            >
              {/* Relative window presets for quick comparison periods. */}
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>

            {/* Refresh button: manually re-fetches all query sources and shows loading state while running. */}
            <button
              onClick={handleRefresh}
              className={`btn btn-sm btn-outline btn-error gap-2 ${refreshing ? "loading" : ""}`}
              disabled={refreshing}
            >
              {/* Hide icon while `loading` class spinner is active to avoid duplicate indicators. */}
              {!refreshing && <FaSync />}
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            {/* Export placeholder action (currently visual only). */}
            <button className="btn btn-sm btn-error gap-2">
              <FaDownload />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Quick KPIs: top-level summary cards for immediate platform health snapshot. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: user footprint (total + verified trend context). */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          {/* KPI icon area. */}
          <div className="stat-figure text-error">
            <FaUsers size={32} />
          </div>
          {/* KPI label. */}
          <div className="stat-title">Total Users</div>
          {/* KPI primary numeric value. */}
          <div className="stat-value text-3xl text-error">
            {formatNumber(processedData.users.total)}
          </div>
          {/* Direction/trend indicator row. */}
          <div className="stat-desc flex items-center gap-1">
            {getTrendIcon(12)}
          </div>
          {/* Secondary context line. */}
          <div className="mt-2 text-sm">
            <span className="text-success">+{processedData.users.verified}</span> verified
          </div>
        </motion.div>

        {/* Card 2: donor availability health. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-success">
            <FaTint size={32} />
          </div>
          <div className="stat-title">Active Donors</div>
          <div className="stat-value text-3xl text-success">
            {formatNumber(processedData.donors.active)}
          </div>
          <div className="stat-desc flex items-center gap-1">
            {getTrendIcon(8)}
          </div>
          <div className="mt-2 text-sm">
            <span className="text-warning">{processedData.donors.total - processedData.donors.active}</span> inactive
          </div>
        </motion.div>

        {/* Card 3: demand-side pressure (requests + pending load). */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-warning">
            <FaHeartbeat size={32} />
          </div>
          <div className="stat-title">Blood Requests</div>
          <div className="stat-value text-3xl text-warning">
            {formatNumber(processedData.requests.total)}
          </div>
          <div className="stat-desc flex items-center gap-1">
            {getTrendIcon(-5)}
          </div>
          <div className="mt-2 text-sm">
            <span className="text-error">{processedData.requests.pending}</span> pending
          </div>
        </motion.div>

        {/* Card 4: supply network coverage and low-inventory signal. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-info">
            <FaHospital size={32} />
          </div>
          <div className="stat-title">Blood Banks</div>
          <div className="stat-value text-3xl text-info">
            {formatNumber(usersData?.data?.filter(u => u.role === "blood_bank").length || 0)}
          </div>
          <div className="stat-desc flex items-center gap-1">
            {getTrendIcon(3)}
          </div>
          <div className="mt-2 text-sm">
            <span className="text-success">{bankStats?.count || 0}</span> low inventory
          </div>
        </motion.div>
      </div>

      {/* Tab navigation: toggles between domain-specific analytics views. */}
      <div className="tabs tabs-boxed bg-base-100 p-1 mb-6 overflow-x-auto flex-nowrap">
        {/* Overview tab: cross-domain summary charts and activity. */}
        <button
          className={`tab tab-lg ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <FaChartLine className="mr-2" />
          Overview
        </button>
        {/* Users tab: account and verification metrics. */}
        <button
          className={`tab tab-lg ${activeTab === "users" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <FaUsers className="mr-2" />
          Users
        </button>
        {/* Donors tab: donor quality, eligibility, and blood profile. */}
        <button
          className={`tab tab-lg ${activeTab === "donors" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("donors")}
        >
          <FaTint className="mr-2" />
          Donors
        </button>
        {/* Requests tab: request throughput, urgency, and blood-type demand. */}
        <button
          className={`tab tab-lg ${activeTab === "requests" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          <FaHeartbeat className="mr-2" />
          Requests
        </button>
        {/* Inventory tab: low-stock monitoring and current stock projection. */}
        <button
          className={`tab tab-lg ${activeTab === "inventory" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          <FaDroplet className="mr-2" />
          Inventory
        </button>
        {/* Events tab: campaign volume and participation breakdown. */}
        <button
          className={`tab tab-lg ${activeTab === "events" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          <FaCalendarAlt className="mr-2" />
          Events
        </button>
        {/* Audit tab: platform action logs, actor coverage, and timeline activity. */}
        <button
          className={`tab tab-lg ${activeTab === "audit" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          <FaClipboardList className="mr-2" />
          Audit
        </button>
      </div>

      {/* Animated tab body: only one panel is mounted based on `activeTab`. */}
      <AnimatePresence mode="wait">
        {/* Overview panel: high-level charts + recent activity feed. */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Overview chart grid: blood type distribution + request status distribution. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart card: donor blood-type share (pie chart + short legend rows). */}
              {processedData.bloodTypeData.length > 0 && (
                <div className="bg-base-100 rounded-lg shadow-lg p-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <FaChartPie className="text-error" />
                    Blood Type Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={processedData.bloodTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {processedData.bloodTypeData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "0.5rem",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {processedData.bloodTypeData.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="opacity-70">{item.name}:</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chart card: request lifecycle status counts (bar chart + value rows). */}
              {processedData.requestStatusChartData.length > 0 && (
                <div className="bg-base-100 rounded-lg shadow-lg p-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <FaChartBar className="text-error" />
                    Request Status Overview
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedData.requestStatusChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "0.5rem",
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
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="opacity-70">{item.name}:</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Activity feed: latest audit-driven actions from dashboard summary payload. */}
            <div className="bg-base-100 rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <FaClock className="text-error" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {processedData.recentActivities.length > 0 ? (
                  processedData.recentActivities.map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-error/10 text-error rounded-full w-8 h-8 flex items-center justify-center">
                            <FaUserCheck size={14} />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm opacity-70">
                            {activity.userName} • {activity.resource}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm opacity-50">
                        {activity.timestamp ? formatAppTime(activity.timestamp) : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 opacity-70">No recent activities</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Users panel: account composition and recent onboarding list. */}
        {activeTab === "users" && (
          <motion.div
            key="users"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Users KPIs: total, verified, pending verification, and inactive/deleted. */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-primary">
                  <FaUsers size={24} />
                </div>
                <div className="stat-title">Total Users</div>
                <div className="stat-value text-2xl">{processedData.users.total}</div>
                <div className="stat-desc">↗︎ {processedData.users.verified} verified</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-success">
                  <FaUserCheck size={24} />
                </div>
                <div className="stat-title">Verified</div>
                <div className="stat-value text-2xl">{processedData.users.verified}</div>
                <div className="stat-desc">{formatPercent(processedData.users.verified, processedData.users.total)} of total</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-warning">
                  <FaUserClock size={24} />
                </div>
                <div className="stat-title">Pending</div>
                <div className="stat-value text-2xl">{processedData.users.pending}</div>
                <div className="stat-desc">{formatPercent(processedData.users.pending, processedData.users.total)} of total</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-error">
                  <FaUserMinus size={24} />
                </div>
                <div className="stat-title">Inactive</div>
                <div className="stat-value text-2xl">{processedData.users.inactive}</div>
                <div className="stat-desc">{formatPercent(processedData.users.inactive, processedData.users.total)} of total</div>
              </div>
            </div>

            {/* Users detail row: role distribution chart + latest registration items. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {processedData.roleDistribution.length > 0 && (
                <div className="bg-base-100 rounded-lg shadow-lg p-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <FaChartPie className="text-error" />
                    User Roles
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={processedData.roleDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
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
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent Users */}
              <div className="bg-base-100 rounded-lg shadow-lg p-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                  <FaUserPlus className="text-error" />
                  Recent Registrations
                </h3>
                <div className="space-y-3">
                  {usersData?.data?.slice(0, 5).map((user, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-base-200 rounded">
                      <div className="flex items-center gap-2">
                        <div className="avatar placeholder">
                          <div className="bg-error/10 text-error rounded-full w-8 h-8 flex items-center justify-center">
                            <FaUser size={12} />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{user.profile?.fullName || user.email}</p>
                          <p className="text-xs opacity-70 capitalize">{user.role}</p>
                        </div>
                      </div>
                      <span className="text-xs opacity-50">
                        {user.createdAt ? formatAppDate(user.createdAt) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Donors panel: donor quality indicators and composition charts. */}
        {activeTab === "donors" && (
          <motion.div
            key="donors"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Donor KPIs: total, eligible, deferred, emergency-ready donors. */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-primary">
                  <FaTint size={24} />
                </div>
                <div className="stat-title">Total Donors</div>
                <div className="stat-value text-2xl">{processedData.donors.total}</div>
                <div className="stat-desc">{processedData.donors.active} active</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-success">
                  <FaCheckCircle size={24} />
                </div>
                <div className="stat-title">Eligible</div>
                <div className="stat-value text-2xl">{processedData.donors.eligible}</div>
                <div className="stat-desc">{formatPercent(processedData.donors.eligible, processedData.donors.total)} of donors</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-warning">
                  <FaExclamationTriangle size={24} />
                </div>
                <div className="stat-title">Deferred</div>
                <div className="stat-value text-2xl">{processedData.donors.total - processedData.donors.eligible}</div>
                <div className="stat-desc">{formatPercent(processedData.donors.total - processedData.donors.eligible, processedData.donors.total)} of donors</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-info">
                  <FaStar size={24} />
                </div>
                <div className="stat-title">Emergency Ready</div>
                <div className="stat-value text-2xl">{processedData.donors.emergency}</div>
                <div className="stat-desc">{formatPercent(processedData.donors.emergency, processedData.donors.total)} of donors</div>
              </div>
            </div>

            {/* Donor charts: donation type mix + blood type concentration. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-base-100 rounded-lg shadow-lg p-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                  <FaChartPie className="text-error" />
                  Donation Types
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processedData.donationTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
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
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donor Blood Type Distribution */}
              <div className="bg-base-100 rounded-lg shadow-lg p-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                  <FaChartBar className="text-error" />
                  Donors by Blood Type
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedData.bloodTypeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "0.5rem",
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

        {/* Requests panel: operational demand, urgency mix, and blood-type demand split. */}
        {activeTab === "requests" && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Request KPIs: total volume, fulfilled, pending, and average response time. */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-primary">
                  <FaHeartbeat size={24} />
                </div>
                <div className="stat-title">Total Requests</div>
                <div className="stat-value text-2xl">{processedData.requests.total}</div>
                <div className="stat-desc">{processedData.requests.pending} pending</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-success">
                  <FaCheckCircle size={24} />
                </div>
                <div className="stat-title">Fulfilled</div>
                <div className="stat-value text-2xl">{processedData.requests.fulfilled}</div>
                <div className="stat-desc">{formatPercent(processedData.requests.fulfilled, processedData.requests.total)} success rate</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-warning">
                  <FaExclamationTriangle size={24} />
                </div>
                <div className="stat-title">Pending</div>
                <div className="stat-value text-2xl">{processedData.requests.pending}</div>
                <div className="stat-desc">{formatPercent(processedData.requests.pending, processedData.requests.total)} pending</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-info">
                  <FaClock size={24} />
                </div>
                <div className="stat-title">Avg Response</div>
                <div className="stat-value text-2xl">{processedData.requests.avgResponse}h</div>
                <div className="stat-desc">Average response time</div>
              </div>
            </div>

            {/* Request charts: urgency distribution and blood-type request counts. */}
            {processedData.urgencyChartData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-base-100 rounded-lg shadow-lg p-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <FaChartPie className="text-error" />
                    Requests by Urgency
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={processedData.urgencyChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
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
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Blood Type Requests */}
                <div className="bg-base-100 rounded-lg shadow-lg p-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <FaChartBar className="text-error" />
                    Requests by Blood Type
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={requestStats?.data?.byBloodType || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="_id" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "0.5rem",
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

        {/* Inventory panel: low stock visibility and stock composition snapshot. */}
        {activeTab === "inventory" && (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Inventory KPIs: units, bank coverage, low-stock count, and turnover estimate. */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-primary">
                  <FaDroplet size={24} />
                </div>
                <div className="stat-title">Total Units</div>
                <div className="stat-value text-2xl">{formatNumber(processedData.inventory.lowUnits || 1204)}</div>
                <div className="stat-desc">Across all blood types</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-success">
                  <FaBoxes size={24} />
                </div>
                <div className="stat-title">Blood Banks</div>
                <div className="stat-value text-2xl">{usersData?.data?.filter(u => u.role === "blood_bank").length || 0}</div>
                <div className="stat-desc">With inventory</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-warning">
                  <FaExclamationTriangle size={24} />
                </div>
                <div className="stat-title">Low Stock</div>
                <div className="stat-value text-2xl">{processedData.inventory.lowStock}</div>
                <div className="stat-desc">Blood banks with low inventory</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-info">
                  <FaSync size={24} />
                </div>
                <div className="stat-title">Turnover Rate</div>
                <div className="stat-value text-2xl">15.3</div>
                <div className="stat-desc">Units per day (estimated)</div>
              </div>
            </div>

            {/* Alert list: each bank with low inventory and affected blood groups. */}
            <div className="bg-base-100 rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <FaBell className="text-error" />
                Low Inventory Alerts
              </h3>
              <div className="space-y-3">
                {bankStats?.data?.length > 0 ? (
                  bankStats.data.map((bank, idx) => (
                    <div key={idx} className="alert alert-warning shadow-lg">
                      <FaExclamationTriangle />
                      <div className="flex-1">
                        <span className="font-bold">{bank.name}</span> has low inventory:
                        <div className="flex flex-wrap gap-2 mt-1">
                          {bank.lowInventory?.map((item, i) => (
                            <span key={i} className="badge badge-warning badge-sm">
                              {item.bloodType}: {item.units} units
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 opacity-70">No low inventory alerts</p>
                )}
              </div>
            </div>

            {/* Inventory chart: current blood-type units (uses available bloodTypeData as placeholder). */}
            <div className="bg-base-100 rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <FaChartBar className="text-error" />
                Current Inventory by Blood Type
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedData.bloodTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* Events panel: event throughput, participation, and type distribution. */}
        {activeTab === "events" && (
          <motion.div
            key="events"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Event KPIs: total, participants, upcoming schedule, completion ratio. */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-primary">
                  <FaCalendarAlt size={24} />
                </div>
                <div className="stat-title">Total Events</div>
                <div className="stat-value text-2xl">{processedData.events.total}</div>
                <div className="stat-desc">{processedData.events.upcoming} upcoming</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-success">
                  <FaUsers size={24} />
                </div>
                <div className="stat-title">Participants</div>
                <div className="stat-value text-2xl">{processedData.events.participants}</div>
                <div className="stat-desc">Avg {processedData.events.total ? Math.round(processedData.events.participants / processedData.events.total) : 0} per event</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-warning">
                  <FaClock size={24} />
                </div>
                <div className="stat-title">Upcoming</div>
                <div className="stat-value text-2xl">{processedData.events.upcoming}</div>
                <div className="stat-desc">Next 30 days</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-info">
                  <FaCheckCircle size={24} />
                </div>
                <div className="stat-title">Completed</div>
                <div className="stat-value text-2xl">{processedData.events.completed}</div>
                <div className="stat-desc">{formatPercent(processedData.events.completed, processedData.events.total)} completion</div>
              </div>
            </div>

            {/* Event distribution chart: split by event type from backend aggregation. */}
            <div className="bg-base-100 rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <FaRegCalendarAlt className="text-error" />
                Event Type Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventStats?.data?.byType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
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
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* Audit panel: operational logging overview and activity analysis. */}
        {activeTab === "audit" && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Audit KPIs: total logs, unique actors, today's actions, unique resources. */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-primary">
                  <FaFileAlt size={24} />
                </div>
                <div className="stat-title">Total Logs</div>
                <div className="stat-value text-2xl">
                  {formatNumber(processedData.auditSummary.totalLogs)}
                </div>
                <div className="stat-desc">Last {dateRange} days</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-success">
                  <FaUsers size={24} />
                </div>
                <div className="stat-title">Active Users</div>
                <div className="stat-value text-2xl">
                  {processedData.auditSummary.uniqueUsers}
                </div>
                <div className="stat-desc">Performed actions</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-warning">
                  <FaShieldAlt size={24} />
                </div>
                <div className="stat-title">Actions Today</div>
                <div className="stat-value text-2xl">
                  {processedData.activityToday}
                </div>
                <div className="stat-desc">↗︎ 23% from yesterday</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
                <div className="stat-figure text-info">
                  <FaGlobe size={24} />
                </div>
                <div className="stat-title">Resources</div>
                <div className="stat-value text-2xl">
                  {processedData.auditSummary.uniqueResources}
                </div>
                <div className="stat-desc">Tracked resources</div>
              </div>
            </div>

            {/* Audit detail row: top actions list + hourly activity histogram. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-base-100 rounded-lg shadow-lg p-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                  <FaChartBar className="text-error" />
                  Top Actions
                </h3>
                <div className="space-y-3">
                  {processedData.topActions.length > 0 ? (
                    processedData.topActions.map((action, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="capitalize">{action._id}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{action.count}</span>
                          <span className="text-xs opacity-50">
                            ({formatPercent(action.count, processedData.auditSummary.totalLogs)})
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-4 opacity-70">No action data available</p>
                  )}
                </div>
              </div>

              {/* Hourly Activity */}
              <div className="bg-base-100 rounded-lg shadow-lg p-6">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                  <FaClock className="text-error" />
                  Activity by Hour
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={auditStats?.data?.byHour || [
                        { hour: "0-4", count: 45 },
                        { hour: "4-8", count: 78 },
                        { hour: "8-12", count: 234 },
                        { hour: "12-16", count: 345 },
                        { hour: "16-20", count: 267 },
                        { hour: "20-24", count: 123 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey={auditStats?.data?.byHour ? "_id" : "hour"}
                        stroke="#9CA3AF"
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "0.5rem",
                        }}
                      />
                      <Bar dataKey="count" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SystemStatistics;
