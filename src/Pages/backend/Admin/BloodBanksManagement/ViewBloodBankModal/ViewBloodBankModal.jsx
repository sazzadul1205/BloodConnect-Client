// Page/backend/Admin/BloodBanksManagement/ViewBloodBankModal/ViewBloodBankModal.jsx

// React
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FaHospital,
  FaBuilding,
  FaHeartbeat,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt,
  FaClock,
  FaTools,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaShieldAlt,
  FaTimes,
  FaFileAlt,
  FaBoxes,
  FaExclamationTriangle,
} from "react-icons/fa";
import { FaDroplet } from "react-icons/fa6";

// Hooks
import BloodLoader from "../../../../../shared/BloodLoader";
import ErrorState from "../../../../../shared/ErrorState";
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";
import { formatAppDate, formatAppDateTime } from "../../../../../utils/dateFormat";

const ViewBloodBankModal = ({ bankId, onClose }) => {
  const { axiosInstance } = useAxiosPublic();

  // States
  const [activeTab, setActiveTab] = useState("overview"); // overview, contact, inventory, staff, verification

  const {
    data: bankData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["blood-bank-details", bankId],
    enabled: Boolean(bankId),
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const response = await axiosInstance.get(`/blood-banks/${bankId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.data?.success) {
        throw new Error("Failed to load blood bank details.");
      }

      return response.data.data;
    },
  });

  // Format date
  const formatDate = (dateString) => {
    return formatAppDate(dateString, "MMMM d, yyyy");
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    return formatAppDateTime(dateString, "MMMM d, yyyy p");
  };

  // Get bank type icon and color
  const getBankTypeInfo = (type) => {
    const typeMap = {
      government: { icon: FaBuilding, color: "primary", label: "Government", bgColor: "from-primary to-primary/80" },
      private: { icon: FaBuilding, color: "secondary", label: "Private", bgColor: "from-secondary to-secondary/80" },
      ngo: { icon: FaHeartbeat, color: "success", label: "NGO", bgColor: "from-success to-success/80" },
      hospital: { icon: FaHospital, color: "info", label: "Hospital", bgColor: "from-info to-info/80" },
    };
    return typeMap[type] || {
      icon: FaHospital,
      color: "ghost",
      label: type || "Blood Bank",
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
      <span className="badge badge-warning gap-1">
        <FaTimesCircle size={12} />
        Pending Verification
      </span>
    );
  };

  // Get inventory status
  const getInventoryStatus = (units, threshold) => {
    if (units <= threshold) return { status: "Low", color: "badge-error", icon: FaExclamationTriangle };
    if (units <= threshold * 2) return { status: "Adequate", color: "badge-warning", icon: FaCheckCircle };
    return { status: "Good", color: "badge-success", icon: FaCheckCircle };
  };

  // Get badge color based on color name
  const getBadgeColor = (color) => {
    const colorMap = {
      primary: "badge-primary",
      secondary: "badge-secondary",
      success: "badge-success",
      warning: "badge-warning",
      info: "badge-info",
      error: "badge-error",
      ghost: "badge-ghost"
    };
    return colorMap[color] || "badge-ghost";
  };

  if (isLoading) return <BloodLoader fullscreen={false} />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!bankData) return null;

  const bank = bankData;
  const typeInfo = getBankTypeInfo(bank.type);
  const TypeIcon = typeInfo.icon;
  const badgeColor = getBadgeColor(typeInfo.color);

  // Safe access to nested properties
  const contact = bank.contact || {};
  const address = bank.address || {};
  const inventory = bank.inventory || [];
  const staff = bank.staff || [];
  const verification = bank.verification || {};
  const operatingHours = bank.operatingHours || {};
  const facilities = bank.facilities || [];
  const stats = bank.stats || {};

  return (
    <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className={`bg-linear-to-r ${typeInfo.bgColor} p-6 text-white`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <TypeIcon size={32} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">{bank.name || "Blood Bank"}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`badge ${badgeColor} gap-1`}>
                  <TypeIcon size={12} />
                  {typeInfo.label}
                </div>
                <span className="text-white/80 text-sm">
                  Reg: {bank.registrationNumber?.slice(-8) || "N/A"}
                </span>
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
          <div className="stat-title text-xs">Established</div>
          <div className="stat-value text-sm">{formatDate(bank.createdAt)}</div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-success">
            <FaUsers />
          </div>
          <div className="stat-title text-xs">Staff Count</div>
          <div className="stat-value text-sm">{staff.length || 0} Members</div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-warning">
            <FaDroplet />
          </div>
          <div className="stat-title text-xs">Blood Units</div>
          <div className="stat-value text-sm">
            {inventory.reduce((acc, item) => acc + (item.units || 0), 0)}
          </div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-info">
            <FaStar />
          </div>
          <div className="stat-title text-xs">Rating</div>
          <div className="stat-value text-sm">{stats.rating || 0}/5</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-100 p-1 border-b border-base-300">
        <button
          className={`tab tab-sm ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab tab-sm ${activeTab === "contact" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          Contact
        </button>
        <button
          className={`tab tab-sm ${activeTab === "inventory" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory
        </button>
        <button
          className={`tab tab-sm ${activeTab === "staff" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("staff")}
        >
          Staff
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
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Basic Info */}
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                <FaHospital className="text-primary" />
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-70">Registration Number</p>
                  <p className="font-medium">{bank.registrationNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Bank Type</p>
                  <p className="font-medium capitalize">{bank.type || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Verification Status</p>
                  <div className="mt-1">{getStatusBadge(verification.isVerified)}</div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                <FaMapMarkerAlt className="text-primary" />
                Location
              </h4>
              <div className="space-y-2">
                <p className="font-medium">{address.street || "N/A"}</p>
                <p className="text-base-content/70">
                  {address.city && address.state
                    ? `${address.city}, ${address.state} ${address.zipCode || ""}`
                    : "Address not available"}
                </p>
                {address.coordinates?.coordinates && (
                  <p className="text-sm text-base-content/50">
                    Coordinates: {address.coordinates.coordinates[0]}, {address.coordinates.coordinates[1]}
                  </p>
                )}
              </div>
            </div>

            {/* Facilities */}
            {facilities.length > 0 && (
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                  <FaTools className="text-primary" />
                  Facilities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {facilities.map((facility, index) => (
                    <span key={index} className="badge badge-outline badge-lg">
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Operating Hours */}
            {Object.keys(operatingHours).length > 0 && (
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                  <FaClock className="text-primary" />
                  Operating Hours
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(operatingHours).map(([day, hours]) => {
                    if (day === 'holidays') return null;
                    const isOpen = hours?.open && hours?.close;
                    return (
                      <div key={day} className="flex justify-between items-center p-2 bg-base-300 rounded">
                        <span className="capitalize font-medium">{day}</span>
                        <span className={isOpen ? '' : 'text-base-content/50'}>
                          {isOpen ? `${hours.open} - ${hours.close}` : 'Closed'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Contact Tab */}
        {activeTab === "contact" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                <FaPhone className="text-primary" />
                Contact Details
              </h4>

              {/* Phone Numbers */}
              <div className="mb-4">
                <p className="text-sm opacity-70 mb-2">Phone Numbers</p>
                <div className="space-y-2">
                  {contact.phone?.map((phone, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <FaPhone size={12} className="text-primary" />
                      <span className="font-medium">{phone}</span>
                      {index === 0 && (
                        <span className="badge badge-sm badge-primary">Primary</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Email & Website */}
              <div className="grid grid-cols-2 gap-4">
                {contact.email && (
                  <div>
                    <p className="text-sm opacity-70">Email</p>
                    <p className="font-medium flex items-center gap-2">
                      <FaEnvelope size={12} className="text-primary" />
                      {contact.email}
                    </p>
                  </div>
                )}
                {contact.website && (
                  <div>
                    <p className="text-sm opacity-70">Website</p>
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium flex items-center gap-2 text-primary hover:underline"
                    >
                      <FaGlobe size={12} />
                      {contact.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              {contact.emergency && (
                <div className="mt-4 pt-4 border-t border-base-300">
                  <p className="text-sm opacity-70 mb-2">Emergency Contact</p>
                  <div className="flex items-center gap-2 text-error">
                    <FaPhone size={12} />
                    <span className="font-medium">{contact.emergency}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {inventory.length > 0 ? (
              <>
                {/* Inventory Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="stat bg-base-200 rounded-lg p-4">
                    <div className="stat-figure text-primary">
                      <FaDroplet size={24} />
                    </div>
                    <div className="stat-title">Total Units</div>
                    <div className="stat-value text-3xl">
                      {inventory.reduce((acc, item) => acc + (item.units || 0), 0)}
                    </div>
                    <div className="stat-desc">Across all blood types</div>
                  </div>

                  <div className="stat bg-base-200 rounded-lg p-4">
                    <div className="stat-figure text-warning">
                      <FaExclamationTriangle size={24} />
                    </div>
                    <div className="stat-title">Low Stock Items</div>
                    <div className="stat-value text-3xl">
                      {inventory.filter(item => (item.units || 0) <= (item.threshold || 0)).length}
                    </div>
                    <div className="stat-desc">Need immediate attention</div>
                  </div>
                </div>

                {/* Inventory Table */}
                <div className="bg-base-200 rounded-lg p-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                    <FaBoxes className="text-primary" />
                    Blood Inventory Details
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr className="bg-base-300">
                          <th>Blood Type</th>
                          <th>Units</th>
                          <th>Threshold</th>
                          <th>Status</th>
                          <th>Components</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((item) => {
                          const status = getInventoryStatus(item.units || 0, item.threshold || 0);
                          const StatusIcon = status.icon;
                          return (
                            <tr key={item.bloodType}>
                              <td className="font-semibold">{item.bloodType}</td>
                              <td>{item.units || 0}</td>
                              <td>{item.threshold || 0}</td>
                              <td>
                                <span className={`badge ${status.color} gap-1`}>
                                  <StatusIcon size={10} />
                                  {status.status}
                                </span>
                              </td>
                              <td className="text-sm">
                                <span className="tooltip" data-tip="Whole Blood">
                                  WB: {item.components?.wholeBlood || 0}
                                </span>
                                {' | '}
                                <span className="tooltip" data-tip="Plasma">
                                  P: {item.components?.plasma || 0}
                                </span>
                                {' | '}
                                <span className="tooltip" data-tip="Platelets">
                                  PLT: {item.components?.platelets || 0}
                                </span>
                                {' | '}
                                <span className="tooltip" data-tip="Red Blood Cells">
                                  RBC: {item.components?.redBloodCells || 0}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-base-200 rounded-lg p-8 text-center">
                <FaBoxes className="text-4xl text-base-content/30 mx-auto mb-3" />
                <p className="text-base-content/70">No inventory data available</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Staff Tab */}
        {activeTab === "staff" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {staff.length > 0 ? (
              <>
                <div className="stat bg-base-200 rounded-lg p-4">
                  <div className="stat-figure text-primary">
                    <FaUsers size={24} />
                  </div>
                  <div className="stat-title">Total Staff</div>
                  <div className="stat-value text-3xl">{staff.length}</div>
                  <div className="stat-desc">Active members</div>
                </div>

                <div className="bg-base-200 rounded-lg p-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                    <FaUsers className="text-primary" />
                    Staff Members
                  </h4>
                  <div className="space-y-3">
                    {staff.map((member, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-base-300 rounded-lg">
                        <div className="avatar placeholder">
                          <div className="bg-primary/10 text-primary rounded-full w-10">
                            <FaUsers size={18} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">User ID: {member.userId}</p>
                          <div className="flex gap-2 text-sm">
                            <span className="badge badge-sm">{member.role}</span>
                            {member.department && (
                              <span className="text-base-content/70">{member.department}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-base-200 rounded-lg p-8 text-center">
                <FaUsers className="text-4xl text-base-content/30 mx-auto mb-3" />
                <p className="text-base-content/70">No staff members assigned</p>
              </div>
            )}
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
                <FaShieldAlt className="text-primary" />
                Verification Status
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-70">Verification Status</p>
                  <div className="mt-1">
                    {getStatusBadge(verification.isVerified)}
                  </div>
                </div>
                <div>
                  <p className="text-sm opacity-70">Documents</p>
                  <p className="font-medium">
                    {verification.documents?.length || 0} uploaded
                  </p>
                </div>
              </div>

              {verification.verifiedAt && (
                <div className="mt-4 pt-4 border-t border-base-300">
                  <p className="text-sm opacity-70">Verified On</p>
                  <p className="font-medium">{formatDateTime(verification.verifiedAt)}</p>
                </div>
              )}

              {verification.verifiedBy && (
                <div className="mt-2">
                  <p className="text-sm opacity-70">Verified By</p>
                  <p className="font-medium">User ID: {verification.verifiedBy}</p>
                </div>
              )}

              {verification.documents?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm opacity-70 mb-2">Verification Documents</p>
                  <div className="space-y-2">
                    {verification.documents.map((doc, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-base-300 rounded">
                        <FaFileAlt size={14} className="text-primary" />
                        <span className="text-sm">{doc.name || `Document ${index + 1}`}</span>
                        {doc.verified ? (
                          <FaCheckCircle className="text-success ml-auto" size={14} />
                        ) : (
                          <FaTimesCircle className="text-warning ml-auto" size={14} />
                        )}
                      </div>
                    ))}
                  </div>
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
          <FaHospital />
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewBloodBankModal;
