// pages/backend/Donor/DonorProfile/DonorProfile.jsx

import React, { useState, useEffect, useCallback } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

// Icons
import {
  FaTint,
  FaHeart,
  FaHeartbeat,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaShieldAlt,
  FaFlask,
  FaStethoscope,
  FaPills,
  FaAward,
  FaEdit,
  FaTrashAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaHistory,
  FaSyringe,
  FaBell,
  FaGlobe,
  FaCalendarCheck,
  FaPrescriptionBottle,
  FaBan,
  FaInfoCircle,
  FaHome,
  FaNotesMedical,
} from "react-icons/fa";
import { FaShieldHeart, FaDroplet } from "react-icons/fa6";

// Components
import CreateDonorModal from "./CreateDonorModal/CreateDonorModal";
import EditDonorModal from "./EditDonorModal/EditDonorModal";
import ErrorState from "../../../../shared/ErrorState";

// Hooks
import useAxiosPublic from "../../../../hooks/useAxiosPublic";
import useAuth from "../../../../hooks/useAuth";
import BloodLoader from "../../../../shared/BloodLoader";

const DonorProfile = () => {
  const { axiosInstance } = useAxiosPublic();
  const { user, loading: authLoading } = useAuth();
  const token = localStorage.getItem("auth_token");

  // States
  const [hasProfile, setHasProfile] = useState(false);
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const checkDonorProfile = useCallback(async () => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Check if user exists and has an ID
    if (!user) {
      setLoading(false);
      setError(new Error("Please log in to view your donor profile"));
      return;
    }

    // Get the user ID - check different possible ID fields
    const userId = user?.userId || user?._id || user?.id || user?.uid;

    if (!userId) {
      setLoading(false);
      setError(new Error("User ID not found. Please log in again."));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      // Try to fetch donor profile using user ID
      const response = await axiosInstance.get(`/donors/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data.success) {
        setHasProfile(true);
        setDonor(response.data.data);
      }
    } catch (err) {
      console.error("Error checking donor profile:", err);

      if (err.response?.status === 404) {
        setHasProfile(false);
        setError(null);
      } else if (err.response?.status === 401) {
        setError(new Error("Authentication failed. Please log in again."));
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, axiosInstance]);

  // Check if donor profile exists on component mount / auth changes
  useEffect(() => {
    checkDonorProfile();
  }, [checkDonorProfile]);

  const handleCreateProfileModalClose = () => {
    document.getElementById('create_donor_modal')?.close();
    checkDonorProfile();
  };

  const handleRefreshProfile = () => {
    checkDonorProfile();
  };

  const handleRetry = () => {
    checkDonorProfile();
  };

  const handleEdit = () => {
    document.getElementById("edit_donor_modal")?.showModal();
  };

  const handleEditProfileModalClose = () => {
    document.getElementById("edit_donor_modal")?.close();
    checkDonorProfile();
  };

  // Delete function with SweetAlert2 confirmation and API call
  const handleDelete = () => {
    Swal.fire({
      title: 'Delete Donor Profile?',
      text: "This action cannot be undone. All your donation history will be permanently removed.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Show loading state
          Swal.fire({
            title: 'Deleting...',
            text: 'Please wait while we delete your profile',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            willOpen: () => {
              Swal.showLoading();
            },
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          });

          // Get donor ID from the donor object
          const donorId = donor?._id?.$oid || donor?._id;

          if (!donorId) {
            throw new Error('Donor ID not found');
          }

          // Make API call to delete donor profile
          const response = await axiosInstance.delete(`/donors/${donorId}?confirm=true`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          if (response.data.success) {
            // Success - close any open modals and update state
            document.getElementById('edit_donor_modal')?.close();
            document.getElementById('delete_donor_modal')?.close();

            Swal.fire({
              title: 'Deleted!',
              text: 'Your donor profile has been successfully deleted.',
              icon: 'success',
              confirmButtonColor: '#ef4444',
              timer: 2000,
              background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
              color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
            }).then(() => {
              // Update state to show create profile screen
              setHasProfile(false);
              setDonor(null);
            });
          }
        } catch (err) {
          console.error("Error deleting donor profile:", err);

          // Handle specific error cases
          let errorMessage = 'Failed to delete donor profile. Please try again.';

          if (err.response?.status === 403) {
            errorMessage = 'You do not have permission to delete this profile.';
          } else if (err.response?.status === 404) {
            errorMessage = 'Donor profile not found. It may have already been deleted.';
            // Update state to reflect that profile doesn't exist
            setHasProfile(false);
            setDonor(null);
          } else if (err.response?.data?.error) {
            errorMessage = err.response.data.error;
          }

          Swal.fire({
            title: 'Error!',
            text: errorMessage,
            icon: 'error',
            confirmButtonColor: '#ef4444',
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          });
        }
      }
    });
  };
  // Helper function to format date
  const formatDate = (date) => {
    if (!date) return "Not available";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format MongoDB date
  const formatMongoDate = (mongoDate) => {
    if (!mongoDate) return "Not available";
    return formatDate(mongoDate.$date || mongoDate);
  };

  // Helper function to get status badge
  const getStatusBadge = () => {
    if (!donor?.eligibility?.isEligible) {
      return {
        text: donor?.eligibility?.ineligibleReason || "Not Eligible",
        icon: FaClock,
        color: "warning",
        bgColor: "bg-warning/10",
        textColor: "text-warning",
        borderColor: "border-warning/20"
      };
    }
    if (donor?.donationPreferences?.isActive) {
      return {
        text: "Active & Eligible",
        icon: FaCheckCircle,
        color: "success",
        bgColor: "bg-success/10",
        textColor: "text-success",
        borderColor: "border-success/20"
      };
    }
    return {
      text: "Inactive",
      icon: FaExclamationCircle,
      color: "neutral",
      bgColor: "bg-base-300",
      textColor: "text-base-content",
      borderColor: "border-base-300"
    };
  };

  // Get full name from user object
  const getFullName = () => {
    return donor?.user?.profile?.fullName || donor?.user?.fullName || "Donor Name";
  };

  // Get user email
  const getUserEmail = () => {
    return donor?.user?.email || "Email not available";
  };

  // Get user phone
  const getUserPhone = () => {
    return donor?.user?.phone || "Phone not available";
  };

  // Get user location
  const getUserLocation = () => {
    return donor?.user?.address?.city || donor?.user?.profile?.address?.city || "Location not set";
  };

  // Format blood type with Rh factor
  const getFormattedBloodType = () => {
    const bloodType = donor?.medicalInfo?.bloodType || "N/A";
    const rhFactor = donor?.medicalInfo?.rhFactor;

    if (rhFactor) {
      const rhSymbol = rhFactor === "positive" ? "+" : rhFactor === "negative" ? "-" : "";
      return `${bloodType}${rhSymbol}`;
    }
    return bloodType;
  };

  // Get donation type display
  const getDonationTypeDisplay = (type) => {
    return type?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Not specified";
  };

  // Calculate days since last donation
  const getDaysSinceLastDonation = () => {
    if (!donor?.eligibility?.lastDonationDate) return null;
    const lastDonation = new Date(donor.eligibility.lastDonationDate.$date || donor.eligibility.lastDonationDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastDonation);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const statusBadge = donor ? getStatusBadge() : null;
  const StatusIcon = statusBadge?.icon || FaInfoCircle;
  const daysSinceLastDonation = getDaysSinceLastDonation();

  // Show loading state
  if (loading || authLoading) return <BloodLoader fullscreen={true} />;

  // Show error state using the ErrorState component
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  // Show create profile screen if no profile exists
  if (!hasProfile) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card bg-base-100 shadow-2xl w-full max-w-md border border-error/20"
        >
          <div className="card-body items-center text-center space-y-5">

            {/* Blood Icon with Pulse Animation */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-error/10 text-error rounded-full w-24 h-24 flex items-center justify-center"
            >
              <FaTint size={40} />
            </motion.div>

            {/* Title */}
            <h2 className="card-title text-2xl font-bold text-error">
              Become a Blood Donor
            </h2>

            {/* Message */}
            <p className="text-base-content/70">
              You don't have a donor profile yet.
              Create one and start saving lives today.
            </p>

            {/* Features List */}
            <div className="w-full space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <FaCheckCircle className="text-success" />
                Track your donation history
              </div>
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <FaCheckCircle className="text-success" />
                Get notified for emergency needs
              </div>
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <FaCheckCircle className="text-success" />
                Earn badges and achievements
              </div>
            </div>

            {/* CTA Button */}
            <div className="card-actions mt-4 w-full">
              <motion.button
                onClick={() => {
                  document.getElementById('create_donor_modal')?.showModal();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-error w-full text-white flex items-center gap-2"
              >
                <FaHeart />
                Create Donor Profile
              </motion.button>
            </div>

          </div>
        </motion.div>

        {/* Create Donor Modal */}
        <dialog id="create_donor_modal" className="modal">
          <CreateDonorModal
            refreshDonors={handleRefreshProfile}
            onSuccess={handleCreateProfileModalClose}
          />
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>
    );
  }

  // Show detailed donor profile if profile exists
  return (
    <div className="min-h-screen bg-base-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Title and Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2 text-base-content">
                <FaHeartbeat className="text-error" />
                Donor Profile
              </h1>
              <p className="text-base-content/60 mt-1">
                Manage your donor information and track your contributions
              </p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEdit}
                className="btn btn-info gap-2"
              >
                <FaEdit />
                Edit Profile
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                className="btn btn-error gap-2"
              >
                <FaTrashAlt />
                Delete Profile
              </motion.button>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="stat bg-base-100 rounded-lg shadow-sm p-4">
              <div className="stat-figure text-error">
                <FaDroplet size={24} />
              </div>
              <div className="stat-title text-sm">Blood Type</div>
              <div className="stat-value text-2xl text-error">{getFormattedBloodType()}</div>
              <div className="stat-desc text-xs">
                {donor?.medicalInfo?.rhFactor ?
                  (donor.medicalInfo.rhFactor === "positive" ? "Rh Positive" : "Rh Negative") :
                  "Rh not specified"}
              </div>
            </div>

            <div className="stat bg-base-100 rounded-lg shadow-sm p-4">
              <div className="stat-figure text-info">
                <FaSyringe size={24} />
              </div>
              <div className="stat-title text-sm">Total Donations</div>
              <div className="stat-value text-2xl text-info">{donor?.donationHistory?.length || 0}</div>
              <div className="stat-desc text-xs">Lifetime</div>
            </div>

            <div className="stat bg-base-100 rounded-lg shadow-sm p-4">
              <div className="stat-figure text-warning">
                <FaFlask size={24} />
              </div>
              <div className="stat-title text-sm">Volume Donated</div>
              <div className="stat-value text-2xl text-warning">{donor?.eligibility?.totalDonated || 0}ml</div>
              <div className="stat-desc text-xs">Total volume</div>
            </div>

            <div className="stat bg-base-100 rounded-lg shadow-sm p-4">
              <div className="stat-figure text-success">
                <FaCalendarCheck size={24} />
              </div>
              <div className="stat-title text-sm">Next Eligible</div>
              <div className="stat-value text-2xl text-success">
                {donor?.eligibility?.nextEligibleDate ?
                  new Date(donor.eligibility.nextEligibleDate.$date || donor.eligibility.nextEligibleDate)
                    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
                  'Now'}
              </div>
              <div className="stat-desc text-xs">
                {daysSinceLastDonation ? `${daysSinceLastDonation} days since last` : 'No donations yet'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-base-100 rounded-2xl shadow-xl overflow-hidden border border-base-300"
        >
          {/* Profile Header with Gradient */}
          <div className="bg-linear-to-r from-error to-error/80 p-8 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full"></div>
              <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-white rounded-full"></div>
            </div>

            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Image/Icon */}
              <div className="bg-white/20 p-6 rounded-2xl backdrop-blur-sm">
                <FaUser size={48} />
              </div>

              {/* Donor Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {getFullName()}
                  </h1>
                  <div className={`badge ${statusBadge?.bgColor} ${statusBadge?.textColor} border-0 gap-2 p-3`}>
                    <StatusIcon />
                    {statusBadge?.text}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-white/90">
                  <div className="flex items-center gap-2">
                    <FaIdCard className="text-white/60" />
                    <span className="text-sm">Donor ID: {donor?._id?.$oid?.slice(-8) || donor?._id?.slice(-8) || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-white/60" />
                    <span className="text-sm">{getUserEmail()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-white/60" />
                    <span className="text-sm">Member since {formatMongoDate(donor?.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-white/60" />
                    <span className="text-sm">{getUserLocation()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs Navigation */}
          <div className="border-b border-base-300 px-4 sm:px-8 bg-base-100">
            <div className="flex gap-1 sm:gap-2 overflow-x-auto py-2">
              {[
                { id: "overview", label: "Overview", icon: FaUser },
                { id: "medical", label: "Medical", icon: FaStethoscope },
                { id: "donations", label: "History", icon: FaHistory },
                { id: "preferences", label: "Preferences", icon: FaBell },
                { id: "badges", label: "Badges", icon: FaAward },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap
                      ${isActive
                        ? 'bg-error/10 text-error shadow-sm'
                        : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'
                      }`}
                  >
                    <Icon className={isActive ? 'text-error' : ''} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content with Animation */}
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information Card */}
                    <div className="card bg-base-200/50 border border-base-300">
                      <div className="card-body">
                        <h3 className="card-title text-lg flex items-center gap-2">
                          <FaUser className="text-error" />
                          Personal Information
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
                            <FaEnvelope className="text-base-content/40" />
                            <span className="text-base-content/70 min-w-20">Email:</span>
                            <span className="font-medium truncate">{getUserEmail()}</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
                            <FaPhone className="text-base-content/40" />
                            <span className="text-base-content/70 min-w-20">Phone:</span>
                            <span className="font-medium">{getUserPhone()}</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
                            <FaMapMarkerAlt className="text-base-content/40" />
                            <span className="text-base-content/70 min-w-20">Location:</span>
                            <span className="font-medium">{getUserLocation()}</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
                            <FaIdCard className="text-base-content/40" />
                            <span className="text-base-content/70 min-w-20">Donor ID:</span>
                            <span className="font-medium text-sm">{donor?._id?.$oid || donor?._id || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Eligibility Status Card */}
                    <div className="card bg-base-200/50 border border-base-300">
                      <div className="card-body">
                        <h3 className="card-title text-lg flex items-center gap-2">
                          <FaShieldAlt className="text-error" />
                          Donation Eligibility
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                            <span className="text-base-content/70">Status:</span>
                            <span className={`badge ${donor?.eligibility?.isEligible ? 'badge-success' : 'badge-warning'} gap-2 p-3`}>
                              {donor?.eligibility?.isEligible ? <FaCheckCircle /> : <FaClock />}
                              {donor?.eligibility?.isEligible ? "Eligible" : "Not Eligible"}
                            </span>
                          </div>

                          <div className="p-3 bg-base-100 rounded-lg">
                            <span className="text-base-content/70 block mb-1">Last Donation:</span>
                            <span className="font-medium flex items-center gap-2">
                              <FaCalendarAlt className="text-base-content/40" />
                              {formatMongoDate(donor?.eligibility?.lastDonationDate)}
                            </span>
                          </div>

                          <div className="p-3 bg-base-100 rounded-lg">
                            <span className="text-base-content/70 block mb-1">Next Eligible Date:</span>
                            <span className="font-medium flex items-center gap-2">
                              <FaCalendarCheck className="text-base-content/40" />
                              {formatMongoDate(donor?.eligibility?.nextEligibleDate)}
                            </span>
                          </div>

                          {donor?.eligibility?.ineligibleReason && (
                            <div className="alert alert-warning p-3">
                              <FaExclamationCircle />
                              <span>{donor.eligibility.ineligibleReason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Medical Overview Card - Full Width */}
                    <div className="card bg-base-200/50 border border-base-300 lg:col-span-2">
                      <div className="card-body">
                        <h3 className="card-title text-lg flex items-center gap-2">
                          <FaStethoscope className="text-error" />
                          Medical Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="stat bg-base-100 rounded-lg p-4">
                            <div className="stat-title text-sm">Hemoglobin Level</div>
                            <div className="stat-value text-2xl text-error">
                              {donor?.medicalInfo?.hemoglobin || "N/A"}
                              {donor?.medicalInfo?.hemoglobin && <span className="text-sm font-normal"> g/dL</span>}
                            </div>
                            {!donor?.medicalInfo?.hemoglobin && (
                              <div className="stat-desc text-xs">Not recorded</div>
                            )}
                          </div>

                          <div className="bg-base-100 rounded-lg p-4">
                            <p className="text-base-content/70 text-sm mb-2 flex items-center gap-1">
                              <FaNotesMedical />
                              Medical Conditions
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {donor?.medicalInfo?.diseases?.length > 0 ? (
                                donor.medicalInfo.diseases.map((disease, i) => (
                                  <span key={i} className="badge badge-error badge-sm gap-1 p-2">
                                    <FaBan className="text-xs" />
                                    {disease}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-base-content/60 flex items-center gap-1">
                                  <FaCheckCircle className="text-success text-xs" />
                                  None reported
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="bg-base-100 rounded-lg p-4">
                            <p className="text-base-content/70 text-sm mb-2 flex items-center gap-1">
                              <FaPills />
                              Allergies
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {donor?.medicalInfo?.allergies?.length > 0 ? (
                                donor.medicalInfo.allergies.map((allergy, i) => (
                                  <span key={i} className="badge badge-warning badge-sm gap-1 p-2">
                                    <FaExclamationCircle className="text-xs" />
                                    {allergy}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-base-content/60 flex items-center gap-1">
                                  <FaCheckCircle className="text-success text-xs" />
                                  None reported
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Medications section if any */}
                        {donor?.medicalInfo?.medications?.length > 0 && (
                          <div className="mt-4 p-4 bg-base-100 rounded-lg">
                            <p className="text-base-content/70 text-sm mb-2 flex items-center gap-1">
                              <FaPrescriptionBottle />
                              Current Medications
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {donor.medicalInfo.medications.map((med, i) => (
                                <span key={i} className="badge badge-info gap-1 p-2">
                                  <FaPrescriptionBottle />
                                  {med}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Medical History Tab */}
              {activeTab === "medical" && (
                <motion.div
                  key="medical"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Blood Information */}
                  <div className="card bg-base-200/50 border border-base-300">
                    <div className="card-body">
                      <h3 className="card-title text-lg flex items-center gap-2">
                        <FaTint className="text-error" />
                        Blood Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="stat bg-base-100 rounded-lg p-4">
                          <div className="stat-title text-sm">Blood Type</div>
                          <div className="stat-value text-2xl text-error">{donor?.medicalInfo?.bloodType || "N/A"}</div>
                        </div>
                        <div className="stat bg-base-100 rounded-lg p-4">
                          <div className="stat-title text-sm">Rh Factor</div>
                          <div className="stat-value text-2xl text-error">
                            {donor?.medicalInfo?.rhFactor ?
                              (donor.medicalInfo.rhFactor === "positive" ? "Positive (+)" : "Negative (-)") :
                              "Not specified"}
                          </div>
                        </div>
                        <div className="stat bg-base-100 rounded-lg p-4">
                          <div className="stat-title text-sm">Hemoglobin</div>
                          <div className="stat-value text-2xl text-error">
                            {donor?.medicalInfo?.hemoglobin || "N/A"}
                            {donor?.medicalInfo?.hemoglobin && <span className="text-sm"> g/dL</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Conditions */}
                  <div className="card bg-base-200/50 border border-base-300">
                    <div className="card-body">
                      <h3 className="card-title text-lg flex items-center gap-2">
                        <FaStethoscope className="text-error" />
                        Medical Conditions
                      </h3>
                      {donor?.medicalInfo?.diseases?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {donor.medicalInfo.diseases.map((disease, i) => (
                            <div key={i} className="badge badge-error badge-lg p-4 gap-2">
                              <FaExclamationCircle />
                              {disease}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-base-content/70">
                          <FaCheckCircle className="text-success" />
                          No medical conditions reported
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="card bg-base-200/50 border border-base-300">
                    <div className="card-body">
                      <h3 className="card-title text-lg flex items-center gap-2">
                        <FaPills className="text-warning" />
                        Allergies
                      </h3>
                      {donor?.medicalInfo?.allergies?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {donor.medicalInfo.allergies.map((allergy, i) => (
                            <div key={i} className="badge badge-warning badge-lg p-4 gap-2">
                              <FaExclamationCircle />
                              {allergy}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-base-content/70">
                          <FaCheckCircle className="text-success" />
                          No allergies reported
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Current Medications */}
                  <div className="card bg-base-200/50 border border-base-300">
                    <div className="card-body">
                      <h3 className="card-title text-lg flex items-center gap-2">
                        <FaPrescriptionBottle className="text-info" />
                        Current Medications
                      </h3>
                      {donor?.medicalInfo?.medications?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {donor.medicalInfo.medications.map((med, i) => (
                            <div key={i} className="badge badge-info badge-lg p-4 gap-2">
                              <FaPrescriptionBottle />
                              {med}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-base-content/70">
                          <FaCheckCircle className="text-success" />
                          No medications reported
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Donation History Tab */}
              {activeTab === "donations" && (
                <motion.div
                  key="donations"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FaHistory className="text-error" />
                      Donation History
                    </h3>
                    <span className="text-sm text-base-content/60">
                      Total: {donor?.donationHistory?.length || 0} donations
                    </span>
                  </div>

                  {donor?.donationHistory?.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-base-300">
                      <table className="table table-zebra w-full">
                        <thead className="bg-base-200">
                          <tr>
                            <th className="text-sm">Date</th>
                            <th className="text-sm">Type</th>
                            <th className="text-sm">Volume</th>
                            <th className="text-sm">Location</th>
                            <th className="text-sm">Reaction</th>
                          </tr>
                        </thead>
                        <tbody>
                          {donor.donationHistory.map((donation, index) => (
                            <tr key={index} className="hover">
                              <td className="font-medium">{formatMongoDate(donation.date)}</td>
                              <td>
                                <span className="badge badge-error gap-2">
                                  <FaDroplet />
                                  {getDonationTypeDisplay(donation.type)}
                                </span>
                              </td>
                              <td>{donation.volume} ml</td>
                              <td>
                                {donation.bloodBankId ? (
                                  <span className="flex items-center gap-1">
                                    <FaHome className="text-base-content/40" />
                                    {typeof donation.bloodBankId === 'object' ?
                                      donation.bloodBankId.$oid?.slice(-6) :
                                      donation.bloodBankId.toString().slice(-6)}
                                  </span>
                                ) : "N/A"}
                              </td>
                              <td>
                                {donation.reaction ? (
                                  <span className="badge badge-warning badge-sm">{donation.reaction}</span>
                                ) : "None"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="card bg-base-200/50 border border-base-300 p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <FaHeartbeat className="text-6xl text-base-content/30" />
                        <div>
                          <p className="text-base-content/70 text-lg">No donation history yet</p>
                          <p className="text-sm text-base-content/50 mt-1">
                            Your first donation will appear here
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {/* Donation Types */}
                  <div className="card bg-base-200/50 border border-base-300">
                    <div className="card-body">
                      <h3 className="card-title text-lg flex items-center gap-2">
                        <FaHeartbeat className="text-error" />
                        Donation Types
                      </h3>
                      <div className="space-y-2">
                        {donor?.donationPreferences?.donationType?.length > 0 ? (
                          donor.donationPreferences.donationType.map((type, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-base-100 rounded-lg">
                              <FaCheckCircle className="text-success" />
                              <span className="capitalize">{getDonationTypeDisplay(type)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-base-content/70">No preferences set</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Travel Preferences */}
                  <div className="card bg-base-200/50 border border-base-300">
                    <div className="card-body">
                      <h3 className="card-title text-lg flex items-center gap-2">
                        <FaGlobe className="text-error" />
                        Travel Preferences
                      </h3>
                      <div className="flex items-center gap-4 p-4 bg-base-100 rounded-lg">
                        <div className="text-3xl font-bold text-error">
                          {donor?.donationPreferences?.maxDistance || 50}
                        </div>
                        <div>
                          <div className="text-sm font-medium">kilometers</div>
                          <div className="text-xs text-base-content/50">Maximum travel distance</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="card bg-base-200/50 border border-base-300">
                    <div className="card-body">
                      <h3 className="card-title text-lg flex items-center gap-2">
                        <FaClock className="text-error" />
                        Availability
                      </h3>
                      {donor?.donationPreferences?.availability?.length > 0 ? (
                        <div className="space-y-2">
                          {donor.donationPreferences.availability.map((slot, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-base-100 rounded-lg">
                              <span className="font-medium">{slot.day}</span>
                              <span className="text-sm bg-base-200 px-2 py-1 rounded">
                                {slot.start} - {slot.end}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-base-content/70">No availability set</p>
                      )}
                    </div>
                  </div>

                  {/* Emergency Settings */}
                  <div className="card bg-base-200/50 border border-base-300">
                    <div className="card-body">
                      <h3 className="card-title text-lg flex items-center gap-2">
                        <FaShieldHeart className="text-error" />
                        Emergency Settings
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                          <span>Emergency Donor:</span>
                          <span className={`badge ${donor?.donationPreferences?.emergencyDonor ? 'badge-success' : 'badge-neutral'} gap-2 p-3`}>
                            {donor?.donationPreferences?.emergencyDonor ? <FaCheckCircle /> : <FaClock />}
                            {donor?.donationPreferences?.emergencyDonor ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-base-100 rounded-lg">
                          <span>Emergency Notifications:</span>
                          <span className={`badge ${donor?.donationPreferences?.notifyForEmergency ? 'badge-success' : 'badge-neutral'} gap-2 p-3`}>
                            {donor?.donationPreferences?.notifyForEmergency ? <FaBell /> : <FaBan />}
                            {donor?.donationPreferences?.notifyForEmergency ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preferred Centers */}
                  <div className="card bg-base-200/50 border border-base-300 md:col-span-2">
                    <div className="card-body">
                      <h3 className="card-title text-lg flex items-center gap-2">
                        <FaMapMarkerAlt className="text-error" />
                        Preferred Centers
                      </h3>
                      {donor?.donationPreferences?.preferredCenters?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {donor.donationPreferences.preferredCenters.map((center, i) => (
                            <span key={i} className="badge badge-error badge-lg p-4 gap-2">
                              <FaHome />
                              {center.toString()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-base-content/70">No preferred centers selected</p>
                      )}
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="card bg-base-200/50 border border-base-300 md:col-span-2">
                    <div className="card-body">
                      <h3 className="card-title text-lg flex items-center gap-2">
                        <FaUser className="text-error" />
                        Account Status
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 p-3 bg-base-100 rounded-lg">
                          <span className="text-base-content/70">Active Status:</span>
                          <span className={`badge ${donor?.donationPreferences?.isActive ? 'badge-success' : 'badge-neutral'}`}>
                            {donor?.donationPreferences?.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-base-100 rounded-lg">
                          <span className="text-base-content/70">Last Updated:</span>
                          <span className="font-medium">{formatMongoDate(donor?.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Badges Tab */}
              {activeTab === "badges" && (
                <motion.div
                  key="badges"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FaAward className="text-error" />
                    Badges & Achievements
                  </h3>

                  {donor?.badges?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {donor.badges.map((badge, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          className="card bg-linear-to-br from-error/5 to-transparent border border-error/20 hover:shadow-lg transition-all"
                        >
                          <div className="card-body items-center text-center">
                            <div className="bg-error/10 text-error rounded-full w-20 h-20 flex items-center justify-center mb-4">
                              <FaAward size={40} />
                            </div>
                            <h4 className="font-bold text-lg">{badge.name}</h4>
                            <p className="text-sm text-base-content/70">{badge.description}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-base-content/50">
                              <FaCalendarAlt />
                              Earned: {formatMongoDate(badge.earnedDate)}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="card bg-base-200/50 border border-base-300 p-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <FaAward className="text-7xl text-base-content/30" />
                        <div>
                          <p className="text-base-content/70 text-xl">No badges earned yet</p>
                          <p className="text-sm text-base-content/50 mt-2">
                            Complete donations to earn achievements and badges
                          </p>
                        </div>

                        {/* Achievement Goals */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-2xl">
                          <div className="bg-base-100 p-4 rounded-lg">
                            <div className="text-error font-bold mb-2">First Donation</div>
                            <div className="text-xs text-base-content/60">Complete your first donation</div>
                          </div>
                          <div className="bg-base-100 p-4 rounded-lg">
                            <div className="text-warning font-bold mb-2">5 Donations</div>
                            <div className="text-xs text-base-content/60">Donate 5 times</div>
                          </div>
                          <div className="bg-base-100 p-4 rounded-lg">
                            <div className="text-success font-bold mb-2">1 Year</div>
                            <div className="text-xs text-base-content/60">Active for 1 year</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer Note with Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-error/5 rounded-full">
            <FaHeart className="text-error animate-pulse" />
            <span className="text-sm text-base-content/70">
              This donor is helping save lives through blood donation
            </span>
          </div>
        </motion.div>
      </div>

      <dialog id="edit_donor_modal" className="modal">
        <EditDonorModal
          donorId={donor?._id?.$oid || donor?._id}
          donorData={donor}
          refreshDonors={handleRefreshProfile}
          onSuccess={handleEditProfileModalClose}
        />
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default DonorProfile;
