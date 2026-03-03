// Pages/backend/Admin/UsersManagement/ChangePasswordModal/ChangePasswordModal.jsx

// React
import React, { useState } from "react";


// Add motion import
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// Sweet Alert
import Swal from "sweetalert2";

// Icons
import { FaEye, FaEyeSlash, FaLock, FaTimes } from "react-icons/fa";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

// ==================== ANIMATION VARIANTS ====================

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

// ==================== MAIN COMPONENT ====================

/**
 * Change Password Modal Component
 * Allows admin to change password for a user
 * 
 * @param {string} userId - ID of the user
 * @param {string} userName - Name of the user (for display)
 * @param {Function} onClose - Function to close the modal
 * @param {Function} refreshUsers - Function to refresh users list
 */
const ChangePasswordModal = ({ userId, userName, onClose, refreshUsers }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  // Password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Close modal and reset form
   */
  const closeModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setApiError("");
    if (onClose) onClose();
  };

  /**
   * Form submission handler
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    // ==================== VALIDATION ====================

    // Check if user ID exists
    if (!userId) {
      setApiError("No user selected.");
      return;
    }

    // Check if all fields are filled
    if (!currentPassword || !newPassword || !confirmPassword) {
      setApiError("All password fields are required.");
      return;
    }

    // Check password length
    if (newPassword.length < 6) {
      setApiError("New password must be at least 6 characters.");
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setApiError("Confirm password does not match.");
      return;
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      setApiError("New password must be different from current password.");
      return;
    }

    try {
      setLoading(true);

      // API call to change password
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

      // Show success message
      await Swal.fire({
        title: "Password Updated",
        text: `Password changed successfully for ${userName || "user"}.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
        customClass: {
          popup: "bg-base-100 border border-base-300 rounded-xl p-4 sm:p-6 shadow-lg",
        },
        buttonsStyling: false,
      });

      // Close modal and refresh
      closeModal();
      if (refreshUsers) refreshUsers();
    } catch (error) {
      // Handle error
      setApiError(
        error?.response?.data?.error ||
        error?.message ||
        "Failed to change password.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="modal-box w-11/12 max-w-xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== MODAL HEADER ==================== */}
      <div className="bg-linear-to-r from-warning to-warning/80 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and icon */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-2 sm:p-3 rounded-full">
              <FaLock size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg md:text-xl">Change User Password</h2>
              <p className="text-white/80 text-xs sm:text-sm truncate max-w-40 sm:max-w-64">
                {userName || "Selected user"}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={closeModal}
            className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-white hover:bg-white/20 self-end sm:self-auto"
            aria-label="Close modal"
          >
            <FaTimes size={12} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* ==================== FORM ==================== */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">

        {/* ==================== API ERROR MESSAGE ==================== */}
        {apiError && (
          <div className="alert alert-error shadow-lg p-2 sm:p-3">
            <span className="text-xs sm:text-sm">{apiError}</span>
          </div>
        )}

        {/* ==================== CURRENT PASSWORD FIELD ==================== */}
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-xs sm:text-sm">Current Password</span>
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              className="input input-bordered input-sm sm:input-md w-full pr-10"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((prev) => !prev)}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-warning"
              tabIndex="-1"
            >
              {showCurrent ? <FaEyeSlash size={14} className="sm:w-4 sm:h-4" /> : <FaEye size={14} className="sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>

        {/* ==================== NEW PASSWORD FIELD ==================== */}
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-xs sm:text-sm">New Password</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              className="input input-bordered input-sm sm:input-md w-full pr-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
            />
            <button
              type="button"
              onClick={() => setShowNew((prev) => !prev)}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-warning"
              tabIndex="-1"
            >
              {showNew ? <FaEyeSlash size={14} className="sm:w-4 sm:h-4" /> : <FaEye size={14} className="sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>

        {/* ==================== CONFIRM PASSWORD FIELD ==================== */}
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-xs sm:text-sm">Confirm New Password</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              className="input input-bordered input-sm sm:input-md w-full pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-warning"
              tabIndex="-1"
            >
              {showConfirm ? <FaEyeSlash size={14} className="sm:w-4 sm:h-4" /> : <FaEye size={14} className="sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>

        {/* ==================== PASSWORD REQUIREMENTS ==================== */}
        <div className="text-[10px] sm:text-xs text-base-content/60 space-y-1">
          <p className="font-medium">Password requirements:</p>
          <ul className="list-disc list-inside ml-1">
            <li className={newPassword.length >= 6 ? "text-success" : ""}>
              At least 6 characters
            </li>
            <li className={newPassword !== currentPassword && newPassword ? "text-success" : ""}>
              Different from current password
            </li>
            <li className={newPassword === confirmPassword && newPassword ? "text-success" : ""}>
              Passwords match
            </li>
          </ul>
        </div>

        {/* ==================== MODAL FOOTER ACTIONS ==================== */}
        <div className="modal-action mt-4 sm:mt-6 flex flex-col xs:flex-row justify-end gap-2">
          <button
            type="button"
            onClick={closeModal}
            className="btn btn-ghost btn-xs sm:btn-sm order-2 xs:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-warning text-white btn-xs sm:btn-sm gap-2 order-1 xs:order-2"
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span className="text-xs sm:text-sm">Updating...</span>
              </>
            ) : (
              <>
                <FaLock size={12} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Update Password</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};


export default ChangePasswordModal;