// Pages/backend/Admin/BloodBanksManagement/StaffModal.jsx

// React
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FaTimes,
  FaUserPlus,
  FaTrash,
  FaUser,
  FaExclamationCircle,
  FaCheckCircle,
  FaUserTie,
  FaUserMd,
  FaUserNurse,
  FaFlask,
  FaHospitalUser,
} from "react-icons/fa";

// SweetAlert - kept only for success messages
import Swal from "sweetalert2";

// Hooks
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

// ==================== QUERY KEYS ====================

const queryKeys = {
  bankStaff: (bankId) => ['bank-staff', bankId],
  allUsers: ['all-users-for-staff'],
};

// ==================== CONSTANTS ====================

/**
 * Role options for staff selection
 */
const ROLE_OPTIONS = [
  { value: "technician", label: "🧪 Technician", icon: FaFlask },
  { value: "manager", label: "👔 Manager", icon: FaUserTie },
  { value: "doctor", label: "👨‍⚕️ Doctor", icon: FaUserMd },
  { value: "nurse", label: "👩‍⚕️ Nurse", icon: FaUserNurse },
  { value: "administrator", label: "🏥 Administrator", icon: FaHospitalUser },
];

/**
 * Role icon mapping
 */
const roleIconMap = {
  technician: FaFlask,
  manager: FaUserTie,
  doctor: FaUserMd,
  nurse: FaUserNurse,
  administrator: FaHospitalUser,
};

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

const staffItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// ==================== MAIN COMPONENT ====================

/**
 * Staff Modal Component
 * Allows managing staff members for a specific blood bank
 * 
 * @param {string} bankId - ID of the blood bank
 * @param {Function} onClose - Function to close the modal
 * @param {Function} refreshBanks - Function to refresh banks list after update
 */
const StaffModal = ({ bankId, onClose, refreshBanks }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // ==================== STATE MANAGEMENT ====================

  const [apiError, setApiError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("technician");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Confirmation state for remove
  const [removeConfirmId, setRemoveConfirmId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [removeUserName, setRemoveUserName] = useState("");

  // ==================== TANSTACK QUERIES ====================

  /**
   * Query 1: Fetch bank details to get current staff list
   */
  const { data: bankData, refetch, isLoading } = useQuery({
    queryKey: queryKeys.bankStaff(bankId),
    queryFn: async () => {
      const res = await axiosInstance.get(`/blood-banks/${bankId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!bankId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  /**
   * Query 2: Fetch all users for staff selection
   */
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.allUsers,
    queryFn: async () => {
      const res = await axiosInstance.get("/users/admin/all-users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ==================== COMPUTED VALUES ====================

  /**
   * Filter users not already staff members
   */
  const availableUsers = usersData?.data?.filter(user =>
    !bankData?.data?.staff?.some(staff => staff.userId === user._id)
  ) || [];

  /**
   * Get role icon for a given role
   */
  const getRoleIcon = (role) => {
    return roleIconMap[role] || FaUser;
  };

  // ==================== HANDLER FUNCTIONS ====================

  /**
   * Handle adding a new staff member
   */
  const handleAddStaff = async () => {
    if (!selectedUser) {
      setApiError("Please select a user");
      return;
    }

    setApiError("");
    setIsAdding(true);

    try {
      const response = await axiosInstance.post(
        `/blood-banks/${bankId}/staff`,
        {
          userId: selectedUser,
          role: selectedRole,
          department: selectedDepartment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Staff member added successfully",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#1f2937',
          customClass: {
            popup: "bg-base-100 border border-base-300 rounded-lg shadow-lg",
          },
        });

        refetch();
        refreshBanks();
        setSelectedUser("");
        setSelectedRole("technician");
        setSelectedDepartment("");
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      setApiError(error.response?.data?.error || "Failed to add staff");
    } finally {
      setIsAdding(false);
    }
  };

  /**
   * Show remove confirmation for a staff member
   */
  const showRemoveConfirmation = (userId, userName) => {
    setRemoveConfirmId(userId);
    setRemoveUserName(userName);
  };

  /**
   * Cancel remove confirmation
   */
  const cancelRemove = () => {
    setRemoveConfirmId(null);
    setRemoveUserName("");
  };

  /**
   * Handle removing a staff member
   */
  const handleRemoveStaff = async () => {
    if (!removeConfirmId) return;

    setIsRemoving(true);
    setApiError("");

    try {
      const response = await axiosInstance.delete(
        `/blood-banks/${bankId}/staff/${removeConfirmId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        refetch();
        refreshBanks();
        setRemoveConfirmId(null);
        setRemoveUserName("");
      }
    } catch (error) {
      console.error("Error removing staff:", error);
      setApiError(error.response?.data?.error || "Failed to remove staff");
    } finally {
      setIsRemoving(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100 mx-2 sm:mx-0"
    >

      {/* ==================== MODAL HEADER ==================== */}
      <div className="bg-linear-to-r from-error to-error/80 p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">

          {/* Title and icon */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white/20 p-2 sm:p-3 rounded-full">
              <FaUserTie size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-2xl">Manage Staff</h2>
              <p className="text-white/80 text-xs sm:text-sm truncate max-w-48 sm:max-w-64">
                {bankData?.data?.name || "Blood Bank"} • Total Staff: {bankData?.data?.staff?.length || 0}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-white hover:bg-white/20 self-end sm:self-auto"
            aria-label="Close modal"
          >
            <FaTimes size={14} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ==================== API ERROR MESSAGE ==================== */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 sm:px-6 pt-4"
          >
            <div className="alert alert-error shadow-lg p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <FaExclamationCircle size={16} className="sm:w-5 sm:h-5 shrink-0" />
                <span className="text-xs sm:text-sm">{apiError}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== CONTENT ==================== */}
      <div className="p-4 sm:p-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
        <div className="space-y-4 sm:space-y-6">

          {/* ==================== ADD STAFF FORM ==================== */}
          <div className="bg-base-200 rounded-lg p-4 sm:p-6">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
              <FaUserPlus className="text-error text-sm sm:text-base" />
              Add New Staff Member
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

              {/* User Selection */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm flex items-center gap-2">
                    <FaUser className="text-error" size={12} />
                    Select User
                  </span>
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="select select-bordered select-sm sm:select-md w-full"
                  disabled={isAdding}
                >
                  <option value="">Choose a user...</option>
                  {availableUsers.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.profile?.fullName || user.email} ({user.role})
                    </option>
                  ))}
                </select>
                {availableUsers.length === 0 && !usersLoading && (
                  <label className="label py-1">
                    <span className="label-text-alt text-warning text-[10px] sm:text-xs">
                      No available users to add
                    </span>
                  </label>
                )}
              </div>

              {/* Role Selection */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm">Role</span>
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="select select-bordered select-sm sm:select-md w-full"
                  disabled={isAdding}
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs sm:text-sm">Department</span>
                </label>
                <input
                  type="text"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="input input-bordered input-sm sm:input-md"
                  placeholder="e.g., Blood Collection"
                  disabled={isAdding}
                />
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddStaff}
              disabled={isAdding || !selectedUser}
              className="btn btn-error text-white btn-xs sm:btn-sm gap-2 mt-3 sm:mt-4 w-full sm:w-auto"
            >
              {isAdding ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span className="text-xs sm:text-sm">Adding...</span>
                </>
              ) : (
                <>
                  <FaUserPlus size={12} className="sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Add Staff Member</span>
                </>
              )}
            </button>
          </div>

          {/* ==================== CURRENT STAFF LIST ==================== */}
          <div>
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-4">
              <FaUser className="text-error text-sm sm:text-base" />
              Current Staff Members ({bankData?.data?.staff?.length || 0})
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-6 sm:py-8">
                <span className="loading loading-spinner loading-md sm:loading-lg text-error"></span>
              </div>
            ) : bankData?.data?.staff?.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {bankData.data.staff.map((staff) => {
                  const user = usersData?.data?.find(u => u._id === staff.userId);
                  const userName = user?.profile?.fullName || user?.email || "Unknown User";
                  const RoleIcon = getRoleIcon(staff.role);
                  const isConfirming = removeConfirmId === staff.userId;

                  return (
                    <motion.div
                      key={staff.userId}
                      variants={staffItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      {isConfirming ? (
                        /* Inline Confirmation */
                        <div className="p-3 sm:p-4 bg-warning/10 border-2 border-warning rounded-lg">
                          <div className="flex flex-col xs:flex-row items-start gap-3">
                            <div className="text-warning mt-1 shrink-0">
                              <FaExclamationCircle size={16} className="sm:w-5 sm:h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-xs sm:text-sm mb-2">
                                Remove <span className="font-bold">{userName}</span> from staff?
                              </p>
                              <p className="text-[10px] sm:text-xs text-base-content/70 mb-3">
                                This action cannot be undone.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={handleRemoveStaff}
                                  disabled={isRemoving}
                                  className="btn btn-error btn-xs sm:btn-sm gap-2"
                                >
                                  {isRemoving ? (
                                    <>
                                      <span className="loading loading-spinner loading-xs"></span>
                                      <span className="text-[10px] sm:text-xs">Removing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <FaCheckCircle size={10} className="sm:w-4 sm:h-4" />
                                      <span className="text-[10px] sm:text-xs">Yes, Remove</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={cancelRemove}
                                  disabled={isRemoving}
                                  className="btn btn-ghost btn-xs sm:btn-sm"
                                >
                                  <span className="text-[10px] sm:text-xs">Cancel</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Normal Staff Item */
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between p-3 sm:p-4 bg-base-200 rounded-lg gap-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="avatar placeholder">
                              <div className="bg-error/10 text-error rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                                <RoleIcon size={12} className="sm:w-5 sm:h-5" />
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-xs sm:text-sm">{userName}</p>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
                                <span className="badge badge-error badge-outline badge-xs sm:badge-sm">
                                  {staff.role}
                                </span>
                                {staff.department && (
                                  <span className="text-base-content/70 truncate max-w-24 sm:max-w-32">
                                    {staff.department}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => showRemoveConfirmation(staff.userId, userName)}
                            className="btn btn-ghost btn-xs sm:btn-sm btn-square text-error hover:bg-error/10 self-end xs:self-auto"
                            title="Remove staff member"
                          >
                            <FaTrash size={12} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              // Empty State
              <motion.div
                className="text-center py-8 sm:py-12 bg-base-200 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="bg-error/10 p-3 sm:p-4 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <FaUser className="text-error text-xl sm:text-3xl" />
                </div>
                <p className="font-medium text-sm sm:text-base mb-1">No Staff Members</p>
                <p className="text-xs sm:text-sm text-base-content/70 mb-3 sm:mb-4">
                  This blood bank doesn't have any staff members yet.
                </p>
                <p className="text-[10px] sm:text-xs text-base-content/50">
                  Use the form above to add staff members.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== MODAL FOOTER ==================== */}
      <div className="modal-action border-t border-base-300 p-3 sm:p-4 bg-base-200/50">
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm sm:btn-md ml-auto"
        >
          <span className="text-xs sm:text-sm">Close</span>
        </button>
      </div>
    </motion.div>
  );
};

export default StaffModal;