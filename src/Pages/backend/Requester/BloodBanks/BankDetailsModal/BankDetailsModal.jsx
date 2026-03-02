// Pages/frontend/Requester/BloodBanks/BankDetailsModal/BankDetailsModal.jsx

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
  FaGlobe,
  FaClock,
  FaTools,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaRegStar,
  FaTimes,
  FaTint,
  FaShieldAlt,
  FaInfoCircle,
} from "react-icons/fa";
import { FiNavigation, FiMail, FiPhone, FiMapPin } from "react-icons/fi";

// Hooks
import BloodLoader from "../../../../../shared/BloodLoader";
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

// Utils
import { formatDate, getBloodTypeColor } from "../utils";

// ==================== QUERY KEYS ====================

const queryKeys = {
  bankDetails: (bankId) => ['bankDetails', bankId],
};

// ==================== CONSTANTS ====================

// Days of week for hours display
const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// ==================== MAIN COMPONENT ====================

const BankDetailsModal = ({ bankId, onClose }) => {
  const { axiosInstance } = useAxiosPublic();

  // States
  const [activeTab, setActiveTab] = useState("inventory"); // inventory, contact, hours, about

  // ==================== TANSTACK QUERY ====================

  /**
   * Fetch bank details using TanStack Query
   * Automatically caches results and handles loading/error states
   */
  const {
    data: bankData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.bankDetails(bankId),
    queryFn: async () => {
      if (!bankId) throw new Error("Bank ID is required");

      const response = await axiosInstance.get(`/blood-banks/${bankId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });

      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch bank details");
    },
    enabled: !!bankId, // Only run when bankId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Get bank type icon and color - BUILD COMPATIBLE
   * Returns static classes instead of dynamic strings
   */
  const getBankTypeInfo = (type) => {
    const typeMap = {
      government: {
        icon: FaBuilding,
        color: "badge-primary",
        label: "Government",
        bgColor: "from-primary to-primary/80"
      },
      private: {
        icon: FaBuilding,
        color: "badge-secondary",
        label: "Private",
        bgColor: "from-secondary to-secondary/80"
      },
      ngo: {
        icon: FaHeartbeat,
        color: "badge-success",
        label: "NGO",
        bgColor: "from-success to-success/80"
      },
      hospital: {
        icon: FaHospital,
        color: "badge-info",
        label: "Hospital",
        bgColor: "from-info to-info/80"
      },
    };

    return typeMap[type] || {
      icon: FaHospital,
      color: "badge-ghost",
      label: type || "Blood Bank",
      bgColor: "from-base-300 to-base-300/80"
    };
  };

  /**
   * Get rating stars
   */
  const getRatingStars = (rating = 0, size = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-warning" size={size} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <FaStar key={i} className="text-warning opacity-50" size={size} />
        );
      } else {
        stars.push(<FaRegStar key={i} className="text-base-content/30" size={size} />);
      }
    }
    return stars;
  };

  /**
   * Get inventory status - BUILD COMPATIBLE
   */
  const getInventoryStatus = (units, threshold) => {
    if (units === 0) return {
      status: "Out of Stock",
      color: "badge-error",
      icon: FaTimesCircle
    };
    if (units <= threshold) return {
      status: "Low Stock",
      color: "badge-warning",
      icon: FaTimesCircle
    };
    return {
      status: "Available",
      color: "badge-success",
      icon: FaCheckCircle
    };
  };

  /**
   * Format day name for display
   */
  const formatDayName = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // ==================== LOADING & ERROR STATES ====================

  if (isLoading) return <BloodLoader fullscreen={false} />;

  if (error || !bankData) {
    return (
      <div className="modal-box w-11/12 max-w-4xl p-6 bg-base-100 mx-2 sm:mx-0">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FaTimesCircle className="text-5xl text-error mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Bank Details</h3>
          <p className="text-base-content/70 mb-4">
            {error?.message || "Could not load bank details. Please try again."}
          </p>
          <button
            onClick={() => refetch()}
            className="btn btn-error btn-sm gap-2"
          >
            Retry
          </button>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm mt-2"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ==================== DATA EXTRACTION ====================

  const bank = bankData;
  const typeInfo = getBankTypeInfo(bank.type);
  const TypeIcon = typeInfo.icon;

  // Safe access to nested properties
  const contact = bank.contact || {};
  const address = bank.address || {};
  const inventory = bank.inventory || [];
  const operatingHours = bank.operatingHours || {};
  const facilities = bank.facilities || [];
  const stats = bank.stats || {};
  const verification = bank.verification || {};

  // ==================== RENDER ====================

  return (
    <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0">

      {/* ==================== HEADER ==================== */}
      {/* Dynamic header with static gradient classes */}
      <div className={`bg-linear-to-r ${typeInfo.bgColor} p-4 sm:p-6 text-white`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Bank Info */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-white/20 p-2 sm:p-4 rounded-full">
              <TypeIcon size={20} className="sm:w-8 sm:h-8" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg sm:text-2xl truncate">{bank.name}</h2>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                {/* Bank Type Badge */}
                <span className={`badge ${typeInfo.color} badge-sm sm:badge-md gap-1`}>
                  <TypeIcon size={8} className="sm:w-3 sm:h-3" />
                  <span className="text-[10px] sm:text-xs">{typeInfo.label}</span>
                </span>

                {/* Verified Badge */}
                {verification.isVerified && (
                  <span className="badge badge-success badge-sm sm:badge-md gap-1">
                    <FaCheckCircle size={8} className="sm:w-3 sm:h-3" />
                    <span className="text-[10px] sm:text-xs">Verified</span>
                  </span>
                )}

                {/* Registration Number */}
                <span className="text-white/80 text-[10px] sm:text-sm truncate">
                  Reg: {bank.registrationNumber?.slice(-8) || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-white hover:bg-white/20 self-end sm:self-auto"
            aria-label="Close modal"
          >
            <FaTimes size={14} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ==================== QUICK STATS ==================== */}
      {/* Responsive grid: 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 p-2 sm:p-4 bg-base-200/50 border-b border-base-300">

        {/* Total Units */}
        <div className="stat py-1 sm:py-2">
          <div className="stat-figure text-primary">
            <FaTint size={12} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[10px] sm:text-xs">Total Units</div>
          <div className="stat-value text-sm sm:text-lg">
            {inventory.reduce((acc, item) => acc + (item.units || 0), 0)}
          </div>
        </div>

        {/* Available Types */}
        <div className="stat py-1 sm:py-2">
          <div className="stat-figure text-success">
            <FaCheckCircle size={12} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[10px] sm:text-xs">Available</div>
          <div className="stat-value text-sm sm:text-lg">
            {inventory.filter((item) => item.units > 0).length}/8
          </div>
        </div>

        {/* Rating */}
        <div className="stat py-1 sm:py-2">
          <div className="stat-figure text-warning">
            <FaStar size={12} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[10px] sm:text-xs">Rating</div>
          <div className="stat-value text-sm sm:text-lg">{stats.rating || "N/A"}</div>
        </div>

        {/* Distance */}
        <div className="stat py-1 sm:py-2">
          <div className="stat-figure text-info">
            <FiNavigation size={12} className="sm:w-4 sm:h-4" />
          </div>
          <div className="stat-title text-[10px] sm:text-xs">Distance</div>
          <div className="stat-value text-sm sm:text-lg">
            {bank.distance ? `${bank.distance} km` : "N/A"}
          </div>
        </div>
      </div>

      {/* ==================== TABS ==================== */}
      {/* Responsive tabs - wrap on mobile */}
      <div className="tabs tabs-boxed bg-base-100 p-1 border-b border-base-300 flex-wrap">
        <button
          className={`tab tab-xs sm:tab-md ${activeTab === "inventory" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          <FaTint className="mr-1 sm:mr-2" size={10} />
          <span className="text-[10px] sm:text-sm">Inventory</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-md ${activeTab === "contact" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          <FiPhone className="mr-1 sm:mr-2" size={10} />
          <span className="text-[10px] sm:text-sm">Contact</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-md ${activeTab === "hours" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("hours")}
        >
          <FaClock className="mr-1 sm:mr-2" size={10} />
          <span className="text-[10px] sm:text-sm">Hours</span>
        </button>
        <button
          className={`tab tab-xs sm:tab-md ${activeTab === "about" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("about")}
        >
          <FaInfoCircle className="mr-1 sm:mr-2" size={10} />
          <span className="text-[10px] sm:text-sm">About</span>
        </button>
      </div>

      {/* ==================== CONTENT ==================== */}
      {/* Scrollable content area */}
      <div className="p-3 sm:p-6 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">

        {/* ==================== INVENTORY TAB ==================== */}
        {activeTab === "inventory" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-4"
          >
            {/* Main Inventory */}
            <div className="bg-base-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                <FaTint className="text-error text-sm sm:text-base" />
                Blood Inventory Status
              </h3>

              {inventory.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {inventory.map((item) => {
                    const status = getInventoryStatus(item.units || 0, item.threshold || 0);
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={item.bloodType}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-base-300 rounded-lg gap-2"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* Blood Type Circle */}
                          <div
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white text-xs sm:text-sm"
                            style={{ backgroundColor: getBloodTypeColor(item.bloodType) }}
                          >
                            {item.bloodType}
                          </div>

                          {/* Blood Type Info */}
                          <div>
                            <p className="font-semibold text-xs sm:text-sm">Type {item.bloodType}</p>
                            <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs">
                              <span>
                                Units: <span className="font-bold">{item.units || 0}</span>
                              </span>
                              <span>
                                Threshold: <span className="font-bold">{item.threshold || 10}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`badge ${status.color} badge-xs sm:badge-sm gap-1 self-end sm:self-auto`}>
                          <StatusIcon size={8} className="sm:w-3 sm:h-3" />
                          <span className="text-[10px] sm:text-xs">{status.status}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-base-content/70 py-3 sm:py-4 text-xs sm:text-sm">
                  No inventory data available
                </p>
              )}
            </div>

            {/* Blood Components Table */}
            {inventory.some((item) => Object.values(item.components || {}).some((v) => v > 0)) && (
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Blood Components</h3>
                <div className="overflow-x-auto">
                  <table className="table table-xs sm:table-sm w-full">
                    <thead>
                      <tr className="bg-base-300">
                        <th className="text-[10px] sm:text-xs">Type</th>
                        <th className="text-[10px] sm:text-xs">Whole</th>
                        <th className="text-[10px] sm:text-xs">Plasma</th>
                        <th className="text-[10px] sm:text-xs">Platelets</th>
                        <th className="text-[10px] sm:text-xs">Cryo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(
                        (item) =>
                          Object.values(item.components || {}).some((v) => v > 0) && (
                            <tr key={item.bloodType}>
                              <td className="font-semibold text-xs sm:text-sm">{item.bloodType}</td>
                              <td className="text-xs sm:text-sm">{item.components?.wholeBlood || 0}</td>
                              <td className="text-xs sm:text-sm">{item.components?.plasma || 0}</td>
                              <td className="text-xs sm:text-sm">{item.components?.platelets || 0}</td>
                              <td className="text-xs sm:text-sm">{item.components?.cryoprecipitate || 0}</td>
                            </tr>
                          )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ==================== CONTACT TAB ==================== */}
        {activeTab === "contact" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-4"
          >
            {/* Contact Information */}
            <div className="bg-base-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                <FiPhone className="text-error text-sm sm:text-base" />
                Contact Information
              </h3>

              {/* Phone Numbers */}
              {contact.phone?.length > 0 && (
                <div className="mb-3 sm:mb-4">
                  <p className="text-[10px] sm:text-xs opacity-70 mb-1 sm:mb-2">Phone Numbers</p>
                  <div className="space-y-1 sm:space-y-2">
                    {contact.phone.map((phone, index) => (
                      <div key={index} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                        <FiPhone size={10} className="sm:w-4 sm:h-4 text-error" />
                        <a href={`tel:${phone}`} className="hover:text-error truncate">
                          {phone}
                        </a>
                        {index === 0 && (
                          <span className="badge badge-xs sm:badge-sm badge-error">Primary</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Email */}
              {contact.email && (
                <div className="mb-3 sm:mb-4">
                  <p className="text-[10px] sm:text-xs opacity-70 mb-1 sm:mb-2">Email</p>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <FiMail size={10} className="sm:w-4 sm:h-4 text-error" />
                    <a href={`mailto:${contact.email}`} className="hover:text-error break-all">
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Website */}
              {contact.website && (
                <div className="mb-3 sm:mb-4">
                  <p className="text-[10px] sm:text-xs opacity-70 mb-1 sm:mb-2">Website</p>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <FaGlobe size={10} className="sm:w-4 sm:h-4 text-error" />
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-error truncate"
                    >
                      {contact.website}
                    </a>
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {contact.emergency && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-base-300">
                  <p className="text-[10px] sm:text-xs opacity-70 mb-1 sm:mb-2">Emergency Contact</p>
                  <div className="flex items-center gap-1 sm:gap-2 text-error text-xs sm:text-sm">
                    <FiPhone size={10} className="sm:w-4 sm:h-4" />
                    <a href={`tel:${contact.emergency}`} className="font-semibold">
                      {contact.emergency}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="bg-base-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                <FiMapPin className="text-error text-sm sm:text-base" />
                Location
              </h3>

              <div className="space-y-1 sm:space-y-2">
                <p className="font-medium text-xs sm:text-sm wrap-break-word">
                  {address.street || "Address not available"}
                </p>
                <p className="text-[10px] sm:text-xs text-base-content/70 wrap-break-word">
                  {address.city && address.state
                    ? `${address.city}, ${address.state} ${address.zipCode || ""}`
                    : "Location details not available"}
                </p>

                {/* Map Link */}
                {address.street && address.city && address.state && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${address.street}, ${address.city}, ${address.state} ${address.zipCode || ""}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-xs sm:btn-sm btn-outline btn-error gap-1 sm:gap-2 mt-2 w-full sm:w-auto"
                  >
                    <FiNavigation size={10} className="sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs">Get Directions</span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== HOURS TAB ==================== */}
        {activeTab === "hours" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-4"
          >
            <div className="bg-base-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                <FaClock className="text-error text-sm sm:text-base" />
                Operating Hours
              </h3>

              <div className="space-y-1 sm:space-y-2">
                {daysOfWeek.map((day) => {
                  const hours = operatingHours[day];
                  const isOpen = hours?.open && hours?.close;

                  return (
                    <div
                      key={day}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-base-300 rounded gap-1 sm:gap-2"
                    >
                      <span className="capitalize font-medium text-xs sm:text-sm">
                        {formatDayName(day)}
                      </span>
                      <span className={`text-[10px] sm:text-xs ${isOpen ? "" : "text-base-content/50"}`}>
                        {isOpen ? `${hours.open} - ${hours.close}` : "Closed"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Holiday Information */}
              {operatingHours.holidays?.length > 0 && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-base-300">
                  <p className="text-[10px] sm:text-xs opacity-70 mb-1 sm:mb-2">Holiday Closures</p>
                  <div className="space-y-1">
                    {operatingHours.holidays.map((holiday, index) => (
                      <div key={index} className="text-[10px] sm:text-xs wrap-break-word">
                        {holiday}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ==================== ABOUT TAB ==================== */}
        {activeTab === "about" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 sm:space-y-4"
          >
            {/* Basic Info */}
            <div className="bg-base-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                <FaInfoCircle className="text-error text-sm sm:text-base" />
                Bank Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <p className="text-[10px] sm:text-xs opacity-70">Registration Number</p>
                  <p className="font-medium text-xs sm:text-sm wrap-break-word">
                    {bank.registrationNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs opacity-70">Bank Type</p>
                  <p className="font-medium text-xs sm:text-sm capitalize wrap-break-word">
                    {bank.type || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs opacity-70">Established</p>
                  <p className="font-medium text-xs sm:text-sm wrap-break-word">
                    {formatDate(bank.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs opacity-70">Last Updated</p>
                  <p className="font-medium text-xs sm:text-sm wrap-break-word">
                    {formatDate(bank.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Facilities */}
            {facilities.length > 0 && (
              <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                  <FaTools className="text-error text-sm sm:text-base" />
                  Facilities
                </h3>

                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {facilities.map((facility, index) => (
                    <span key={index} className="badge badge-outline badge-xs sm:badge-sm">
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="bg-base-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                <FaShieldAlt className="text-error text-sm sm:text-base" />
                Statistics
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <p className="text-[10px] sm:text-xs opacity-70">Total Donations</p>
                  <p className="font-medium text-xs sm:text-sm">{stats.totalDonations || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs opacity-70">Total Requests</p>
                  <p className="font-medium text-xs sm:text-sm">{stats.totalRequests || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs opacity-70">Response Time</p>
                  <p className="font-medium text-xs sm:text-sm">{stats.avgResponseTime || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs opacity-70">Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getRatingStars(stats.rating || 0, 10)}
                    <span className="text-xs ml-1">({stats.rating || 0})</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ==================== FOOTER ==================== */}
      <div className="modal-action border-t border-base-300 p-3 sm:p-4 bg-base-200/50">
        <button
          onClick={onClose}
          className="btn btn-error btn-sm sm:btn-md text-white ml-auto gap-1 sm:gap-2"
        >
          <FaTimes size={12} className="sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Close</span>
        </button>
      </div>
    </div>
  );
};

export default BankDetailsModal;