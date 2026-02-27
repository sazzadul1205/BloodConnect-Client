import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { FiEye, FiMapPin, FiRefreshCw, FiSearch, FiUsers } from "react-icons/fi";
import { FaHospital } from "react-icons/fa";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";
import useAuth from "../../../../hooks/useAuth";
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";

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

  const [filters, setFilters] = useState({
    bloodType: "A+",
    bloodGroup: "A+",
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
      setSelectedDonor(null);
      setProfileError("");

      try {
        let endpoint = "";
        let params = new URLSearchParams();

        if (type === "eligible") {
          endpoint = "/donors/search/eligible";
          params.set("bloodType", values.bloodType || "A+");
          if (values.city) params.set("city", values.city);
        }

        if (type === "emergency") {
          endpoint = "/donors/search/emergency";
          params.set("bloodType", values.bloodType || "A+");
          if (values.city) params.set("city", values.city);
        }

        if (type === "nearby") {
          endpoint = "/users/nearby-donors";
          params.set("longitude", values.longitude || "0");
          params.set("latitude", values.latitude || "0");
          params.set("radius", values.radius || "10000");
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
    [authHeaders, axiosInstance],
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
    syncUrl(activeType, filters);
    fetchDonors(activeType, filters);
  }, [activeType, fetchDonors, filters, syncUrl]);

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
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </>
          )}

          <button type="button" className="btn btn-error gap-2" onClick={handleSearch}>
            <FiSearch size={14} />
            Search
          </button>
        </div>
      </div>

      <div className="stat bg-base-100 rounded-lg border border-base-300">
        <div className="stat-figure text-error">
          <FiUsers size={22} />
        </div>
        <div className="stat-title">Results</div>
        <div className="stat-value text-3xl">{donors.length}</div>
        <div className="stat-desc capitalize">{activeType} donor matches</div>
      </div>

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
              {donors.length > 0 ? (
                donors.map((donor, idx) => {
                  const donorId = donor?.donorId || donor?._id;
                  const fullName =
                    donor?.user?.profile?.fullName ||
                    donor?.profile?.fullName ||
                    "Donor";
                  const bloodType =
                    donor?.medicalInfo?.bloodType || donor?.profile?.bloodGroup || "N/A";
                  const city = donor?.user?.address?.city || donor?.address?.city || "N/A";
                  const isEligible = donor?.eligibility?.isEligible;
                  const isEmergency =
                    donor?.donationPreferences?.emergencyDonor ||
                    donor?.donationPreferences?.notifyForEmergency;

                  return (
                    <tr key={String(donorId || idx)}>
                      <td>{idx + 1}</td>
                      <td>{fullName}</td>
                      <td>{bloodType}</td>
                      <td>
                        <span className="inline-flex items-center gap-1">
                          <FiMapPin size={12} />
                          {city}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isEligible ? "badge-success" : "badge-warning"}`}>
                          {isEligible ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isEmergency ? "badge-info" : "badge-ghost"}`}>
                          {isEmergency ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-square"
                          disabled={!donorId || profileLoading}
                          onClick={() => openProfile(donorId)}
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
                    No donors found for this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
