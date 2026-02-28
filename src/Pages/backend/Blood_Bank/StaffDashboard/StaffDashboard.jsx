// Pages/backend/BloodBank/StaffDashboard/StaffDashboard.jsx

// React
import { Link, useNavigate } from "react-router";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

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

// Modals
import StaffDetailsModal from "./StaffDetailsModal/StaffDetailsModal";

import TodayEventsModal from "./TodayEventsModal/TodayEventsModal";
import PendingCheckInsModal from "./PendingCheckInsModal/PendingCheckInsModal";

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
  if (!value) return "N/A";
  try {
    const date = new Date(value?.$date || value);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

// Format time
const formatTime = (value) => {
  if (!value) return "N/A";
  try {
    const date = new Date(value?.$date || value);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

// Staff role configuration
const staffRoleConfig = {
  manager: {
    icon: FaUserTie,
    color: "warning",
    label: "Manager",
    bgColor: "from-warning to-warning/80",
    badgeClass: "badge-warning",
    avatarBgClass: "bg-warning/10",
    avatarTextClass: "text-warning",
  },
  technician: {
    icon: FaFlaskIcon,
    color: "info",
    label: "Technician",
    bgColor: "from-info to-info/80",
    badgeClass: "badge-info",
    avatarBgClass: "bg-info/10",
    avatarTextClass: "text-info",
  },
  nurse: {
    icon: FaUserNurse,
    color: "success",
    label: "Nurse",
    bgColor: "from-success to-success/80",
    badgeClass: "badge-success",
    avatarBgClass: "bg-success/10",
    avatarTextClass: "text-success",
  },
  doctor: {
    icon: FaUserMd,
    color: "error",
    label: "Doctor",
    bgColor: "from-error to-error/80",
    badgeClass: "badge-error",
    avatarBgClass: "bg-error/10",
    avatarTextClass: "text-error",
  },
  administrator: {
    icon: FaUserTie,
    color: "secondary",
    label: "Administrator",
    bgColor: "from-secondary to-secondary/80",
    badgeClass: "badge-secondary",
    avatarBgClass: "bg-secondary/10",
    avatarTextClass: "text-secondary",
  },
  admin: {
    icon: FaShieldAlt,
    color: "error",
    label: "Admin",
    bgColor: "from-error to-error/80",
    badgeClass: "badge-error",
    avatarBgClass: "bg-error/10",
    avatarTextClass: "text-error",
  },
};

const StaffDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const navigate = useNavigate();
  const token = localStorage.getItem("auth_token");
  const isBloodBankUser = user?.role === "blood_bank";

  const userId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  // Get today's date for filtering
  const today = useMemo(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }, []);

  // States
  const [staffDetails, setStaffDetails] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auth headers for API requests
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  const {
    data: myBankData,
    isLoading: myBankLoading,
    isError: myBankError,
  } = useQuery({
    queryKey: ["my-blood-bank-staff-dashboard", userId, user?.role],
    enabled: !authLoading && isBloodBankUser && !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get("/blood-banks/staff/me", {
        headers: authHeaders,
      });
      return res.data?.data || null;
    },
    retry: false,
  });

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

  // Fetch blood bank details with staff
  const {
    data: bankData,
    isLoading: bankLoading,
    isError: bankError,
    error: bankErrorData,
    refetch: refetchBank,
  } = useQuery({
    queryKey: ["blood-bank-staff", bankId],
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
  });

  // Fetch bank statistics
  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["blood-bank-stats-dashboard", bankId],
    enabled: !authLoading && !!bankData?._id,
    queryFn: async () => {
      if (!bankId) return null;

      const res = await axiosInstance.get(`/blood-banks/${bankId}/stats`, {
        headers: authHeaders,
      });

      return res.data?.data;
    },
  });

  // Fetch today's events
  const {
    data: todayEventsData,
    isLoading: todayEventsLoading,
    refetch: refetchTodayEvents,
  } = useQuery({
    queryKey: ["today-events", bankId, today],
    enabled: !authLoading && !!bankData?._id,
    queryFn: async () => {
      const res = await axiosInstance.get(
        `/donation-events?bloodBankId=${bankId}&startDate=${today}`,
        { headers: authHeaders }
      );
      return res.data?.data || [];
    },
  });

  const fetchStaffDetails = useCallback(async (staffList) => {
    if (!staffList || staffList.length === 0) {
      setStaffDetails([]);
      return;
    }

    setLoadingStaff(true);
    try {
      const staffWithDetails = await Promise.all(
        staffList.map(async (staffMember) => {
          try {
            const userRes = await axiosInstance.get(
              `/users/profile/${staffMember.userId}`,
              { headers: authHeaders }
            );
            return {
              ...staffMember,
              user: userRes.data?.data || null,
            };
          } catch (error) {
            console.error(`Error fetching staff user ${staffMember.userId}:`, error);
            return {
              ...staffMember,
              user: null,
            };
          }
        }),
      );

      setStaffDetails(staffWithDetails);
    } catch (error) {
      console.error("Error fetching staff details:", error);
    } finally {
      setLoadingStaff(false);
    }
  }, [axiosInstance, authHeaders]);

  // Fetch staff details when bank data is available
  useEffect(() => {
    fetchStaffDetails(bankData?.staff);
  }, [bankData, fetchStaffDetails]);

  // Calculate staff statistics
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

  // Calculate today's events statistics
  const todayStats = useMemo(() => {
    const events = todayEventsData || [];
    const totalEvents = events.length;

    // Calculate total registered donors today
    const registeredToday = events.reduce((total, event) => {
      return total + (event.registeredDonors?.length || 0);
    }, 0);

    // Get pending check-ins (donors with status "registered")
    const pendingCheckIns = events.flatMap(event =>
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
      pendingCheckIns,
      pendingCount: pendingCheckIns.length,
      checkedInToday,
      completedToday,
    };
  }, [todayEventsData]);

  // Calculate recent donations from stats
  const recentDonations = useMemo(() => {
    return statsData?.recentDonations || [];
  }, [statsData]);

  // Handle refresh all data
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const bankResult = await refetchBank();
      const latestBankData = bankResult?.data || bankData || null;

      await Promise.allSettled([
        refetchStats(),
        refetchTodayEvents(),
        fetchStaffDetails(latestBankData?.staff),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Close modal helper
  const CloseModal = () => {
    setSelectedStaff(null);
    document.getElementById('staff_details_modal')?.close();
    document.getElementById('pending_checkIns_modal')?.close();
    document.getElementById('today_events_modal')?.close();
  };

  // Loading state
  if (bankLoading || statsLoading || todayEventsLoading || authLoading || myBankLoading) {
    return <BloodLoader />;
  }

  if (!bankId || (isBloodBankUser && myBankError)) {
    return (
      <div className="space-y-6 min-h-screen bg-base-200 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaBuilding className="text-error" />
            Staff Dashboard
          </h2>
          <p className="text-sm text-base-content/70 mt-1">
            Manage staff, view today's activities.
          </p>
        </motion.div>
        <div className="alert bg-base-100 border border-error/20 shadow-sm items-start">
          <FaExclamationCircle className="text-error mt-0.5" />
          <div>
            <h3 className="font-semibold text-error">Blood Bank Profile Not Found</h3>
            <p className="text-sm text-base-content/70 mt-1">
              No blood bank profile data is available for this account. Please contact an admin to create or link your blood bank profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (bankError) {
    return <ErrorState error={bankErrorData} onRetry={refetchBank} />;
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
            <FaBuilding className="text-error" />
            Staff Dashboard
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            {bankData?.name || "Blood Bank"} • Manage staff, view today's activities
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-outline btn-sm gap-2"
          >
            <FiRefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            to="/blood_bank/bank-profile"
            className="btn btn-error btn-sm gap-2"
          >
            <FaBuilding size={16} />
            Bank Profile
          </Link>
        </div>
      </motion.div>

      {/* Quick Stats Cards */}
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
        {/* Total Staff */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-error">
            <FiUsers size={24} />
          </div>
          <p className="stat-title">Total Staff</p>
          <p className="stat-value text-3xl">{staffStats.total}</p>
          <p className="stat-desc">
            {staffStats.technicianCount} Technicians • {staffStats.nurseCount} Nurses
          </p>
        </motion.div>

        {/* Today's Events */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-info">
            <FiCalendar size={24} />
          </div>
          <p className="stat-title">Today's Events</p>
          <p className="stat-value text-3xl">{todayStats.totalEvents}</p>
          <p className="stat-desc">
            {todayStats.registeredToday} registered
          </p>
        </motion.div>

        {/* Pending Check-ins */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-warning">
            <FiUserCheck size={24} />
          </div>
          <p className="stat-title">Pending Check-ins</p>
          <p className="stat-value text-3xl">{todayStats.pendingCount}</p>
          <p className="stat-desc">
            {todayStats.checkedInToday} checked in today
          </p>
        </motion.div>

        {/* Recent Donations */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          className="stat bg-base-100 rounded-lg shadow-lg p-4"
        >
          <div className="stat-figure text-success">
            <FaTint size={24} />
          </div>
          <p className="stat-title">Recent Donations</p>
          <p className="stat-value text-3xl">{recentDonations.length}</p>
          <p className="stat-desc">Last 24 hours</p>
        </motion.div>
      </motion.div>

      {/* Today's Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Events Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
        >
          <div className="p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-info" />
              Today's Events
            </div>
            <span className="badge badge-info">{todayStats.totalEvents}</span>
          </div>

          {todayStats.totalEvents > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {todayEventsData.slice(0, 3).map((event) => (
                <div key={getId(event._id)} className="p-4 hover:bg-base-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">{event.title}</span>
                    <span className={`badge badge-sm ${event.type === 'emergency' ? 'badge-error' :
                      event.type === 'drive' ? 'badge-info' : 'badge-success'
                      }`}>
                      {event.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <FiClock size={12} className="opacity-50" />
                      {event.schedule?.startTime} - {event.schedule?.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiUser size={12} className="opacity-50" />
                      {event.registeredDonors?.length || 0} registered
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-base-content/70">
              <FiCalendar size={48} className="mx-auto mb-3 opacity-50" />
              <p>No events scheduled for today</p>
            </div>
          )}

          <div className="p-4 border-t border-base-300">
            <button
              onClick={() => {
                document.getElementById('today_events_modal')?.showModal();
              }}
              className="btn btn-sm btn-outline w-full gap-2"
              disabled={todayStats.totalEvents === 0}
            >
              View All Today's Events
              <FiArrowRight />
            </button>
          </div>
        </motion.div>

        {/* Pending Check-ins Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
        >
          <div className="p-4 border-b border-base-300 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiUserCheck className="text-warning" />
              Pending Check-ins
            </div>
            <span className="badge badge-warning">{todayStats.pendingCount}</span>
          </div>

          {todayStats.pendingCount > 0 ? (
            <div className="divide-y divide-base-300 max-h-80 overflow-y-auto">
              {todayStats.pendingCheckIns.slice(0, 5).map((donor, index) => (
                <div key={index} className="p-4 hover:bg-base-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-warning/10 text-warning rounded-full w-8 h-8 flex items-center justify-center">
                        <FiUser size={14} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{donor.donorName || "Anonymous Donor"}</p>
                      <p className="text-xs opacity-70">
                        {donor.eventTitle} • {formatTime(donor.registrationDate)}
                      </p>
                    </div>
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
            <div className="p-8 text-center text-base-content/70">
              <FiUserCheck size={48} className="mx-auto mb-3 opacity-50" />
              <p>No pending check-ins</p>
              <p className="text-xs mt-2">All donors checked in</p>
            </div>
          )}

          {todayStats.pendingCount > 0 && (
            <div className="p-4 border-t border-base-300">
              <button
                onClick={() => {
                  document.getElementById('pending_checkIns_modal')?.showModal();
                }}
                className="btn btn-sm btn-outline w-full gap-2"
              >
                View All Pending Check-ins
                <FiArrowRight />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Staff List Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 overflow-hidden"
      >
        <div className="p-4 border-b border-base-300 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiUsers className="text-error" />
            Staff Members
          </div>
          <div className="flex gap-2">
            <span className="badge badge-error badge-sm">Total: {staffStats.total}</span>
            <Link
              to="/blood_bank/bank-profile"
              className="btn btn-xs btn-ghost"
            >
              Manage Staff
            </Link>
          </div>
        </div>

        {loadingStaff ? (
          <div className="p-8 text-center">
            <span className="loading loading-spinner loading-lg text-error"></span>
          </div>
        ) : staffDetails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-base-200">
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Contact</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffDetails.map((staff, index) => {
                  const roleInfo = staffRoleConfig[staff.role] || {
                    icon: FiUser,
                    color: "ghost",
                    label: staff.role || "Staff",
                    badgeClass: "badge-ghost",
                    avatarBgClass: "bg-base-300",
                    avatarTextClass: "text-base-content",
                  };
                  const RoleIcon = roleInfo.icon;
                  const user = staff.user || {};

                  return (
                    <motion.tr
                      key={staff.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.25 + index * 0.02 }}
                      className="hover"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className={`${roleInfo.avatarBgClass} ${roleInfo.avatarTextClass} rounded-full w-10 h-10 flex items-center justify-center`}>
                              <RoleIcon size={18} />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold">
                              {user.profile?.fullName || "Unknown"}
                            </p>
                            <p className="text-xs text-base-content/70">
                              ID: {staff.userId?.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${roleInfo.badgeClass} gap-1`}>
                          <RoleIcon size={12} />
                          {roleInfo.label}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-outline">
                          {staff.department || "General"}
                        </span>
                      </td>

                      <td>
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-1 text-xs">
                              <FaEnvelope size={10} className="opacity-50" />
                              <span className="truncate max-w-32">{user.email}</span>
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-1 text-xs">
                              <FaPhoneAlt size={10} className="opacity-50" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

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
                            <FiUser size={14} />
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
          <div className="p-12 text-center text-base-content/70">
            <FiUsers size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No Staff Members</p>
            <p className="text-sm">
              Add staff members from the bank profile page
            </p>
          </div>
        )}
      </motion.div>

      {/* Recent Donations Section */}
      {recentDonations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-5"
        >
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <FaTint className="text-error" />
            Recent Donations
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-200">
                  <th>Donor</th>
                  <th>Blood Type</th>
                  <th>Type</th>
                  <th>Volume</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentDonations.slice(0, 5).map((donation, index) => (
                  <tr key={index}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar placeholder">
                          <div className="bg-error/10 text-error rounded-full w-6 h-6">
                            <FiUser size={12} />
                          </div>
                        </div>
                        <span className="text-sm">{donation.donorName || "Anonymous"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-error badge-sm">{donation.donorBloodGroup || "Unknown"}</span>
                    </td>
                    <td className="capitalize">{donation.type || "whole_blood"}</td>
                    <td>{donation.volume || 0}ml</td>
                    <td>{formatDate(donation.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <Link
          to="/blood_bank/events-management"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FiCalendar className="text-error" size={24} />
          </div>
          <p className="font-semibold text-sm">Events</p>
        </Link>

        <Link
          to="/blood_bank/inventory-management"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FaTint className="text-error" size={24} />
          </div>
          <p className="font-semibold text-sm">Inventory</p>
        </Link>

        <Link
          to="/blood_bank/bank-profile"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FaBuilding className="text-error" size={24} />
          </div>
          <p className="font-semibold text-sm">Bank Profile</p>
        </Link>

        <Link
          to="/blood_bank/events-management"
          className="bg-base-100 border border-base-300 rounded-lg p-4 text-center hover:shadow-lg transition-all hover:border-error/50 group"
        >
          <div className="bg-error/10 p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-error/20 transition-colors">
            <FiUserCheck className="text-error" size={24} />
          </div>
          <p className="font-semibold text-sm">Check-ins</p>
        </Link>
      </motion.div>

      {/* Footer Note */}
      <div className="text-xs text-center text-base-content/60 flex items-center justify-center gap-2">
        <FaShieldAlt className="inline" />
        Staff dashboard updates in real-time. Last updated: {new Date().toLocaleTimeString()}
      </div>

      {/* Modals */}
      <dialog id="staff_details_modal" className="modal">
        <StaffDetailsModal
          staff={selectedStaff}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <dialog id="pending_checkIns_modal" className="modal">
        <PendingCheckInsModal
          pendingCheckIns={todayStats.pendingCheckIns}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <dialog id="today_events_modal" className="modal">
        <TodayEventsModal
          events={todayEventsData}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default StaffDashboard;


