// Pages/frontend/Requester/BloodBanks/BloodBanks.jsx

// React
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

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

const BloodBanks = () => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // States
  const [radius, setRadius] = useState(10000); // 10km default
  const [viewMode, setViewMode] = useState("list"); // 'list', 'nearby', 'search'
  const [searchTerm, setSearchTerm] = useState("");
  const [nearbyBanks, setNearbyBanks] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [selectedBloodType, setSelectedBloodType] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Blood types for filter
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Bank type configuration
  const bankTypeConfig = {
    government: {
      color: "badge-primary",
      icon: FaBuilding,
      label: "Government",
      bgColor: "from-primary to-primary/80",
    },
    private: {
      color: "badge-secondary",
      icon: FaBuilding,
      label: "Private",
      bgColor: "from-secondary to-secondary/80",
    },
    ngo: {
      color: "badge-success",
      icon: FaHeartbeat,
      label: "NGO",
      bgColor: "from-success to-success/80",
    },
    hospital: {
      color: "badge-info",
      icon: FaHospital,
      label: "Hospital",
      bgColor: "from-info to-info/80",
    },
  };

  // 🔹 Fetch All Blood Banks
  const {
    data: bloodBanksData,
    isLoading: loadingBanks,
    isError: banksError,
    error: banksErrorData,
    refetch: refetchBanks,
  } = useQuery({
    queryKey: ["public-blood-banks", selectedType, selectedCity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedType) params.append("type", selectedType);
      if (selectedCity) params.append("city", selectedCity);

      const res = await axiosInstance.get(`/blood-banks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // 🔹 Search by Blood Type
  const {
    data: searchResults,
    isLoading: searchingBlood,
    refetch: searchByBlood,
  } = useQuery({
    queryKey: ["blood-type-search", selectedBloodType, selectedCity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBloodType) params.append("bloodType", selectedBloodType);
      if (selectedCity) params.append("city", selectedCity);

      const res = await axiosInstance.get(
        `/blood-banks/search/inventory?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: false, // Don't run automatically
  });

  // Get user location for nearby search - FIXED VERSION
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
        setUserLocation({ lat: latitude, lng: longitude });

        try {
          const res = await axiosInstance.get(
            `/blood-banks/nearby?longitude=${longitude}&latitude=${latitude}&radius=${radius}`
          );

          // Check if we got any results
          if (res.data.data && res.data.data.length > 0) {
            setNearbyBanks(res.data.data);
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

  // Handle blood type search - FIXED VERSION
  const handleBloodTypeSearch = async () => {
    if (!selectedBloodType) return;

    setIsLoadingLocation(true); // Reuse loading state for search
    setLocationError("");

    try {
      const result = await searchByBlood();

      if (result.data?.data && result.data.data.length > 0) {
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

  // Reset filters - FIXED VERSION
  const resetFilters = () => {
    setSelectedType("");
    setSelectedCity("");
    setSelectedBloodType("");
    setSearchTerm("");
    setNearbyBanks([]);
    setViewMode("list");
    setLocationError(""); // Clear any error messages
    setShowFilters(false);
  };

  // Go back to list view - NEW FUNCTION
  const goToListView = () => {
    setViewMode("list");
    setLocationError(""); // Clear any error messages
  };

  // Filter banks based on search term
  const getFilteredBanks = () => {
    let banks = [];

    if (viewMode === "nearby") {
      banks = nearbyBanks;
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
  };

  const filteredBanks = getFilteredBanks();

  // Get unique cities for filter
  const uniqueCities = [
    ...new Set(bloodBanksData?.data?.map((bank) => bank.address?.city).filter(Boolean)),
  ];

  // Get inventory status
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

  // Get rating stars
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

  // Close modal helper
  const closeModal = () => {
    setSelectedBankId(null);
    document.getElementById("bank_details_modal")?.close();
  };

  return (
    <div className="min-h-screen bg-base-200 p-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="bg-error/10 p-2 rounded-full">
                <FiHome className="text-error text-2xl" />
              </div>
              Find Blood Banks
            </h1>
            <p className="text-base-content/70 mt-1">
              Search for blood banks, check inventory, and find nearby facilities
            </p>
          </div>

          {/* Location Button */}
          <button
            onClick={getUserLocation}
            disabled={isLoadingLocation}
            className="btn btn-error gap-2"
          >
            {isLoadingLocation ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Getting Location...
              </>
            ) : (
              <>
                <FiNavigation size={18} />
                Find Nearby Banks
              </>
            )}
          </button>
        </div>

        {/* Location Error - Shows when nearby search fails */}
        {locationError && (
          <div className="alert alert-warning mt-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FiAlertCircle size={20} />
              <span>{locationError}</span>
            </div>
            {/* Show "View All Banks" button when there's an error */}
            {viewMode !== "list" && (
              <button
                onClick={goToListView}
                className="btn btn-sm btn-ghost"
              >
                View All Banks
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 mb-6"
      >
        {/* Main Search Row */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="form-control">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                <input
                  type="text"
                  placeholder="Search by bank name, city, or state..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2">
            <select
              className="select select-bordered w-40"
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

            <button
              onClick={handleBloodTypeSearch}
              disabled={!selectedBloodType || isLoadingLocation}
              className="btn btn-error gap-2"
            >
              {isLoadingLocation && selectedBloodType ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <FaTint size={16} />
              )}
              Search
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-outline gap-2 ${showFilters ? "btn-error" : ""}`}
            >
              <FiFilter size={16} />
              Filters
            </button>

            {(selectedType || selectedCity || selectedBloodType || searchTerm || viewMode !== "list") && (
              <button onClick={resetFilters} className="btn btn-ghost btn-square">
                <FiX size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="divider my-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Type Filter */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bank Type</span>
                  </label>
                  <select
                    className="select select-bordered"
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
                  <label className="label">
                    <span className="label-text">City</span>
                  </label>
                  <select
                    className="select select-bordered"
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
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Search Radius (km)</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={radius / 1000}
                      onChange={(e) => setRadius(parseInt(e.target.value) * 1000)}
                      className="range range-error range-sm"
                      step="1"
                    />
                    <div className="flex justify-between text-xs px-2 mt-1">
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

      {/* Results Count and View Mode */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex justify-between items-center mb-4"
      >
        <div className="text-sm text-base-content/70">
          {viewMode === "list" && `Showing ${filteredBanks.length} blood bank${filteredBanks.length !== 1 ? "s" : ""}`}
          {viewMode === "nearby" && `Found ${filteredBanks.length} blood bank${filteredBanks.length !== 1 ? "s" : ""} near you`}
          {viewMode === "search" && selectedBloodType && `Found ${filteredBanks.length} blood bank${filteredBanks.length !== 1 ? "s" : ""} with ${selectedBloodType} blood`}
        </div>

        <div className="flex gap-1">
          <button
            onClick={goToListView}
            className={`btn btn-sm ${viewMode === "list" ? "btn-error" : "btn-ghost"}`}
          >
            All Banks
          </button>
          {userLocation && (
            <button
              onClick={() => {
                if (nearbyBanks.length > 0) {
                  setViewMode("nearby");
                  setLocationError("");
                } else {
                  getUserLocation(); // Refetch if no nearby banks
                }
              }}
              className={`btn btn-sm ${viewMode === "nearby" ? "btn-error" : "btn-ghost"}`}
            >
              Nearby
            </button>
          )}
        </div>
      </motion.div>

      {/* Loading State */}
      {(loadingBanks || searchingBlood || isLoadingLocation) && <BloodLoader />}

      {/* Error State for main banks fetch */}
      {banksError && viewMode === "list" && (
        <ErrorState error={banksErrorData} onRetry={() => refetchBanks()} />
      )}

      {/* Blood Banks Grid */}
      {!loadingBanks && !searchingBlood && !isLoadingLocation && (
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredBanks.length > 0 ? (
            filteredBanks.map((bank) => {
              const TypeIcon = bankTypeConfig[bank.type]?.icon || FaHospital;
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
                  {/* Card Header with Type Color */}
                  <div
                    className={`h-2 bg-linear-to-r ${bankTypeConfig[bank.type]?.bgColor || "from-base-300 to-base-300/80"
                      }`}
                  ></div>

                  <div className="card-body p-5">
                    {/* Bank Name and Type */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TypeIcon className="text-error text-xl" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg line-clamp-1">{bank.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`badge ${bankTypeConfig[bank.type]?.color || "badge-ghost"
                                } badge-sm gap-1`}
                            >
                              <TypeIcon size={10} />
                              {bankTypeConfig[bank.type]?.label || bank.type}
                            </span>
                            {bank.verification?.isVerified && (
                              <span className="badge badge-success badge-sm gap-1">
                                <FiCheckCircle size={10} />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        {getRatingStars(bank.stats?.rating)}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2 mt-3">
                      <FiMapPin className="text-base-content/50 mt-1 shrink-0" size={14} />
                      <div>
                        <p className="text-sm">
                          {bank.address?.street && `${bank.address.street}, `}
                          {bank.address?.city && `${bank.address.city}, `}
                          {bank.address?.state}
                        </p>
                        {distance && (
                          <p className="text-xs text-error mt-1">
                            <FiNavigation className="inline mr-1" size={10} />
                            {distance} km away
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {bank.contact?.phone?.[0] && (
                        <div className="flex items-center gap-1 text-sm">
                          <FiPhone className="text-base-content/50" size={12} />
                          <span>{bank.contact.phone[0]}</span>
                        </div>
                      )}
                      {bank.contact?.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <FiMail className="text-base-content/50" size={12} />
                          <span className="truncate max-w-32">{bank.contact.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Operating Hours */}
                    {bank.operatingHours?.monday?.open && (
                      <div className="flex items-center gap-1 text-sm mt-2">
                        <FiClock className="text-base-content/50" size={12} />
                        <span>
                          Mon-Fri: {bank.operatingHours.monday.open} -{" "}
                          {bank.operatingHours.friday?.close || "17:00"}
                        </span>
                      </div>
                    )}

                    {/* Inventory Status */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-base-300">
                      <div className="flex items-center gap-2">
                        <FaTint className="text-error" size={16} />
                        <span className="text-sm font-medium">Blood Inventory:</span>
                      </div>
                      <div className={`badge ${inventoryStatus.color} gap-1`}>
                        {inventoryStatus.status}
                      </div>
                    </div>

                    {/* Blood Types Summary */}
                    {bank.inventory && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {bank.inventory
                          .filter((item) => item.units > 0)
                          .slice(0, 4)
                          .map((item) => (
                            <span
                              key={item.bloodType}
                              className="badge badge-outline badge-sm"
                              style={{
                                borderColor: getBloodTypeColor(item.bloodType),
                                color: getBloodTypeColor(item.bloodType),
                              }}
                            >
                              {item.bloodType}: {item.units}
                            </span>
                          ))}
                        {bank.inventory.filter((item) => item.units > 0).length > 4 && (
                          <span className="badge badge-ghost badge-sm">
                            +{bank.inventory.filter((item) => item.units > 0).length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* View Details Button */}
                    <div className="card-actions justify-end mt-4">
                      <button
                        onClick={() => {
                          setSelectedBankId(bank._id);
                          document.getElementById("bank_details_modal")?.showModal();
                        }}
                        className="btn btn-error btn-sm gap-2"
                      >
                        View Details
                        <FiChevronRight size={16} />
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
              <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-12 text-center">
                <div className="bg-error/10 p-4 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <FiHome className="text-error text-4xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Blood Banks Found</h3>
                <p className="text-base-content/70 mb-6">
                  {viewMode === "nearby"
                    ? "No blood banks found near your location. Try increasing the search radius or viewing all banks."
                    : viewMode === "search"
                      ? `No blood banks found with ${selectedBloodType} blood available. Try another blood type or location.`
                      : "No blood banks match your current filters. Try adjusting your search criteria."}
                </p>
                <button onClick={resetFilters} className="btn btn-error gap-2">
                  <FiFilter size={16} />
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Bank Details Modal */}
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