// React
import React, { useState, useEffect } from "react";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaTint,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaHeartbeat,
  FaBuilding,
  FaShieldAlt,
  FaTimes,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaVenusMars,
  FaIdCard,
  FaBell,
  FaGlobe,
  FaClock,
  FaUserCheck,
  FaUserClock,
  FaStar,
  FaChartLine,
} from "react-icons/fa";

// Hooks
import BloodLoader from "../../../../../shared/BloodLoader";
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";
import { formatAppDate, formatAppDateTime } from "../../../../../utils/dateFormat";

const ViewUserModal = ({ userId, onClose }) => {
  const { axiosInstance } = useAxiosPublic();

  // States
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // profile, address, stats, settings

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get(`/users/profile/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        });

        if (response.data?.success) {
          setUserData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, axiosInstance]);

  // Format date
  const formatDate = (dateString) => {
    return formatAppDate(dateString, "MMMM d, yyyy");
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    return formatAppDateTime(dateString, "MMMM d, yyyy p");
  };

  // Get role icon and color
  const getRoleInfo = (role) => {
    const roleMap = {
      donor: { icon: FaTint, color: "success", label: "Donor", bgColor: "from-success to-success/80" },
      requester: { icon: FaHeartbeat, color: "warning", label: "Requester", bgColor: "from-warning to-warning/80" },
      hospital: { icon: FaMapMarkerAlt, color: "info", label: "Hospital", bgColor: "from-info to-info/80" },
      blood_bank: { icon: FaBuilding, color: "secondary", label: "Blood Bank", bgColor: "from-secondary to-secondary/80" },
      admin: { icon: FaShieldAlt, color: "error", label: "Admin", bgColor: "from-error to-error/80" },
      super_admin: { icon: FaShieldAlt, color: "error", label: "Super Admin", bgColor: "from-error to-error/80" },
    };
    return roleMap[role] || {
      icon: FaUser,
      color: "ghost",
      label: role || "User",
      bgColor: "from-base-300 to-base-300/80"
    };
  };

  // Get status badge
  const getStatusBadge = (isVerified) => {
    return isVerified ? (
      <span className="badge badge-success gap-1">
        <FaCheckCircle size={12} />
        Verified
      </span>
    ) : (
      <span className="badge badge-ghost gap-1">
        <FaTimesCircle size={12} />
        Unverified
      </span>
    );
  };

  // Get badge color based on role
  const getBadgeColor = (color) => {
    const colorMap = {
      success: "badge-success",
      warning: "badge-warning",
      info: "badge-info",
      secondary: "badge-secondary",
      error: "badge-error",
      ghost: "badge-ghost"
    };
    return colorMap[color] || "badge-ghost";
  };

  if (loading) return <BloodLoader fullscreen={false} />;
  if (!userData) return null;

  const roleInfo = getRoleInfo(userData.role);
  const RoleIcon = roleInfo.icon;
  const badgeColor = getBadgeColor(roleInfo.color);

  // Safe access to nested properties
  const profile = userData.profile || {};
  const verification = userData.verification || {};
  const address = userData.address || {};
  const stats = userData.stats || {};
  const settings = userData.settings || {};
  const notifications = settings.notifications || {};
  const privacy = settings.privacy || {};

  return (
    <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className={`bg-linear-to-r ${roleInfo.bgColor} p-6 text-white`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <RoleIcon size={32} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">{profile.fullName || "User Profile"}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`badge ${badgeColor} gap-1`}>
                  <RoleIcon size={12} />
                  {roleInfo.label}
                </div>
                <span className="text-white/80 text-sm">ID: {userData._id?.slice(-8) || "N/A"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onClose()}
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
          >
            <FaTimes size={20} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-base-200/50 border-b border-base-300">
        <div className="stat py-2">
          <div className="stat-figure text-primary">
            <FaClock />
          </div>
          <div className="stat-title text-xs">Joined</div>
          <div className="stat-value text-sm">{formatDate(userData.createdAt)}</div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-success">
            <FaUserCheck />
          </div>
          <div className="stat-title text-xs">Last Active</div>
          <div className="stat-value text-sm">{formatDate(stats.lastActive)}</div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-warning">
            <FaStar />
          </div>
          <div className="stat-title text-xs">Reputation</div>
          <div className="stat-value text-sm">{stats.reputation || 100}%</div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-info">
            <FaChartLine />
          </div>
          <div className="stat-title text-xs">Response Rate</div>
          <div className="stat-value text-sm">{stats.responseRate || 0}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-100 p-1 border-b border-base-300">
        <button
          className={`tab tab-sm ${activeTab === "profile" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          className={`tab tab-sm ${activeTab === "address" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("address")}
        >
          Address
        </button>
        <button
          className={`tab tab-sm ${activeTab === "stats" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          Statistics
        </button>
        <button
          className={`tab tab-sm ${activeTab === "settings" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
        <button
          className={`tab tab-sm ${activeTab === "verification" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("verification")}
        >
          Verification
        </button>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[50vh] overflow-y-auto">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Basic Info */}
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                <FaUser className="text-primary" />
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-70">Full Name</p>
                  <p className="font-medium">{profile.fullName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Username</p>
                  <p className="font-medium">@{userData.username || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    {userData.email || "N/A"}
                    {getStatusBadge(verification.isEmailVerified)}
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    {userData.phone || "N/A"}
                    {getStatusBadge(verification.isPhoneVerified)}
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                <FaVenusMars className="text-primary" />
                Personal Information
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm opacity-70">Blood Group</p>
                  <p className="font-medium text-error text-lg">
                    {profile.bloodGroup || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Date of Birth</p>
                  <p className="font-medium">{formatDate(profile.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Gender</p>
                  <p className="font-medium capitalize">{profile.gender || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Weight</p>
                  <p className="font-medium">{profile.weight ? `${profile.weight} kg` : "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {profile.emergencyContact?.name && (
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                  <FaPhone className="text-primary" />
                  Emergency Contact
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm opacity-70">Name</p>
                    <p className="font-medium">{profile.emergencyContact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70">Relation</p>
                    <p className="font-medium">{profile.emergencyContact.relation}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70">Phone</p>
                    <p className="font-medium">{profile.emergencyContact.phone}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Address Tab */}
        {activeTab === "address" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                <FaMapMarkerAlt className="text-primary" />
                Address Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-sm opacity-70">Street Address</p>
                  <p className="font-medium">{address.street || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">City</p>
                  <p className="font-medium">{address.city || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">State</p>
                  <p className="font-medium">{address.state || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Zip Code</p>
                  <p className="font-medium">{address.zipCode || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Country</p>
                  <p className="font-medium">{address.country || "N/A"}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Statistics Tab */}
        {activeTab === "stats" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-figure text-primary">
                  <FaTint size={24} />
                </div>
                <div className="stat-title">Total Donations</div>
                <div className="stat-value text-3xl">{stats.totalDonations || 0}</div>
                <div className="stat-desc">Lives saved: {(stats.totalDonations || 0) * 3}</div>
              </div>

              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-figure text-warning">
                  <FaHeartbeat size={24} />
                </div>
                <div className="stat-title">Total Requests</div>
                <div className="stat-value text-3xl">{stats.totalRequests || 0}</div>
                <div className="stat-desc">Active requests</div>
              </div>
            </div>

            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Activity Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <FaClock className="text-primary" />
                  <span>Last active: {formatDateTime(stats.lastActive)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FaUserCheck className="text-success" />
                  <span>Account created: {formatDateTime(userData.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FaUserClock className="text-warning" />
                  <span>Last updated: {formatDateTime(userData.updatedAt)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                <FaBell className="text-primary" />
                Notification Settings
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`badge ${notifications.email ? 'badge-success' : 'badge-ghost'}`}>
                    {notifications.email ? 'Enabled' : 'Disabled'}
                  </div>
                  <span>Email Notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`badge ${notifications.sms ? 'badge-success' : 'badge-ghost'}`}>
                    {notifications.sms ? 'Enabled' : 'Disabled'}
                  </div>
                  <span>SMS Notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`badge ${notifications.push ? 'badge-success' : 'badge-ghost'}`}>
                    {notifications.push ? 'Enabled' : 'Disabled'}
                  </div>
                  <span>Push Notifications</span>
                </div>
              </div>
            </div>

            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                <FaGlobe className="text-primary" />
                Privacy Settings
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`badge ${privacy.showLocation ? 'badge-success' : 'badge-ghost'}`}>
                    {privacy.showLocation ? 'Public' : 'Private'}
                  </div>
                  <span>Show Location</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`badge ${privacy.showContact ? 'badge-success' : 'badge-ghost'}`}>
                    {privacy.showContact ? 'Public' : 'Private'}
                  </div>
                  <span>Show Contact Info</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`badge ${privacy.showLastDonation ? 'badge-success' : 'badge-ghost'}`}>
                    {privacy.showLastDonation ? 'Public' : 'Private'}
                  </div>
                  <span>Show Last Donation</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Verification Tab */}
        {activeTab === "verification" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                <FaIdCard className="text-primary" />
                Verification Status
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-70">Email Verification</p>
                  <div className="mt-1">
                    {getStatusBadge(verification.isEmailVerified)}
                  </div>
                </div>
                <div>
                  <p className="text-sm opacity-70">Phone Verification</p>
                  <div className="mt-1">
                    {getStatusBadge(verification.isPhoneVerified)}
                  </div>
                </div>
                <div>
                  <p className="text-sm opacity-70">Identity Verification</p>
                  <div className="mt-1">
                    {getStatusBadge(verification.isIdentityVerified)}
                  </div>
                </div>
              </div>

              {verification.verifiedAt && (
                <div className="mt-4 pt-4 border-t border-base-300">
                  <p className="text-sm opacity-70">Verified On</p>
                  <p className="font-medium">{formatDateTime(verification.verifiedAt)}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
        <button
          onClick={() => onClose()}
          className="btn btn-primary text-white ml-auto gap-2"
        >
          <FaEye />
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewUserModal;
