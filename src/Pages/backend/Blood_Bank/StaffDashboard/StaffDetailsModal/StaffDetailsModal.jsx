// Pages/backend/BloodBank/StaffDashboard/StaffDetailsModal/StaffDetailsModal.jsx

// React
import React from "react";

// Icons
import { FaTimes, FaUser, FaShieldAlt, FaHeartbeat } from "react-icons/fa";
import {
  FiUser,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiMail,
} from "react-icons/fi";

const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    return value?.$oid || value?.toString?.() || JSON.stringify(value);
  }
  return String(value);
};

// Staff role configuration
const staffRoleConfig = {
  manager: {
    icon: FaUser,
    color: "warning",
    label: "Manager",
    bgColor: "from-warning to-warning/80",
    badgeClass: "badge-warning",
  },
  technician: {
    icon: FaHeartbeat,
    color: "info",
    label: "Technician",
    bgColor: "from-info to-info/80",
    badgeClass: "badge-info",
  },
  nurse: {
    icon: FaUser,
    color: "success",
    label: "Nurse",
    bgColor: "from-success to-success/80",
    badgeClass: "badge-success",
  },
  doctor: {
    icon: FaUser,
    color: "error",
    label: "Doctor",
    bgColor: "from-error to-error/80",
    badgeClass: "badge-error",
  },
  administrator: {
    icon: FaShieldAlt,
    color: "secondary",
    label: "Administrator",
    bgColor: "from-secondary to-secondary/80",
    badgeClass: "badge-secondary",
  },
  admin: {
    icon: FaShieldAlt,
    color: "error",
    label: "Admin",
    bgColor: "from-error to-error/80",
    badgeClass: "badge-error",
  },
};

const StaffDetailsModal = ({ staff, onClose }) => {
  if (!staff) return null;

  const roleInfo = staffRoleConfig[staff.role] || {
    icon: FaUser,
    color: "ghost",
    label: staff.role || "Staff",
    bgColor: "from-base-300 to-base-300/80",
    badgeClass: "badge-ghost",
  };
  const RoleIcon = roleInfo.icon;
  const user = staff.user || {};

  return (
    <div className="modal-box w-11/12 max-w-2xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className={`bg-linear-to-r ${roleInfo.bgColor} p-6 text-white`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <RoleIcon size={32} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">{user.profile?.fullName || "Staff Member"}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${roleInfo.badgeClass} gap-1`}>
                  <RoleIcon size={12} />
                  {roleInfo.label}
                </span>
                <span className="text-white/80 text-sm">
                  Dept: {staff.department || "General"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
          >
            <FaTimes size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        {/* Personal Information */}
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <FiUser className="text-primary" />
            Personal Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-70">Full Name</p>
              <p className="font-medium">{user.profile?.fullName || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Staff ID</p>
              <p className="font-medium">{getId(staff.userId)?.slice(-8) || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Role</p>
              <p className="font-medium capitalize">{staff.role || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm opacity-70">Department</p>
              <p className="font-medium">{staff.department || "General"}</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-base-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <FiPhone className="text-primary" />
            Contact Information
          </h4>
          <div className="space-y-2">
            {user.email && (
              <div className="flex items-center gap-2">
                <FiMail className="text-primary/70" size={14} />
                <span>{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2">
                <FiPhone className="text-primary/70" size={14} />
                <span>{user.phone}</span>
              </div>
            )}
            {user.address?.city && (
              <div className="flex items-center gap-2">
                <FiMapPin className="text-primary/70" size={14} />
                <span>
                  {user.address.city}
                  {user.address.state && `, ${user.address.state}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        {user.createdAt && (
          <div className="bg-base-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <FiCalendar className="text-primary" />
              Account Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-70">Joined</p>
                <p className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-70">Last Active</p>
                <p className="font-medium">
                  {user.stats?.lastActive
                    ? new Date(user.stats.lastActive).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
        <button onClick={onClose} className="btn btn-primary text-white ml-auto">
          Close
        </button>
      </div>
    </div>
  );
};

export default StaffDetailsModal;
