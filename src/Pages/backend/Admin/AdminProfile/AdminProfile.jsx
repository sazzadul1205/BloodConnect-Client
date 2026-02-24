// Pages/backend/Admin/AdminProfile/AdminProfile.jsx

// React
import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import { FiUser, FiMapPin, FiSave, FiPhone, FiHeart, FiCalendar, FiDroplet, FiKey } from "react-icons/fi";

// Hooks
import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";

// Shared
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import ChangePasswordModal from "../UsersManagement/ChangePasswordModal/ChangePasswordModal";

// Empty form template for initial state
const emptyForm = {
  fullName: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  weight: "",
  bio: "",
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactPhone: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
};

const AdminProfile = () => {
  const { user } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");
  const userId = user?._id || user?.userId;

  // Form state
  const [form, setForm] = useState(emptyForm);

  // 🔹 Fetch Admin Profile Data
  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await axiosInstance.get(`/users/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data?.data;
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (!profileData) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      fullName: profileData?.profile?.fullName || "",
      dateOfBirth: profileData?.profile?.dateOfBirth
        ? new Date(profileData.profile.dateOfBirth).toISOString().slice(0, 10)
        : "",
      gender: profileData?.profile?.gender || "",
      bloodGroup: profileData?.profile?.bloodGroup || "",
      weight: profileData?.profile?.weight || "",
      bio: profileData?.profile?.bio || "",
      emergencyContactName: profileData?.profile?.emergencyContact?.name || "",
      emergencyContactRelation:
        profileData?.profile?.emergencyContact?.relation || "",
      emergencyContactPhone: profileData?.profile?.emergencyContact?.phone || "",
      street: profileData?.address?.street || "",
      city: profileData?.address?.city || "",
      state: profileData?.address?.state || "",
      zipCode: profileData?.address?.zipCode || "",
      country: profileData?.address?.country || "",
    });
  }, [profileData]);

  // Update profile mutation
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
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });
      refetch();
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update profile.",
        icon: "error",
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
          confirmButton: "btn btn-sm btn-error text-white",
        },
        buttonsStyling: false,
      });
    },
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateMutation.mutateAsync(form);
  };

  const closePasswordModal = () => {
    document.getElementById("profile_change_password_modal")?.close();
  };

  // User ID validation
  if (!userId) {
    return (
      <div className="bg-base-100 rounded-lg border border-base-300 p-6 text-center">
        <FiUser size={48} className="mx-auto text-base-content/30 mb-3" />
        <p className="text-base-content/70">Unable to resolve user profile.</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) return <BloodLoader />;

  // Error state
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      {/* Header Section with Fade In */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        {/* Header copy: communicates context and purpose of profile management. */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {/* Visual identity icon for admin profile. */}
            <FiUser className="text-error" />
            My Profile
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Update your personal details and address information.
          </p>
        </div>

        {/* Header Actions: password change and profile save. */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              document.getElementById("profile_change_password_modal")?.showModal()
            }
            className="btn btn-outline btn-sm gap-2"
          >
            <FiKey size={16} />
            Change Password
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="btn btn-error btn-sm gap-2"
          >
            <FiSave size={16} />
            {updateMutation.isPending ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </motion.div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-4"
        >
          {/* Section header with icon and title */}
          <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiUser className="text-error" />
            Personal Information
          </h3>

          {/* Two-column grid for personal info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name: primary identifier. */}
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Full Name</span>
              <input
                name="fullName"
                className="input input-bordered w-full"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </label>

            {/* Date of Birth: for age verification. */}
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Date of Birth</span>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={16} />
                <input
                  type="date"
                  name="dateOfBirth"
                  className="input input-bordered w-full pl-10"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </label>

            {/* Gender: demographic information. */}
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Gender</span>
              <select
                name="gender"
                className="select select-bordered w-full"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>

            {/* Blood Group: medical information. */}
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Blood Group</span>
              <div className="relative">
                <FiDroplet className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={16} />
                <select
                  name="bloodGroup"
                  className="select select-bordered w-full pl-10"
                  value={form.bloodGroup}
                  onChange={handleChange}
                >
                  <option value="">Select Blood Group</option>
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
            </label>

            {/* Weight: health metric. */}
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Weight (kg)</span>
              <input
                type="number"
                name="weight"
                min={20}
                max={300}
                step={0.1}
                className="input input-bordered w-full"
                value={form.weight}
                onChange={handleChange}
                placeholder="Enter weight in kg"
              />
            </label>

            {/* Bio: personal description (full width). */}
            <label className="form-control w-full md:col-span-2">
              <span className="label-text font-medium mb-1">Bio</span>
              <textarea
                name="bio"
                className="textarea textarea-bordered w-full"
                rows={4}
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell us a little about yourself..."
              />
              <span className="label-text-alt text-base-content/50 mt-1">
                Brief description of yourself (max 500 characters)
              </span>
            </label>
          </div>
        </motion.section>

        {/* Emergency Contact Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-4"
        >
          {/* Section header with icon and title */}
          <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiHeart className="text-error" />
            Emergency Contact
          </h3>

          {/* Three-column grid for emergency contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Emergency Contact Name: person to contact in emergency. */}
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Contact Name</span>
              <input
                name="emergencyContactName"
                className="input input-bordered w-full"
                value={form.emergencyContactName}
                onChange={handleChange}
                placeholder="Full name"
              />
            </label>

            {/* Emergency Contact Relation: relationship to contact. */}
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Relation</span>
              <input
                name="emergencyContactRelation"
                className="input input-bordered w-full"
                value={form.emergencyContactRelation}
                onChange={handleChange}
                placeholder="Spouse, parent, sibling..."
              />
            </label>

            {/* Emergency Contact Phone: contact number. */}
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Phone</span>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" size={16} />
                <input
                  name="emergencyContactPhone"
                  className="input input-bordered w-full pl-10"
                  value={form.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </div>
            </label>
          </div>
        </motion.section>

        {/* Address Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-4"
        >
          {/* Section header with icon and title */}
          <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiMapPin className="text-error" />
            Address
          </h3>

          {/* Two-column grid for address information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Street: full street address. */}
            <label className="form-control w-full md:col-span-2">
              <span className="label-text font-medium mb-1">Street Address</span>
              <input
                name="street"
                className="input input-bordered w-full"
                value={form.street}
                onChange={handleChange}
                placeholder="Street name, building number, apartment"
              />
            </label>

            {/* City: city/locality. */}
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">City</span>
              <input
                name="city"
                className="input input-bordered w-full"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
              />
            </label>

            {/* State: state/province/region. */}
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">State</span>
              <input
                name="state"
                className="input input-bordered w-full"
                value={form.state}
                onChange={handleChange}
                placeholder="State / Province"
              />
            </label>

            {/* Zip Code: postal code. */}
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Zip Code</span>
              <input
                name="zipCode"
                className="input input-bordered w-full"
                value={form.zipCode}
                onChange={handleChange}
                placeholder="Postal / Zip code"
              />
            </label>

            {/* Country: country name. */}
            <label className="form-control w-full">
              <span className="label-text font-medium mb-1">Country</span>
              <input
                name="country"
                className="input input-bordered w-full"
                value={form.country}
                onChange={handleChange}
                placeholder="Country"
              />
            </label>
          </div>
        </motion.section>

        {/* Mobile Save Button - FAB for small screens */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="lg:hidden fixed bottom-6 right-6 z-10"
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="btn btn-error btn-circle shadow-xl w-14 h-14"
            data-tip="Save Profile"
          >
            {updateMutation.isPending ? (
              <span className="loading loading-spinner loading-md"></span>
            ) : (
              <FiSave size={24} />
            )}
          </button>
        </motion.div>
      </form>

      {/* Change Password Modal */}
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
    </div>
  );
};

export default AdminProfile;
