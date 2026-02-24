import React, { useState } from "react";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash, FaLock, FaTimes } from "react-icons/fa";

import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

const ChangePasswordModal = ({ userId, userName, onClose, refreshUsers }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const closeModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setApiError("");
    if (onClose) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!userId) {
      setApiError("No user selected.");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setApiError("All password fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setApiError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setApiError("Confirm password does not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setApiError("New password must be different from current password.");
      return;
    }

    try {
      setLoading(true);

      const res = await axiosInstance.post(
        "/auth/change-password",
        {
          userId,
          currentPassword,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.data?.success) {
        throw new Error(res.data?.error || "Failed to change password");
      }

      await Swal.fire({
        title: "Password Updated",
        text: `Password changed successfully for ${userName || "user"}.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        },
      });

      closeModal();
      if (refreshUsers) refreshUsers();
    } catch (error) {
      setApiError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to change password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-box w-11/12 max-w-xl p-0 overflow-hidden bg-base-100">
      <div className="bg-linear-to-r from-warning to-warning/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaLock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-xl">Change User Password</h3>
              <p className="text-white/80 text-sm">{userName || "Selected user"}</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
          >
            <FaTimes size={18} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {apiError && (
          <div className="alert alert-error">
            <span>{apiError}</span>
          </div>
        )}

        <div className="form-control">
          <span className="label-text mb-1">Current Password</span>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              className="input input-bordered w-full pr-10"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60"
            >
              {showCurrent ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="form-control">
          <span className="label-text mb-1">New Password</span>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              className="input input-bordered w-full pr-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNew((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60"
            >
              {showNew ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="form-control">
          <span className="label-text mb-1">Confirm New Password</span>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              className="input input-bordered w-full pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60"
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="modal-action mt-2">
          <button type="button" onClick={closeModal} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-warning text-white"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordModal;
