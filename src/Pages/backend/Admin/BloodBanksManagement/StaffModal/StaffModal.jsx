// React
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

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

const StaffModal = ({ bankId, onClose, refreshBanks }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");

  // States
  const [apiError, setApiError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("technician");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Confirmation state for remove
  const [removeConfirmId, setRemoveConfirmId] = useState(null);
  const [setRemoveUserName] = useState("");

  // Fetch bank details
  const { data: bankData, refetch, isLoading } = useQuery({
    queryKey: ["bank-staff", bankId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/blood-banks/${bankId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!bankId,
  });

  // Fetch all users for staff selection
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["all-users-for-staff"],
    queryFn: async () => {
      const res = await axiosInstance.get("/users/admin/all-users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
  });

  // Get role icon
  const getRoleIcon = (role) => {
    const roleMap = {
      technician: FaFlask,
      manager: FaUserTie,
      doctor: FaUserMd,
      nurse: FaUserNurse,
      administrator: FaHospitalUser,
    };
    return roleMap[role] || FaUser;
  };

  // Filter users not already staff
  const availableUsers = usersData?.data?.filter(user =>
    !bankData?.data?.staff?.some(staff => staff.userId === user._id)
  ) || [];

  // Handle add staff
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

  // Show remove confirmation
  const showRemoveConfirmation = (userId, userName) => {
    setRemoveConfirmId(userId);
    setRemoveUserName(userName);
  };

  // Cancel remove
  const cancelRemove = () => {
    setRemoveConfirmId(null);
    setRemoveUserName("");
  };

  // Handle remove staff
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

  return (
    <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100">
      {/* Header */}
      <div className="bg-linear-to-r from-error to-error/80 p-6 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <FaUserTie size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl">Manage Staff</h3>
              <p className="text-white/80 text-sm">
                {bankData?.data?.name || "Blood Bank"} • Total Staff: {bankData?.data?.staff?.length || 0}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20"
          >
            <FaTimes size={20} />
          </button>
        </div>
      </div>

      {/* Inline API Error Message */}
      {apiError && (
        <div className="px-6 pt-4">
          <div className="alert alert-error shadow-lg">
            <div className="flex items-center gap-2">
              <FaExclamationCircle size={20} />
              <span>{apiError}</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 max-h-[70vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Add Staff Form */}
          <div className="bg-base-200 rounded-lg p-6">
            <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
              <FaUserPlus className="text-error" />
              Add New Staff Member
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* User Selection */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2">
                    <FaUser className="text-error" /> Select User
                  </span>
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="select select-bordered w-full"
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
                  <label className="label">
                    <span className="label-text-alt text-warning">
                      No available users to add
                    </span>
                  </label>
                )}
              </div>

              {/* Role Selection */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="select select-bordered w-full"
                  disabled={isAdding}
                >
                  <option value="technician">🧪 Technician</option>
                  <option value="manager">👔 Manager</option>
                  <option value="doctor">👨‍⚕️ Doctor</option>
                  <option value="nurse">👩‍⚕️ Nurse</option>
                  <option value="administrator">🏥 Administrator</option>
                </select>
              </div>

              {/* Department */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Department</span>
                </label>
                <input
                  type="text"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="input input-bordered"
                  placeholder="e.g., Blood Collection"
                  disabled={isAdding}
                />
              </div>
            </div>

            <button
              onClick={handleAddStaff}
              disabled={isAdding || !selectedUser}
              className="btn btn-error text-white gap-2 mt-4"
            >
              {isAdding ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Adding...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Add Staff Member
                </>
              )}
            </button>
          </div>

          {/* Current Staff List */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-4 text-lg">
              <FaUser className="text-error" />
              Current Staff Members ({bankData?.data?.staff?.length || 0})
            </h4>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg text-error"></span>
              </div>
            ) : bankData?.data?.staff?.length > 0 ? (
              <div className="space-y-3">
                {bankData.data.staff.map((staff) => {
                  const user = usersData?.data?.find(u => u._id === staff.userId);
                  const userName = user?.profile?.fullName || user?.email || "Unknown User";
                  const RoleIcon = getRoleIcon(staff.role);
                  const isConfirming = removeConfirmId === staff.userId;

                  return (
                    <motion.div
                      key={staff.userId}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-base-200 rounded-lg overflow-hidden"
                    >
                      {isConfirming ? (
                        /* Inline Confirmation */
                        <div className="p-4 bg-warning/10 border-2 border-warning rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="text-warning mt-1">
                              <FaExclamationCircle size={20} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium mb-2">
                                Remove <span className="font-bold">{userName}</span> from staff?
                              </p>
                              <p className="text-sm text-base-content/70 mb-3">
                                This action cannot be undone.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleRemoveStaff}
                                  disabled={isRemoving}
                                  className="btn btn-error btn-sm gap-2"
                                >
                                  {isRemoving ? (
                                    <>
                                      <span className="loading loading-spinner loading-sm"></span>
                                      Removing...
                                    </>
                                  ) : (
                                    <>
                                      <FaCheckCircle />
                                      Yes, Remove
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={cancelRemove}
                                  disabled={isRemoving}
                                  className="btn btn-ghost btn-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Normal Staff Item */
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className="bg-error/10 text-error rounded-full w-10 h-10 flex items-center justify-center">
                                <RoleIcon size={20} />
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold">{userName}</p>
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="badge badge-error badge-outline">
                                  {staff.role}
                                </span>
                                {staff.department && (
                                  <span className="text-base-content/70">
                                    {staff.department}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => showRemoveConfirmation(staff.userId, userName)}
                            className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10"
                            title="Remove staff member"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-base-200 rounded-lg">
                <div className="bg-error/10 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <FaUser className="text-error text-3xl" />
                </div>
                <p className="font-medium text-lg mb-1">No Staff Members</p>
                <p className="text-base-content/70 text-sm mb-4">
                  This blood bank doesn't have any staff members yet.
                </p>
                <p className="text-base-content/50 text-sm">
                  Use the form above to add staff members.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="modal-action border-t border-base-300 p-4 bg-base-200/50">
        <button
          onClick={onClose}
          className="btn btn-ghost ml-auto"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StaffModal;