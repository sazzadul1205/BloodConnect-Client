// Pages/backend/Donor/DonationHistory/DonationHistory.jsx

// React
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Sweet Alert
import Swal from "sweetalert2";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Icons
import {
  FiClock,
  FiPlusCircle,
  FiSave,
  FiDroplet,
  FiCalendar,
  FiActivity,
  FiAlertCircle,
} from "react-icons/fi";
import {
  FaTint,
  FaFlask,
  FaHeartbeat,
  FaHospital,
  FaCheckCircle as FaCheckCircleSolid,
} from "react-icons/fa";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import DonationDetailsModal from "./DonationDetailsModal/DonationDetailsModal";
import DonorProfileRequired from "../../../../shared/DonorProfileRequired";

// Constants
const donationTypes = [
  { value: "whole_blood", label: "Whole Blood", icon: FaTint, color: "error", description: "450ml whole blood donation" },
  { value: "plasma", label: "Plasma", icon: FaFlask, color: "info", description: "Plasma via apheresis" },
  { value: "platelets", label: "Platelets", icon: FaHeartbeat, color: "warning", description: "Platelets via apheresis" },
];

const reactionOptions = [
  "None",
  "Mild dizziness",
  "Fatigue",
  "Bruising",
  "Nausea",
  "Fainting",
  "Other",
];

const DonationHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // Get donor ID from user object
  const donorId = useMemo(
    () => user?.userId || user?._id || user?.id || user?.uid,
    [user],
  );

  // Check if user can add donation records
  const canAddDonation = ["admin", "super_admin", "hospital", "blood_bank"].includes(
    user?.role,
  );

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [donor, setDonor] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);

  // Form state for adding donation
  const [form, setForm] = useState({
    type: "whole_blood",
    bloodBankId: "",
    bloodBankName: "",
    volume: "",
    reaction: "",
    notes: "",
  });

  // Fetch donor history
  const fetchHistory = useCallback(async () => {
    if (!donorId) {
      setError(new Error("Donor ID not found. Please log in again."));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setProfileMissing(false);
    try {
      const res = await axiosInstance.get(`/donors/${donorId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setDonor(res.data?.data || null);
    } catch (err) {
      if (err?.response?.status === 404) {
        setProfileMissing(true);
        setError(null);
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [axiosInstance, donorId, token]);

  // Fetch data on component mount
  useEffect(() => {
    if (!authLoading) {
      fetchHistory();
    }
  }, [authLoading, fetchHistory]);

  // Handle form input changes
  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setForm({
      type: "whole_blood",
      bloodBankId: "",
      bloodBankName: "",
      volume: "",
      reaction: "",
      notes: "",
    });
    setShowAddForm(false);
  };

  // Handle add donation submission
  const handleAddDonation = async (e) => {
    e.preventDefault();
    if (!canAddDonation) return;

    // Validate volume
    const volumeNum = Number(form.volume);
    if (volumeNum < 100 || volumeNum > 1000) {
      await Swal.fire({
        title: "Invalid Volume",
        text: "Volume should be between 100ml and 1000ml.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: form.type,
        bloodBankId: form.bloodBankId.trim(),
        bloodBankName: form.bloodBankName.trim() || undefined,
        volume: volumeNum,
        reaction: form.reaction === "None" ? null : form.reaction.trim(),
        notes: form.notes.trim() || null,
        date: new Date().toISOString(),
      };

      await axiosInstance.post(`/donors/${donorId}/donations`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      await Swal.fire({
        title: "Donation Added",
        html: `
          <div class="text-center">
            <p class="mb-2">Donation record was added successfully.</p>
            <p class="text-sm text-base-content/70">The donor's eligibility has been updated.</p>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Great!",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });

      resetForm();
      await fetchHistory();
    } catch (err) {
      await Swal.fire({
        title: "Failed to Add Donation",
        text: err?.response?.data?.error || "Could not add donation record.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
    } finally {
      setSaving(false);
    }
  };

  // View donation details
  const viewDonationDetails = (donation) => {
    setSelectedDonation(donation);
    document.getElementById("donation_details_modal")?.showModal();
  };

  // Close details modal
  const CloseModal = () => {
    setSelectedDonation(null);
    document.getElementById("donation_details_modal")?.close();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString.$date || dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date only
  const formatDateOnly = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString.$date || dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get donation type details
  const getDonationTypeDetails = (type) => {
    return donationTypes.find(t => t.value === type) || donationTypes[0];
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const history = donor?.donationHistory || [];
    const totalDonations = history.length;
    const totalVolume = history.reduce((sum, item) => sum + (item.volume || 0), 0);
    const lastDonation = history.length > 0 ? history[history.length - 1] : null;
    const donationsByType = history.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalDonations,
      totalVolume,
      lastDonation,
      donationsByType,
    };
  }, [donor]);

  // Loading state
  if (loading || authLoading) return <BloodLoader />;

  // Error state
  if (error) return <ErrorState error={error} onRetry={fetchHistory} />;
  if (profileMissing) {
    return (
      <DonorProfileRequired
        title="Donation History Needs Donor Profile"
        description="Create your donor profile first, then your donations and eligibility timeline will appear here."
      />
    );
  }

  const history = donor?.donationHistory || [];

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiClock className="text-error" />
            Donation History
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Track and manage blood donation records
          </p>
        </div>

        {/* Stats Badge */}
        <div className="flex items-center gap-3">
          <div className="badge badge-outline badge-lg gap-2">
            <FaTint className="text-error" />
            Total: {stats.totalDonations}
          </div>
          <div className="badge badge-outline badge-lg gap-2">
            <FaFlask className="text-info" />
            Volume: {stats.totalVolume}ml
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-base-100 rounded-lg shadow border border-base-300 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-error/10 p-3 rounded-full">
              <FaTint className="text-error" />
            </div>
            <div>
              <p className="text-sm opacity-70">Total Donations</p>
              <p className="text-2xl font-bold">{stats.totalDonations}</p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow border border-base-300 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-info/10 p-3 rounded-full">
              <FaFlask className="text-info" />
            </div>
            <div>
              <p className="text-sm opacity-70">Total Volume</p>
              <p className="text-2xl font-bold">{stats.totalVolume}ml</p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow border border-base-300 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-warning/10 p-3 rounded-full">
              <FaHeartbeat className="text-warning" />
            </div>
            <div>
              <p className="text-sm opacity-70">Last Donation</p>
              <p className="font-semibold">
                {stats.lastDonation ? formatDateOnly(stats.lastDonation.date) : "Never"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow border border-base-300 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 p-3 rounded-full">
              <FaCheckCircleSolid className="text-success" />
            </div>
            <div>
              <p className="text-sm opacity-70">Next Eligible</p>
              <p className="font-semibold">
                {stats.lastDonation?.nextEligibleDate
                  ? formatDateOnly(stats.lastDonation.nextEligibleDate)
                  : "Eligible now"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Donation Form - Only visible to authorized users */}
      {canAddDonation && (
        <div className="bg-base-100 rounded-lg shadow border border-base-300 overflow-hidden">
          {/* Form Header - Click to toggle */}
          <div
            className="p-4 bg-base-200/50 cursor-pointer flex items-center justify-between"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <h3 className="font-semibold flex items-center gap-2">
              <FiPlusCircle className="text-error" />
              Add New Donation Record
            </h3>
            <span className={`transform transition-transform ${showAddForm ? 'rotate-180' : ''}`}>
              v
            </span>
          </div>

          {/* Collapsible Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-5 border-t border-base-300"
            >
              <form onSubmit={handleAddDonation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Donation Type Selection */}
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium">Donation Type</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {donationTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = form.type === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, type: type.value }))}
                            className={`btn btn-sm ${isSelected ? `btn-${type.color}` : 'btn-outline'}`}
                          >
                            <Icon className={isSelected ? '' : `text-${type.color}`} />
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Volume Input */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Volume (ml)</span>
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="1000"
                      step="10"
                      name="volume"
                      value={form.volume}
                      onChange={handleInput}
                      className="input input-bordered"
                      placeholder="450"
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        Standard: 450ml for whole blood
                      </span>
                    </label>
                  </div>

                  {/* Blood Bank ID */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Blood Bank ID</span>
                    </label>
                    <input
                      type="text"
                      name="bloodBankId"
                      value={form.bloodBankId}
                      onChange={handleInput}
                      className="input input-bordered"
                      placeholder="MongoDB ObjectId"
                      required
                    />
                  </div>

                  {/* Blood Bank Name (Optional) */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Blood Bank Name</span>
                    </label>
                    <input
                      type="text"
                      name="bloodBankName"
                      value={form.bloodBankName}
                      onChange={handleInput}
                      className="input input-bordered"
                      placeholder="e.g. City Blood Bank"
                    />
                  </div>

                  {/* Reaction Selection */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Reaction</span>
                    </label>
                    <select
                      name="reaction"
                      value={form.reaction}
                      onChange={handleInput}
                      className="select select-bordered"
                    >
                      {reactionOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium">Additional Notes</span>
                    </label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleInput}
                      className="textarea textarea-bordered"
                      rows={2}
                      placeholder="Any additional information about the donation..."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="btn btn-error gap-2"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave />
                        Save Donation Record
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                </div>

                {/* Form Info Alert */}
                <div className="alert bg-info/10 border-info/20 text-sm">
                  <FiAlertCircle className="text-info" />
                  <span>
                    Adding a donation record will automatically update the donor's eligibility status.
                  </span>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      )}

      {/* Donation History Table */}
      <div className="bg-base-100 rounded-lg shadow border border-base-300 overflow-hidden">
        <div className="p-4 border-b border-base-300 font-semibold flex justify-between items-center">
          <span>Donation Records</span>
          <span className="badge badge-error">{history.length}</span>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Volume</th>
                  <th>Blood Bank</th>
                  <th>Reaction</th>
                  <th>Next Eligible</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => {
                  const typeDetails = getDonationTypeDetails(item?.type);
                  const TypeIcon = typeDetails.icon;

                  return (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-base-200 cursor-pointer"
                      onClick={() => viewDonationDetails(item)}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <FiCalendar className="opacity-50" />
                          {formatDateOnly(item?.date)}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <TypeIcon className={`text-${typeDetails.color}`} />
                          <span>{item?.type?.replace("_", " ") || "N/A"}</span>
                        </div>
                      </td>
                      <td className="font-mono">{item?.volume ? `${item.volume}ml` : "N/A"}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <FaHospital className="opacity-50 text-xs" />
                          <span className="text-sm truncate max-w-37.5">
                            {item?.bloodBankName ||
                              (typeof item?.bloodBankId === "object"
                                ? item?.bloodBankId?.$oid?.slice(-6)
                                : item?.bloodBankId?.slice(-6) || "N/A")}
                          </span>
                        </div>
                      </td>
                      <td>
                        {item?.reaction ? (
                          <span className="badge badge-warning badge-sm">{item.reaction}</span>
                        ) : (
                          <span className="badge badge-success badge-sm">None</span>
                        )}
                      </td>
                      <td>
                        {item?.nextEligibleDate ? (
                          <span className="text-sm">
                            {formatDateOnly(item.nextEligibleDate)}
                          </span>
                        ) : (
                          <span className="badge badge-success badge-sm">Eligible now</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewDonationDetails(item);
                          }}
                        >
                          <FiActivity />
                          Details
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // Empty State
          <div className="p-12 text-center text-base-content/70">
            <FiDroplet className="mx-auto text-4xl mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">No Donation History Yet</p>
            <p className="text-sm opacity-70">
              {canAddDonation
                ? "Use the form above to add the first donation record."
                : "Donation records will appear here once you've donated."}
            </p>
          </div>
        )}
      </div>

      {/* Donation Details Modal */}
      <dialog id="donation_details_modal" className="modal">
        <DonationDetailsModal
          selectedDonation={selectedDonation}
          formatDate={formatDate}
          formatDateOnly={formatDateOnly}
          onClose={CloseModal}
        />

        {/* Modal Backdrop */}
        <form method="dialog" className="modal-backdrop" onClick={CloseModal}>
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default DonationHistory;

