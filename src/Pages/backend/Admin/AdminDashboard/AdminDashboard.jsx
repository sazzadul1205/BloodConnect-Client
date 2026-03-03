// Pages/backend/Admin/Dashboard/Dashboard.jsx

// React
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FiUsers,
  FiUserCheck,
  FiDroplet,
  FiClock,
  FiCalendar,
  FiActivity,
  FiCheckCircle,
  FiRefreshCw,
  FiDownload,
  FiHeart,
} from "react-icons/fi";
import { FaHospital } from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";

// Components
import StatCard from "./StatCard/StatCard";
import TopDonors from "./TopDonors/TopDonors";
import QuickActions from "./QuickActions/QuickActions";
import ActivityChart from "./ActivityChart/ActivityChart";
import RecentActivities from "./RecentActivities/RecentActivities";
import ActionStatistics from "./ActionStatistics/ActionStatistics";
import RequestsByStatus from "./RequestsByStatus/RequestsByStatus";
import BloodTypeDistribution from "./BloodTypeDistribution/BloodTypeDistribution";
import { showDashboardExportOptions } from "./ExportReport";

// ==================== QUERY KEYS ====================

const queryKeys = {
  dashboardSummary: (refreshKey) => ['dashboard-summary', refreshKey],
  usersCount: (refreshKey) => ['users-count', refreshKey],
  donorsCount: (refreshKey) => ['donors-count', refreshKey],
  banksCount: (refreshKey) => ['banks-count', refreshKey],
  requestsStats: (refreshKey) => ['requests-stats', refreshKey],
  actionStats: (dateRange, refreshKey) => ['action-stats', dateRange, refreshKey],
  recentActivities: (refreshKey) => ['recent-activities', refreshKey],
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

/**
 * Admin Dashboard Component
 * Displays comprehensive system statistics, charts, and metrics
 * Fetches data from multiple endpoints and combines them
 */
const AdminDashboard = () => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [dateRange, setDateRange] = useState("30");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query 1: Fetch Dashboard Summary
   */
  const {
    data: summaryData,
    isLoading: loadingSummary,
    isError: summaryError,
    error: summaryErrorData,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: queryKeys.dashboardSummary(refreshKey),
    queryFn: async () => {
      const res = await axiosInstance.get("/audit-logs/dashboard/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 2: Fetch Users Count
   */
  const {
    data: usersData,
    isLoading: loadingUsers,
    isError: usersError,
    error: usersErrorData,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: queryKeys.usersCount(refreshKey),
    queryFn: async () => {
      const res = await axiosInstance.get("/users/admin/all-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 3: Fetch Donors Count
   */
  const {
    data: donorsData,
    isLoading: loadingDonors,
    isError: donorsError,
    error: donorsErrorData,
    refetch: refetchDonors,
  } = useQuery({
    queryKey: queryKeys.donorsCount(refreshKey),
    queryFn: async () => {
      const res = await axiosInstance.get("/users/admin/donors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 4: Fetch Blood Banks Count
   */
  const {
    data: banksData,
    isLoading: loadingBanks,
    isError: banksError,
    error: banksErrorData,
    refetch: refetchBanks,
  } = useQuery({
    queryKey: queryKeys.banksCount(refreshKey),
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 5: Fetch Requests Statistics
   */
  const {
    data: requestsData,
    isLoading: loadingRequests,
    isError: requestsError,
    error: requestsErrorData,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: queryKeys.requestsStats(refreshKey),
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-requests/stats/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 6: Fetch Action Statistics (filtered by date range)
   */
  const {
    data: actionStatsData,
    isLoading: loadingActionStats,
    isError: actionStatsError,
    error: actionStatsErrorData,
    refetch: refetchActionStats,
  } = useQuery({
    queryKey: queryKeys.actionStats(dateRange, refreshKey),
    queryFn: async () => {
      const res = await axiosInstance.get(`/audit-logs/stats/actions?days=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - changes more frequently
  });

  /**
   * Query 7: Fetch Recent Activities
   */
  const {
    data: recentActivitiesData,
    isLoading: loadingActivities,
    isError: activitiesError,
    error: activitiesErrorData,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: queryKeys.recentActivities(refreshKey),
    queryFn: async () => {
      const res = await axiosInstance.get("/audit-logs?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute - very frequent changes
  });

  // ==================== COMPUTED VALUES ====================

  /**
   * Calculate derived statistics from raw data
   */
  const totalUsers = usersData?.count || 0;
  const totalDonors = donorsData?.count || 0;
  const totalBanks = banksData?.count || 0;
  const verifiedBanks = banksData?.data?.filter(b => b.verification?.isVerified).length || 0;

  // Requests statistics
  const pendingRequests = requestsData?.data?.byStatus?.find(s => s._id === "pending")?.count || 0;
  const fulfilledRequests = requestsData?.data?.byStatus?.find(s => s._id === "fulfilled")?.count || 0;
  const totalRequests = requestsData?.data?.byStatus?.reduce((sum, s) => sum + s.count, 0) || 0;

  // Inventory statistics
  const totalInventory = banksData?.data?.reduce((sum, bank) =>
    sum + (bank.inventory?.reduce((s, i) => s + (i.units || 0), 0) || 0), 0
  ) || 0;

  const lowInventoryCount = banksData?.data?.filter(bank =>
    bank.inventory?.some(item => item.units <= item.threshold)
  ).length || 0;

  // Urgent requests
  const urgentRequests = requestsData?.data?.byUrgency?.find(u => u._id === "emergency")?.count || 0;

  // Calculate completion rate
  const completionRate = totalRequests > 0
    ? Math.round((fulfilledRequests / totalRequests) * 100)
    : 0;

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle refresh of all dashboard data
   */
  const handleRefresh = () => {
    // Increment refresh key to trigger all queries to refetch
    setRefreshKey(prev => prev + 1);

    // Also manually trigger refetch for each query
    refetchUsers();
    refetchBanks();
    refetchDonors();
    refetchSummary();
    refetchRequests();
    refetchActivities();
    refetchActionStats();
  };

  /**
   * Handle export of dashboard report
   */
  const handleExport = () => {
    showDashboardExportOptions(
      {
        dateRange,
        totals: {
          totalUsers,
          totalDonors,
          totalBanks,
          verifiedBanks,
          totalInventory,
          lowInventoryCount,
          totalRequests,
          pendingRequests,
          fulfilledRequests,
          urgentRequests,
          completionRate,
        },
        summaryData,
        requestsData,
        actionStatsData,
        recentActivitiesData,
      },
      setIsExporting
    );
  };

  // ==================== LOADING STATE ====================

  if (loadingSummary || loadingUsers || loadingDonors || loadingBanks || loadingRequests || loadingActionStats || loadingActivities) {
    return <BloodLoader />;
  }

  // ==================== ERROR STATE ====================

  if (summaryError || usersError || donorsError || banksError || requestsError || actionStatsError || activitiesError) {
    return (
      <ErrorState
        error={[
          summaryErrorData,
          usersErrorData,
          donorsErrorData,
          banksErrorData,
          requestsErrorData,
          actionStatsErrorData,
          activitiesErrorData,
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
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        {/* Title and description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiActivity className="text-error" />
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Monitor blood donation activities, requests, and system statistics
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {/* Date Range Selector */}
          <select
            className="select select-bordered select-xs sm:select-sm w-full sm:w-auto"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="btn btn-outline btn-xs sm:btn-sm gap-1 sm:gap-2 flex-1 sm:flex-none"
          >
            <FiRefreshCw size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Refresh</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn btn-outline btn-xs sm:btn-sm gap-1 sm:gap-2 flex-1 sm:flex-none"
          >
            <FiDownload size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">
              {isExporting ? "Exporting..." : "Export Report"}
            </span>
          </button>
        </div>
      </motion.div>

      {/* ==================== KEY METRICS STATS CARDS ==================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={FiUsers}
          color="primary"
          delay={0.1}
        />
        <StatCard
          title="Total Donors"
          value={totalDonors}
          icon={FiUserCheck}
          color="success"
          delay={0.2}
        />
        <StatCard
          title="Blood Banks"
          value={totalBanks}
          icon={FaHospital}
          color="info"
          subValue={`${verifiedBanks} verified`}
          delay={0.3}
        />
        <StatCard
          title="Total Inventory"
          value={totalInventory}
          icon={FiDroplet}
          color="error"
          unit="units"
          subValue={`${lowInventoryCount} low stock`}
          delay={0.4}
        />
      </motion.div>

      {/* ==================== SECONDARY STATS ROW ==================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        <StatCard
          title="Total Requests"
          value={totalRequests}
          icon={FiHeart}
          color="secondary"
          delay={0.5}
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          icon={FiClock}
          color="warning"
          subValue={`${urgentRequests} urgent`}
          delay={0.6}
        />
        <StatCard
          title="Fulfilled Requests"
          value={fulfilledRequests}
          icon={FiCheckCircle}
          color="success"
          subValue={`${completionRate}% completion`}
          delay={0.7}
        />
        <StatCard
          title="Active Events"
          value={summaryData?.data?.activity?.thisWeek || 0}
          icon={FiCalendar}
          color="accent"
          subValue={`Today: ${summaryData?.data?.activity?.today || 0}`}
          delay={0.8}
        />
      </motion.div>

      {/* ==================== CHARTS AND STATISTICS ROW 1 ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Activity Chart */}
        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.3 }}
        >
          <ActivityChart
            data={actionStatsData?.data?.byDay || []}
            isLoading={loadingActionStats}
          />
        </motion.div>

        {/* Requests by Status */}
        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.4 }}
        >
          <RequestsByStatus
            data={requestsData?.data?.byStatus || []}
            isLoading={loadingRequests}
          />
        </motion.div>
      </div>

      {/* ==================== CHARTS AND STATISTICS ROW 2 ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Blood Type Distribution */}
        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.5 }}
          className="lg:col-span-1"
        >
          <BloodTypeDistribution
            data={banksData?.data || []}
            isLoading={loadingBanks}
          />
        </motion.div>

        {/* Action Statistics */}
        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <ActionStatistics
            data={actionStatsData?.data}
            isLoading={loadingActionStats}
          />
        </motion.div>
      </div>

      {/* ==================== BOTTOM SECTION ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activities */}
        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2"
        >
          <RecentActivities
            data={recentActivitiesData?.data || []}
            isLoading={loadingActivities}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={fadeInUp}
          transition={{ delay: 0.8 }}
          className="lg:col-span-1"
        >
          <QuickActions />
        </motion.div>
      </div>

      {/* ==================== TOP DONORS SECTION ==================== */}
      <motion.div
        variants={fadeInUp}
        transition={{ delay: 0.9 }}
      >
        <TopDonors />
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;