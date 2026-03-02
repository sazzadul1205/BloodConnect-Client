// Pages/backend/Hospital/DonorSearch/DonorSearch.jsx

// React
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FiEye,
  FiMapPin,
  FiNavigation,
  FiRefreshCw,
  FiSearch,
  FiUsers,

  FiHeart,
  FiClock,
  FiCalendar,
  FiAward,

  FiPhone,
  FiMap,
} from "react-icons/fi";
import {
  FaHospital,
  FaTint,
  FaShieldAlt,
  FaCheckCircle,

  FaUserMd,
  FaAmbulance,
  FaPhoneAlt,
  FaEnvelope,

} from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";
import useAuth from "../../../../hooks/useAuth";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import Pagination from "../../../../shared/Pagination";
import ResultsCount from "../../../../shared/ResultsCount";

// ==================== CONSTANTS ====================

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SEARCH_TYPES = ["eligible", "emergency", "nearby"];
const PROFILE_MODAL_ID = "hospital_donor_profile_modal";

// Animation variants
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

// ==================== QUERY KEYS ====================

const queryKeys = {
  donors: (type, params) => ['donors', type, params],
  donorProfile: (donorId) => ['donorProfile', donorId],
};

// ==================== MAIN COMPONENT ====================

const DonorSearch = () => {
  const { axiosInstance } = useAxiosPublic();
  const { loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");
  const location = useLocation();
  const navigate = useNavigate();
  const { searchType } = useParams();

  // ==================== STATE MANAGEMENT ====================

  const [selectedDonorId, setSelectedDonorId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [inputError, setInputError] = useState("");

  const [filters, setFilters] = useState({
    bloodType: "",
    bloodGroup: "",
    city: "",
    longitude: "",
    latitude: "",
    radius: "10000",
  });

  const activeType = SEARCH_TYPES.includes(searchType) ? searchType : "eligible";

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Validate nearby search input
   */
  const validateNearbyInput = useCallback((values) => {
    const longitude = Number(values.longitude);
    const latitude = Number(values.latitude);
    const radius = Number(values.radius);

    if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
      return "Longitude and latitude are required for nearby search.";
    }
    if (longitude < -180 || longitude > 180) {
      return "Longitude must be between -180 and 180.";
    }
    if (latitude < -90 || latitude > 90) {
      return "Latitude must be between -90 and 90.";
    }
    if (Number.isNaN(radius) || radius <= 0) {
      return "Radius must be a positive number.";
    }
    return "";
  }, []);

  /**
   * Sync filters to URL
   */
  const syncUrl = useCallback(
    (type, values) => {
      const params = new URLSearchParams();
      if (type === "nearby") {
        if (values.longitude) params.set("longitude", values.longitude);
        if (values.latitude) params.set("latitude", values.latitude);
        if (values.radius) params.set("radius", values.radius);
        if (values.bloodGroup) params.set("bloodGroup", values.bloodGroup);
      } else {
        if (values.bloodType) params.set("bloodType", values.bloodType);
        if (values.city) params.set("city", values.city);
      }
      const query = params.toString();
      navigate(`/hospital/donor-search/${type}${query ? `?${query}` : ""}`, {
        replace: true,
      });
    },
    [navigate],
  );

  /**
   * Get user's current location
   */
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setInputError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setInputError("");
        setFilters((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
      },
      () => {
        setInputError("Unable to read your location. Enter coordinates manually.");
      },
    );
  };

  /**
   * Read query parameters on mount
   */
  const readQueryDefaults = useCallback(() => {
    const params = new URLSearchParams(location.search);
    setFilters((prev) => ({
      ...prev,
      bloodType: params.get("bloodType") || prev.bloodType,
      bloodGroup: params.get("bloodGroup") || prev.bloodGroup,
      city: params.get("city") || prev.city,
      longitude: params.get("longitude") || prev.longitude,
      latitude: params.get("latitude") || prev.latitude,
      radius: params.get("radius") || prev.radius,
    }));
  }, [location.search]);

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query 1: Fetch donors based on search type and filters
   */
  const {
    data: donors = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.donors(activeType, { ...filters, location: location.search }),
    enabled: !authLoading,
    queryFn: async () => {
      let endpoint = "";
      let params = new URLSearchParams();

      if (activeType === "eligible") {
        endpoint = "/donors/search/eligible";
        if (filters.bloodType) params.set("bloodType", filters.bloodType);
        if (filters.city) params.set("city", filters.city);
      } else if (activeType === "emergency") {
        endpoint = "/donors/search/emergency";
        if (filters.bloodType) params.set("bloodType", filters.bloodType);
        if (filters.city) params.set("city", filters.city);
      } else if (activeType === "nearby") {
        const validationError = validateNearbyInput(filters);
        if (validationError) {
          throw new Error(validationError);
        }
        endpoint = "/users/nearby-donors";
        params.set("longitude", String(filters.longitude));
        params.set("latitude", String(filters.latitude));
        params.set("radius", String(filters.radius || "10000"));
        if (filters.bloodGroup) params.set("bloodGroup", filters.bloodGroup);
      }

      const res = await axiosInstance.get(`${endpoint}?${params.toString()}`, {
        headers: authHeaders,
      });

      return res.data?.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Query 2: Fetch donor profile details for modal
   */
  const {
    data: selectedDonor = null,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: queryKeys.donorProfile(selectedDonorId),
    enabled: !!selectedDonorId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/donors/${selectedDonorId}`, {
        headers: authHeaders,
      });
      return res.data?.data || null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });


  // ==================== EFFECTS ====================

  /**
   * Read URL params on mount
   */
  useEffect(() => {
    readQueryDefaults();
  }, [readQueryDefaults]);

  /**
   * Fetch donors when search type or URL changes
   */
  useEffect(() => {
    if (authLoading) return;
    const params = new URLSearchParams(location.search);
    // eslint-disable-next-line no-unused-vars
    const values = {
      bloodType: params.get("bloodType") || filters.bloodType,
      bloodGroup: params.get("bloodGroup") || filters.bloodGroup,
      city: params.get("city") || filters.city,
      longitude: params.get("longitude") || filters.longitude,
      latitude: params.get("latitude") || filters.latitude,
      radius: params.get("radius") || filters.radius,
    };
    // Trigger refetch with new values
    queryClient.invalidateQueries({ queryKey: queryKeys.donors(activeType) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, activeType, location.search]);

  // ==================== COMPUTED VALUES ====================

  /**
   * Normalize donor data for consistent display
   */
  const normalizedDonors = useMemo(
    () =>
      donors.map((donor, idx) => {
        const donorId = donor?.donorId || donor?._id || idx;
        return {
          raw: donor,
          donorId,
          fullName:
            donor?.user?.profile?.fullName || donor?.profile?.fullName || "Anonymous Donor",
          bloodType:
            donor?.medicalInfo?.bloodType || donor?.profile?.bloodGroup || "N/A",
          city: donor?.user?.address?.city || donor?.address?.city || "N/A",
          isEligible: Boolean(donor?.eligibility?.isEligible),
          isEmergency: Boolean(
            donor?.donationPreferences?.emergencyDonor ||
            donor?.donationPreferences?.notifyForEmergency,
          ),
          lastDonation: donor?.eligibility?.lastDonationDate || null,
          totalDonations: donor?.eligibility?.totalDonated || 0,
          maxDistance: donor?.donationPreferences?.maxDistance || 50,
        };
      }),
    [donors],
  );

  /**
   * Filter donors by search term
   */
  const filteredDonors = useMemo(() => {
    if (!searchTerm.trim()) return normalizedDonors;
    const term = searchTerm.toLowerCase();
    return normalizedDonors.filter((donor) =>
      `${donor.fullName} ${donor.bloodType} ${donor.city}`
        .toLowerCase()
        .includes(term),
    );
  }, [normalizedDonors, searchTerm]);

  /**
   * Pagination calculations
   */
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDonors = filteredDonors.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(filteredDonors.length / itemsPerPage));

  /**
   * Handle search button click
   */
  const handleSearch = useCallback(() => {
    if (activeType === "nearby") {
      const validationError = validateNearbyInput(filters);
      if (validationError) {
        setInputError(validationError);
        return;
      }
    }
    setInputError("");
    syncUrl(activeType, filters);
    queryClient.invalidateQueries({ queryKey: queryKeys.donors(activeType) });
  }, [activeType, filters, syncUrl, validateNearbyInput, queryClient]);

  /**
   * Open donor profile modal
   */
  const openProfile = useCallback((donorId) => {
    setSelectedDonorId(donorId);
    setTimeout(() => {
      document.getElementById(PROFILE_MODAL_ID)?.showModal();
    }, 100);
  }, []);

  /**
   * Close profile modal
   */
  const closeProfileModal = useCallback(() => {
    setSelectedDonorId(null);
    document.getElementById(PROFILE_MODAL_ID)?.close();
  }, []);

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // ==================== LOADING & ERROR STATES ====================

  if (isLoading || authLoading) return <BloodLoader />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

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
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FaHospital className="text-error" />
            Donor Search
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Search eligible, emergency, and nearby donors with hospital-safe data.
          </p>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="btn btn-outline btn-xs sm:btn-sm gap-2"
            onClick={handleSearch}
            disabled={isFetching}
          >
            <FiRefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
            <span className="text-xs sm:text-sm">Refresh</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ==================== SEARCH TYPE TABS ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-base-100 rounded-lg border border-base-300 p-3 sm:p-4 space-y-3"
      >
        <div className="flex flex-wrap gap-2">
          {SEARCH_TYPES.map((type) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className={`btn btn-xs sm:btn-sm ${activeType === type ? "btn-error" : "btn-outline"}`}
              onClick={() => {
                setInputError("");
                setCurrentPage(1);
                syncUrl(type, filters);
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* ==================== FILTER INPUTS ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          {activeType !== "nearby" ? (
            <>
              {/* Blood Type Filter */}
              <select
                className="select select-bordered select-xs sm:select-sm w-full"
                value={filters.bloodType}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, bloodType: e.target.value }))
                }
              >
                <option value="">All Blood Types</option>
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* City Filter */}
              <input
                type="text"
                className="input input-bordered input-xs sm:input-sm w-full"
                placeholder="City (e.g. Mumbai)"
                value={filters.city}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, city: e.target.value }))
                }
              />
            </>
          ) : (
            <>
              {/* Longitude Input */}
              <input
                type="number"
                step="any"
                className="input input-bordered input-xs sm:input-sm w-full"
                placeholder="Longitude"
                value={filters.longitude}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, longitude: e.target.value }))
                }
              />

              {/* Latitude Input */}
              <input
                type="number"
                step="any"
                className="input input-bordered input-xs sm:input-sm w-full"
                placeholder="Latitude"
                value={filters.latitude}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, latitude: e.target.value }))
                }
              />

              {/* Radius Input */}
              <input
                type="number"
                className="input input-bordered input-xs sm:input-sm w-full"
                placeholder="Radius (meters)"
                value={filters.radius}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, radius: e.target.value }))
                }
              />

              {/* Blood Group Filter */}
              <select
                className="select select-bordered select-xs sm:select-sm w-full"
                value={filters.bloodGroup}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, bloodGroup: e.target.value }))
                }
              >
                <option value="">All Blood Types</option>
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Use My Location Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="btn btn-outline btn-xs sm:btn-sm gap-2 w-full sm:w-auto"
                onClick={useMyLocation}
              >
                <FiNavigation size={12} />
                <span className="text-xs sm:text-sm">My Location</span>
              </motion.button>
            </>
          )}

          {/* Search Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            className="btn btn-error btn-xs sm:btn-sm gap-2 w-full lg:w-auto"
            onClick={handleSearch}
            disabled={isFetching}
          >
            {isFetching ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <FiSearch size={12} />
            )}
            <span className="text-xs sm:text-sm">Search</span>
          </motion.button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {inputError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-error text-xs sm:text-sm"
            >
              {inputError}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ==================== RESULTS STATS CARD ==================== */}
      <motion.div
        variants={fadeInUp}
        className="stat bg-base-100 rounded-lg border border-base-300 p-3 sm:p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="stat-title text-xs sm:text-sm opacity-70">Results</p>
            <p className="stat-value text-xl sm:text-2xl md:text-3xl font-bold text-error">
              {filteredDonors.length}
            </p>
            <p className="stat-desc text-xs mt-1 capitalize">{activeType} donor matches</p>
          </div>
          <div className="stat-figure text-error bg-error/10 p-2 sm:p-3 rounded-full">
            <FiUsers size={18} className="sm:w-6 sm:h-6" />
          </div>
        </div>
      </motion.div>

      {/* ==================== SEARCH FILTER INPUT ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-base-100 rounded-lg border border-base-300 p-3 sm:p-4"
      >
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-sm sm:text-base" />
          <input
            type="text"
            className="input input-bordered input-sm sm:input-md w-full pl-8 sm:pl-10"
            placeholder="Filter results by name, blood type, or city..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </motion.div>

      {/* ==================== RESULTS COUNT ==================== */}
      {filteredDonors.length > 0 && (
        <motion.div variants={fadeInUp}>
          <ResultsCount
            filteredUsers={filteredDonors}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            setCurrentPage={setCurrentPage}
          />
        </motion.div>
      )}

      {/* ==================== DONORS TABLE ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-base-100 rounded-lg border border-base-300 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="table table-xs sm:table-sm md:table-md w-full">
            <thead>
              <tr className="bg-base-200">
                <th className="text-xs sm:text-sm">#</th>
                <th className="text-xs sm:text-sm">Donor</th>
                <th className="text-xs sm:text-sm">Blood Type</th>
                <th className="hidden sm:table-cell text-xs sm:text-sm">City</th>
                <th className="text-xs sm:text-sm">Eligible</th>
                <th className="text-xs sm:text-sm">Emergency</th>
                <th className="text-center text-xs sm:text-sm">Profile</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDonors.length > 0 ? (
                paginatedDonors.map((donor, idx) => {
                  return (
                    <motion.tr
                      key={String(donor.donorId || idx)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.02 }}
                      className="hover"
                    >
                      <td className="text-xs sm:text-sm">{startIndex + idx + 1}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar placeholder hidden sm:block">
                            <div className="bg-error/10 text-error rounded-full w-6 h-6 sm:w-8 sm:h-8">
                              <span className="text-xs sm:text-sm">
                                {donor.fullName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm font-medium truncate max-w-24 sm:max-w-full">
                            {donor.fullName}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono font-bold text-error text-xs sm:text-sm">
                          {donor.bloodType}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs sm:text-sm">
                          <FiMapPin size={10} className="sm:w-3 sm:h-3" />
                          <span className="truncate max-w-20">{donor.city}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-xs sm:badge-sm ${donor.isEligible ? "badge-success" : "badge-warning"}`}>
                          {donor.isEligible ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-xs sm:badge-sm ${donor.isEmergency ? "badge-info" : "badge-ghost"}`}>
                          {donor.isEmergency ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs sm:btn-sm btn-square"
                          disabled={!donor.donorId}
                          onClick={() => openProfile(donor.donorId)}
                          title="View limited donor profile"
                        >
                          <FiEye size={12} className="sm:w-4 sm:h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 sm:py-10 text-xs sm:text-sm text-base-content/70">
                    {donors.length > 0
                      ? "No donors match your local filter."
                      : "No donors found for this search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ==================== PAGINATION ==================== */}
      {filteredDonors.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </motion.div>
      )}

      {/* ==================== INFO ALERT ==================== */}
      <motion.div
        variants={fadeInUp}
        className="bg-info/10 border border-info/20 rounded-lg p-3 sm:p-4 text-xs sm:text-sm"
      >
        <p className="font-semibold text-info mb-1 flex items-center gap-2">
          <FaShieldAlt className="text-info" />
          Hospital Profile View:
        </p>
        <p className="text-base-content/70">
          Profile details are limited to blood type, eligibility, and donation preferences.
          Medical history and private contact info are hidden.
        </p>
      </motion.div>

      {/* ==================== DONOR PROFILE MODAL ==================== */}
      <dialog id={PROFILE_MODAL_ID} className="modal">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="modal-box w-11/12 max-w-3xl p-0 overflow-hidden bg-base-100"
        >
          {/* Modal Header */}
          <div className="bg-linear-to-r from-error to-error/80 p-4 sm:p-6 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                  <FaUserMd size={20} className="sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h2 className="font-bold text-lg sm:text-2xl">Donor Profile</h2>
                  <p className="text-white/80 text-xs sm:text-sm">Hospital View (Limited Access)</p>
                </div>
              </div>
              <button
                onClick={closeProfileModal}
                className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-white hover:bg-white/20"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">

            {/* Loading State */}
            {profileLoading ? (
              <div className="py-8 sm:py-12 flex flex-col items-center justify-center">
                <span className="loading loading-spinner loading-md sm:loading-lg text-error"></span>
                <p className="text-xs sm:text-sm mt-3 text-base-content/70">Loading donor details...</p>
              </div>
            ) : profileError ? (
              /* Error State */
              <div className="alert alert-error">
                <span className="text-xs sm:text-sm">{profileError?.message || "Failed to load profile"}</span>
              </div>
            ) : selectedDonor ? (
              /* Donor Profile Content */
              <div className="space-y-4 sm:space-y-6">

                {/* Donor Basic Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                  {/* Blood Type Card */}
                  <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="bg-error/10 p-1.5 sm:p-2 rounded-full">
                        <FaTint className="text-error text-sm sm:text-base" />
                      </div>
                      <p className="font-medium text-xs sm:text-sm">Blood Type</p>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-error">
                      {selectedDonor?.medicalInfo?.bloodType || "N/A"}
                    </p>
                    <p className="text-xs opacity-70 mt-1">
                      RH Factor: {selectedDonor?.medicalInfo?.rhFactor || "N/A"}
                    </p>
                  </div>

                  {/* Eligibility Card */}
                  <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="bg-success/10 p-1.5 sm:p-2 rounded-full">
                        <FaCheckCircle className="text-success text-sm sm:text-base" />
                      </div>
                      <p className="font-medium text-xs sm:text-sm">Eligibility</p>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-success">
                      {selectedDonor?.eligibility?.isEligible ? "Eligible" : "Not Eligible"}
                    </p>
                    {!selectedDonor?.eligibility?.isEligible && (
                      <p className="text-xs text-error mt-1">
                        {selectedDonor?.eligibility?.ineligibleReason || "Temporarily ineligible"}
                      </p>
                    )}
                  </div>

                  {/* Last Donation Card */}
                  <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="bg-warning/10 p-1.5 sm:p-2 rounded-full">
                        <FiCalendar className="text-warning text-sm sm:text-base" />
                      </div>
                      <p className="font-medium text-xs sm:text-sm">Last Donation</p>
                    </div>
                    <p className="text-base sm:text-lg font-semibold">
                      {formatDate(selectedDonor?.eligibility?.lastDonationDate)}
                    </p>
                    {selectedDonor?.eligibility?.nextEligibleDate && (
                      <p className="text-xs opacity-70 mt-1">
                        Next eligible: {formatDate(selectedDonor?.eligibility?.nextEligibleDate)}
                      </p>
                    )}
                  </div>

                  {/* Total Donations Card */}
                  <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="bg-info/10 p-1.5 sm:p-2 rounded-full">
                        <FiAward className="text-info text-sm sm:text-base" />
                      </div>
                      <p className="font-medium text-xs sm:text-sm">Total Donations</p>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-info">
                      {selectedDonor?.eligibility?.totalDonated || 0}
                    </p>
                    <p className="text-xs opacity-70 mt-1">Units donated</p>
                  </div>
                </div>

                {/* Donation Preferences */}
                <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                    <FiHeart className="text-error" />
                    Donation Preferences
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Max Distance */}
                    <div>
                      <p className="text-xs opacity-70 flex items-center gap-1">
                        <FiMap size={12} />
                        Max Distance
                      </p>
                      <p className="font-medium text-sm">
                        {selectedDonor?.donationPreferences?.maxDistance || 50} km
                      </p>
                    </div>

                    {/* Emergency Donor */}
                    <div>
                      <p className="text-xs opacity-70 flex items-center gap-1">
                        <FaAmbulance size={12} />
                        Emergency Donor
                      </p>
                      <p className="font-medium text-sm">
                        {selectedDonor?.donationPreferences?.emergencyDonor ? "Yes" : "No"}
                      </p>
                    </div>

                    {/* Donation Types */}
                    <div className="sm:col-span-2">
                      <p className="text-xs opacity-70 mb-2">Preferred Donation Types</p>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {selectedDonor?.donationPreferences?.donationType?.map((type) => (
                          <span key={type} className="badge badge-error badge-xs sm:badge-sm">
                            {type.replace('_', ' ')}
                          </span>
                        ))}
                        {(!selectedDonor?.donationPreferences?.donationType?.length) && (
                          <span className="text-xs text-base-content/50">No preferences set</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Info (Limited) */}
                <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                    <FaShieldAlt className="text-error" />
                    Medical Information (Limited)
                  </h3>

                  <div className="space-y-2 sm:space-y-3">
                    {/* Hemoglobin */}
                    {selectedDonor?.medicalInfo?.hemoglobin && (
                      <div className="flex justify-between items-center p-2 bg-base-300 rounded">
                        <span className="text-xs sm:text-sm">Hemoglobin</span>
                        <span className="font-medium text-xs sm:text-sm">{selectedDonor.medicalInfo.hemoglobin} g/dL</span>
                      </div>
                    )}

                    {/* Diseases */}
                    {selectedDonor?.medicalInfo?.diseases?.length > 0 && (
                      <div className="p-2 bg-base-300 rounded">
                        <p className="text-xs opacity-70 mb-1">Known Conditions</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedDonor.medicalInfo.diseases.map((disease, i) => (
                            <span key={i} className="badge badge-warning badge-xs sm:badge-sm">{disease}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Donations History */}
                {selectedDonor?.donationHistory?.length > 0 && (
                  <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                      <FiClock className="text-error" />
                      Recent Donations
                    </h3>

                    <div className="space-y-2">
                      {selectedDonor.donationHistory.slice(0, 3).map((donation, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-base-300 rounded text-xs sm:text-sm">
                          <span>{formatDate(donation.date)}</span>
                          <span className="font-mono">{donation.type}</span>
                          <span className="badge badge-success badge-xs">{donation.volume} mL</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information (Limited) - Only for matched donors */}
                {selectedDonor?.user?.phone && (
                  <div className="bg-base-200 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
                      <FiPhone className="text-error" />
                      Contact Information
                    </h3>
                    <div className="space-y-2">
                      {selectedDonor.user.phone && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FaPhoneAlt size={10} className="sm:w-3 sm:h-3" />
                          <span>{selectedDonor.user.phone}</span>
                        </div>
                      )}
                      {selectedDonor.user.email && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FaEnvelope size={10} className="sm:w-3 sm:h-3" />
                          <span className="truncate">{selectedDonor.user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-base-content/70 py-6 sm:py-8">No profile data available.</p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-action border-t border-base-300 p-3 sm:p-4 bg-base-200/50">
            <button
              type="button"
              className="btn btn-error btn-xs sm:btn-sm text-white ml-auto gap-2"
              onClick={closeProfileModal}
            >
              <span>Close</span>
            </button>
          </div>
        </motion.div>

        {/* Backdrop */}
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeProfileModal}>close</button>
        </form>
      </dialog>
    </motion.div>
  );
};

export default DonorSearch;