// Pages/frontend/Requester/BloodBanks/BankDetailsModal/BankDetailsModal.jsx

// React
import React, { useState, useEffect } from "react";

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

const BankDetailsModal = ({ bankId, onClose }) => {
  const { axiosInstance } = useAxiosPublic();

  // States
  const [loading, setLoading] = useState(true);
  const [bankData, setBankData] = useState(null);
  const [activeTab, setActiveTab] = useState("inventory"); // inventory, contact, hours, about

  // Fetch bank data on mount
  useEffect(() => {
    const fetchBankData = async () => {
      if (!bankId) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get(`/blood-banks/${bankId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        });

        if (response.data?.success) {
          setBankData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching bank data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBankData();
  }, [bankId, axiosInstance]);

  // Get bank type icon and color
  const getBankTypeInfo = (type) => {
    const typeMap = {
      government: { icon: FaBuilding, color: "primary", label: "Government" },
      private: { icon: FaBuilding, color: "secondary", label: "Private" },
      ngo: { icon: FaHeartbeat, color: "success", label: "NGO" },
      hospital: { icon: FaHospital, color: "info", label: "Hospital" },
    };
    return (
      typeMap[type] || {
        icon: FaHospital,
        color: "ghost",
        label: type || "Blood Bank",
      }
    );
  };

  // Get rating stars
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

  // Get inventory status
  const getInventoryStatus = (units, threshold) => {
    if (units === 0) return { status: "Out of Stock", color: "badge-error", icon: FaTimesCircle };
    if (units <= threshold)
      return { status: "Low Stock", color: "badge-warning", icon: FaTimesCircle };
    return { status: "Available", color: "badge-success", icon: FaCheckCircle };
  };

  if (loading) return <BloodLoader fullscreen={false} />;
  if (!bankData) return null;

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

  return (
    <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-error to-error/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <TypeIcon size={32} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">{bank.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge badge-ghost gap-1">
                  <TypeIcon size={12} />
                  {typeInfo.label}
                </span>
                {verification.isVerified && (
                  <span className="badge badge-success gap-1">
                    <FaCheckCircle size={12} />
                    Verified
                  </span>
                )}
                <span className="text-white/80 text-sm">
                  Reg: {bank.registrationNumber?.slice(-8) || "N/A"}
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-base-200/50 border-b border-base-300">
        <div className="stat py-2">
          <div className="stat-figure text-primary">
            <FaTint />
          </div>
          <div className="stat-title text-xs">Total Units</div>
          <div className="stat-value text-lg">
            {inventory.reduce((acc, item) => acc + (item.units || 0), 0)}
          </div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-success">
            <FaCheckCircle />
          </div>
          <div className="stat-title text-xs">Available Types</div>
          <div className="stat-value text-lg">
            {inventory.filter((item) => item.units > 0).length}/8
          </div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-warning">
            <FaStar />
          </div>
          <div className="stat-title text-xs">Rating</div>
          <div className="stat-value text-lg">{stats.rating || "N/A"}</div>
        </div>
        <div className="stat py-2">
          <div className="stat-figure text-info">
            <FiNavigation />
          </div>
          <div className="stat-title text-xs">Distance</div>
          <div className="stat-value text-lg">
            {bank.distance ? `${bank.distance} km` : "N/A"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-100 p-1 border-b border-base-300">
        <button
          className={`tab ${activeTab === "inventory" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          <FaTint className="mr-2" size={14} />
          Inventory
        </button>
        <button
          className={`tab ${activeTab === "contact" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          <FiPhone className="mr-2" size={14} />
          Contact
        </button>
        <button
          className={`tab ${activeTab === "hours" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("hours")}
        >
          <FaClock className="mr-2" size={14} />
          Hours
        </button>
        <button
          className={`tab ${activeTab === "about" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("about")}
        >
          <FaInfoCircle className="mr-2" size={14} />
          About
        </button>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[50vh] overflow-y-auto">
        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4">
                <FaTint className="text-error" />
                Blood Inventory Status
              </h4>

              {inventory.length > 0 ? (
                <div className="space-y-3">
                  {inventory.map((item) => {
                    const status = getInventoryStatus(item.units || 0, item.threshold || 0);
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={item.bloodType}
                        className="flex items-center justify-between p-3 bg-base-300 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: getBloodTypeColor(item.bloodType) }}
                          >
                            {item.bloodType}
                          </div>
                          <div>
                            <p className="font-semibold">Type {item.bloodType}</p>
                            <div className="flex gap-4 text-sm">
                              <span>
                                Units: <span className="font-bold">{item.units || 0}</span>
                              </span>
                              <span>
                                Threshold: <span className="font-bold">{item.threshold || 10}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`badge ${status.color} gap-1`}>
                          <StatusIcon size={10} />
                          {status.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-base-content/70 py-4">
                  No inventory data available
                </p>
              )}
            </div>

            {/* Blood Components */}
            {inventory.some((item) => Object.values(item.components || {}).some((v) => v > 0)) && (
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Blood Components</h4>
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr className="bg-base-300">
                        <th>Type</th>
                        <th>Whole Blood</th>
                        <th>Plasma</th>
                        <th>Platelets</th>
                        <th>Cryo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(
                        (item) =>
                          Object.values(item.components || {}).some((v) => v > 0) && (
                            <tr key={item.bloodType}>
                              <td className="font-semibold">{item.bloodType}</td>
                              <td>{item.components?.wholeBlood || 0}</td>
                              <td>{item.components?.plasma || 0}</td>
                              <td>{item.components?.platelets || 0}</td>
                              <td>{item.components?.cryoprecipitate || 0}</td>
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

        {/* Contact Tab */}
        {activeTab === "contact" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4">
                <FiPhone className="text-error" />
                Contact Information
              </h4>

              {/* Phone Numbers */}
              {contact.phone?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm opacity-70 mb-2">Phone Numbers</p>
                  <div className="space-y-2">
                    {contact.phone.map((phone, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <FiPhone size={14} className="text-error" />
                        <a href={`tel:${phone}`} className="hover:text-error">
                          {phone}
                        </a>
                        {index === 0 && (
                          <span className="badge badge-sm badge-error">Primary</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Email */}
              {contact.email && (
                <div className="mb-4">
                  <p className="text-sm opacity-70 mb-2">Email</p>
                  <div className="flex items-center gap-2">
                    <FiMail size={14} className="text-error" />
                    <a href={`mailto:${contact.email}`} className="hover:text-error">
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Website */}
              {contact.website && (
                <div className="mb-4">
                  <p className="text-sm opacity-70 mb-2">Website</p>
                  <div className="flex items-center gap-2">
                    <FaGlobe size={14} className="text-error" />
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-error"
                    >
                      {contact.website}
                    </a>
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {contact.emergency && (
                <div className="mt-4 pt-4 border-t border-base-300">
                  <p className="text-sm opacity-70 mb-2">Emergency Contact</p>
                  <div className="flex items-center gap-2 text-error">
                    <FiPhone size={14} />
                    <a href={`tel:${contact.emergency}`} className="font-semibold">
                      {contact.emergency}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4">
                <FiMapPin className="text-error" />
                Location
              </h4>

              <div className="space-y-2">
                <p className="font-medium">{address.street || "Address not available"}</p>
                <p className="text-base-content/70">
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
                    className="btn btn-sm btn-outline btn-error gap-2 mt-2"
                  >
                    <FiNavigation size={14} />
                    Get Directions
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Hours Tab */}
        {activeTab === "hours" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4">
                <FaClock className="text-error" />
                Operating Hours
              </h4>

              <div className="space-y-2">
                {[
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ].map((day) => {
                  const hours = operatingHours[day];
                  const isOpen = hours?.open && hours?.close;

                  return (
                    <div
                      key={day}
                      className="flex justify-between items-center p-2 bg-base-300 rounded"
                    >
                      <span className="capitalize font-medium">{day}</span>
                      <span className={isOpen ? "" : "text-base-content/50"}>
                        {isOpen ? `${hours.open} - ${hours.close}` : "Closed"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Holiday Information */}
              {operatingHours.holidays?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-base-300">
                  <p className="text-sm opacity-70 mb-2">Holiday Closures</p>
                  <div className="space-y-1">
                    {operatingHours.holidays.map((holiday, index) => (
                      <div key={index} className="text-sm">
                        {holiday}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Basic Info */}
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4">
                <FaInfoCircle className="text-error" />
                Bank Information
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
                  <p className="text-sm opacity-70">Established</p>
                  <p className="font-medium">{formatDate(bank.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Last Updated</p>
                  <p className="font-medium">{formatDate(bank.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Facilities */}
            {facilities.length > 0 && (
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-4">
                  <FaTools className="text-error" />
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

            {/* Statistics */}
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4">
                <FaShieldAlt className="text-error" />
                Statistics
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-70">Total Donations</p>
                  <p className="font-medium">{stats.totalDonations || 0}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Total Requests</p>
                  <p className="font-medium">{stats.totalRequests || 0}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Response Time</p>
                  <p className="font-medium">{stats.avgResponseTime || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getRatingStars(stats.rating || 0, 14)}
                    <span className="text-sm ml-1">({stats.rating || 0})</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
        <button onClick={onClose} className="btn btn-error text-white ml-auto gap-2">
          Close
        </button>
      </div>
    </div>
  );
};

export default BankDetailsModal;