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

// ==================== QUERY KEYS ====================

const queryKeys = {
  topDonors: ['top-donors-overview'],
};

// ==================== ANIMATION VARIANTS ====================

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (custom) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: custom * 0.08,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

// ==================== MAIN COMPONENT ====================

/**
 * Top Donors Component
 * Displays donor statistics including blood type distribution and rankings
 * 
 * @returns {JSX.Element} Top donors overview component
 */
const TopDonors = () => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // ==================== TANSTACK QUERY ====================

  /**
   * Query: Fetch donor statistics overview
   * Includes total donors, donated volume, and blood type distribution
   */
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.topDonors,
    queryFn: async () => {
      const res = await axiosInstance.get("/donors/stats/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const overview = res.data?.data || {};
      const totalDonors = overview.counts?.total || 0;
      const distribution = Array.isArray(overview.bloodTypeDistribution)
        ? overview.bloodTypeDistribution
        : [];

      // Sort blood types by count and calculate percentages
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ==================== LOADING STATE ====================

  if (isLoading) {
    return (
      <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <BloodLoader fullscreen={false} />
        </div>
      </div>
    );
  }

  // ==================== ERROR STATE ====================

  if (isError) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // ==================== NO DATA STATE ====================

  if (!data?.ranked?.length) {
    return (
      <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 text-center text-base-content/60">
        <FiUsers className="text-3xl sm:text-4xl mx-auto mb-2 opacity-50" />
        <p className="text-xs sm:text-sm">No donor statistics available.</p>
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden">

      {/* ==================== HEADER ==================== */}
      <div className="p-3 sm:p-4 border-b border-base-300">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
          <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
            <FiAward className="text-error text-sm sm:text-base" />
            Top Donor Blood Types
          </h3>
          <span className="badge badge-xs sm:badge-sm">Overview</span>
        </div>
      </div>

      {/* ==================== DONORS LIST ==================== */}
      <div className="divide-y divide-base-300">
        {data.ranked.map((item, index) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            custom={index}
            initial="hidden"
            animate="visible"
            className="p-3 sm:p-4 hover:bg-base-200/50 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">

              {/* ==================== BLOOD TYPE AVATAR ==================== */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <div className="avatar placeholder">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-error text-white flex items-center justify-center">
                    <span className="text-sm sm:text-base md:text-lg font-bold">
                      {item.bloodType}
                    </span>
                  </div>
                </div>

                {/* ==================== STATISTICS ==================== */}
                <div className="flex-1 min-w-0">
                  {/* Title and Badge */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-xs sm:text-sm">
                      {item.bloodType} Donors
                    </span>
                    <span className="badge badge-outline badge-xs sm:badge-sm">
                      {item.donorCount} donors
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-1 sm:gap-2 text-[10px] sm:text-xs">

                    {/* Donor Count */}
                    <div className="flex items-center gap-1 text-base-content/70">
                      <FiUsers size={10} className="sm:w-3 sm:h-3" />
                      <span className="truncate">{item.donorCount} registered</span>
                    </div>

                    {/* Percentage */}
                    <div className="flex items-center gap-1 text-base-content/70">
                      <FiPieChart size={10} className="sm:w-3 sm:h-3" />
                      <span>{item.percentage}% of donors</span>
                    </div>

                    {/* Blood Type */}
                    <div className="flex items-center gap-1 text-error">
                      <FiDroplet size={10} className="sm:w-3 sm:h-3" />
                      <span>Type {item.bloodType}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ==================== RANK ==================== */}
              <div className="text-right mt-2 sm:mt-0">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-error">
                  #{index + 1}
                </div>
                <div className="text-[8px] sm:text-xs text-base-content/50">Rank</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ==================== FOOTER STATS ==================== */}
      <div className="p-2 sm:p-3 border-t border-base-300 bg-base-200/50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] sm:text-xs">

        {/* Total Donors */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 text-base-content/70">
          <FiUsers size={12} className="sm:w-4 sm:h-4" />
          <span>Total Donors: {data.totalDonors}</span>
        </div>

        {/* Total Donated Volume */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 text-base-content/70">
          <FiHeart size={12} className="sm:w-4 sm:h-4 text-error" />
          <span>Total Donated: {data.totalDonatedVolume} ml</span>
        </div>
      </div>
    </div>
  );
};

export default TopDonors;