// Pages/backend/Admin/BloodBanksManagement/StaffModal.jsx

import React, { useState } from "react";
import { FiX, FiUserPlus, FiTrash2, FiUser } from "react-icons/fi";
import Swal from "sweetalert2";

import { useQuery } from "@tanstack/react-query";
import useAxiosPublic from "../../../../../hooks/useAxiosPublic";

const StaffModal = ({ bankId, onClose, refreshBanks }) => {
  const { axiosInstance } = useAxiosPublic();
  const token = localStorage.getItem("auth_token");
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("technician");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Fetch bank details
  const { data: bankData, refetch } = useQuery({
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
  const { data: usersData } = useQuery({
    queryKey: ["all-users-for-staff"],
    queryFn: async () => {
      const res = await axiosInstance.get("/users/admin/all-users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
  });

  // Filter users not already staff
  const availableUsers = usersData?.data?.filter(user =>
    !bankData?.data?.staff?.some(staff => staff.userId === user._id)
  ) || [];

  // Handle add staff
  const handleAddStaff = async () => {
    if (!selectedUser) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a user",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

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
          timer: 2000,
          showConfirmButton: false,
        });

        refetch();
        refreshBanks();
        setSelectedUser("");
        setSelectedRole("technician");
        setSelectedDepartment("");
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to add staff",
        timer: 3000,
        showConfirmButton: true,
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Handle remove staff
  const handleRemoveStaff = async (userId, userName) => {
    const result = await Swal.fire({
      title: "Remove Staff?",
      html: `<p>Are you sure you want to remove <span class="font-semibold">${userName}</span> from staff?</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "bg-base-100 border border-base-300 rounded-xl p-6 shadow-lg",
        title: "text-lg font-bold text-error",
        confirmButton: "btn btn-sm btn-error text-white",
        cancelButton: "btn btn-sm",
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      setIsRemoving(true);

      try {
        const response = await axiosInstance.delete(
          `/blood-banks/${bankId}/staff/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          await Swal.fire({
            icon: "success",
            title: "Removed!",
            text: "Staff member removed successfully",
            timer: 2000,
            showConfirmButton: false,
          });

          refetch();
          refreshBanks();
        }
      } catch (error) {
        console.error("Error removing staff:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.error || "Failed to remove staff",
          timer: 3000,
          showConfirmButton: true,
        });
      } finally {
        setIsRemoving(false);
      }
    }
  };

  return (
    <div className="modal-box max-w-4xl bg-base-100">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-base-300">
        <div>
          <h3 className="font-bold text-xl">Manage Staff</h3>
          <p className="text-sm text-base-content/70">
            {bankData?.data?.name} • Total Staff: {bankData?.data?.staff?.length || 0}
          </p>
        </div>
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost"
        >
          <FiX size={20} />
        </button>
      </div>

      <div className="py-4 space-y-6">
        {/* Add Staff Form */}
        <div className="bg-base-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <FiUserPlus />
            Add New Staff Member
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select User</span>
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">Choose a user...</option>
                {availableUsers.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.profile?.fullName || user.email} ({user.role})
                  </option>
                ))}
              </select>
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
              >
                <option value="technician">Technician</option>
                <option value="manager">Manager</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="administrator">Administrator</option>
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
              />
            </div>
          </div>

          <button
            onClick={handleAddStaff}
            disabled={isAdding}
            className="btn btn-error mt-4 gap-2"
          >
            {isAdding ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Adding...
              </>
            ) : (
              <>
                <FiUserPlus size={16} />
                Add Staff
              </>
            )}
          </button>
        </div>

        {/* Current Staff List */}
        <div>
          <h4 className="font-semibold mb-4">Current Staff Members</h4>

          {bankData?.data?.staff?.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {bankData.data.staff.map((staff) => {
                const user = usersData?.data?.find(u => u._id === staff.userId);
                const userName = user?.profile?.fullName || user?.email || "Unknown User";

                return (
                  <div
                    key={staff.userId}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-error/10 text-error rounded-full w-10">
                          <FiUser size={20} />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold">{userName}</p>
                        <div className="flex gap-2 text-sm text-base-content/70">
                          <span className="badge badge-sm badge-outline">{staff.role}</span>
                          {staff.department && (
                            <span>{staff.department}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveStaff(staff.userId, userName)}
                      disabled={isRemoving}
                      className="btn btn-ghost btn-sm btn-square text-error"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-base-200 rounded-lg">
              <FiUser size={40} className="mx-auto text-base-content/30 mb-2" />
              <p className="text-base-content/70">No staff members yet</p>
              <p className="text-sm text-base-content/50">Add staff members using the form above</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Actions */}
      <div className="modal-action">
        <button onClick={onClose} className="btn">
          Close
        </button>
      </div>
    </div>
  );
};

export default StaffModal;