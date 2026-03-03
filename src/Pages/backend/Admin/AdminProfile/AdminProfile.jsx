// Pages/backend/Admin/AdminProfile/AdminProfile.jsx

// React
import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import {
  FiUser,
  FiMapPin,
  FiSave,
  FiPhone,
  FiHeart,
  FiCalendar,
  FiDroplet,
  FiKey
} from "react-icons/fi";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import ChangePasswordModal from "../UsersManagement/ChangePasswordModal/ChangePasswordModal";
import { formatDateInputValue } from "../../../../utils/dateFormat";

// ==================== QUERY KEYS ====================

const queryKeys = {
  adminProfile: (userId) => ['admin-profile', userId],
};

// ==================== CONSTANTS ====================

// Empty form template for initial state
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

// Blood type options
const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Gender options
const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

// ==================== ANIMATION VARIANTS ====================

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

// ==================== MAIN COMPONENT ====================

/**
 * Admin Profile Component
 * Allows admin users to view and update their profile information
 * 
 * @returns {JSX.Element} Admin profile page
 */
const AdminProfile = () => {
  const { user } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("auth_token");
  const userId = user?._id || user?.userId;

  // ==================== STATE MANAGEMENT ====================

  const [form, setForm] = useState(emptyForm);

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query: Fetch admin profile data
   */
  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.adminProfile(userId),
    enabled: !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ==================== MUTATIONS ====================

  /**
   * Mutation: Update profile and address
   */
  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      // Prepare profile data payload
      const profilePayload = {
        fullName: payload.fullName,
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

      // Prepare address data payload
      const addressPayload = {
        street: payload.street || undefined,
        city: payload.city || undefined,
        state: payload.state || undefined,
        zipCode: payload.zipCode || undefined,
        country: payload.country || undefined,
      };

      // Send both updates
      await axiosInstance.patch(`/users/profile/${userId}`, profilePayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await axiosInstance.patch(`/users/address/${userId}`, addressPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: async () => {
      await Swal.fire({
        title: "Profile Updated",
        text: "Your profile information was saved successfully.",
        icon: "success",
        timer: 1700,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        },
        buttonsStyling: false,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProfile(userId) });
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update profile.",
        icon: "error",
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    },
  });

  // ==================== EFFECTS ====================

  /**
   * Update form when profile data loads
   */
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

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle form input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateMutation.mutateAsync(form);
  };

  /**
   * Close password modal
   */
  const closePasswordModal = () => {
    document.getElementById("profile_change_password_modal")?.close();
  };

  // ==================== VALIDATION ====================

  if (!userId) {
    return (
      <div className="bg-base-100 rounded-lg border border-base-300 p-4 sm:p-6 text-center">
        <FiUser size={32} className="sm:w-12 sm:h-12 mx-auto text-base-content/30 mb-2 sm:mb-3" />
        <p className="text-xs sm:text-sm text-base-content/70">Unable to resolve user profile.</p>
      </div>
    );
  }

  // ==================== LOADING & ERROR STATES ====================

  if (isLoading) return <BloodLoader />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

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
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        {/* Title and description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FiUser className="text-error" />
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-1">
            Update your personal details and address information.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Change Password Button */}
          <button
            type="button"
            onClick={() =>
              document.getElementById("profile_change_password_modal")?.showModal()
            }
            className="btn btn-outline btn-xs sm:btn-sm gap-1 sm:gap-2 flex-1 sm:flex-none"
          >
            <FiKey size={12} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Change Password</span>
          </button>

          {/* Save Profile Button */}
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="btn btn-error btn-xs sm:btn-sm gap-1 sm:gap-2 flex-1 sm:flex-none"
          >
            {updateMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span className="text-xs sm:text-sm">Saving...</span>
              </>
            ) : (
              <>
                <FiSave size={12} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Save Profile</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* ==================== MAIN PROFILE FORM ==================== */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">

        {/* ==================== PERSONAL INFORMATION SECTION ==================== */}
        <motion.section
          variants={fadeInUp}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4"
        >
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiUser className="text-error text-sm sm:text-base" />
            Personal Information
          </h2>

          {/* Two-column grid for personal info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

            {/* Full Name */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FiUser className="text-error" size={12} />
                Full Name
              </span>
              <input
                name="fullName"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </label>

            {/* Date of Birth */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FiCalendar className="text-error" size={12} />
                Date of Birth
              </span>
              <div className="relative">
                <FiCalendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-xs sm:text-sm" />
                <input
                  type="date"
                  name="dateOfBirth"
                  className="input input-bordered input-sm sm:input-md w-full pl-7 sm:pl-10"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </label>

            {/* Gender */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1">Gender</span>
              <select
                name="gender"
                className="select select-bordered select-sm sm:select-md w-full"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Blood Group */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FiDroplet className="text-error" size={12} />
                Blood Group
              </span>
              <div className="relative">
                <FiDroplet className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-xs sm:text-sm" />
                <select
                  name="bloodGroup"
                  className="select select-bordered select-sm sm:select-md w-full pl-7 sm:pl-10"
                  value={form.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">Select Blood Group</option>
                  {bloodTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            {/* Weight */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1">Weight (kg)</span>
              <input
                type="number"
                name="weight"
                min={20}
                max={300}
                step={0.1}
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.weight}
                onChange={handleChange}
                placeholder="Enter weight in kg"
              />
            </label>

            {/* Bio - Full width */}
            <label className="form-control w-full md:col-span-2">
              <span className="label-text text-xs sm:text-sm font-medium mb-1">Bio</span>
              <textarea
                name="bio"
                className="textarea textarea-bordered textarea-sm sm:textarea-md w-full"
                rows={3}
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell us a little about yourself..."
              />
              <span className="label-text-alt text-[10px] sm:text-xs text-base-content/50 mt-1">
                Brief description of yourself (max 500 characters)
              </span>
            </label>
          </div>
        </motion.section>

        {/* ==================== EMERGENCY CONTACT SECTION ==================== */}
        <motion.section
          variants={fadeInUp}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4"
        >
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiHeart className="text-error text-sm sm:text-base" />
            Emergency Contact
          </h2>

          {/* Three-column grid for emergency contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

            {/* Contact Name */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1">Contact Name</span>
              <input
                name="emergencyContactName"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.emergencyContactName}
                onChange={handleChange}
                placeholder="Full name"
              />
            </label>

            {/* Relation */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1">Relation</span>
              <input
                name="emergencyContactRelation"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.emergencyContactRelation}
                onChange={handleChange}
                placeholder="Spouse, parent, sibling..."
              />
            </label>

            {/* Phone */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1 flex items-center gap-1">
                <FiPhone className="text-error" size={12} />
                Phone
              </span>
              <div className="relative">
                <FiPhone className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-base-content/50 text-xs sm:text-sm" />
                <input
                  name="emergencyContactPhone"
                  className="input input-bordered input-sm sm:input-md w-full pl-7 sm:pl-10"
                  value={form.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </div>
            </label>
          </div>
        </motion.section>

        {/* ==================== ADDRESS SECTION ==================== */}
        <motion.section
          variants={fadeInUp}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4 sm:p-6 space-y-4"
        >
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiMapPin className="text-error text-sm sm:text-base" />
            Address
          </h2>

          {/* Two-column grid for address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

            {/* Street Address - Full width */}
            <label className="form-control w-full md:col-span-2">
              <span className="label-text text-xs sm:text-sm font-medium mb-1">Street Address</span>
              <input
                name="street"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.street}
                onChange={handleChange}
                placeholder="Street name, building number, apartment"
              />
            </label>

            {/* City */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1">City</span>
              <input
                name="city"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
              />
            </label>

            {/* State */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1">State</span>
              <input
                name="state"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.state}
                onChange={handleChange}
                placeholder="State / Province"
              />
            </label>

            {/* Zip Code */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1">Zip Code</span>
              <input
                name="zipCode"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.zipCode}
                onChange={handleChange}
                placeholder="Postal / Zip code"
              />
            </label>

            {/* Country */}
            <label className="form-control w-full">
              <span className="label-text text-xs sm:text-sm font-medium mb-1">Country</span>
              <input
                name="country"
                className="input input-bordered input-sm sm:input-md w-full"
                value={form.country}
                onChange={handleChange}
                placeholder="Country"
              />
            </label>
          </div>
        </motion.section>

        {/* ==================== MOBILE SAVE BUTTON - FAB ==================== */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="lg:hidden fixed bottom-4 right-4 z-10"
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="btn btn-error btn-circle shadow-xl w-12 h-12 sm:w-14 sm:h-14"
            data-tip="Save Profile"
            aria-label="Save Profile"
          >
            {updateMutation.isPending ? (
              <span className="loading loading-spinner loading-sm sm:loading-md"></span>
            ) : (
              <FiSave size={18} className="sm:w-6 sm:h-6" />
            )}
          </button>
        </motion.div>
      </form>

      {/* ==================== CHANGE PASSWORD MODAL ==================== */}
      <dialog id="profile_change_password_modal" className="modal">
        <ChangePasswordModal
          userId={userId}
          userName={form.fullName || user?.profile?.fullName || "My Account"}
          onClose={closePasswordModal}
          refreshUsers={() => refetch()}
        />
        <form method="dialog" className="modal-backdrop" onClick={closePasswordModal}>
          <button>close</button>
        </form>
      </dialog>
    </motion.div>
  );
};

export default AdminProfile;