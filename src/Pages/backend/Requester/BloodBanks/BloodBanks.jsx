// Pages/frontend/Requester/BloodBanks/BloodBanks.jsx

// React
import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FiHome,
  FiMapPin,
  FiPhone,
  FiMail,
  FiSearch,
  FiNavigation,
  FiClock,
  FiFilter,
  FiX,
  FiChevronRight,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import {
  FaHospital,
  FaHeartbeat,
  FaBuilding,
  FaTint,
  FaStar,
  FaRegStar,
} from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared Components
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";

// Modals
import BankDetailsModal from "./BankDetailsModal/BankDetailsModal";

// Utils
import { getBloodTypeColor } from "./utils";

// ==================== CONSTANTS ====================

// Blood types for filter
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Bank type configuration - BUILD COMPATIBLE (static classes)
const bankTypeConfig = {
  government: {
    color: "badge-primary",
    icon: FaBuilding,
    label: "Government",
    bgGradient: "from-primary to-primary/80",
  },
  private: {
    color: "badge-secondary",
    icon: FaBuilding,
    label: "Private",
    bgGradient: "from-secondary to-secondary/80",
  },
  ngo: {
    color: "badge-success",
    icon: FaHeartbeat,
    label: "NGO",
    bgGradient: "from-success to-success/80",
  },
  hospital: {
    color: "badge-info",
    icon: FaHospital,
    label: "Hospital",
    bgGradient: "from-info to-info/80",
  },
};

// Default config for unknown types
const defaultBankConfig = {
  color: "badge-ghost",
  icon: FaHospital,
  label: "Blood Bank",
  bgGradient: "from-base-300 to-base-300/80",
};

// ==================== QUERY KEYS ====================

const queryKeys = {
  bloodBanks: (filters) => ['bloodBanks', filters],
  nearbyBanks: (coords, radius) => ['nearbyBanks', coords, radius],
  bloodTypeSearch: (bloodType, city) => ['bloodTypeSearch', bloodType, city],
};

// ==================== MAIN COMPONENT ====================

const BloodBanks = () => {
  const { axiosInstance } = useAxiosPublic();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");

  // ==================== STATES ====================

  const [radius, setRadius] = useState(10000); // 10km default
  const [viewMode, setViewMode] = useState("list"); // 'list', 'nearby', 'search'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [selectedBloodType, setSelectedBloodType] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // ==================== QUERIES ====================

  /**
   * Query 1: Fetch All Blood Banks
   * Automatically refetches when filters change
   */
  const {
    data: bloodBanksData,
    isLoading: loadingBanks,
    isError: banksError,
    error: banksErrorData,
    refetch: refetchBanks,
  } = useQuery({
    queryKey: queryKeys.bloodBanks({ selectedType, selectedCity }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedType) params.append("type", selectedType);
      if (selectedCity) params.append("city", selectedCity);

      const res = await axiosInstance.get(`/blood-banks?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  /**
   * Query 2: Search by Blood Type
   * Only enabled when we have a selected blood type and we're in search mode
   */
  const {
    data: searchResults,
    isLoading: searchingBlood,
    error: searchError,
    refetch: performBloodTypeSearch,
  } = useQuery({
    queryKey: queryKeys.bloodTypeSearch(selectedBloodType, selectedCity),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBloodType) params.append("bloodType", selectedBloodType);
      if (selectedCity) params.append("city", selectedCity);

      const res = await axiosInstance.get(
        `/blood-banks/search/inventory?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
    enabled: false, // Don't run automatically - we'll trigger manually
  });

  /**
   * Query 3: Nearby Banks
   * Only enabled when we have user location
   */
  const {
    data: nearbyData,
    isLoading: loadingNearby,
    error: nearbyError,
  } = useQuery({
    queryKey: queryKeys.nearbyBanks(userLocation, radius),
    queryFn: async () => {
      if (!userLocation) throw new Error("Location not available");

      const { lat, lng } = userLocation;
      const res = await axiosInstance.get(
        `/blood-banks/nearby?longitude=${lng}&latitude=${lat}&radius=${radius}`
      );
      return res.data;
    },
    enabled: !!userLocation && viewMode === "nearby", // Only run when we have location and are in nearby mode
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Get user location for nearby search
   */
  const getUserLocation = () => {
    setIsLoadingLocation(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        setUserLocation(newLocation);

        try {
          // Manually trigger the nearby query
          const result = await queryClient.fetchQuery({
            queryKey: queryKeys.nearbyBanks(newLocation, radius),
            queryFn: async () => {
              const res = await axiosInstance.get(
                `/blood-banks/nearby?longitude=${longitude}&latitude=${latitude}&radius=${radius}`
              );
              return res.data;
            },
          });

          // Check if we got any results
          if (result.data && result.data.length > 0) {
            setViewMode("nearby");
            setLocationError(""); // Clear any previous errors
          } else {
            // No results found - show message but keep previous view
            setLocationError("No blood banks found near your location. Try increasing the radius or use search filters.");
            setViewMode("list"); // Stay in list mode
          }
        } catch (error) {
          console.error("Error fetching nearby banks:", error);
          setLocationError("Failed to fetch nearby banks. Showing all banks instead.");
          setViewMode("list"); // Stay in list mode on error
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        let message = "Failed to get your location. ";
        if (error.code === 1) {
          message += "Please enable location access in your browser settings.";
        } else if (error.code === 2) {
          message += "Location unavailable. Please try again.";
        } else if (error.code === 3) {
          message += "Location request timed out.";
        }
        setLocationError(message);
        setIsLoadingLocation(false);
        setViewMode("list"); // Stay in list mode on error
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  /**
   * Handle blood type search
   */
  const handleBloodTypeSearch = async () => {
    if (!selectedBloodType) return;

    setIsLoadingLocation(true); // Reuse loading state for search
    setLocationError("");

    try {
      const result = await performBloodTypeSearch();

      if (result?.data && result.data.length > 0) {
        setViewMode("search");
        setLocationError("");
      } else {
        setLocationError(`No blood banks found with ${selectedBloodType} blood available.`);
        setViewMode("list"); // Stay in list mode
      }
    } catch (error) {
      console.error("Error searching by blood type:", error);
      setLocationError("Failed to search by blood type. Showing all banks instead.");
      setViewMode("list"); // Stay in list mode
    } finally {
      setIsLoadingLocation(false);
    }
  };

  /**
   * Reset filters
   */
  const resetFilters = () => {
    setSelectedType("");
    setSelectedCity("");
    setSelectedBloodType("");
    setSearchTerm("");
    setUserLocation(null);
    setViewMode("list");
    setLocationError(""); // Clear any error messages
    setShowFilters(false);
  };

  /**
   * Go back to list view
   */
  const goToListView = () => {
    setViewMode("list");
    setLocationError(""); // Clear any error messages
  };

  /**
   * Filter banks based on search term
   */
  const getFilteredBanks = useMemo(() => {
    let banks = [];

    if (viewMode === "nearby") {
      banks = nearbyData?.data || [];
    } else if (viewMode === "search") {
      banks = searchResults?.data || [];
    } else {
      banks = bloodBanksData?.data || [];
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      banks = banks.filter(
        (bank) =>
          bank.name?.toLowerCase().includes(term) ||
          bank.address?.city?.toLowerCase().includes(term) ||
          bank.address?.state?.toLowerCase().includes(term)
      );
    }

    return banks;
  }, [viewMode, nearbyData, searchResults, bloodBanksData, searchTerm]);

  /**
   * Get inventory status
   */
  const getInventoryStatus = (inventory, bloodType) => {
    if (!inventory) return { status: "No Data", color: "badge-ghost" };

    if (bloodType) {
      const item = inventory.find((i) => i.bloodType === bloodType);
      if (!item) return { status: "Not Available", color: "badge-error" };

      if (item.units === 0) return { status: "Out of Stock", color: "badge-error" };
      if (item.units <= item.threshold)
        return { status: "Low Stock", color: "badge-warning" };
      return { status: "Available", color: "badge-success" };
    }

    const totalUnits = inventory.reduce((sum, item) => sum + (item.units || 0), 0);
    const lowStockItems = inventory.filter(
      (item) => item.units <= item.threshold
    ).length;

    if (totalUnits === 0) return { status: "Empty", color: "badge-error" };
    if (lowStockItems > 0)
      return { status: `${lowStockItems} Low`, color: "badge-warning" };
    return { status: "Good", color: "badge-success" };
  };

  /**
   * Get rating stars
   */
  const getRatingStars = (rating = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-warning" size={12} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStar key={i} className="text-warning opacity-50" size={12} />);
      } else {
        stars.push(<FaRegStar key={i} className="text-base-content/30" size={12} />);
      }
    }
    return stars;
  };

  /**
   * Get bank config with fallback
   */
  const getBankConfig = (type) => {
    return bankTypeConfig[type] || defaultBankConfig;
  };

  /**
   * Close modal helper
   */
  const closeModal = () => {
    setSelectedBankId(null);
    document.getElementById("bank_details_modal")?.close();
  };

  // ==================== COMPUTED VALUES ====================

  const filteredBanks = getFilteredBanks;

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    return [
      ...new Set(bloodBanksData?.data?.map((bank) => bank.address?.city).filter(Boolean)),
    ];
  }, [bloodBanksData]);

  // Determine loading state
  const isLoading = loadingBanks || searchingBlood || loadingNearby || isLoadingLocation;

  // Determine error based on view mode
  const getCurrentError = () => {
    if (viewMode === "nearby") return nearbyError;
    if (viewMode === "search") return searchError;
    return banksError;
  };

  const currentError = getCurrentError();
  const errorData = viewMode === "nearby" ? nearbyError : viewMode === "search" ? searchError : banksErrorData;

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-base-200 p-3 sm:p-4 md:p-6">

      {/* ==================== HEADER SECTION ==================== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 sm:mb-6"
      >
        {/* Title and location button - responsive layout */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">

          {/* Title */}
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
              <div className="bg-error/10 p-1.5 sm:p-2 rounded-full">
                <FiHome className="text-error text-lg sm:text-xl md:text-2xl" />
              </div>
              Find Blood Banks
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Search for blood banks, check inventory, and find nearby facilities
            </p>
          </div>

          {/* Location Button */}
          <button
            onClick={getUserLocation}
            disabled={isLoadingLocation}
            className="btn btn-error btn-sm sm:btn-md gap-1 sm:gap-2 w-full md:w-auto"
          >
            {isLoadingLocation ? (
              <>
                <span className="loading loading-spinner loading-xs sm:loading-sm"></span>
                <span className="text-xs sm:text-sm">Getting Location...</span>
              </>
            ) : (
              <>
                <FiNavigation size={14} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Find Nearby Banks</span>
              </>
            )}
          </button>
        </div>

        {/* Location Error - Shows when nearby search fails */}
        {locationError && (
          <div className="alert alert-warning mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <FiAlertCircle size={16} className="sm:w-5 sm:h-5 shrink-0" />
              <span className="text-xs sm:text-sm">{locationError}</span>
            </div>
            {/* Show "View All Banks" button when there's an error */}
            {viewMode !== "list" && (
              <button
                onClick={goToListView}
                className="btn btn-xs sm:btn-sm btn-ghost w-full sm:w-auto"
              >
                View All Banks
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* ==================== SEARCH AND FILTERS ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-3 sm:p-4 mb-4 sm:mb-6"
      >
        {/* Main Search Row - Responsive layout */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">

          {/* Search Input - Full width on mobile */}
          <div className="flex-1 w-full">
            <div className="form-control">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-sm sm:text-base" />
                <input
                  type="text"
                  placeholder="Search by bank name, city, or state..."
                  className="input input-bordered input-sm sm:input-md w-full pl-8 sm:pl-10 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quick Filters - Responsive wrap */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Blood Type Select */}
            <select
              className="select select-bordered select-sm sm:select-md w-32 sm:w-40 text-xs sm:text-sm"
              value={selectedBloodType}
              onChange={(e) => setSelectedBloodType(e.target.value)}
            >
              <option value="">All Blood Types</option>
              {bloodTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Search Button */}
            <button
              onClick={handleBloodTypeSearch}
              disabled={!selectedBloodType || isLoadingLocation}
              className="btn btn-error btn-sm sm:btn-md gap-1 sm:gap-2 px-3 sm:px-4"
            >
              {isLoadingLocation && selectedBloodType ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <FaTint size={12} className="sm:w-4 sm:h-4" />
              )}
              <span className="text-xs sm:text-sm">Search</span>
            </button>

            {/* Filters Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-sm sm:btn-md gap-1 sm:gap-2 px-3 sm:px-4 ${showFilters ? "btn-error" : "btn-outline"}`}
            >
              <FiFilter size={12} className="sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm hidden xs:inline">Filters</span>
            </button>

            {/* Reset Button - Only show when filters are active */}
            {(selectedType || selectedCity || selectedBloodType || searchTerm || viewMode !== "list") && (
              <button
                onClick={resetFilters}
                className="btn btn-ghost btn-sm sm:btn-md btn-square"
                aria-label="Reset filters"
              >
                <FiX size={14} className="sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="divider my-3 sm:my-4"></div>

              {/* Filters Grid - Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

                {/* Type Filter */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm">Bank Type</span>
                  </label>
                  <select
                    className="select select-bordered select-sm sm:select-md text-xs sm:text-sm"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="government">Government</option>
                    <option value="private">Private</option>
                    <option value="ngo">NGO</option>
                    <option value="hospital">Hospital</option>
                  </select>
                </div>

                {/* City Filter */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm">City</span>
                  </label>
                  <select
                    className="select select-bordered select-sm sm:select-md text-xs sm:text-sm"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  >
                    <option value="">All Cities</option>
                    {uniqueCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Radius Filter (for nearby) */}
                {viewMode === "nearby" && (
                  <div className="form-control sm:col-span-2 lg:col-span-1">
                    <label className="label py-1">
                      <span className="label-text text-xs sm:text-sm">Search Radius (km)</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={radius / 1000}
                      onChange={(e) => setRadius(parseInt(e.target.value) * 1000)}
                      className="range range-error range-xs sm:range-sm"
                      step="1"
                    />
                    <div className="flex justify-between text-[10px] sm:text-xs px-1 sm:px-2 mt-1">
                      <span>1km</span>
                      <span>{radius / 1000}km</span>
                      <span>50km</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ==================== RESULTS COUNT AND VIEW MODE ==================== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 sm:mb-4"
      >
        {/* Results count text */}
        <div className="text-xs sm:text-sm text-base-content/70">
          {viewMode === "list" && `Showing ${filteredBanks.length} blood bank${filteredBanks.length !== 1 ? "s" : ""}`}
          {viewMode === "nearby" && `Found ${filteredBanks.length} blood bank${filteredBanks.length !== 1 ? "s" : ""} near you`}
          {viewMode === "search" && selectedBloodType && `Found ${filteredBanks.length} blood bank${filteredBanks.length !== 1 ? "s" : ""} with ${selectedBloodType} blood`}
        </div>

        {/* View mode toggle buttons */}
        <div className="flex gap-1">
          <button
            onClick={goToListView}
            className={`btn btn-xs sm:btn-sm ${viewMode === "list" ? "btn-error" : "btn-ghost"}`}
          >
            All Banks
          </button>
          {userLocation && (
            <button
              onClick={() => {
                if (nearbyData?.data?.length > 0) {
                  setViewMode("nearby");
                  setLocationError("");
                } else {
                  getUserLocation(); // Refetch if no nearby banks
                }
              }}
              className={`btn btn-xs sm:btn-sm ${viewMode === "nearby" ? "btn-error" : "btn-ghost"}`}
            >
              Nearby
            </button>
          )}
        </div>
      </motion.div>

      {/* ==================== LOADING STATE ==================== */}
      {isLoading && <BloodLoader />}

      {/* ==================== ERROR STATE ==================== */}
      {currentError && !isLoading && (
        <ErrorState
          error={errorData}
          onRetry={() => {
            if (viewMode === "nearby") {
              queryClient.refetchQueries({ queryKey: queryKeys.nearbyBanks(userLocation, radius) });
            } else if (viewMode === "search") {
              performBloodTypeSearch();
            } else {
              refetchBanks();
            }
          }}
        />
      )}

      {/* ==================== BLOOD BANKS GRID ==================== */}
      {!isLoading && !currentError && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {filteredBanks.length > 0 ? (
            filteredBanks.map((bank) => {
              const bankConfig = getBankConfig(bank.type);
              const TypeIcon = bankConfig.icon;
              const inventoryStatus = getInventoryStatus(
                bank.inventory,
                selectedBloodType
              );
              const distance = bank.distance;

              return (
                <motion.div
                  key={bank._id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.4 }}
                  className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300 overflow-hidden group"
                >
                  {/* Card Header with Type Color - Static class */}
                  <div className={`h-2 bg-linear-to-r ${bankConfig.bgGradient}`}></div>

                  <div className="card-body p-4 sm:p-5">

                    {/* Bank Name and Type */}
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        {/* Bank Avatar */}
                        <div className="avatar">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-error/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TypeIcon className="text-error text-base sm:text-xl" />
                          </div>
                        </div>

                        {/* Bank Name and Type Badges */}
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm sm:text-base line-clamp-1">{bank.name}</h3>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                            {/* Bank Type Badge */}
                            <span className={`badge ${bankConfig.color} badge-xs sm:badge-sm gap-1`}>
                              <TypeIcon size={8} />
                              <span className="text-[10px] sm:text-xs">{bankConfig.label}</span>
                            </span>

                            {/* Verified Badge */}
                            {bank.verification?.isVerified && (
                              <span className="badge badge-success badge-xs sm:badge-sm gap-1">
                                <FiCheckCircle size={8} />
                                <span className="text-[10px] sm:text-xs">Verified</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rating - Hidden on very small screens */}
                      <div className="hidden xs:flex items-center gap-1">
                        {getRatingStars(bank.stats?.rating)}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-1 sm:gap-2 mt-2 sm:mt-3">
                      <FiMapPin className="text-base-content/50 mt-1 shrink-0" size={12} />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm wrap-break-word">
                          {bank.address?.street && `${bank.address.street}, `}
                          {bank.address?.city && `${bank.address.city}, `}
                          {bank.address?.state}
                        </p>
                        {distance && (
                          <p className="text-xs text-error mt-1 flex items-center gap-1">
                            <FiNavigation className="inline" size={10} />
                            <span>{distance} km away</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact Info - Responsive layout */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 mt-2">
                      {bank.contact?.phone?.[0] && (
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <FiPhone className="text-base-content/50" size={10} />
                          <span className="truncate max-w-24 sm:max-w-32">{bank.contact.phone[0]}</span>
                        </div>
                      )}
                      {bank.contact?.email && (
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <FiMail className="text-base-content/50" size={10} />
                          <span className="truncate max-w-24 sm:max-w-32">{bank.contact.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Operating Hours */}
                    {bank.operatingHours?.monday?.open && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm mt-2">
                        <FiClock className="text-base-content/50" size={10} />
                        <span className="truncate">
                          Mon-Fri: {bank.operatingHours.monday.open} -{" "}
                          {bank.operatingHours.friday?.close || "17:00"}
                        </span>
                      </div>
                    )}

                    {/* Inventory Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-base-300">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <FaTint className="text-error" size={12} />
                        <span className="text-xs sm:text-sm font-medium">Blood Inventory:</span>
                      </div>
                      <div className={`badge ${inventoryStatus.color} badge-xs sm:badge-sm gap-1`}>
                        {inventoryStatus.status}
                      </div>
                    </div>

                    {/* Blood Types Summary */}
                    {bank.inventory && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {bank.inventory
                          .filter((item) => item.units > 0)
                          .slice(0, 3)
                          .map((item) => (
                            <span
                              key={item.bloodType}
                              className="badge badge-outline badge-xs sm:badge-sm"
                              style={{
                                borderColor: getBloodTypeColor(item.bloodType),
                                color: getBloodTypeColor(item.bloodType),
                              }}
                            >
                              {item.bloodType}: {item.units}
                            </span>
                          ))}
                        {bank.inventory.filter((item) => item.units > 0).length > 3 && (
                          <span className="badge badge-ghost badge-xs sm:badge-sm">
                            +{bank.inventory.filter((item) => item.units > 0).length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* View Details Button */}
                    <div className="card-actions justify-end mt-3 sm:mt-4">
                      <button
                        onClick={() => {
                          setSelectedBankId(bank._id);
                          document.getElementById("bank_details_modal")?.showModal();
                        }}
                        className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 w-full xs:w-auto"
                      >
                        <span>View Details</span>
                        <FiChevronRight size={12} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            // Empty State
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 },
              }}
              className="col-span-full"
            >
              <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 sm:p-8 md:p-12 text-center">
                <div className="bg-error/10 p-3 sm:p-4 rounded-full w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <FiHome className="text-error text-2xl sm:text-3xl md:text-4xl" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">No Blood Banks Found</h3>
                <p className="text-xs sm:text-sm text-base-content/70 mb-4 sm:mb-6 max-w-md mx-auto">
                  {viewMode === "nearby"
                    ? "No blood banks found near your location. Try increasing the search radius or viewing all banks."
                    : viewMode === "search"
                      ? `No blood banks found with ${selectedBloodType} blood available. Try another blood type or location.`
                      : "No blood banks match your current filters. Try adjusting your search criteria."}
                </p>
                <button onClick={resetFilters} className="btn btn-error btn-sm sm:btn-md gap-2">
                  <FiFilter size={14} className="sm:w-4 sm:h-4" />
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ==================== BANK DETAILS MODAL ==================== */}
      <dialog id="bank_details_modal" className="modal">
        <BankDetailsModal bankId={selectedBankId} onClose={closeModal} />
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeModal}>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default BloodBanks;