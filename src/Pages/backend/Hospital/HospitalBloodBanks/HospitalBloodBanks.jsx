// Pages/backend/Hospital/HospitalBloodBanks/HospitalBloodBanks.jsx

// React
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Sweet Alert
import Swal from "sweetalert2";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons - Fi (Feather Icons)
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiRefreshCw,
  FiAlertCircle,
  FiPackage,
  FiCalendar,
  FiNavigation,
  FiUsers,
} from "react-icons/fi";

// Icons - Fa (Font Awesome)
import {
  FaHospital,
  FaHeartbeat,
  FaBuilding,
  FaTint,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import ErrorState from "../../../../shared/ErrorState";
import BloodLoader from "../../../../shared/BloodLoader";
import Pagination from "../../../../shared/Pagination";
import ResultsCount from "../../../../shared/ResultsCount";
import ViewBloodBankModal from "../../Admin/BloodBanksManagement/ViewBloodBankModal/ViewBloodBankModal";

// Modals


// Helper function to extract ID from MongoDB ObjectId
const getId = (value) =>
  typeof value === "object" ? value?.$oid || value?.toString?.() : value;

// Format date and time for display
const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value?.$date || value);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Bank type configuration
const bankTypeConfig = {
  government: {
    icon: FaBuilding,
    color: "primary",
    label: "Government",
  },
  private: {
    icon: FaBuilding,
    color: "secondary",
    label: "Private",
  },
  ngo: {
    icon: FaHeartbeat,
    color: "success",
    label: "NGO",
  },
  hospital: {
    icon: FaHospital,
    color: "info",
    label: "Hospital",
  },
};

const HospitalBloodBanks = () => {
  const { axiosInstance } = useAxiosPublic();
  const { loading: authLoading } = useAuth();
  const token = localStorage.getItem("auth_token");

  // States
  const [error, setError] = useState(null);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBank, setSelectedBank] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Map state for nearby search
  const [coords, setCoords] = useState({
    latitude: "",
    longitude: "",
    radius: 10000, // Default 10km in meters
  });

  // Filters state
  const [filters, setFilters] = useState({
    searchTerm: "",
    city: "",
    type: "",
    bloodType: "",
    verificationStatus: "",
  });

  // Auth headers for API requests
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  // Fetch all blood banks
  const fetchAllBanks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string based on filters
      const params = new URLSearchParams();
      if (filters.city) params.append("city", filters.city);
      if (filters.type) params.append("type", filters.type);
      if (filters.verificationStatus === "verified") {
        params.append("verified", "true");
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await axiosInstance.get(`/blood-banks${queryString}`, {
        headers: authHeaders,
      });
      setBanks(res.data?.data || []);
      setActiveTab("all");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, authHeaders, filters.city, filters.type, filters.verificationStatus]);

  // Fetch nearby blood banks
  const fetchNearbyBanks = useCallback(async () => {
    if (!coords.latitude || !coords.longitude) {
      await Swal.fire({
        title: "Location Required",
        text: "Please provide latitude and longitude to find nearby blood banks.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        longitude: String(coords.longitude),
        latitude: String(coords.latitude),
        radius: String(coords.radius || 10000),
      });
      const res = await axiosInstance.get(`/blood-banks/nearby?${query.toString()}`, {
        headers: authHeaders,
      });
      setBanks(res.data?.data || []);
      setActiveTab("nearby");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, authHeaders, coords.latitude, coords.longitude, coords.radius]);

  // Search by blood type
  const searchByBloodType = useCallback(async () => {
    if (!filters.bloodType) {
      await Swal.fire({
        title: "Blood Type Required",
        text: "Please select a blood type to search.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        bloodType: filters.bloodType,
        minUnits: "1",
      });
      if (filters.city) params.append("city", filters.city);

      const res = await axiosInstance.get(`/blood-banks/search/inventory?${params.toString()}`, {
        headers: authHeaders,
      });
      setBanks(res.data?.data || []);
      setActiveTab("bloodType");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, authHeaders, filters.bloodType, filters.city]);

  // Refresh current tab
  const refreshCurrentTab = useCallback(async () => {
    if (activeTab === "nearby") {
      await fetchNearbyBanks();
      return;
    }
    if (activeTab === "bloodType") {
      await searchByBloodType();
      return;
    }
    await fetchAllBanks();
  }, [activeTab, fetchAllBanks, fetchNearbyBanks, searchByBloodType]);

  // Get user's current location
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        title: "Not Supported",
        text: "Geolocation is not supported in this browser.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));

        Swal.fire({
          title: "Location Updated",
          text: "Your location has been set. Click 'Nearby Banks' to find banks near you.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          },
          buttonsStyling: false,
        });
      },
      async () => {
        await Swal.fire({
          title: "Location Access Failed",
          text: "Unable to read your location. You can enter coordinates manually.",
          icon: "warning",
          confirmButtonColor: "#ef4444",
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
            confirmButton: "btn btn-sm btn-error text-white",
          },
          buttonsStyling: false,
        });
      },
    );
  };

  // Filter banks based on local search
  const filteredBanks = useMemo(() => {
    if (!filters.searchTerm) return banks;

    const term = filters.searchTerm.toLowerCase();
    return banks.filter((bank) =>
      bank.name?.toLowerCase().includes(term) ||
      bank.registrationNumber?.toLowerCase().includes(term) ||
      bank.address?.city?.toLowerCase().includes(term) ||
      bank.address?.state?.toLowerCase().includes(term)
    );
  }, [banks, filters.searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBanks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBanks = filteredBanks.slice(startIndex, endIndex);

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    return [...new Set(banks.map((bank) => bank.address?.city).filter(Boolean))];
  }, [banks]);

  // Get verification badge
  const getVerificationBadge = (bank) => {
    const isVerified = bank.verification?.isVerified;
    return isVerified ? (
      <span className="badge badge-success gap-1">
        <FiCheckCircle size={12} />
        Verified
      </span>
    ) : (
      <span className="badge badge-warning gap-1">
        <FiXCircle size={12} />
        Pending
      </span>
    );
  };

  // Get inventory status
  const getInventoryStatus = (inventory) => {
    if (!inventory || inventory.length === 0) {
      return { status: "No Data", color: "badge-ghost", icon: FiPackage };
    }

    const totalUnits = inventory.reduce((sum, item) => sum + (item.units || 0), 0);
    const lowStockItems = inventory.filter((item) => (item.units || 0) <= (item.threshold || 0)).length;

    if (totalUnits === 0) {
      return { status: "Empty", color: "badge-error", icon: FiAlertCircle };
    }
    if (lowStockItems > 0) {
      return { status: `${lowStockItems} Low`, color: "badge-warning", icon: FiAlertCircle };
    }
    return { status: "Good", color: "badge-success", icon: FiCheckCircle };
  };

  // Close modal helper
  const CloseModal = useCallback(() => {
    setSelectedBank(null);
    document.getElementById("view_bank_modal")?.close();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.searchTerm, filters.city, filters.type, filters.bloodType]);

  // Load initial data
  useEffect(() => {
    if (!authLoading) {
      fetchAllBanks();
    }
  }, [authLoading, fetchAllBanks]);

  // Loading state
  if (loading || authLoading) return <BloodLoader />;

  // Error state
  if (error) return <ErrorState error={error} onRetry={refreshCurrentTab} />;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaHospital className="text-error" />
            Blood Banks Directory
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Browse blood banks, check inventory, and view facility details.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className={`btn btn-sm ${activeTab === 'all' ? 'btn-error' : 'btn-outline'}`}
            onClick={fetchAllBanks}
          >
            All Banks
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className={`btn btn-sm ${activeTab === 'nearby' ? 'btn-error' : 'btn-outline'}`}
            onClick={fetchNearbyBanks}
          >
            Nearby
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="btn btn-sm btn-error gap-2"
            onClick={refreshCurrentTab}
          >
            <FiRefreshCw size={14} />
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-error">
            <FaHospital size={24} />
          </div>
          <div className="stat-title">Total Banks</div>
          <div className="stat-value text-3xl">{banks.length}</div>
          <div className="stat-desc">Registered facilities</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-success">
            <FiCheckCircle size={24} />
          </div>
          <div className="stat-title">Verified</div>
          <div className="stat-value text-3xl">
            {banks.filter(b => b.verification?.isVerified).length}
          </div>
          <div className="stat-desc">Approved banks</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-info">
            <FaTint size={24} />
          </div>
          <div className="stat-title">Total Units</div>
          <div className="stat-value text-3xl">
            {banks.reduce((sum, bank) =>
              sum + (bank.inventory?.reduce((s, i) => s + (i.units || 0), 0) || 0), 0
            )}
          </div>
          <div className="stat-desc">Blood units available</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow-lg p-4">
          <div className="stat-figure text-warning">
            <FiAlertCircle size={24} />
          </div>
          <div className="stat-title">Low Inventory</div>
          <div className="stat-value text-3xl">
            {banks.filter(b =>
              b.inventory?.some(item => (item.units || 0) <= (item.threshold || 0))
            ).length}
          </div>
          <div className="stat-desc">Banks need attention</div>
        </div>
      </motion.div>

      {/* Filters Section with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="form-control">
              <input
                type="text"
                placeholder="Search by name, registration number, city..."
                className="input input-bordered w-full"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>
          </div>

          <div className="w-full lg:w-48">
            <select
              className="select select-bordered w-full"
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">All Types</option>
              <option value="government">Government</option>
              <option value="private">Private</option>
              <option value="ngo">NGO</option>
              <option value="hospital">Hospital</option>
            </select>
          </div>

          <div className="w-full lg:w-48">
            <select
              className="select select-bordered w-full"
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            >
              <option value="">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="w-full lg:w-48">
            <select
              className="select select-bordered w-full"
              value={filters.bloodType}
              onChange={(e) => setFilters(prev => ({ ...prev, bloodType: e.target.value }))}
            >
              <option value="">All Blood Types</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div className="w-full lg:w-48">
            <select
              className="select select-bordered w-full"
              value={filters.verificationStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, verificationStatus: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {filters.bloodType && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={searchByBloodType}
            >
              Search {filters.bloodType}
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline btn-square"
            onClick={() => setFilters({
              searchTerm: "",
              city: "",
              type: "",
              bloodType: "",
              verificationStatus: "",
            })}
            aria-label="Reset Filters"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>

        {/* Nearby Search Panel (when nearby tab active) */}
        {activeTab === 'nearby' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-3 border-t border-base-300"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="number"
                step="0.000001"
                placeholder="Latitude"
                className="input input-bordered input-sm"
                value={coords.latitude}
                onChange={(e) => setCoords((prev) => ({ ...prev, latitude: e.target.value }))}
              />
              <input
                type="number"
                step="0.000001"
                placeholder="Longitude"
                className="input input-bordered input-sm"
                value={coords.longitude}
                onChange={(e) => setCoords((prev) => ({ ...prev, longitude: e.target.value }))}
              />
              <select
                className="select select-bordered select-sm"
                value={coords.radius}
                onChange={(e) => setCoords((prev) => ({ ...prev, radius: Number(e.target.value) }))}
              >
                <option value={5000}>5 km</option>
                <option value={10000}>10 km</option>
                <option value={20000}>20 km</option>
                <option value={50000}>50 km</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline gap-2 flex-1"
                  onClick={useMyLocation}
                >
                  <FiNavigation size={14} />
                  My Location
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-error flex-1"
                  onClick={fetchNearbyBanks}
                  disabled={!coords.latitude || !coords.longitude}
                >
                  Search
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ResultsCount
          endIndex={endIndex}
          startIndex={startIndex}
          itemsPerPage={itemsPerPage}
          filteredUsers={filteredBanks}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
        />
      </motion.div>

      {/* Blood Banks Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="bg-base-100 border border-base-300 rounded-lg overflow-hidden"
      >
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <span className="font-semibold capitalize flex items-center gap-2">
            {activeTab === 'all' ? 'All' : activeTab === 'nearby' ? 'Nearby' : `Blood Type: ${filters.bloodType}`} Banks
            <span className="badge badge-error badge-sm">{filteredBanks.length}</span>
          </span>
          {activeTab === 'nearby' && coords.latitude && coords.longitude && (
            <span className="text-xs opacity-70">
              Within {(coords.radius / 1000).toFixed(1)}km of your location
            </span>
          )}
        </div>

        {paginatedBanks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="bg-base-200">
                  <th className="w-12">#</th>
                  <th>Blood Bank</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Contact</th>
                  <th>Inventory</th>
                  <th>Status</th>
                  <th>Staff</th>
                  <th>Registered</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBanks.map((bank, index) => {
                  const bankId = getId(bank._id);
                  const typeInfo = bankTypeConfig[bank.type] || {
                    icon: FaHospital,
                    color: "ghost",
                    label: bank.type || "Blood Bank",
                  };
                  const TypeIcon = typeInfo.icon;
                  const inventoryStatus = getInventoryStatus(bank.inventory);
                  const StatusIcon = inventoryStatus.icon;
                  const distance = bank.distance;

                  return (
                    <motion.tr
                      key={bankId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.25 + index * 0.02 }}
                      className="hover"
                    >
                      <td className="font-medium">{startIndex + index + 1}</td>

                      {/* Blood Bank Details */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                              <FaHospital className="text-error text-xl" />
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold">{bank.name}</div>
                            <div className="text-xs text-base-content/70">
                              Reg: {bank.registrationNumber?.slice(-8) || "N/A"}
                            </div>
                            {distance && (
                              <div className="text-xs text-info flex items-center gap-1 mt-1">
                                <FiNavigation size={10} />
                                {distance} km away
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td>
                        <div className={`badge badge-${typeInfo.color} gap-1`}>
                          <TypeIcon size={12} />
                          {typeInfo.label}
                        </div>
                      </td>

                      {/* Location */}
                      <td>
                        <div className="flex items-center gap-1 text-sm">
                          <FiMapPin size={12} className="text-base-content/50" />
                          <span>
                            {bank.address?.city || "N/A"}
                            {bank.address?.state && `, ${bank.address.state}`}
                          </span>
                        </div>
                      </td>

                      {/* Contact */}
                      <td>
                        <div className="space-y-1">
                          {bank.contact?.phone?.[0] && (
                            <div className="flex items-center gap-1 text-sm">
                              <FiPhone size={12} className="text-base-content/50" />
                              <span>{bank.contact.phone[0]}</span>
                            </div>
                          )}
                          {bank.contact?.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <FiMail size={12} className="text-base-content/50" />
                              <span className="truncate max-w-24">{bank.contact.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Inventory */}
                      <td>
                        <div className="space-y-1">
                          <span className={`badge ${inventoryStatus.color} gap-1`}>
                            <StatusIcon size={12} />
                            {inventoryStatus.status}
                          </span>
                          {bank.inventory?.filter(item => (item.units || 0) <= (item.threshold || 0)).length > 0 && (
                            <div className="text-xs text-warning">
                              {bank.inventory
                                .filter(item => (item.units || 0) <= (item.threshold || 0))
                                .map(item => item.bloodType)
                                .join(', ')} low
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        {getVerificationBadge(bank)}
                      </td>

                      {/* Staff */}
                      <td>
                        <div className="flex items-center gap-1 text-sm">
                          <FiUsers size={12} className="text-base-content/50" />
                          <span>{bank.staff?.length || 0}</span>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td>
                        <div className="flex items-center gap-1 text-sm">
                          <FiCalendar size={12} className="text-base-content/50" />
                          <span>{formatDate(bank.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actions - Only View */}
                      <td>
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              setSelectedBank(getId(bank?._id));
                              document.getElementById("view_bank_modal")?.showModal();
                            }}
                            className="btn btn-ghost btn-sm btn-square tooltip"
                            data-tip="View Details"
                          >
                            <FiEye size={16} />
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
          // Empty State
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="p-12 text-center text-base-content/70"
          >
            <FaHospital className="mx-auto text-4xl mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No Blood Banks Found</p>
            <p className="text-sm opacity-70">
              {activeTab === 'nearby'
                ? "No blood banks found near your location. Try increasing the radius or check coordinates."
                : activeTab === 'bloodType'
                  ? `No banks with ${filters.bloodType} blood type available.`
                  : "No blood banks match your current filters. Try adjusting your search criteria."}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Pagination */}
      {filteredBanks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </motion.div>
      )}

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-info/10 border border-info/20 rounded-lg p-4 text-sm"
      >
        <div className="flex items-start gap-3">
          <FiAlertCircle className="text-info text-xl shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-info mb-1">Quick Tips:</p>
            <ul className="list-disc list-inside text-base-content/70 space-y-1">
              <li>Use "Nearby" tab to find blood banks around your location</li>
              <li>Filter by blood type to find banks with specific blood availability</li>
              <li>Click the eye icon to view complete bank details including full inventory</li>
              <li>Green verification badge indicates government-approved banks</li>
              <li>Low inventory warning helps identify banks needing attention</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* View Bank Modal */}
      <dialog id="view_bank_modal" className="modal">
        <ViewBloodBankModal
          bankId={selectedBank}
          onClose={CloseModal}
        />
        <form onClick={CloseModal} method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default HospitalBloodBanks;
