// Pages/backend/BloodBank/StaffDashboard/StaffDashboard.jsx

// React
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import React, { useMemo, useState, useEffect, useCallback } from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons - Fi (Feather Icons)
import {
  FiUsers,
  FiUser,
  FiCalendar,
  FiClock,
  FiRefreshCw,
  FiArrowRight,
  FiUserCheck,
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaTint,
  FaExclamationCircle,
  FaShieldAlt,
  FaBuilding,
  FaPhoneAlt,
  FaEnvelope,
  FaUserTie,
  FaUserMd,
  FaUserNurse,
  FaFlask as FaFlaskIcon,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import { formatAppDate, formatAppTime, formatDateInputValue } from "../../../../utils/dateFormat";

// Modals
import StaffDetailsModal from "./StaffDetailsModal/StaffDetailsModal";
import TodayEventsModal from "./TodayEventsModal/TodayEventsModal";
import PendingCheckInsModal from "./PendingCheckInsModal/PendingCheckInsModal";

// ==================== CONSTANTS ====================

// Helper function to extract ID from MongoDB ObjectId
const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    return value?.$oid || value?.toString?.() || JSON.stringify(value);
  }
  return String(value);
};

// Format date for display
const formatDate = (value) => {
  return formatAppDate(value);
};

// Format time
const formatTime = (value) => {
  return formatAppTime(value);
};

// Staff role configuration for consistent display
const staffRoleConfig = {
  manager: {
    icon: FaUserTie,
    color: "warning",
    label: "Manager",
    bgGradient: "from-warning to-warning/80",
    badgeClass: "badge-warning",
    avatarBgClass: "bg-warning/10",
    avatarTextClass: "text-warning",
  },
  technician: {
    icon: FaFlaskIcon,
    color: "info",
    label: "Technician",
    bgGradient: "from-info to-info/80",
    badgeClass: "badge-info",
    avatarBgClass: "bg-info/10",
    avatarTextClass: "text-info",
  },
  nurse: {
    icon: FaUserNurse,
    color: "success",
    label: "Nurse",
    bgGradient: "from-success to-success/80",
    badgeClass: "badge-success",
    avatarBgClass: "bg-success/10",
    avatarTextClass: "text-success",
  },
  doctor: {
    icon: FaUserMd,
    color: "error",
    label: "Doctor",
    bgGradient: "from-error to-error/80",
    badgeClass: "badge-error",
    avatarBgClass: "bg-error/10",
    avatarTextClass: "text-error",
  },
  administrator: {
    icon: FaUserTie,
    color: "secondary",
    label: "Administrator",
    bgGradient: "from-secondary to-secondary/80",
    badgeClass: "badge-secondary",
    avatarBgClass: "bg-secondary/10",
    avatarTextClass: "text-secondary",
  },
  admin: {
    icon: FaShieldAlt,
    color: "error",
    label: "Admin",
    bgGradient: "from-error to-error/80",
    badgeClass: "badge-error",
    avatarBgClass: "bg-error/10",
    avatarTextClass: "text-error",
  },
};

// Default role for unknown roles
const defaultRoleConfig = {
  icon: FiUser,
  color: "ghost",
  label: "Staff",
  badgeClass: "badge-ghost",
  avatarBgClass: "bg-base-300",
  avatarTextClass: "text-base-content",
};

// ==================== QUERY KEYS ====================

const queryKeys = {
  myBloodBank: (userId) => ['my-blood-bank-staff-dashboard', userId],
  bloodBankStaff: (bankId) => ['blood-bank-staff', bankId],
  bloodBankStats: (bankId) => ['blood-bank-stats-dashboard', bankId],
  todayEvents: (bankId, date) => ['today-events', bankId, date],
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

const StaffDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const navigate = useNavigate();

  const token = localStorage.getItem("auth_token");
  const isBloodBankUser = user?.role === "blood_bank";

  // Get user ID from auth
  const userId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  // Get today's date for filtering
  const today = useMemo(() => {
    return formatDateInputValue(new Date());
  }, []);

  // ==================== STATE MANAGEMENT ====================

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auth headers for API requests
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query 1: Fetch blood bank data for current staff user
   * Only runs for blood bank staff users
   */
  const {
    data: myBankData,
    isLoading: myBankLoading,
    isError: myBankError,
    refetch: refetchMyBank,
  } = useQuery({
    queryKey: queryKeys.myBloodBank(userId),
    enabled: !authLoading && isBloodBankUser && !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks/staff/me", {
        headers: authHeaders,
      });
      return res.data?.data || null;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Resolve blood bank ID from multiple possible sources
   */
  const bankId = useMemo(() => {
    const profileBankId =
      user?.bankId ||
      user?.bloodBankId ||
      user?.assignedBankId ||
      user?.profile?.bankId ||
      user?.profile?.bloodBankId;

    if (isBloodBankUser) {
      return myBankData?._id || profileBankId || null;
    }

    return profileBankId || userId || null;
  }, [isBloodBankUser, myBankData, user, userId]);

  /**
   * Query 2: Fetch blood bank details with staff
   */
  const {
    data: bankData,
    isLoading: bankLoading,
    isError: bankError,
    error: bankErrorData,
    refetch: refetchBank,
  } = useQuery({
    queryKey: queryKeys.bloodBankStaff(bankId),
    enabled: !authLoading && !!bankId && (!isBloodBankUser || !myBankLoading),
    queryFn: async () => {
      if (!bankId) {
        throw new Error("Bank ID not found. Please log in again.");
      }

      const res = await axiosInstance.get(`/blood-banks/${bankId}`, {
        headers: authHeaders,
      });

      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 3: Fetch blood bank statistics
   */
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: queryKeys.bloodBankStats(bankId),
    enabled: !authLoading && !!bankData?._id,
    queryFn: async () => {
      if (!bankId) return null;

      const res = await axiosInstance.get(`/blood-banks/${bankId}/stats`, {
        headers: authHeaders,
      });

      return res.data?.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - stats change frequently
  });

  /**
   * Query 4: Fetch today's events
   */
  const {
    data: todayEventsData,
    isLoading: todayEventsLoading,
    refetch: refetchTodayEvents,
  } = useQuery({
    queryKey: queryKeys.todayEvents(bankId, today),
    enabled: !authLoading && !!bankData?._id,
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/donation-events?bloodBankId=${bankId}&startDate=${today}`,
        { headers: authHeaders }
      );
      return res.data?.data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute - events change frequently
  });

  // ==================== CUSTOM FETCH FUNCTIONS ====================

  /**
   * Fetch detailed staff information including user profiles
   */
  const fetchStaffDetails = useCallback(async (staffList) => {
    if (!staffList || staffList.length === 0) {
      return [];
    }

    try {
      const staffWithDetails = await Promise.all(
        staffList.map(async (staffMember) => {
          try {
            const staffUserId = getId(staffMember.userId);
            const userRes = await axiosInstance.get(
              `/users/profile/${staffUserId}`,
              { headers: authHeaders }
            );
            return {
              ...staffMember,
              user: userRes.data?.data || null,
            };
          } catch (error) {
            console.error(`Error fetching staff user ${getId(staffMember.userId)}:`, error);
            return {
              ...staffMember,
              user: null,
            };
          }
        }),
      );

      return staffWithDetails;
    } catch (error) {
      console.error("Error fetching staff details:", error);
      return [];
    }
  }, [axiosInstance, authHeaders]);

  // ==================== COMPUTED VALUES ====================

  /**
   * Staff details with user profiles (from query + manual fetch)
   */
  const [staffDetails, setStaffDetails] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Fetch staff details when bank data is available
  useEffect(() => {
    const loadStaffDetails = async () => {
      if (!bankData?.staff) {
        setStaffDetails([]);
        return;
      }

      setLoadingStaff(true);
      const details = await fetchStaffDetails(bankData.staff);
      setStaffDetails(details);
      setLoadingStaff(false);
    };

    loadStaffDetails();
  }, [bankData, fetchStaffDetails]);

  /**
   * Calculate staff statistics
   */
  const staffStats = useMemo(() => {
    const total = staffDetails.length;
    const byRole = staffDetails.reduce((acc, staff) => {
      const role = staff.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    const byDepartment = staffDetails.reduce((acc, staff) => {
      const dept = staff.department || 'general';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      byRole,
      byDepartment,
      managerCount: byRole.manager || 0,
      technicianCount: byRole.technician || 0,
      nurseCount: byRole.nurse || 0,
      doctorCount: byRole.doctor || 0,
      adminCount: byRole.admin || 0,
    };
  }, [staffDetails]);

  /**
   * Calculate today's events statistics
   */
  const todayStats = useMemo(() => {
    const events = todayEventsData || [];
    const totalEvents = events.length;

    // Calculate total registered donors today
    const registeredToday = events.reduce((total, event) => {
      return total + (event.registeredDonors?.length || 0);
    }, 0);

    // Get pending check-ins (donors with status "registered")
    const pendingCheckins = events.flatMap(event =>
      (event.registeredDonors || [])
        .filter(donor => donor.status === "registered")
        .map(donor => ({
          ...donor,
          eventTitle: event.title,
          eventId: event._id,
        }))
    );

    // Get checked-in donors today
    const checkedInToday = events.flatMap(event =>
      (event.registeredDonors || [])
        .filter(donor => donor.status === "checked_in" || donor.status === "donated")
    ).length;

    // Get completed donations today
    const completedToday = events.flatMap(event =>
      (event.registeredDonors || [])
        .filter(donor => donor.status === "donated")
    ).length;

    return {
      totalEvents,
      registeredToday,
      pendingCheckins,
      pendingCount: pendingCheckins.length,
      checkedInToday,
      completedToday,
    };
  }, [todayEventsData]);

  /**
   * Recent donations from stats
   */
  const recentDonations = useMemo(() => {
    return statsData?.recentDonations || [];
  }, [statsData]);

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle refresh all data
   */
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const bankResult = await refetchBank();
      const latestBankData = bankResult?.data || bankData || null;

      await Promise.allSettled([
        refetchMyBank(),
        refetchStats(),
        refetchTodayEvents(),
      ]);

      // Also refresh staff details with latest bank data
      if (latestBankData?.staff) {
        const details = await fetchStaffDetails(latestBankData.staff);
        setStaffDetails(details);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Close modal helper
   */
  const CloseModal = () => {
    setSelectedStaff(null);
    document.getElementById('staff_details_modal')?.close();
    document.getElementById('pending_checkins_modal')?.close();
    document.getElementById('today_events_modal')?.close();
  };

  // ==================== LOADING STATES ====================

  if (bankLoading || statsLoading || todayEventsLoading || authLoading || myBankLoading) {
    return <BloodLoader />;
  }

  // ==================== NO PROFILE STATE ====================

  if (!bankId || (isBloodBankUser && myBankError)) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-4 sm:space-y-6 min-h-screen bg-base-200 p-3 sm:p-4 md:p-6"
      >
        {/* Header */}
        <motion.div variants={fadeInUp}>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FaBuilding className="text-error" />
            Staff Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Manage staff, view today's activities.
          </p>
        </motion.div>

        {/* No Profile Alert */}
        <motion.div
          variants={fadeInUp}
          className="alert bg-base-100 border border-error/20 shadow-sm items-start p-3 sm:p-4"
        >
          <FaExclamationCircle className="text-error mt-0.5 text-lg sm:text-xl shrink-0" />
          <div>
            <h3 className="font-semibold text-error text-sm sm:text-base">Blood Bank Profile Not Found</h3>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              No blood bank profile data is available for this account. Please contact an admin to create or link your blood bank profile.
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ==================== ERROR STATE ====================

  if (bankError) {
    return <ErrorState error={bankErrorData} onRetry={refetchBank} />;
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
            <FaBuilding className="text-error" />
            Staff Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            {bankData?.name || "Blood Bank"} • Manage staff, view today's activities
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-outline btn-xs sm:btn-sm gap-2"
          >
            <FiRefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
            <span className="text-xs sm:text-sm">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          {/* Bank Profile Link */}
          <Link
            to="/blood_bank/bank-profile"
            className="btn btn-error btn-xs sm:btn-sm gap-2"
          >
            <FaBuilding size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Bank Profile</span>
          </Link>
        </div>
      </motion.div>

      {/* ==================== QUICK STATS CARDS ==================== */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* Total Staff Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Total Staff</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-error">{staffStats.total}</p>
            </div>
            <div className="stat-figure bg-error/10 p-2 rounded-full">
              <FiUsers className="text-error text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">
            {staffStats.technicianCount} Tech • {staffStats.nurseCount} Nurses
          </p>
        </motion.div>

        {/* Today's Events Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Today's Events</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-info">{todayStats.totalEvents}</p>
            </div>
            <div className="stat-figure bg-info/10 p-2 rounded-full">
              <FiCalendar className="text-info text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">
            {todayStats.registeredToday} registered
          </p>
        </motion.div>

        {/* Pending Check-ins Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Pending Check-ins</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-warning">{todayStats.pendingCount}</p>
            </div>
            <div className="stat-figure bg-warning/10 p-2 rounded-full">
              <FiUserCheck className="text-warning text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">
            {todayStats.checkedInToday} checked in today
          </p>
        </motion.div>

        {/* Recent Donations Card */}
        <motion.div variants={fadeInUp} className="stat bg-base-100 rounded-lg shadow-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="stat-title text-xs sm:text-sm opacity-70">Recent Donations</p>
              <p className="stat-value text-lg sm:text-xl md:text-2xl font-bold text-success">{recentDonations.length}</p>
            </div>
            <div className="stat-figure bg-success/10 p-2 rounded-full">
              <FaTint className="text-success text-sm sm:text-base" />
            </div>
          </div>
          <p className="stat-desc text-xs mt-2">Latest records</p>
        </motion.div>
      </motion.div>

      {/* ==================== TODAY'S OVERVIEW CARDS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Today's Events Card */}
        <motion.div
          variants={fadeInUp}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
        >
          <div className="p-3 sm:p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-info text-sm sm:text-base" />
              <span className="text-xs sm:text-sm">Today's Events</span>
            </div>
            <span className="badge badge-info badge-xs sm:badge-sm">{todayStats.totalEvents}</span>
          </div>

          {todayStats.totalEvents > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {(todayEventsData || []).slice(0, 3).map((event) => (
                <div key={getId(event._id)} className="p-3 sm:p-4 hover:bg-base-200 transition-colors">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <span className="font-semibold text-xs sm:text-sm">{event.title}</span>
                    <span className={`badge badge-xs sm:badge-sm ${event.type === 'emergency' ? 'badge-error' :
                      event.type === 'drive' ? 'badge-info' : 'badge-success'
                      }`}>
                      {event.type}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
                    <span className="flex items-center gap-1">
                      <FiClock size={10} className="opacity-50" />
                      {event.schedule?.startTime} - {event.schedule?.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiUser size={10} className="opacity-50" />
                      {event.registeredDonors?.length || 0} registered
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center text-base-content/70">
              <FiCalendar size={32} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-xs sm:text-sm">No events scheduled for today</p>
            </div>
          )}

          <div className="p-3 sm:p-4 border-t border-base-300">
            <button
              onClick={() => {
                document.getElementById('today_events_modal')?.showModal();
              }}
              className="btn btn-xs sm:btn-sm btn-outline w-full gap-2"
              disabled={todayStats.totalEvents === 0}
            >
              <span className="text-xs">View All Today's Events</span>
              <FiArrowRight size={10} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </motion.div>

        {/* Pending Check-ins Card */}
        <motion.div
          variants={fadeInUp}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
        >
          <div className="p-3 sm:p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiUserCheck className="text-warning text-sm sm:text-base" />
              <span className="text-xs sm:text-sm">Pending Check-ins</span>
            </div>
            <span className="badge badge-warning badge-xs sm:badge-sm">{todayStats.pendingCount}</span>
          </div>

          {todayStats.pendingCount > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {todayStats.pendingCheckins.slice(0, 5).map((donor, index) => (
                <div key={index} className="p-3 sm:p-4 hover:bg-base-200 transition-colors">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Avatar */}
                    <div className="avatar placeholder">
                      <div className="bg-warning/10 text-warning rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                        <FiUser size={10} className="sm:w-4 sm:h-4" />
                      </div>
                    </div>

                    {/* Donor Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{donor.donorName || "Anonymous Donor"}</p>
                      <p className="text-[10px] sm:text-xs opacity-70 truncate">
                        {donor.eventTitle} • {formatTime(donor.registrationDate)}
                      </p>
                    </div>

                    {/* Check In Button */}
                    <button
                      onClick={() => {
                        const eventId = getId(donor.eventId);
                        navigate(`/blood_bank/events-management${eventId ? `?event=${eventId}` : ""}`);
                      }}
                      className="btn btn-xs btn-warning"
                    >
                      Check In
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center text-base-content/70">
              <FiUserCheck size={32} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
              <p className="text-xs sm:text-sm">No pending check-ins</p>
              <p className="text-[10px] sm:text-xs mt-2">All donors checked in</p>
            </div>
          )}

          {todayStats.pendingCount > 0 && (
            <div className="p-3 sm:p-4 border-t border-base-300">
              <button
                onClick={() => {
                  document.getElementById('pending_checkins_modal')?.showModal();
                }}
                className="btn btn-xs sm:btn-sm btn-outline w-full gap-2"
              >
                <span className="text-xs">View All Pending Check-ins</span>
                <FiArrowRight size={10} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ==================== STAFF LIST SECTION ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
      >
        <div className="p-3 sm:p-4 border-b border-base-300 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiUsers className="text-error text-sm sm:text-base" />
            <span className="text-xs sm:text-sm">Staff Members</span>
          </div>
          <div className="flex gap-2">
            <span className="badge badge-error badge-xs sm:badge-sm">Total: {staffStats.total}</span>
            <Link
              to="/blood_bank/bank-profile"
              className="btn btn-xs btn-ghost"
            >
              Manage Staff
            </Link>
          </div>
        </div>

        {loadingStaff ? (
          <div className="p-6 sm:p-8 text-center">
            <span className="loading loading-spinner loading-sm sm:loading-md text-error"></span>
          </div>
        ) : staffDetails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-xs sm:table-sm md:table-md w-full">
              <thead>
                <tr className="bg-base-200">
                  <th className="text-xs sm:text-sm">Staff Member</th>
                  <th className="text-xs sm:text-sm">Role</th>
                  <th className="text-xs sm:text-sm hidden sm:table-cell">Department</th>
                  <th className="text-xs sm:text-sm hidden md:table-cell">Contact</th>
                  <th className="text-xs sm:text-sm text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffDetails.map((staff, index) => {
                  const roleInfo = staffRoleConfig[staff.role] || defaultRoleConfig;
                  const RoleIcon = roleInfo.icon;
                  const user = staff.user || {};

                  return (
                    <motion.tr
                      key={getId(staff.userId)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.25 + index * 0.02 }}
                      className="hover"
                    >
                      {/* Staff Member Column */}
                      <td>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="avatar placeholder">
                            <div className={`${roleInfo.avatarBgClass} ${roleInfo.avatarTextClass} rounded-full w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex items-center justify-center`}>
                              <RoleIcon size={10} className="sm:w-4 sm:h-4" />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-xs sm:text-sm truncate max-w-24 sm:max-w-32">
                              {user.profile?.fullName || "Unknown"}
                            </p>
                            <p className="text-[10px] sm:text-xs text-base-content/70">
                              ID: {getId(staff.userId)?.slice(-8) || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td>
                        <span className={`badge ${roleInfo.badgeClass} badge-xs sm:badge-sm gap-1`}>
                          <RoleIcon size={8} className="sm:w-3 sm:h-3" />
                          <span className="text-[10px] sm:text-xs">{roleInfo.label}</span>
                        </span>
                      </td>

                      {/* Department Column - Hidden on mobile */}
                      <td className="hidden sm:table-cell">
                        <span className="badge badge-outline badge-xs sm:badge-sm">
                          {staff.department || "General"}
                        </span>
                      </td>

                      {/* Contact Column - Hidden on tablet */}
                      <td className="hidden md:table-cell">
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                              <FaEnvelope size={8} className="sm:w-3 sm:h-3 opacity-50" />
                              <span className="truncate max-w-24 lg:max-w-32">{user.email}</span>
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                              <FaPhoneAlt size={8} className="sm:w-3 sm:h-3 opacity-50" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td>
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              setSelectedStaff(staff);
                              document.getElementById('staff_details_modal')?.showModal();
                            }}
                            className="btn btn-ghost btn-xs btn-square tooltip"
                            data-tip="View Details"
                          >
                            <FiUser size={10} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 sm:p-8 md:p-12 text-center text-base-content/70">
            <FiUsers size={32} className="sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
            <p className="text-xs sm:text-sm font-medium mb-1">No Staff Members</p>
            <p className="text-[10px] sm:text-xs">
              Add staff members from the bank profile page
            </p>
          </div>
        )}
      </motion.div>

      {/* ==================== RECENT DONATIONS SECTION ==================== */}
      {recentDonations.length > 0 && (
        <motion.div
          variants={fadeInUp}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-5"
        >
          <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
            <FaTint className="text-error" />
            Recent Donations
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-xs sm:table-sm w-full">
              <thead>
                <tr className="bg-base-200">
                  <th className="text-[10px] sm:text-xs">Donor</th>
                  <th className="text-[10px] sm:text-xs">Blood Type</th>
                  <th className="text-[10px] sm:text-xs">Type</th>
                  <th className="text-[10px] sm:text-xs hidden sm:table-cell">Volume</th>
                  <th className="text-[10px] sm:text-xs hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentDonations.slice(0, 5).map((donation, index) => (
                  <tr key={index}>
                    <td>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="avatar placeholder hidden xs:block">
                          <div className="bg-error/10 text-error rounded-full w-4 h-4 sm:w-5 sm:h-5">
                            <FiUser size={8} className="sm:w-3 sm:h-3" />
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-xs truncate max-w-20 sm:max-w-24">
                          {donation.donorName || "Anonymous"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-error badge-xs sm:badge-sm">{donation.donorBloodGroup || "Unknown"}</span>
                    </td>
                    <td className="text-[10px] sm:text-xs capitalize">{donation.type || "whole_blood"}</td>
                    <td className="hidden sm:table-cell text-[10px] sm:text-xs">{donation.volume || 0}ml</td>
                    <td className="hidden md:table-cell text-[10px] sm:text-xs">{formatDate(donation.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ==================== QUICK ACTIONS GRID ==================== */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* Events Quick Action */}
        <Link
          to="/blood_bank/events-management"
          className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-2 sm:p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FiCalendar className="text-error text-base sm:text-xl" />
          </div>
          <p className="font-semibold text-[10px] sm:text-sm">Events</p>
        </Link>

        {/* Inventory Quick Action */}
        <Link
          to="/blood_bank/inventory-management"
          className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-2 sm:p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FaTint className="text-error text-base sm:text-xl" />
          </div>
          <p className="font-semibold text-[10px] sm:text-sm">Inventory</p>
        </Link>

        {/* Bank Profile Quick Action */}
        <Link
          to="/blood_bank/bank-profile"
          className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-2 sm:p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FaBuilding className="text-error text-base sm:text-xl" />
          </div>
          <p className="font-semibold text-[10px] sm:text-sm">Bank Profile</p>
        </Link>

        {/* Check-ins Quick Action */}
        <Link
          to="/blood_bank/events-management"
          className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-2 sm:p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FiUserCheck className="text-error text-base sm:text-xl" />
          </div>
          <p className="font-semibold text-[10px] sm:text-sm">Check-ins</p>
        </Link>
      </motion.div>

      {/* ==================== FOOTER NOTE ==================== */}
      <motion.div
        variants={fadeInUp}
        className="text-[10px] sm:text-xs text-center text-base-content/60 flex items-center justify-center gap-2"
      >
        <FaShieldAlt className="inline text-xs" />
        Staff dashboard updates in real-time. Last updated: {formatAppTime(new Date())}
      </motion.div>

      {/* ==================== MODALS ==================== */}

      {/* Staff Details Modal */}
      <dialog id="staff_details_modal" className="modal">
        <StaffDetailsModal
          staff={selectedStaff}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>

      {/* Pending Check-ins Modal */}
      <dialog id="pending_checkins_modal" className="modal">
        <PendingCheckInsModal
          pendingCheckIns={todayStats.pendingCheckins}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>

      {/* Today's Events Modal */}
      <dialog id="today_events_modal" className="modal">
        <TodayEventsModal
          events={todayEventsData}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop hidden md:block">
          <button>close</button>
        </form>
      </dialog>
    </motion.div>
  );
};

export default StaffDashboard;