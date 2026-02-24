// Pages/backend/Admin/AdminDashboard/TopDonors/TopDonors.jsx

// React
import React from "react";
import { useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FiAward,
  FiDroplet,
  FiUsers,
  FiPieChart,
  FiHeart,
} from "react-icons/fi";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../../shared/BloodLoader";
import ErrorState from "../../../../../shared/ErrorState";

const TopDonors = () => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // React Query
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["top-donors-overview"],
    queryFn: async () => {
      const res = await axiosInstance.get("/donors/stats/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const overview = res.data?.data || {};
      const totalDonors = overview.counts?.total || 0;
      const distribution = Array.isArray(overview.bloodTypeDistribution)
        ? overview.bloodTypeDistribution
        : [];

      const ranked = [...distribution]
        .sort((a, b) => (b?.count || 0) - (a?.count || 0))
        .map((item, index) => {
          const count = item?.count || 0;
          const percentage = totalDonors > 0
            ? Math.round((count / totalDonors) * 100)
            : 0;

          return {
            id: `${item?._id || "unknown"}-${index}`,
            bloodType: item?._id || "Unknown",
            donorCount: count,
            percentage,
          };
        });

      return {
        totalDonors,
        totalDonatedVolume: overview.totalDonatedVolume || 0,
        ranked,
      };
    },
  });

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4">
        <div className="flex items-center justify-center h-64">
          <BloodLoader fullscreen={false} />
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // No Data
  if (!data?.ranked?.length) {
    return (
      <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 text-center text-base-content/60">
        No donor statistics available.
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <FiAward className="text-error" />
            Top Donor Blood Types
          </h3>
          <span className="badge badge-sm">Overview</span>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-base-300">
        {data.ranked.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="p-4 hover:bg-base-200/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Blood Type Avatar */}
              <div className="avatar placeholder">
                <div className="w-12 h-12 rounded-full bg-error text-white">
                  <span className="text-xl font-bold">{item.bloodType}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.bloodType} Donors</span>
                  <span className="badge badge-sm badge-outline">
                    {item.donorCount} donors
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm">
                  <div className="flex items-center gap-1 text-base-content/70">
                    <FiUsers size={12} />
                    <span>{item.donorCount} registered</span>
                  </div>

                  <div className="flex items-center gap-1 text-base-content/70">
                    <FiPieChart size={12} />
                    <span>{item.percentage}% of donors</span>
                  </div>

                  <div className="flex items-center gap-1 text-error">
                    <FiDroplet size={12} />
                    <span>Type {item.bloodType}</span>
                  </div>
                </div>
              </div>

              {/* Rank */}
              <div className="text-right">
                <div className="text-2xl font-bold text-error">#{index + 1}</div>
                <div className="text-xs text-base-content/50">Rank</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-base-300 bg-base-200/50 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div className="flex items-center justify-center gap-2 text-base-content/70">
          <FiUsers size={14} />
          <span>Total Donors: {data.totalDonors}</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-base-content/70">
          <FiHeart size={14} className="text-error" />
          <span>Total Donated: {data.totalDonatedVolume} ml</span>
        </div>
      </div>
    </div>
  );
};

export default TopDonors;
