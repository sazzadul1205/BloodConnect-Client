import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  FiUser,
  FiMapPin,
  FiSave,
  FiPhone,
  FiHeart,
  FiCalendar,
  FiDroplet,
  FiKey,
  FiSettings,
} from "react-icons/fi";

import useAuth from "../../../../hooks/useAuth";
import useAxiosPublic from "../../../../hooks/useAxiosPublic";
import BloodLoader from "../../../../shared/BloodLoader";
import ErrorState from "../../../../shared/ErrorState";
import ChangePasswordModal from "../../Admin/UsersManagement/ChangePasswordModal/ChangePasswordModal";
import { formatDateInputValue } from "../../../../utils/dateFormat";

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

const MyProfile = () => {
  const { user } = useAuth();
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");
  const userId = user?._id || user?.userId;

  const [form, setForm] = useState(emptyForm);

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

  useEffect(() => {
    if (!profileData) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      fullName: profileData?.profile?.fullName || "",
      dateOfBirth: profileData?.profile?.dateOfBirth
        ? formatDateInputValue(profileData.profile.dateOfBirth)
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

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
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

      const addressPayload = {
        street: payload.street || undefined,
        city: payload.city || undefined,
        state: payload.state || undefined,
        zipCode: payload.zipCode || undefined,
        country: payload.country || undefined,
      };

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
        text: "Your profile was updated successfully.",
        icon: "success",
        timer: 1700,
        showConfirmButton: false,
      });
      refetch();
    },
    onError: async (err) => {
      await Swal.fire({
        title: "Update Failed",
        text: err?.response?.data?.error || "Unable to update profile.",
        icon: "error",
      });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateMutation.mutateAsync(form);
  };

  const closePasswordModal = () => {
    document.getElementById("donor_change_password_modal")?.close();
  };

  if (!userId) {
    return (
      <div className="bg-base-100 rounded-lg border border-base-300 p-6 text-center">
        <FiUser size={48} className="mx-auto text-base-content/30 mb-3" />
        <p className="text-base-content/70">Unable to resolve user profile.</p>
      </div>
    );
  }

  if (isLoading) return <BloodLoader />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-6 min-h-screen bg-base-200 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiUser className="text-error" />
            My Profile
          </h2>
          <p className="text-base-content/70 text-sm mt-1">
            Update your personal details and address information.
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/donor/settings" className="btn btn-outline btn-sm gap-2">
            <FiSettings size={16} />
            Settings
          </Link>
          <button
            type="button"
            onClick={() =>
              document.getElementById("donor_change_password_modal")?.showModal()
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiUser className="text-error" />
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </label>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiHeart className="text-error" />
            Emergency Contact
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-base-300">
            <FiMapPin className="text-error" />
            Address
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </form>

      <dialog id="donor_change_password_modal" className="modal">
        <ChangePasswordModal
          userId={userId}
          userName={form.fullName || user?.profile?.fullName || "My Account"}
          onClose={closePasswordModal}
          refreshUsers={() => refetch()}
        />
        <form
          method="dialog"
          className="modal-backdrop"
          onClick={closePasswordModal}
        >
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default MyProfile;
