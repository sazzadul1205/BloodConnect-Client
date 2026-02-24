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

const AdminDashboard = () => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // States
  const [dateRange, setDateRange] = useState("30");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // 🔹 Fetch Dashboard Summary
  const {
    data: summaryData,
    isLoading: loadingSummary,
    isError: summaryError,
    error: summaryErrorData,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["dashboard-summary", refreshKey],
    queryFn: async () => {
      const res = await axiosInstance.get("/audit-logs/dashboard/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // 🔹 Fetch Users Count
  const {
    data: usersData,
    isLoading: loadingUsers,
    isError: usersError,
    error: usersErrorData,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["users-count", refreshKey],
    queryFn: async () => {
      const res = await axiosInstance.get("/users/admin/all-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // 🔹 Fetch Donors Count
  const {
    data: donorsData,
    isLoading: loadingDonors,
    isError: donorsError,
    error: donorsErrorData,
    refetch: refetchDonors,
  } = useQuery({
    queryKey: ["donors-count", refreshKey],
    queryFn: async () => {
      const res = await axiosInstance.get("/users/admin/donors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // 🔹 Fetch Blood Banks Count
  const {
    data: banksData,
    isLoading: loadingBanks,
    isError: banksError,
    error: banksErrorData,
    refetch: refetchBanks,
  } = useQuery({
    queryKey: ["banks-count", refreshKey],
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // 🔹 Fetch Requests Stats
  const {
    data: requestsData,
    isLoading: loadingRequests,
    isError: requestsError,
    error: requestsErrorData,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ["requests-stats", refreshKey],
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-requests/stats/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // 🔹 Fetch Action Statistics
  const {
    data: actionStatsData,
    isLoading: loadingActionStats,
    isError: actionStatsError,
    error: actionStatsErrorData,
    refetch: refetchActionStats,
  } = useQuery({
    queryKey: ["action-stats", dateRange, refreshKey],
    queryFn: async () => {
      const res = await axiosInstance.get(`/audit-logs/stats/actions?days=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // 🔹 Fetch Recent Activities
  const {
    data: recentActivitiesData,
    isLoading: loadingActivities,
    isError: activitiesError,
    error: activitiesErrorData,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ["recent-activities", refreshKey],
    queryFn: async () => {
      const res = await axiosInstance.get("/audit-logs?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Calculate derived stats
  const totalUsers = usersData?.count || 0;
  const totalDonors = donorsData?.count || 0;
  const totalBanks = banksData?.count || 0;
  const verifiedBanks = banksData?.data?.filter(b => b.verification?.isVerified).length || 0;

  // Requests
  const pendingRequests = requestsData?.data?.byStatus?.find(s => s._id === "pending")?.count || 0;
  const fulfilledRequests = requestsData?.data?.byStatus?.find(s => s._id === "fulfilled")?.count || 0;
  const totalRequests = requestsData?.data?.byStatus?.reduce((sum, s) => sum + s.count, 0) || 0;

  // Total Inventory
  const totalInventory = banksData?.data?.reduce((sum, bank) =>
    sum + (bank.inventory?.reduce((s, i) => s + (i.units || 0), 0) || 0), 0
  ) || 0;

  // Low Inventory
  const lowInventoryCount = banksData?.data?.filter(bank =>
    bank.inventory?.some(item => item.units <= item.threshold)
  ).length || 0;

  // Urgent Requests
  const urgentRequests = requestsData?.data?.byUrgency?.find(u => u._id === "emergency")?.count || 0;

  // Calculate completion rate
  const completionRate = totalRequests > 0
    ? Math.round((fulfilledRequests / totalRequests) * 100)
    : 0;

  const handleRefresh = () => {
    refetchUsers()
    refetchBanks()
    refetchDonors()
    refetchSummary()
    refetchRequests()
    refetchActivities()
    refetchActionStats()
    setRefreshKey(prev => prev + 1);
  };

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

  // Loading state
  if (loadingSummary || loadingUsers || loadingDonors || loadingBanks || loadingRequests || loadingActionStats || loadingActivities) {
    return <BloodLoader />;
  }

  // Error state
  if (summaryError || usersError || donorsError || banksError || requestsError || actionStatsError || activitiesError) {
    return (
      <ErrorState
        error={[summaryErrorData, usersErrorData, donorsErrorData, banksErrorData, requestsErrorData, actionStatsErrorData, activitiesErrorData]}
        onRetry={() => {
          handleRefresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiActivity className="text-error" />
            Dashboard Overview
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Monitor blood donation activities, requests, and system statistics
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Date Range Selector */}
          <select
            className="select select-bordered select-sm"
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
            className="btn btn-outline btn-sm gap-2"
          >
            <FiRefreshCw size={16} />
            Refresh
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn btn-outline btn-sm gap-2"
          >
            <FiDownload size={16} />
            {isExporting ? "Exporting..." : "Export Report"}
          </button>
        </div>
      </motion.div>

      {/* Key Metrics Stats Cards */}
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

      {/* Secondary Stats Row */}
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

      {/* Charts and Statistics Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <ActivityChart
            data={actionStatsData?.data?.byDay || []}
            isLoading={loadingActionStats}
          />
        </motion.div>

        {/* Requests by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <RequestsByStatus
            data={requestsData?.data?.byStatus || []}
            isLoading={loadingRequests}
          />
        </motion.div>
      </div>

      {/* Charts and Statistics Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blood Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-1"
        >
          <BloodTypeDistribution
            data={banksData?.data || []}
            isLoading={loadingBanks}
          />
        </motion.div>

        {/* Action Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-2"
        >
          <ActionStatistics
            data={actionStatsData?.data}
            isLoading={loadingActionStats}
          />
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="lg:col-span-2"
        >
          <RecentActivities
            data={recentActivitiesData?.data || []}
            isLoading={loadingActivities}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="lg:col-span-1"
        >
          <QuickActions />
        </motion.div>
      </div>

      {/* Top Donors Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <TopDonors />
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
