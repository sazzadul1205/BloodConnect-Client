import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  FiEye,
  FiMapPin,
  FiNavigation,
  FiRefreshCw,
  FiSearch,
  FiUsers,
} from "react-icons/fi";
import { FaHospital } from "react-icons/fa";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";
import useAuth from "../../../../hooks/useAuth";
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import Pagination from "../../../../shared/Pagination";
import ResultsCount from "../../../../shared/ResultsCount";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SEARCH_TYPES = ["eligible", "emergency", "nearby"];
const PROFILE_MODAL_ID = "hospital_donor_profile_modal";

const DonorSearch = () => {
  const { axiosInstance } = useAxiosPublic();
  const { loading: authLoading } = useAuth();
  const token = localStorage.getItem("auth_token");
  const location = useLocation();
  const navigate = useNavigate();
  const { searchType } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [donors, setDonors] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [inputError, setInputError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const fetchDonors = useCallback(
    async (type, values) => {
      setLoading(true);
      setError(null);
      setInputError("");
      setSelectedDonor(null);
      setProfileError("");
      setCurrentPage(1);

      try {
        let endpoint = "";
        let params = new URLSearchParams();

        if (type === "eligible") {
          endpoint = "/donors/search/eligible";
          if (values.bloodType) params.set("bloodType", values.bloodType);
          if (values.city) params.set("city", values.city);
        }

        if (type === "emergency") {
          endpoint = "/donors/search/emergency";
          if (values.bloodType) params.set("bloodType", values.bloodType);
          if (values.city) params.set("city", values.city);
        }

        if (type === "nearby") {
          const validationError = validateNearbyInput(values);
          if (validationError) {
            setInputError(validationError);
            setDonors([]);
            setLoading(false);
            return;
          }
          endpoint = "/users/nearby-donors";
          params.set("longitude", String(values.longitude));
          params.set("latitude", String(values.latitude));
          params.set("radius", String(values.radius || "10000"));
          if (values.bloodGroup) params.set("bloodGroup", values.bloodGroup);
        }

        const res = await axiosInstance.get(`${endpoint}?${params.toString()}`, {
          headers: authHeaders,
        });

        setDonors(res.data?.data || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [authHeaders, axiosInstance, validateNearbyInput],
  );

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

  const handleSearch = useCallback(() => {
    if (activeType === "nearby") {
      const validationError = validateNearbyInput(filters);
      if (validationError) {
        setInputError(validationError);
        return;
      }
    }
    syncUrl(activeType, filters);
    fetchDonors(activeType, filters);
  }, [activeType, fetchDonors, filters, syncUrl, validateNearbyInput]);

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

  const openProfile = useCallback(
    async (donorId) => {
      document.getElementById(PROFILE_MODAL_ID)?.showModal();
      setProfileLoading(true);
      setProfileError("");
      setSelectedDonor(null);
      try {
        const res = await axiosInstance.get(`/donors/${donorId}`, {
          headers: authHeaders,
        });
        setSelectedDonor(res.data?.data || null);
      } catch (err) {
        setProfileError(
          err?.response?.data?.error || "Failed to load donor profile",
        );
      } finally {
        setProfileLoading(false);
      }
    },
    [authHeaders, axiosInstance],
  );

  const closeProfileModal = () => {
    document.getElementById(PROFILE_MODAL_ID)?.close();
  };

  useEffect(() => {
    readQueryDefaults();
  }, [readQueryDefaults]);

  useEffect(() => {
    if (authLoading) return;
    const params = new URLSearchParams(location.search);
    const values = {
      bloodType: params.get("bloodType") || filters.bloodType,
      bloodGroup: params.get("bloodGroup") || filters.bloodGroup,
      city: params.get("city") || filters.city,
      longitude: params.get("longitude") || filters.longitude,
      latitude: params.get("latitude") || filters.latitude,
      radius: params.get("radius") || filters.radius,
    };
    fetchDonors(activeType, values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, activeType, location.search]);

  const normalizedDonors = useMemo(
    () =>
      donors.map((donor, idx) => {
        const donorId = donor?.donorId || donor?._id || idx;
        return {
          raw: donor,
          donorId,
          fullName:
            donor?.user?.profile?.fullName || donor?.profile?.fullName || "Donor",
          bloodType:
            donor?.medicalInfo?.bloodType || donor?.profile?.bloodGroup || "N/A",
          city: donor?.user?.address?.city || donor?.address?.city || "N/A",
          isEligible: Boolean(donor?.eligibility?.isEligible),
          isEmergency: Boolean(
            donor?.donationPreferences?.emergencyDonor ||
              donor?.donationPreferences?.notifyForEmergency,
          ),
        };
      }),
    [donors],
  );

  const filteredDonors = useMemo(() => {
    if (!searchTerm.trim()) return normalizedDonors;
    const term = searchTerm.toLowerCase();
    return normalizedDonors.filter((donor) =>
      `${donor.fullName} ${donor.bloodType} ${donor.city}`
        .toLowerCase()
        .includes(term),
    );
  }, [normalizedDonors, searchTerm]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDonors = filteredDonors.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(filteredDonors.length / itemsPerPage));

  if (loading || authLoading) return <BloodLoader />;
  if (error) return <ErrorState error={error} onRetry={handleSearch} />;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FaHospital className="text-error" />
            Donor Search
          </h2>
          <p className="text-sm text-base-content/70 mt-1">
            Search eligible, emergency, and nearby donors with hospital-safe data.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm gap-2" onClick={handleSearch}>
          <FiRefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="bg-base-100 rounded-lg border border-base-300 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {SEARCH_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`btn btn-sm ${activeType === type ? "btn-error" : "btn-outline"}`}
              onClick={() => {
                setInputError("");
                syncUrl(type, filters);
                fetchDonors(type, filters);
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {activeType !== "nearby" ? (
            <>
              <select
                className="select select-bordered"
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
              <input
                type="text"
                className="input input-bordered"
                placeholder="City (e.g. Mumbai)"
                value={filters.city}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, city: e.target.value }))
                }
              />
            </>
          ) : (
            <>
              <input
                type="number"
                step="0.000001"
                className="input input-bordered"
                placeholder="Longitude"
                value={filters.longitude}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, longitude: e.target.value }))
                }
              />
              <input
                type="number"
                step="0.000001"
                className="input input-bordered"
                placeholder="Latitude"
                value={filters.latitude}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, latitude: e.target.value }))
                }
              />
              <input
                type="number"
                className="input input-bordered"
                placeholder="Radius (meters)"
                value={filters.radius}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, radius: e.target.value }))
                }
              />
              <select
                className="select select-bordered"
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
              <button
                type="button"
                className="btn btn-outline gap-2"
                onClick={useMyLocation}
              >
                <FiNavigation size={14} />
                Use My Location
              </button>
            </>
          )}

          <button type="button" className="btn btn-error gap-2" onClick={handleSearch}>
            <FiSearch size={14} />
            Search
          </button>
        </div>
        {inputError && <p className="text-error text-sm">{inputError}</p>}
      </div>

      <div className="stat bg-base-100 rounded-lg border border-base-300">
        <div className="stat-figure text-error">
          <FiUsers size={22} />
        </div>
        <div className="stat-title">Results</div>
        <div className="stat-value text-3xl">{filteredDonors.length}</div>
        <div className="stat-desc capitalize">{activeType} donor matches</div>
      </div>

      <div className="bg-base-100 rounded-lg border border-base-300 p-4">
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Filter results by name, blood type, or city..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {filteredDonors.length > 0 && (
        <div className="bg-base-100 rounded-lg border border-base-300 p-4">
          <ResultsCount
            filteredUsers={filteredDonors}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            startIndex={startIndex}
            endIndex={endIndex}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}

      <div className="bg-base-100 rounded-lg border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>#</th>
                <th>Donor</th>
                <th>Blood Type</th>
                <th>City</th>
                <th>Eligible</th>
                <th>Emergency</th>
                <th className="text-center">Profile</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDonors.length > 0 ? (
                paginatedDonors.map((donor, idx) => {
                  return (
                    <tr key={String(donor.donorId || idx)}>
                      <td>{startIndex + idx + 1}</td>
                      <td>{donor.fullName}</td>
                      <td>{donor.bloodType}</td>
                      <td>
                        <span className="inline-flex items-center gap-1">
                          <FiMapPin size={12} />
                          {donor.city}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${donor.isEligible ? "badge-success" : "badge-warning"}`}>
                          {donor.isEligible ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${donor.isEmergency ? "badge-info" : "badge-ghost"}`}>
                          {donor.isEmergency ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-square"
                          disabled={!donor.donorId || profileLoading}
                          onClick={() => openProfile(donor.donorId)}
                          title="View limited donor profile"
                        >
                          <FiEye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-base-content/70">
                    {donors.length > 0
                      ? "No donors match your local filter."
                      : "No donors found for this search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDonors.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <div className="bg-info/10 border border-info/20 rounded-lg p-4 text-sm">
        <p className="font-semibold text-info mb-1">Hospital Profile View:</p>
        <p className="text-base-content/70">
          Profile details are limited to blood type, eligibility, and donation preferences.
          Medical history and private contact info are hidden.
        </p>
      </div>

      <dialog id={PROFILE_MODAL_ID} className="modal">
        <div className="modal-box max-w-2xl">
          <h3 className="font-bold text-lg mb-4">Donor Profile (Hospital View)</h3>

          {profileLoading ? (
            <div className="py-8 flex justify-center">
              <span className="loading loading-spinner loading-md text-error"></span>
            </div>
          ) : profileError ? (
            <div className="alert alert-error">
              <span>{profileError}</span>
            </div>
          ) : selectedDonor ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-base-200 rounded p-3">
                  <p className="text-xs opacity-70">Donor ID</p>
                  <p className="font-medium break-all">{String(selectedDonor?._id || "N/A")}</p>
                </div>
                <div className="bg-base-200 rounded p-3">
                  <p className="text-xs opacity-70">User ID</p>
                  <p className="font-medium break-all">{String(selectedDonor?.userId || "N/A")}</p>
                </div>
                <div className="bg-base-200 rounded p-3">
                  <p className="text-xs opacity-70">Blood Type</p>
                  <p className="font-medium">{selectedDonor?.medicalInfo?.bloodType || "N/A"}</p>
                </div>
                <div className="bg-base-200 rounded p-3">
                  <p className="text-xs opacity-70">Eligibility</p>
                  <p className="font-medium">
                    {selectedDonor?.eligibility?.isEligible ? "Eligible" : "Not Eligible"}
                  </p>
                </div>
              </div>

              <div className="bg-base-200 rounded p-3">
                <p className="text-xs opacity-70">Donation Preferences</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="badge badge-outline">
                    Max Distance: {selectedDonor?.donationPreferences?.maxDistance ?? "N/A"} km
                  </span>
                  <span className="badge badge-outline">
                    Emergency Donor: {selectedDonor?.donationPreferences?.emergencyDonor ? "Yes" : "No"}
                  </span>
                  <span className="badge badge-outline">
                    Active: {selectedDonor?.donationPreferences?.isActive ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-base-content/70">No profile data available.</p>
          )}

          <div className="modal-action">
            <button type="button" className="btn" onClick={closeProfileModal}>
              Close
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default DonorSearch;
