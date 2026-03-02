// pages/donor/MyProfile/MyProfile.jsx

/**
 * MyProfile Component
 * 
 * User profile management page for donors.
 * Features:
 * - Display and edit personal information
 * - Manage emergency contact details
 * - Update address information
 * - Change password functionality
 * - Responsive design for all screen sizes
 * - Form validation and error handling
 * - React Query for data fetching and mutations
 * 
 * @component
 */

// React
import { Link } from "react-router";
import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";


// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// sweet alert
import Swal from "sweetalert2";

// Icons - Organized by category
import {
  // User info icons
  FiUser,
  FiCalendar,
  FiDroplet,
  FiHeart,
  FiPhone,

  // Location icons
  FiMapPin,

  // Action icons
  FiSave,
  FiSettings,
  FiKey,
} from "react-icons/fi";

// Custom Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared Components
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import ChangePasswordModal from "../../Admin/UsersManagement/ChangePasswordModal/ChangePasswordModal";

// Utils
import { formatDateInputValue } from "../../../../utils/dateFormat";

// ==========================================================================
// Constants
// ==========================================================================

/**
 * Empty form template for initial state and reset
 */
const emptyForm = {
  // Personal Information
  fullName: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  weight: "",
  bio: "",

  // Emergency Contact
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactPhone: "",

  // Address
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
};

/**
 * Gender options for select dropdown
 */
const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

/**
 * Blood group options
 */
const bloodGroupOptions = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

// ==========================================================================
// Main Component
// ==========================================================================

const MyProfile = () => {
  // ==========================================================================
  // Hooks and Initialization
  // ==========================================================================

  const { user } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");
  const userId = user?._id || user?.userId;

  // ==========================================================================
  // State Management
  // ==========================================================================

  const [form, setForm] = useState(emptyForm);
  const [isMobile, setIsMobile] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isTablet, setIsTablet] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [formErrors, setFormErrors] = useState({});

  // ==========================================================================
  // Responsive Design Detection
  // ==========================================================================

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [setIsTablet]);

  // ==========================================================================
  // React Query - Fetch Profile Data
  // ==========================================================================

  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["donor-my-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    },
  });

  // ==========================================================================
  // Populate Form with Profile Data
  // ==========================================================================

  useEffect(() => {
    if (!profileData) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      // Personal Information
      fullName: profileData?.profile?.fullName || "",
      dateOfBirth: profileData?.profile?.dateOfBirth
        ? formatDateInputValue(profileData.profile.dateOfBirth)
        : "",
      gender: profileData?.profile?.gender || "",
      bloodGroup: profileData?.profile?.bloodGroup || "",
      weight: profileData?.profile?.weight || "",
      bio: profileData?.profile?.bio || "",

      // Emergency Contact
      emergencyContactName: profileData?.profile?.emergencyContact?.name || "",
      emergencyContactRelation: profileData?.profile?.emergencyContact?.relation || "",
      emergencyContactPhone: profileData?.profile?.emergencyContact?.phone || "",

      // Address
      street: profileData?.address?.street || "",
      city: profileData?.address?.city || "",
      state: profileData?.address?.state || "",
      zipCode: profileData?.address?.zipCode || "",
      country: profileData?.address?.country || "",
    });
  }, [profileData]);

  // ==========================================================================
  // Form Validation
  // ==========================================================================

  const validateForm = () => {
    const errors = {};

    // Validate email format if provided
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Invalid email format";
    }

    // Validate phone number format if provided
    if (form.phone && !/^[\d\s\-+()]{10,}$/.test(form.phone)) {
      errors.phone = "Invalid phone number";
    }

    // Validate emergency contact phone if provided
    if (form.emergencyContactPhone && !/^[\d\s\-+()]{10,}$/.test(form.emergencyContactPhone)) {
      errors.emergencyContactPhone = "Invalid phone number";
    }

    // Validate weight range
    if (form.weight && (form.weight < 20 || form.weight > 300)) {
      errors.weight = "Weight must be between 20-300 kg";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==========================================================================
  // React Query - Update Profile Mutation
  // ==========================================================================

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      // Prepare profile payload (personal info + emergency contact)
      const profilePayload = {
        fullName: payload.fullName || undefined,
        dateOfBirth: payload.dateOfBirth || undefined,
        gender: payload.gender || undefined,
        bloodGroup: payload.bloodGroup || undefined,
        weight: payload.weight ? Number(payload.weight) : undefined,
        bio: payload.bio || undefined,
        emergencyContact: {
          name: payload.emergencyContactName || undefined,
          relation: payload.emergencyContactRelation || undefined,
          phone: payload.emergencyContactPhone || undefined,
        },
      };

      // Prepare address payload
      const addressPayload = {
        street: payload.street || undefined,
        city: payload.city || undefined,
        state: payload.state || undefined,
        zipCode: payload.zipCode || undefined,
        country: payload.country || undefined,
      };

      // Update profile information
      await axiosInstance.patch(`/users/profile/${userId}`, profilePayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update address information
      await axiosInstance.patch(`/users/address/${userId}`, addressPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: async () => {
      await Swal.fire({
        title: "Profile Updated! 🎉",
        html: `
          <div class="text-center">
            <p class="mb-2">Your profile was updated successfully.</p>
            <p class="text-sm text-base-content/70">Your changes have been saved.</p>
          </div>
        `,
        icon: "success",
        timer: 1700,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
      refetch();
    },
    onError: async (err) => {
      console.error("Profile update failed:", err);

      let errorMessage = "Unable to update profile.";
      if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to update this profile.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      await Swal.fire({
        title: "Update Failed",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: "#ef4444",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
      });
    },
  });

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  /**
   * Handles input field changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      await Swal.fire({
        title: "Validation Error",
        text: "Please check the form for errors.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    await updateMutation.mutateAsync(form);
  };

  /**
   * Closes password change modal
   */
  const closePasswordModal = () => {
    document.getElementById("donor_change_password_modal")?.close();
  };

  /**
   * Scrolls to section on mobile
   */
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ==========================================================================
  // Early Returns / Loading States
  // ==========================================================================

  if (!userId) {
    return (
      <div className="min-h-screen bg-base-200 p-4 sm:p-6">
        <div className="bg-base-100 rounded-lg border border-base-300 p-8 sm:p-12 text-center max-w-md mx-auto">
          <FiUser size={isMobile ? 40 : 48} className="mx-auto text-base-content/30 mb-3" />
          <p className="text-base sm:text-lg text-base-content/70">Unable to resolve user profile.</p>
          <p className="text-xs sm:text-sm text-base-content/50 mt-2">Please try logging in again.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <BloodLoader fullscreen={true} />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  // ==========================================================================
  // Render Component
  // ==========================================================================

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-5">
      {/* ==================================================================
            Header Section - Responsive
        ================================================================== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FiUser className="text-error" />
            {isMobile ? 'My Profile' : 'My Profile'}
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            {isMobile
              ? 'Manage your personal details'
              : 'Update your personal details and address information'
            }
          </p>
        </div>

        {/* Action Buttons - Responsive */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Settings Link */}
          <Link
            to="/donor/settings"
            className="btn btn-outline btn-sm gap-2 flex-1 sm:flex-none"
          >
            <FiSettings size={16} />
            {!isMobile && 'Settings'}
          </Link>

          {/* Change Password Button */}
          <button
            type="button"
            onClick={() => document.getElementById("donor_change_password_modal")?.showModal()}
            className="btn btn-outline btn-sm gap-2 flex-1 sm:flex-none"
          >
            <FiKey size={16} />
            {!isMobile && 'Change Password'}
          </button>

          {/* Save Button */}
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="btn btn-error btn-sm gap-2 flex-1 sm:flex-none"
          >
            {updateMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                {isMobile ? 'Saving' : 'Saving...'}
              </>
            ) : (
              <>
                <FiSave size={16} />
                {isMobile ? 'Save' : 'Save Profile'}
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* ==================================================================
            Mobile Navigation Tabs
        ================================================================== */}
      {isMobile && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "personal", label: "Personal", icon: FiUser },
            { id: "emergency", label: "Emergency", icon: FiHeart },
            { id: "address", label: "Address", icon: FiMapPin },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
                    ${isActive
                    ? 'bg-error text-white'
                    : 'bg-base-100 text-base-content/70 hover:bg-base-300'
                  }
                  `}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ==================================================================
            Main Form
        ================================================================== */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Personal Information Section */}
        <motion.section
          id="personal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4"
        >
          {/* Section Header */}
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiUser className="text-error" />
            Personal Information
            {isMobile && (
              <span className="text-xs text-base-content/50 ml-auto">
                {activeSection === "personal" ? "Active" : ""}
              </span>
            )}
          </h3>

          {/* Form Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Full Name */}
            <div className="form-control w-full sm:col-span-2 lg:col-span-1">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">Full Name</span>
              </label>
              <input
                name="fullName"
                type="text"
                className="input input-bordered w-full input-sm sm:input-md"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>

            {/* Date of Birth */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">Date of Birth</span>
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={isMobile ? 14 : 16} />
                <input
                  type="date"
                  name="dateOfBirth"
                  className="input input-bordered w-full pl-8 sm:pl-10 input-sm sm:input-md"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Gender */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">Gender</span>
              </label>
              <select
                name="gender"
                className="select select-bordered w-full select-sm sm:select-md"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                {genderOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Blood Group */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">Blood Group</span>
              </label>
              <div className="relative">
                <FiDroplet className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={isMobile ? 14 : 16} />
                <select
                  name="bloodGroup"
                  className="select select-bordered w-full pl-8 sm:pl-10 select-sm sm:select-md"
                  value={form.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroupOptions.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Weight */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">Weight (kg)</span>
              </label>
              <input
                type="number"
                name="weight"
                min={20}
                max={300}
                step={0.1}
                className={`input input-bordered w-full input-sm sm:input-md ${formErrors.weight ? 'input-error' : ''}`}
                value={form.weight}
                onChange={handleChange}
                placeholder="Enter weight"
              />
              {formErrors.weight && (
                <label className="label">
                  <span className="label-text-alt text-error">{formErrors.weight}</span>
                </label>
              )}
            </div>

            {/* Bio - Full Width */}
            <div className="form-control w-full sm:col-span-2 lg:col-span-3">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">Bio</span>
              </label>
              <textarea
                name="bio"
                className="textarea textarea-bordered w-full textarea-sm sm:textarea-md"
                rows={isMobile ? 3 : 4}
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell us a little about yourself..."
              />
            </div>
          </div>
        </motion.section>

        {/* Emergency Contact Section */}
        <motion.section
          id="emergency"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4"
        >
          {/* Section Header */}
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiHeart className="text-error" />
            Emergency Contact
            {isMobile && (
              <span className="text-xs text-base-content/50 ml-auto">
                {activeSection === "emergency" ? "Active" : ""}
              </span>
            )}
          </h3>

          {/* Form Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Contact Name */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">Contact Name</span>
              </label>
              <input
                name="emergencyContactName"
                type="text"
                className="input input-bordered w-full input-sm sm:input-md"
                value={form.emergencyContactName}
                onChange={handleChange}
                placeholder="Full name"
              />
            </div>

            {/* Relation */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">Relation</span>
              </label>
              <input
                name="emergencyContactRelation"
                type="text"
                className="input input-bordered w-full input-sm sm:input-md"
                value={form.emergencyContactRelation}
                onChange={handleChange}
                placeholder="Spouse, parent, sibling..."
              />
            </div>

            {/* Phone */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">Phone</span>
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={isMobile ? 14 : 16} />
                <input
                  name="emergencyContactPhone"
                  type="tel"
                  className={`input input-bordered w-full pl-8 sm:pl-10 input-sm sm:input-md ${formErrors.emergencyContactPhone ? 'input-error' : ''}`}
                  value={form.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </div>
              {formErrors.emergencyContactPhone && (
                <label className="label">
                  <span className="label-text-alt text-error">{formErrors.emergencyContactPhone}</span>
                </label>
              )}
            </div>
          </div>
        </motion.section>

        {/* Address Section */}
        <motion.section
          id="address"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4"
        >
          {/* Section Header */}
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiMapPin className="text-error" />
            Address
            {isMobile && (
              <span className="text-xs text-base-content/50 ml-auto">
                {activeSection === "address" ? "Active" : ""}
              </span>
            )}
          </h3>

          {/* Form Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Street Address - Full Width */}
            <div className="form-control w-full sm:col-span-2 lg:col-span-3">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">Street Address</span>
              </label>
              <input
                name="street"
                type="text"
                className="input input-bordered w-full input-sm sm:input-md"
                value={form.street}
                onChange={handleChange}
                placeholder="Street name, building number, apartment"
              />
            </div>

            {/* City */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">City</span>
              </label>
              <input
                name="city"
                type="text"
                className="input input-bordered w-full input-sm sm:input-md"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
              />
            </div>

            {/* State */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">State</span>
              </label>
              <input
                name="state"
                type="text"
                className="input input-bordered w-full input-sm sm:input-md"
                value={form.state}
                onChange={handleChange}
                placeholder="State / Province"
              />
            </div>

            {/* Zip Code */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">Zip Code</span>
              </label>
              <input
                name="zipCode"
                type="text"
                className="input input-bordered w-full input-sm sm:input-md"
                value={form.zipCode}
                onChange={handleChange}
                placeholder="Postal / Zip code"
              />
            </div>

            {/* Country */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-xs sm:text-sm font-medium">Country</span>
              </label>
              <input
                name="country"
                type="text"
                className="input input-bordered w-full input-sm sm:input-md"
                value={form.country}
                onChange={handleChange}
                placeholder="Country"
              />
            </div>
          </div>
        </motion.section>

        {/* Mobile Save Button (Fixed at Bottom) */}
        {isMobile && (
          <div className="sticky bottom-4 bg-base-100 rounded-lg shadow-lg border border-base-300 p-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn btn-error w-full gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving Changes...
                </>
              ) : (
                <>
                  <FiSave />
                  Save All Changes
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* ==================================================================
            Change Password Modal
        ================================================================== */}
      <dialog id="donor_change_password_modal" className="modal">
        <ChangePasswordModal
          userId={userId}
          userName={form.fullName || user?.profile?.fullName || "My Account"}
          onClose={closePasswordModal}
          refreshUsers={() => refetch()}
        />
        <form
          method="dialog"
          className="modal-backdrop hidden md:block"
          onClick={closePasswordModal}
        >
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default MyProfile;